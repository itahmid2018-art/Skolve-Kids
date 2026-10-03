import React, { useState } from 'react';
import { LearningProfile } from '../types';
import { X, CheckCircle2, Target, BookOpen, Clock, Brain } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: LearningProfile | null;
  onSaveProfile: (profile: Partial<LearningProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
}) => {
  const [goal, setGoal] = useState(currentProfile?.primaryGoal || 'Master Distributed Consensus & Fault Tolerance');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(currentProfile?.baselineLevel || 'intermediate');
  const [pedagogy, setPedagogy] = useState<'hands-on' | 'theory-first' | 'visual-simulation'>(currentProfile?.preferredPedagogy || 'hands-on');
  const [hours, setHours] = useState(currentProfile?.weeklyHours || 5);
  const [skillsText, setSkillsText] = useState(currentProfile?.knownSkills.join(', ') || 'TypeScript, SQL, Basic Networking');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      primaryGoal: goal,
      baselineLevel: level,
      preferredPedagogy: pedagogy,
      weeklyHours: hours,
      knownSkills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Personalized Learning Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Skolve calibrates curricula to your exact baseline and time budget.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Primary Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Primary Learning Goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Architect an Autonomous Agent System in TypeScript"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 placeholder-slate-400"
              required
            />
            <div className="flex gap-2 mt-2 text-[11px] text-slate-500">
              <span className="text-slate-400">Suggestions:</span>
              <button
                type="button"
                onClick={() => setGoal('Deep Dive into KV Caching & vLLM Serving')}
                className="underline hover:text-indigo-600"
              >
                KV Caching & vLLM
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setGoal('Master Quantum Qubits & Superposition')}
                className="underline hover:text-indigo-600"
              >
                Quantum Computing
              </button>
            </div>
          </div>

          {/* Skill Baseline Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-indigo-600" />
              Baseline Skill Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'beginner', label: 'Beginner', desc: 'No prior exposure; need first-principles grounding' },
                { id: 'intermediate', label: 'Intermediate', desc: 'Know fundamental syntax & basic algorithms' },
                { id: 'advanced', label: 'Advanced', desc: 'Seeking deep systems trade-offs & edge cases' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setLevel(item.id as any)}
                  className={`p-3 text-left border rounded-lg transition-all ${
                    level === item.id
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pedagogy Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Preferred Learning Modality
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'hands-on', label: 'Hands-on Labs', desc: 'Code exercises & practical implementations' },
                { id: 'visual-simulation', label: 'Interactive Models', desc: 'Dynamic state visualizers & sandboxes' },
                { id: 'theory-first', label: 'First Principles', desc: 'Rigorous mathematical & conceptual depth' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPedagogy(item.id as any)}
                  className={`p-3 text-left border rounded-lg transition-all ${
                    pedagogy === item.id
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-900">{item.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Commitment & Prior Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Weekly Hours: <span className="font-mono text-indigo-600 tabular-nums ml-1">{hours} hrs</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 hr/wk</span>
                <span>10 hrs/wk</span>
                <span>20 hrs/wk</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Known Skills (comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Python, Git, Async/Await"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
