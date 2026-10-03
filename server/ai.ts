import { GoogleGenAI, Type } from '@google/genai';
import { Course, CourseModule, CourseLesson } from './db.js';
import { errorLogger, ProviderTestResult, TestRunRecord } from './logger.js';
import crypto from 'crypto';

// Initialize server-side Google GenAI client according to instructions:
// User-Agent must be set to 'aistudio-build' in httpOptions
const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface CourseGenerationPromptParams {
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  pedagogy: 'hands-on' | 'theory-first' | 'visual-simulation';
  hoursPerWeek: number;
  knownSkills?: string[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  type: 'cloud' | 'gateway' | 'local';
  isConfigured: boolean;
  status: 'active' | 'available' | 'unconfigured' | 'error';
  model: string;
  endpoint?: string;
  lastChecked?: string;
  latencyMs?: number;
  diagnosticMessage?: string;
}

export class AIGateway {
  private activeProviderId: string = 'auto';

  // --- Provider Definitions & Availability Checks ---

  public isGeminiConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('MY_GEMINI_API_KEY'));
  }

  public isOpenAIConfigured(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('sk-...'));
  }

  public isAnthropicConfigured(): boolean {
    const key = process.env.ANTHROPIC_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('sk-ant-...'));
  }

  public isOpenRouterConfigured(): boolean {
    const key = process.env.OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('sk-or-...'));
  }

  public isHuggingFaceConfigured(): boolean {
    const key = process.env.HUGGINGFACE_API_KEY;
    return Boolean(key && key.trim().length > 5 && !key.includes('hf_...'));
  }

  public isOllamaConfigured(): boolean {
    return Boolean(process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL);
  }

  public isLlamaCppConfigured(): boolean {
    return Boolean(process.env.LLAMACPP_BASE_URL);
  }

  // --- Provider Testing & Diagnostics ---

  public async validateGemini(): Promise<ProviderTestResult> {
    const isConfigured = this.isGeminiConfigured();
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (!isConfigured) {
      return {
        id: 'gemini',
        name: 'Google Gemini',
        status: 'skipped',
        isConfigured: false,
        model,
        message: 'Skipped: GEMINI_API_KEY is not defined or contains default placeholder.',
        suggestions: ['Configure GEMINI_API_KEY in .env or the AI Studio Secrets panel.'],
      };
    }

    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await geminiClient.models.generateContent({
        model,
        contents: 'Respond with the single word "OK" to verify API readiness.',
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - t0;
      return {
        id: 'gemini',
        name: 'Google Gemini',
        status: 'passed',
        isConfigured: true,
        model,
        latencyMs,
        message: `Validated: Google Gemini is online (${latencyMs}ms response time).`,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - t0;
      return {
        id: 'gemini',
        name: 'Google Gemini',
        status: 'failed',
        isConfigured: true,
        model,
        latencyMs,
        message: `Validation Failed: ${err.message || 'Gemini API call failed'}`,
        errorDetails: err.stack || String(err),
        suggestions: ['Verify GEMINI_API_KEY is valid and active in Google AI Studio / Google Cloud Console.'],
      };
    }
  }

  public async validateOpenAI(): Promise<ProviderTestResult> {
    const isConfigured = this.isOpenAIConfigured();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');

    if (!isConfigured) {
      return {
        id: 'openai',
        name: 'OpenAI',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: 'Skipped: OPENAI_API_KEY is not configured in environment.',
        suggestions: ['Add OPENAI_API_KEY="sk-..." to .env to enable OpenAI models.'],
      };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        const errorText = await res.text();
        return {
          id: 'openai',
          name: 'OpenAI',
          status: 'failed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `OpenAI returned HTTP ${res.status}: ${res.statusText}`,
          errorDetails: errorText,
          suggestions: res.status === 401 ? ['Your OPENAI_API_KEY is invalid or expired.'] : ['Check OpenAI account quota and model permissions.'],
        };
      }

      return {
        id: 'openai',
        name: 'OpenAI',
        status: 'passed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: `Validated: OpenAI responded successfully in ${latencyMs}ms.`,
      };
    } catch (err: any) {
      return {
        id: 'openai',
        name: 'OpenAI',
        status: 'failed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs: Date.now() - t0,
        message: `Network Error: ${err.message || 'Unable to reach OpenAI endpoint'}`,
        errorDetails: String(err),
        suggestions: ['Check internet connectivity and firewall rules for api.openai.com.'],
      };
    }
  }

  public async validateAnthropic(): Promise<ProviderTestResult> {
    const isConfigured = this.isAnthropicConfigured();
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
    const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/+$/, '');

    if (!isConfigured) {
      return {
        id: 'anthropic',
        name: 'Anthropic Claude',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: 'Skipped: ANTHROPIC_API_KEY is not configured in environment.',
        suggestions: ['Add ANTHROPIC_API_KEY="sk-ant-..." to .env to enable Claude models.'],
      };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'Say OK' }],
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        const errorText = await res.text();
        return {
          id: 'anthropic',
          name: 'Anthropic Claude',
          status: 'failed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `Anthropic returned HTTP ${res.status}: ${res.statusText}`,
          errorDetails: errorText,
          suggestions: res.status === 401 ? ['The ANTHROPIC_API_KEY provided is invalid.'] : ['Check your Anthropic workspace credits.'],
        };
      }

      return {
        id: 'anthropic',
        name: 'Anthropic Claude',
        status: 'passed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: `Validated: Anthropic Claude responded successfully in ${latencyMs}ms.`,
      };
    } catch (err: any) {
      return {
        id: 'anthropic',
        name: 'Anthropic Claude',
        status: 'failed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs: Date.now() - t0,
        message: `Network Error: ${err.message || 'Unable to reach Anthropic endpoint'}`,
        errorDetails: String(err),
      };
    }
  }

  public async validateOpenRouter(): Promise<ProviderTestResult> {
    const isConfigured = this.isOpenRouterConfigured();
    const model = process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct';
    const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');

    if (!isConfigured) {
      return {
        id: 'openrouter',
        name: 'OpenRouter (MoE Gateway)',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: 'Skipped: OPENROUTER_API_KEY is not configured in environment.',
        suggestions: ['Add OPENROUTER_API_KEY="sk-or-v1-..." to .env to access 100+ open-source MoE models.'],
      };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://skolve.dev',
          'X-Title': 'Skolve AI Education Platform',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        const errorText = await res.text();
        return {
          id: 'openrouter',
          name: 'OpenRouter (MoE Gateway)',
          status: 'failed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `OpenRouter returned HTTP ${res.status}: ${res.statusText}`,
          errorDetails: errorText,
          suggestions: ['Verify OpenRouter API key balance and permissions.'],
        };
      }

      return {
        id: 'openrouter',
        name: 'OpenRouter (MoE Gateway)',
        status: 'passed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: `Validated: OpenRouter router responded successfully in ${latencyMs}ms.`,
      };
    } catch (err: any) {
      return {
        id: 'openrouter',
        name: 'OpenRouter (MoE Gateway)',
        status: 'failed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs: Date.now() - t0,
        message: `Network Error: ${err.message || 'Unable to reach OpenRouter'}`,
        errorDetails: String(err),
      };
    }
  }

  public async validateHuggingFace(): Promise<ProviderTestResult> {
    const isConfigured = this.isHuggingFaceConfigured();
    const model = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct';
    const baseUrl = (process.env.HUGGINGFACE_ENDPOINT_URL || 'https://router.huggingface.co/hf-inference/v1').replace(/\/+$/, '');

    if (!isConfigured) {
      return {
        id: 'huggingface',
        name: 'Hugging Face Inference',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: 'Skipped: HUGGINGFACE_API_KEY is not configured in environment.',
        suggestions: ['Add HUGGINGFACE_API_KEY="hf_..." to .env for serverless open-weights.'],
      };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        const errorText = await res.text();
        return {
          id: 'huggingface',
          name: 'Hugging Face Inference',
          status: 'failed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `Hugging Face returned HTTP ${res.status}: ${res.statusText}`,
          errorDetails: errorText,
          suggestions: ['Verify your HuggingFace User Access Token has "Inference" permissions.'],
        };
      }

      return {
        id: 'huggingface',
        name: 'Hugging Face Inference',
        status: 'passed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: `Validated: Hugging Face inference responded in ${latencyMs}ms.`,
      };
    } catch (err: any) {
      return {
        id: 'huggingface',
        name: 'Hugging Face Inference',
        status: 'failed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs: Date.now() - t0,
        message: `Network Error: ${err.message || 'Unable to reach Hugging Face endpoint'}`,
        errorDetails: String(err),
      };
    }
  }

  public async validateOllama(): Promise<ProviderTestResult> {
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/+$/, '');
    const model = process.env.OLLAMA_MODEL || 'qwen2.5:32b';

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        return {
          id: 'ollama',
          name: 'Ollama (Local LLM)',
          status: 'failed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `Ollama returned HTTP ${res.status}: ${res.statusText}`,
          suggestions: ['Check Ollama daemon status with "curl http://localhost:11434/api/tags".'],
        };
      }

      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name);
      const hasModel = models.some((m: string) => m.includes(model.split(':')[0]));

      return {
        id: 'ollama',
        name: 'Ollama (Local LLM)',
        status: 'passed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: hasModel
          ? `Validated: Ollama daemon is reachable (${latencyMs}ms) with model "${model}" ready.`
          : `Validated: Ollama daemon is online (${latencyMs}ms), but model "${model}" was not found in installed models (${models.join(', ') || 'none'}).`,
        suggestions: hasModel ? [] : [`Run "ollama pull ${model}" to download weights.`],
      };
    } catch (err: any) {
      return {
        id: 'ollama',
        name: 'Ollama (Local LLM)',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: `Local daemon offline: Cannot connect to Ollama at ${baseUrl} (${err.code || err.message}).`,
        errorDetails: String(err),
        suggestions: [
          'If you wish to use local open weights, start Ollama with "ollama serve".',
          'Otherwise, leave unconfigured to use cloud providers.',
        ],
      };
    }
  }

  public async validateLlamaCpp(): Promise<ProviderTestResult> {
    const baseUrl = (process.env.LLAMACPP_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
    const model = process.env.LLAMACPP_MODEL || 'default';

    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      const latencyMs = Date.now() - t0;
      if (res.ok) {
        return {
          id: 'llamacpp',
          name: 'llama.cpp Server',
          status: 'passed',
          isConfigured: true,
          endpoint: baseUrl,
          model,
          latencyMs,
          message: `Validated: llama.cpp server is healthy (${latencyMs}ms response).`,
        };
      }
      return {
        id: 'llamacpp',
        name: 'llama.cpp Server',
        status: 'failed',
        isConfigured: true,
        endpoint: baseUrl,
        model,
        latencyMs,
        message: `llama.cpp returned HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: any) {
      return {
        id: 'llamacpp',
        name: 'llama.cpp Server',
        status: 'skipped',
        isConfigured: false,
        endpoint: baseUrl,
        model,
        message: `llama.cpp server not detected at ${baseUrl} (${err.code || err.message}).`,
        errorDetails: String(err),
        suggestions: ['Start llama-server with: ./llama-server -m <model.gguf> --port 8080'],
      };
    }
  }

  // --- Run All Diagnostic Tests & Log to testing/errors/ ---

  public async testAllProviders(): Promise<TestRunRecord> {
    const timestamp = new Date().toISOString();
    const runId = `test-run-${Date.now()}`;

    // Test all providers concurrently
    const [gemini, openai, anthropic, openrouter, huggingface, ollama, llamacpp] = await Promise.all([
      this.validateGemini(),
      this.validateOpenAI(),
      this.validateAnthropic(),
      this.validateOpenRouter(),
      this.validateHuggingFace(),
      this.validateOllama(),
      this.validateLlamaCpp(),
    ]);

    const results = [gemini, openai, anthropic, openrouter, huggingface, ollama, llamacpp];

    const record: TestRunRecord = {
      runId,
      timestamp,
      environment: process.env.NODE_ENV || 'development',
      totalTested: results.length,
      passedCount: results.filter(r => r.status === 'passed').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      skippedCount: results.filter(r => r.status === 'skipped').length,
      results,
    };

    // Save to testing/errors/ with timestamped file and latest_test_run.json
    errorLogger.saveTestRun(record);

    return record;
  }

  // --- Provider Resolution & Listing ---

  public async getProvidersStatus(): Promise<{ activeProvider: string; providers: ProviderInfo[] }> {
    const geminiConf = this.isGeminiConfigured();
    const openaiConf = this.isOpenAIConfigured();
    const anthropicConf = this.isAnthropicConfigured();
    const openrouterConf = this.isOpenRouterConfigured();
    const hfConf = this.isHuggingFaceConfigured();

    // Determine active provider
    let resolvedActive = this.activeProviderId;
    if (resolvedActive === 'auto' || !resolvedActive) {
      const preferred = process.env.DEFAULT_AI_PROVIDER || 'auto';
      if (preferred !== 'auto') {
        resolvedActive = preferred;
      } else if (geminiConf) {
        resolvedActive = 'gemini';
      } else if (openrouterConf) {
        resolvedActive = 'openrouter';
      } else if (openaiConf) {
        resolvedActive = 'openai';
      } else if (anthropicConf) {
        resolvedActive = 'anthropic';
      } else if (hfConf) {
        resolvedActive = 'huggingface';
      } else {
        resolvedActive = 'fallback';
      }
    }

    const providers: ProviderInfo[] = [
      {
        id: 'gemini',
        name: 'Google Gemini',
        type: 'cloud',
        isConfigured: geminiConf,
        status: resolvedActive === 'gemini' ? 'active' : geminiConf ? 'available' : 'unconfigured',
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      },
      {
        id: 'openrouter',
        name: 'OpenRouter (Open MoE)',
        type: 'gateway',
        isConfigured: openrouterConf,
        status: resolvedActive === 'openrouter' ? 'active' : openrouterConf ? 'available' : 'unconfigured',
        model: process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct',
        endpoint: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'cloud',
        isConfigured: openaiConf,
        status: resolvedActive === 'openai' ? 'active' : openaiConf ? 'available' : 'unconfigured',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        type: 'cloud',
        isConfigured: anthropicConf,
        status: resolvedActive === 'anthropic' ? 'active' : anthropicConf ? 'available' : 'unconfigured',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        endpoint: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
      },
      {
        id: 'huggingface',
        name: 'Hugging Face Inference',
        type: 'cloud',
        isConfigured: hfConf,
        status: resolvedActive === 'huggingface' ? 'active' : hfConf ? 'available' : 'unconfigured',
        model: process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct',
        endpoint: process.env.HUGGINGFACE_ENDPOINT_URL || 'https://router.huggingface.co/hf-inference/v1',
      },
      {
        id: 'ollama',
        name: 'Ollama (Local MoE/Dense)',
        type: 'local',
        isConfigured: this.isOllamaConfigured(),
        status: resolvedActive === 'ollama' ? 'active' : 'unconfigured',
        model: process.env.OLLAMA_MODEL || 'qwen2.5:32b',
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      },
      {
        id: 'llamacpp',
        name: 'llama.cpp Server',
        type: 'local',
        isConfigured: this.isLlamaCppConfigured(),
        status: resolvedActive === 'llamacpp' ? 'active' : 'unconfigured',
        model: process.env.LLAMACPP_MODEL || 'default',
        endpoint: process.env.LLAMACPP_BASE_URL || 'http://localhost:8080',
      },
      {
        id: 'fallback',
        name: 'Pedagogical Fallback Engine',
        type: 'local',
        isConfigured: true,
        status: resolvedActive === 'fallback' ? 'active' : 'available',
        model: 'built-in heuristic engine',
      },
    ];

    return { activeProvider: resolvedActive, providers };
  }

  public setActiveProvider(providerId: string): string {
    this.activeProviderId = providerId;
    return this.activeProviderId;
  }

  // --- 1. Course Generation (Dispatches to active or available provider) ---

  public async generateCourse(params: CourseGenerationPromptParams): Promise<Course> {
    const { activeProvider } = await this.getProvidersStatus();

    // 1. Try Google Gemini if active or available
    if (activeProvider === 'gemini' && this.isGeminiConfigured()) {
      try {
        const prompt = `You are the Master Curriculum Architect for Skolve, an adaptive AI education platform.
Generate a comprehensive, high-yield course curriculum based on the learner's profile:
- Primary Goal: "${params.goal}"
- Baseline Level: "${params.level}"
- Preferred Pedagogy: "${params.pedagogy}"
- Weekly Time Commitment: ${params.hoursPerWeek} hours/week
- Prior Skills: ${params.knownSkills?.join(', ') || 'General fundamentals'}

Pedagogical Directives:
1. Follow Bloom's Revised Taxonomy (Remember -> Understand -> Apply -> Analyze -> Evaluate -> Create).
2. Decompose into 2-3 coherent modules.
3. Each module must contain 2 high-value lessons with explicit learning objectives, conceptual markdown explanations with mathematical/structural clarity, code or analytical exercise, and a quiz checkpoint.
4. Output MUST be valid JSON adhering to the specified schema.`;

        const response = await geminiClient.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedHours: { type: Type.NUMBER },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                modules: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      lessons: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            title: { type: Type.STRING },
                            durationMinutes: { type: Type.NUMBER },
                            summary: { type: Type.STRING },
                            contentMarkdown: { type: Type.STRING },
                            quiz: {
                              type: Type.OBJECT,
                              properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctAnswerIndex: { type: Type.NUMBER },
                                explanation: { type: Type.STRING },
                              },
                              required: ['question', 'options', 'correctAnswerIndex', 'explanation'],
                            },
                          },
                          required: ['title', 'durationMinutes', 'summary', 'contentMarkdown', 'quiz'],
                        },
                      },
                    },
                    required: ['title', 'description', 'lessons'],
                  },
                },
              },
              required: ['title', 'description', 'estimatedHours', 'tags', 'modules'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return this.formatGeneratedCourse(parsed, params);
        }
      } catch (err) {
        console.warn('Gemini generation failed, checking alternatives:', err);
      }
    }

    // 2. Try OpenAI or OpenRouter if active or configured
    if ((activeProvider === 'openai' && this.isOpenAIConfigured()) ||
        (activeProvider === 'openrouter' && this.isOpenRouterConfigured())) {
      const isOR = activeProvider === 'openrouter';
      const baseUrl = isOR ? (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
      const apiKey = isOR ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
      const model = isOR ? (process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct') : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

      try {
        const prompt = `You are the Master Curriculum Architect for Skolve. Output a JSON object with:
title, description, estimatedHours, tags (array), and modules (array of objects with title, description, and lessons array).
Goal: "${params.goal}". Level: "${params.level}". Pedagogy: "${params.pedagogy}".`;

        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an educational curriculum architect. You output only valid JSON.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw = JSON.parse(data.choices[0]?.message?.content || '{}');
          if (raw.title && raw.modules) {
            return this.formatGeneratedCourse(raw, params);
          }
        }
      } catch (e) {
        console.warn(`${activeProvider} generation error:`, e);
      }
    }

    // 3. High-Fidelity Pedagogical Fallback Generator
    return this.generateFallbackCourse(params);
  }

  // --- 2. Socratic AI Tutor Chat ---

  public async socraticTutorResponse(
    message: string,
    lessonContext: { title: string; summary: string; contentMarkdown: string },
    history: { role: 'user' | 'model'; text: string }[] = []
  ): Promise<string> {
    const { activeProvider } = await this.getProvidersStatus();

    // 1. Google Gemini
    if (activeProvider === 'gemini' && this.isGeminiConfigured()) {
      try {
        const systemInstruction = `You are the Skolve Socratic AI Tutor.
Your pedagogical principle is the Socratic Method:
1. Guide the learner to uncover answers through probing questions, intuition-building analogies, and active recall.
2. NEVER immediately blurt out complete solutions to problem sets. If the learner asks for an answer, challenge their assumption or give a step-by-step hint.
3. Ground your explanations in the current lesson:
Lesson Title: "${lessonContext.title}"
Lesson Summary: "${lessonContext.summary}"
Keep responses concise, clear, and encouraging.`;

        const contents = [
          ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }],
          })),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ];

        const response = await geminiClient.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        return response.text || "Let's think through this step by step. What do you think is the primary constraint here?";
      } catch (err) {
        console.warn('Socratic tutor Gemini error, fallback in use:', err);
      }
    }

    // 2. OpenAI / OpenRouter
    if ((activeProvider === 'openai' && this.isOpenAIConfigured()) ||
        (activeProvider === 'openrouter' && this.isOpenRouterConfigured())) {
      const isOR = activeProvider === 'openrouter';
      const baseUrl = isOR ? (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1') : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
      const apiKey = isOR ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
      const model = isOR ? (process.env.OPENROUTER_MODEL || 'qwen/qwen-2.5-72b-instruct') : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

      try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are the Skolve Socratic AI Tutor for "${lessonContext.title}". Guide the learner through questions and analogies. Never give direct answers right away.`,
              },
              ...history.map(h => ({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices[0]?.message?.content;
          if (reply) return reply;
        }
      } catch (e) {
        console.warn(`${activeProvider} tutor error:`, e);
      }
    }

    // High-Yield Pedagogical Fallback Response
    return this.generateFallbackTutorResponse(message, lessonContext);
  }

  // --- 3. Rubric-Based Quiz Auto-Grader ---

  public async gradeAssessment(
    question: string,
    userAnswer: string,
    rubricKeywords: string[] = [],
    modelExplanation: string = ''
  ): Promise<{
    score: number;
    accuracyGrade: 'high' | 'partial' | 'low';
    feedbackText: string;
    strengths: string[];
    misconceptions: string[];
  }> {
    const { activeProvider } = await this.getProvidersStatus();

    if (activeProvider === 'gemini' && this.isGeminiConfigured()) {
      try {
        const prompt = `Grade this student submission according to pedagogical rubrics.
Question: "${question}"
Student Answer: "${userAnswer}"
Expected Solution / Context: "${modelExplanation}"
Rubric Keywords: ${rubricKeywords.join(', ') || 'N/A'}

Provide:
1. Score from 0 to 100
2. Accuracy grade ("high" >= 85, "partial" 50-84, "low" < 50)
3. Constructive feedback
4. Key strengths (1-2 bullets)
5. Misconceptions or gaps identified (0-2 bullets)`;

        const response = await geminiClient.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                accuracyGrade: { type: Type.STRING },
                feedbackText: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['score', 'accuracyGrade', 'feedbackText', 'strengths', 'misconceptions'],
            },
          },
        });

        const text = response.text;
        if (text) {
          const res = JSON.parse(text);
          return {
            score: Math.min(100, Math.max(0, Math.round(res.score))),
            accuracyGrade: res.accuracyGrade === 'high' || res.accuracyGrade === 'partial' ? res.accuracyGrade : 'low',
            feedbackText: res.feedbackText,
            strengths: res.strengths || [],
            misconceptions: res.misconceptions || [],
          };
        }
      } catch (err) {
        console.warn('Auto-grader Gemini error, falling back:', err);
      }
    }

    // Heuristic Fallback Grader
    const lowerAnswer = userAnswer.toLowerCase();
    const matches = rubricKeywords.filter(k => lowerAnswer.includes(k.toLowerCase()));
    const ratio = rubricKeywords.length > 0 ? matches.length / rubricKeywords.length : 0.75;
    const score = Math.round(40 + ratio * 55 + (userAnswer.length > 40 ? 5 : 0));
    const grade = score >= 80 ? 'high' : score >= 55 ? 'partial' : 'low';

    return {
      score: Math.min(100, score),
      accuracyGrade: grade,
      feedbackText:
        score >= 80
          ? 'Clear and well-reasoned explanation. You captured the critical invariants accurately.'
          : 'Good initial intuition. Consider elaborating on how the underlying state transitions handle failure scenarios.',
      strengths: matches.length > 0 ? [`Identified core concepts: ${matches.slice(0, 2).join(', ')}`] : ['Articulated a concrete perspective'],
      misconceptions: matches.length < rubricKeywords.length ? ['Ensure you address how synchronization or reconciliation occurs'] : [],
    };
  }

  // --- Helper Formatter ---

  private formatGeneratedCourse(raw: any, params: CourseGenerationPromptParams): Course {
    const courseId = `course-gen-${crypto.randomUUID().slice(0, 8)}`;
    const modules: CourseModule[] = (raw.modules || []).map((m: any, mIdx: number) => {
      const moduleId = `mod-${courseId}-${mIdx + 1}`;
      const lessons: CourseLesson[] = (m.lessons || []).map((l: any, lIdx: number) => ({
        id: `les-${moduleId}-${lIdx + 1}`,
        moduleId,
        order: lIdx + 1,
        title: l.title || `Lesson ${lIdx + 1}`,
        durationMinutes: l.durationMinutes || 25,
        summary: l.summary || '',
        contentMarkdown: l.contentMarkdown || 'Content undergoing active synthesis...',
        quiz: l.quiz
          ? {
              id: `quiz-${moduleId}-${lIdx + 1}`,
              type: 'multiple-choice',
              question: l.quiz.question,
              options: l.quiz.options,
              correctAnswerIndex: l.quiz.correctAnswerIndex ?? 0,
              explanation: l.quiz.explanation || 'Verified correct answer.',
            }
          : undefined,
      }));
      return {
        id: moduleId,
        order: mIdx + 1,
        title: m.title || `Module ${mIdx + 1}`,
        description: m.description || '',
        lessons,
      };
    });

    return {
      id: courseId,
      userId: 'learner',
      title: raw.title || `Tailored Curriculum: ${params.goal}`,
      description: raw.description || `Custom engineered learning pathway targeting "${params.goal}".`,
      difficulty: params.level,
      estimatedHours: raw.estimatedHours || 8,
      tags: raw.tags || [params.level, params.pedagogy],
      modules,
      createdAt: new Date().toISOString(),
      isPublic: true,
    };
  }

  // --- Fallback Course Generator ---

  private generateFallbackCourse(params: CourseGenerationPromptParams): Course {
    const courseId = `course-gen-${crypto.randomUUID().slice(0, 8)}`;
    const title = params.goal.length > 5 ? `Mastering ${params.goal}` : 'Adaptive AI Engineering Track';

    return {
      id: courseId,
      userId: 'learner',
      title,
      description: `A targeted ${params.level}-level syllabus built specifically around your goal: "${params.goal}". Emphasizes ${params.pedagogy} learning at ${params.hoursPerWeek} hrs/week.`,
      difficulty: params.level,
      estimatedHours: Math.max(6, params.hoursPerWeek * 2),
      tags: [params.level, params.pedagogy, 'Personalized'],
      createdAt: new Date().toISOString(),
      isPublic: true,
      modules: [
        {
          id: `mod-${courseId}-1`,
          order: 1,
          title: `01. Core Architecture & Mental Models for ${params.goal}`,
          description: 'Establish foundational axioms, system constraints, and decomposition strategies.',
          lessons: [
            {
              id: `les-${courseId}-1-1`,
              moduleId: `mod-${courseId}-1`,
              order: 1,
              title: 'Decomposing the System Boundary & First Principles',
              durationMinutes: 25,
              summary: 'Analyze the problem space, identify bottlenecks, and formulate the core state machine.',
              contentMarkdown: `### Architectural Deconstruction

To master **${params.goal}**, we must first isolate the core invariant. Every complex system is a sequence of transformations operating on bounded states.

\`\`\`
[Input Signal / Intent] ──► [Evaluation & Transformation] ──► [Output Invariant]
\`\`\`

#### Key Architectural Considerations
1. **State Isolation:** Ensure individual subsystems maintain clear failure domains.
2. **Deterministic Contracts:** Define schema interfaces before writing implementation code.
3. **Pacing & Validation:** Incorporate unit feedback loops to prevent update drift.`,
              interactiveSimulation: {
                type: 'consensus-visualizer',
                title: 'State Transition Sandbox',
                description: 'Observe dynamic signal propagation and state reconciliation in real time.',
              },
              quiz: {
                id: `quiz-${courseId}-1-1`,
                type: 'multiple-choice',
                question: 'When designing a robust system architecture, why is establishing clear boundary invariants prioritized before optimizing raw throughput?',
                options: [
                  'Because optimization without verified invariants leads to compounding state corruption and untestable edge cases.',
                  'Because modern compilers automatically optimize unverified invariants.',
                  'Because hardware caches require identical data models across all threads.',
                  'Because network bandwidth is always the limiting factor.',
                ],
                correctAnswerIndex: 0,
                explanation: 'A system must be provably correct under nominal and edge failure modes before performance optimizations are applied.',
              },
            },
            {
              id: `les-${courseId}-1-2`,
              moduleId: `mod-${courseId}-1`,
              order: 2,
              title: 'Practical Execution & Integration Patterns',
              durationMinutes: 30,
              summary: 'Hands-on construction of the operational loop with telemetry and error handling.',
              contentMarkdown: `### Operational Implementation

Now that the boundary is established, we implement the primary driver loop.

\`\`\`typescript
interface PipelineContext<T> {
  payload: T;
  timestamp: number;
  retries: number;
}

async function processPipelineStep<T>(context: PipelineContext<T>): Promise<T> {
  // Execute step with telemetry check
  return context.payload;
}
\`\`\`

Ensure all asynchronous operations feature explicit timeouts and exponential backoff.`,
              quiz: {
                id: `quiz-${courseId}-1-2`,
                type: 'multiple-choice',
                question: 'What is the primary benefit of exponential backoff with jitter in distributed retries?',
                options: [
                  'It prevents the Thundering Herd problem from overwhelming recovering services.',
                  'It guarantees zero dropped packets.',
                  'It doubles CPU clock frequency during spikes.',
                  'It eliminates the need for database indexes.',
                ],
                correctAnswerIndex: 0,
                explanation: 'Exponential backoff with jitter desynchronizes retrying clients, preventing stampeding thundering herds.',
              },
            },
          ],
        },
        {
          id: `mod-${courseId}-2`,
          order: 2,
          title: '02. Production Hardening, Edge Cases & Verification',
          description: 'Harden against failure states, instrument telemetry, and perform rubric evaluations.',
          lessons: [
            {
              id: `les-${courseId}-2-1`,
              moduleId: `mod-${courseId}-2`,
              order: 1,
              title: 'Failure Modes, Resilience & Observability',
              durationMinutes: 35,
              summary: 'Identify single points of failure, partition tolerance, and recovery protocols.',
              contentMarkdown: `### Resilience by Design

Production systems fail in creative ways. By modeling each failure condition as a predictable state transition, our software remains resilient.

- **Partition Tolerance:** How the node behaves when disconnected from its peer.
- **Graceful Degradation:** Providing cached or safe default responses instead of throwing an unhandled exception.
- **Audit Logging:** Every critical decision is recorded monotonically.`,
              quiz: {
                id: `quiz-${courseId}-2-1`,
                type: 'multiple-choice',
                question: 'Which design pattern is best suited for preventing a failing downstream dependency from cascading failures throughout the entire system?',
                options: [
                  'Circuit Breaker Pattern',
                  'Singleton Pattern',
                  'Factory Method Pattern',
                  'Flyweight Pattern',
                ],
                correctAnswerIndex: 0,
                explanation: 'A Circuit Breaker trips after repeated failures, immediately returning a fallback without wasting connection pools or threads.',
              },
            },
          ],
        },
      ],
    };
  }

  // --- Fallback Socratic Tutor ---

  private generateFallbackTutorResponse(
    message: string,
    lessonContext: { title: string; summary: string }
  ): string {
    const q = message.toLowerCase();
    if (q.includes('why') || q.includes('how')) {
      return `That touches the heart of "${lessonContext.title}". Before looking at the final formula, consider: what constraint would break if we didn't have this mechanism in place? How would the nodes or processes know they were in agreement?`;
    }
    if (q.includes('hint') || q.includes('help') || q.includes('stuck')) {
      return `Here's a guiding intuition: think about what happens when two independent events happen at the exact same millisecond across different servers. Who decides which one came first? Review the monotonic counter rules in the lesson text above!`;
    }
    return `Great inquiry regarding "${lessonContext.title}". How would you apply this principle if the network dropped 30% of packets? What invariant must remain true regardless of dropped messages?`;
  }
}

export const aiGateway = new AIGateway();
