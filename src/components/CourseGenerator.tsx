import React, { useState } from 'react';
import { Course, LearningProfile } from '../types';
import { Sparkles, Brain, Clock, BookOpen, Check, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface CourseGeneratorProps {
  userProfile: LearningProfile | null;
  onCourseGenerated: (course: Course) => void;
}

export const CourseGenerator: React.FC<CourseGeneratorProps> = ({
  userProfile,
  onCourseGenerated,
}) => {
  const [goal, setGoal] = useState(userProfile?.primaryGoal || 'Architect High-Throughput Stream Processing in TypeScript');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(userProfile?.baselineLevel || 'intermediate');
  const [pedagogy, setPedagogy] = useState<'hands-on' | 'theory-first' | 'visual-simulation'>(userProfile?.preferredPedagogy || 'hands-on');
  const [hoursPerWeek, setHoursPerWeek] = useState(userProfile?.weeklyHours || 6);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });
  const [generatedCourse, setGeneratedCourse] = useState<Course | null>(null);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isGenerating) return;

    setIsGenerating(true);
    setGeneratedCourse(null);
    setProgressStage({ percent: 10, message: 'Initiating AI curriculum reasoning pipeline...' });

    try {
      const response = await fetch('/api/courses/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          level,
          pedagogy,
          hoursPerWeek,
          knownSkills: userProfile?.knownSkills || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to establish curriculum generation stream');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('event: progress')) {
              const dataLine = lines[i + 1]?.trim();
              if (dataLine && dataLine.startsWith('data: ')) {
                try {
                  const data = JSON.parse(dataLine.replace('data: ', ''));
                  setProgressStage({ percent: data.percent, message: data.message });
                } catch (e) {}
              }
            } else if (line.startsWith('event: complete')) {
              const dataLine = lines[i + 1]?.trim();
              if (dataLine && dataLine.startsWith('data: ')) {
                try {
                  const data = JSON.parse(dataLine.replace('data: ', ''));
                  setGeneratedCourse(data.course);
                  setIsGenerating(false);
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Streaming error, falling back to synchronous API:', err);
      try {
        const res = await fetch('/api/courses/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal, level, pedagogy, hoursPerWeek }),
        });
        const data = await res.json();
        setGeneratedCourse(data.course);
      } catch (e) {
        console.error('Final fallback failed:', e);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Curriculum Synthesis Engine
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Specify a concept, technology, or research paper. Skolve utilizes multi-model Mixture of Experts reasoning to deconstruct the domain into a rigorous, interactive syllabus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <form onSubmit={handleStartGeneration} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Concept / Goal
              </label>
              <textarea
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Master Vector Clocks, Consensus Safety, and Partition Recovery"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Depth
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="beginner">Beginner (Foundations)</option>
                  <option value="intermediate">Intermediate (Core Invariants)</option>
                  <option value="advanced">Advanced (Systems & Edge Cases)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pedagogy
                </label>
                <select
                  value={pedagogy}
                  onChange={(e) => setPedagogy(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  <option value="hands-on">Hands-on Labs (Code)</option>
                  <option value="visual-simulation">Visual Models (Interactive)</option>
                  <option value="theory-first">First Principles (Math/Proofs)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Weekly Commitment
                </label>
                <span className="text-xs font-mono tabular-nums font-semibold text-indigo-600">
                  {hoursPerWeek} hrs/week
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-xs text-white shadow-xs flex items-center justify-center gap-2 transition-all ${
                isGenerating
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Curriculum...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Personalized Course</span>
                </>
              )}
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-xs text-slate-400 block mb-2">Preset Study Tracks:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: 'Rust Memory Safety', g: 'Rust Borrow Checker, Lifetimes & Concurrency' },
                { label: 'MoE Inference & KV Cache', g: 'Mixture of Experts Architecture & Continuous Batching' },
                { label: 'Zero-Knowledge Cryptography', g: 'zk-SNARKs, Polynomial Commitments & Groth16' },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGoal(p.g)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Generation Status or Course Preview */}
        <div className="lg:col-span-6">
          {isGenerating ? (
            <div className="h-full bg-slate-50 border border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                Synthesizing Pedagogical Structure
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6">
                {progressStage.message || 'Analyzing conceptual dependencies...'}
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressStage.percent}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {progressStage.percent}% Completed
              </span>
            </div>
          ) : generatedCourse ? (
            <div className="bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Curriculum Ready</span>
                </div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {generatedCourse.estimatedHours} hrs total
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-4 leading-tight">
                {generatedCourse.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {generatedCourse.description}
              </p>

              {/* Modules breakdown */}
              <div className="mt-5 space-y-3">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Generated Modules ({generatedCourse.modules.length})
                </span>
                {generatedCourse.modules.map((m, idx) => (
                  <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-xs font-semibold text-slate-900">
                      {m.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {m.lessons.length} structured lessons · Comprehension checkpoints included
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setGeneratedCourse(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Configure Another</span>
                </button>

                <button
                  type="button"
                  onClick={() => onCourseGenerated(generatedCourse)}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Launch Course</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                Adaptive Synthesis Preview
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Click "Synthesize Personalized Course" to see live decomposition, milestone checkpoints, and auto-graded assessments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
