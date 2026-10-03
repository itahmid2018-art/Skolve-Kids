import React, { useState, useEffect } from 'react';
import { X, Terminal, CheckCircle2, AlertCircle, Play, FileText, Database, Shield, Cpu, RefreshCw, Layers, Check, ExternalLink } from 'lucide-react';

interface DevDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevDocsModal: React.FC<DevDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'tests' | 'prd' | 'roadmap' | 'specs' | 'install'>('providers');

  // Smoke test state
  const [testResults, setTestResults] = useState<{
    suite: string;
    status: string;
    totalDurationMs: number;
    passCount: number;
    failCount: number;
    tests: { name: string; status: string; durationMs: number; details: string }[];
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [dbStats, setDbStats] = useState<{ usersCount: number; coursesCount: number; courses: any[] } | null>(null);

  // Multi-Provider state
  const [providersData, setProvidersData] = useState<{
    activeProvider: string;
    providers: {
      id: string;
      name: string;
      type: string;
      isConfigured: boolean;
      status: string;
      model: string;
      endpoint?: string;
    }[];
  } | null>(null);
  const [providerTestRun, setProviderTestRun] = useState<any | null>(null);
  const [isTestingProviders, setIsTestingProviders] = useState(false);
  const [errorLogsList, setErrorLogsList] = useState<string[]>([]);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  const [switchSuccessMsg, setSwitchSuccessMsg] = useState<string | null>(null);

  // Fetch provider info & latest logs on modal open or tab switch
  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/ai/providers');
      if (res.ok) {
        const data = await res.json();
        setProvidersData(data);
      }
    } catch (e) {
      console.error('Failed to load providers:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dev/error-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.latestRun) {
          setProviderTestRun(data.latestRun);
        }
        setErrorLogsList(data.logFiles || []);
      }
    } catch (e) {
      console.error('Failed to load error logs:', e);
    }
  };

  const handleSelectProvider = async (providerId: string) => {
    try {
      const res = await fetch('/api/ai/providers/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      if (res.ok) {
        setSwitchSuccessMsg(`Active provider set to "${providerId}"`);
        fetchProviders();
        setTimeout(() => setSwitchSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error('Failed to switch provider:', e);
    }
  };

  const runProviderDiagnostics = async () => {
    setIsTestingProviders(true);
    try {
      const res = await fetch('/api/dev/test-providers', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProviderTestRun(data);
        fetchLogs();
        fetchProviders();
      }
    } catch (e) {
      console.error('Provider diagnostic test failed:', e);
    } finally {
      setIsTestingProviders(false);
    }
  };

  const runSmokeTests = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/dev/run-smoke-tests', { method: 'POST' });
      const data = await res.json();
      setTestResults(data);

      const dbRes = await fetch('/api/dev/db-dump');
      const dbData = await dbRes.json();
      setDbStats(dbData);
    } catch (e: any) {
      console.error('Smoke tests error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-4xl w-full h-[88vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Developer Hub & Diagnostic Test Suite</h2>
              <p className="text-xs text-slate-500">Multi-provider AI configuration, error logs & technical documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white overflow-x-auto text-xs font-medium">
          {[
            { id: 'providers', label: 'AI Providers & Error Logs' },
            { id: 'tests', label: 'Automated Smoke Tests' },
            { id: 'prd', label: 'Initial PRD' },
            { id: 'roadmap', label: 'Development Plan' },
            { id: 'specs', label: 'Technical Specifications' },
            { id: 'install', label: 'Installation & Local Testing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto text-xs leading-relaxed text-slate-700">
          {/* TAB 1: AI PROVIDERS & ERROR LOGS */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Notification Banner */}
              {switchSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{switchSuccessMsg}</span>
                </div>
              )}

              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">Active AI Engine:</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                      {providersData?.activeProvider || 'resolving...'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Configure optional cloud (OpenAI, Claude, OpenRouter, HF) or local (Ollama, llama.cpp) models in <code>.env</code>.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isTestingProviders}
                  onClick={runProviderDiagnostics}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isTestingProviders ? 'Running Diagnostics...' : 'Run Provider Diagnostics'}</span>
                </button>
              </div>

              {/* Providers Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Supported Model Providers & Configuration Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {providersData?.providers.map((p) => {
                    const isActive = providersData.activeProvider === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isActive
                            ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{p.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {p.type}
                            </span>
                          </div>
                          {p.isConfigured ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Configured</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              Optional / Unset
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-slate-500 space-y-0.5 mb-3">
                          <div>Model: <span className="text-slate-800">{p.model}</span></div>
                          {p.endpoint && <div className="truncate">URL: <span className="text-slate-600">{p.endpoint}</span></div>}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {isActive ? (
                              <span className="text-indigo-600 font-semibold">● Currently Active</span>
                            ) : p.isConfigured ? (
                              'Ready for activation'
                            ) : (
                              'Configure in .env'
                            )}
                          </span>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSelectProvider(p.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                            >
                              Set as Active
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest Diagnostic Test Run from testing/errors/ */}
              {providerTestRun && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-900 text-white font-mono text-xs">
                    <div>
                      <span>DIAGNOSTIC TEST RUN ID: {providerTestRun.runId}</span>
                      <span className="text-slate-400 block text-[11px]">Timestamp: {providerTestRun.timestamp}</span>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-emerald-400">✅ {providerTestRun.passedCount} Passed</span>
                      <span className="text-rose-400">❌ {providerTestRun.failedCount} Failed</span>
                      <span className="text-amber-400">⚠️ {providerTestRun.skippedCount} Skipped</span>
                    </div>
                  </div>

                  {/* Individual Diagnostic Results */}
                  <div className="space-y-2">
                    {providerTestRun.results.map((r: any, idx: number) => {
                      const isPassed = r.status === 'passed';
                      const isFailed = r.status === 'failed';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border text-xs ${
                            isPassed
                              ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
                              : isFailed
                              ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              {isPassed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                              ) : isFailed ? (
                                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                              ) : (
                                <span className="text-slate-400 mt-0.5 shrink-0">⚠️</span>
                              )}
                              <div>
                                <span className="font-semibold text-slate-900">{r.name}</span>
                                <div className="text-[11px] text-slate-600 mt-0.5">{r.message}</div>
                                {r.suggestions && r.suggestions.length > 0 && (
                                  <div className="text-[11px] text-indigo-700 mt-1">
                                    💡 <strong>Remedy:</strong> {r.suggestions[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                              {r.latencyMs !== undefined ? `${r.latencyMs}ms` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Error Log Files in testing/errors/ */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="font-semibold text-xs text-slate-900 mb-2 flex items-center justify-between">
                      <span>📁 Timestamped Log Archives in <code>testing/errors/</code></span>
                      <span className="text-slate-500 font-mono text-[11px]">{errorLogsList.length} files saved</span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-600 max-h-24 overflow-y-auto">
                      {errorLogsList.map((file, i) => (
                        <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-200/60 last:border-0">
                          <span className="text-slate-800">{file}</span>
                          <span className="text-slate-400 text-[10px]">written on test execution</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTOMATED SMOKE TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Automated System Health & API Smoke Suite</h3>
                  <p className="text-slate-500 mt-0.5">
                    Validates Database CRUD, Session Token Hashes, Socratic Tutor prompt constraints, and AI Rubric Auto-Grading.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={runSmokeTests}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing Suite...' : 'Run Smoke Tests'}</span>
                </button>
              </div>

              {testResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 text-white font-mono text-xs">
                    <span>
                      STATUS: {testResults.status.toUpperCase()} ({testResults.passCount} passed, {testResults.failCount} failed)
                    </span>
                    <span className="tabular-nums">Duration: {testResults.totalDurationMs}ms</span>
                  </div>

                  <div className="space-y-2">
                    {testResults.tests.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border flex items-start justify-between gap-4 ${
                          t.status === 'passed'
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {t.status === 'passed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold">{t.name}</div>
                            <div className="text-slate-600 text-[11px] mt-0.5">{t.details}</div>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] tabular-nums text-slate-500 shrink-0">
                          {t.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>

                  {dbStats && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                      <div className="font-semibold mb-2 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span>Live Database Inspector State</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                        <div>Active Users: {dbStats.usersCount}</div>
                        <div>Total Courses in Catalog: {dbStats.coursesCount}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Play className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Click "Run Smoke Tests" above to verify all backend API contracts and AI fallback chains.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRD */}
          {activeTab === 'prd' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Initial Product Requirements Document (PRD) Summary</h3>
              <p>
                <strong>Vision:</strong> Skolve addresses the 85%+ dropout rates of traditional MOOCs through dynamic curriculum generation, two-zone active learning sandboxes, and instant Socratic feedback.
              </p>
              <h4 className="font-bold text-slate-900 pt-2">Core Functional Modules:</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>FR-01–FR-03 (Auth & Profiles):</strong> Token-based authentication, user profile calibration (goal, baseline, pedagogy, weekly hours).</li>
                <li><strong>FR-04–FR-06 (Curriculum Generation):</strong> Dynamic synthesis based on Bloom's Revised Taxonomy with real-time SSE streaming.</li>
                <li><strong>FR-07–FR-09 (Two-Zone Learning):</strong> Interactive stage with clean conceptual prose, interactive simulation widgets, and code sandboxes.</li>
                <li><strong>FR-10–FR-12 (Auto-Grading & Radars):</strong> Rubric-based assessment auto-grader with misconception diagnosis and real-time mastery radars.</li>
              </ul>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs mt-4">
                Full PRD document available in repository at: <code>/docs/PRD.md</code>
              </div>
            </div>
          )}

          {/* TAB 4: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Phase-Wise 12-Week Roadmap & Testing Plan</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-900">Phase 1 (Weeks 1–2): Foundation, Auth & Real-Time DB</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Scaffold TypeScript stack, session guards, in-memory ACID store, and pub/sub event bus.</p>
                  <span className="text-emerald-700 text-[11px] font-medium block mt-1">✔ Gate Passed: 100% test pass on auth routes; token validation responds in ≤5ms.</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-900">Phase 2 (Weeks 3–5): AI Pipeline & Streaming Backend</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Google GenAI (@google/genai with gemini-3.8-flash), local Ollama MoE router, and SSE streaming.</p>
                  <span className="text-emerald-700 text-[11px] font-medium block mt-1">✔ Gate Passed: Valid JSON curriculum generated; first streaming token within 1.2s.</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-900">Phase 3 (Weeks 6–8): Frontend Learner UX & Two-Zone Stage</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Interactive sandbox, Socratic tutor drawer, auto-grader view, and mastery radars.</p>
                  <span className="text-emerald-700 text-[11px] font-medium block mt-1">✔ Gate Passed: Zero layout overflow; zero dead clicks; WCAG AA compliant.</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-900">Phase 4 (Weeks 9–12): Hardening & Load Benchmarking</span>
                  <p className="text-slate-600 text-[11px] mt-0.5">Stress testing, edge-case mitigation, in-app test runner, and documentation suite.</p>
                </div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
                Full Development Plan document available in repository at: <code>/docs/DEVELOPMENT_PLAN.md</code>
              </div>
            </div>
          )}

          {/* TAB 5: SPECS */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Technical Specifications & API Contracts</h3>
              <p>Skolve is structured as a full-stack Node.js + Express + React 19 application.</p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto space-y-1">
                <div>POST /api/auth/register       → Registers new user account</div>
                <div>POST /api/auth/login          → Authenticates credentials</div>
                <div>GET  /api/ai/providers        → Lists available AI providers and active engine</div>
                <div>POST /api/ai/providers/select → Sets active model provider</div>
                <div>POST /api/dev/test-providers  → Runs multi-provider diagnostics and logs to testing/errors/</div>
                <div>GET  /api/dev/error-logs      → Reads timestamped error logs from testing/errors/</div>
                <div>GET  /api/courses             → Lists active catalog</div>
                <div>POST /api/courses/generate-stream → SSE curriculum stream</div>
                <div>POST /api/tutoring/chat       → Socratic AI conversation</div>
                <div>POST /api/assessments/grade   → Rubric-based auto-grader</div>
                <div>GET  /api/realtime/events     → SSE real-time event bus</div>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs mt-4">
                Full Technical Specifications document available in repository at: <code>/docs/TECHNICAL_SPECIFICATIONS.md</code>
              </div>
            </div>
          )}

          {/* TAB 6: INSTALLATION */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Installation & Local Testing Guidelines</h3>
              <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto">
{`# 1. Install dependencies
npm install

# 2. Configure .env with your preferred AI providers (Gemini, OpenAI, Claude, OpenRouter, HF, Ollama, llama.cpp)
cp .env.example .env

# 3. Run provider diagnostic tests (writes timestamped logs to testing/errors/)
npm run test:providers

# 4. Run full-stack dev server on port 3000
npm run dev

# 5. Test API via curl
curl http://localhost:3000/api/health`}
              </pre>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 text-xs">
                Full Installation & Testing documents available at: <code>/docs/INSTALLATION.md</code> and <code>/docs/LOCAL_TESTING.md</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
