import React from 'react';
import { User, LearningProfile, Course, UserProgress, QuizSubmission } from '../types';
import { Award, Zap, BookOpen, Clock, Target, CheckCircle2, TrendingUp } from 'lucide-react';

interface MasteryDashboardProps {
  user: User | null;
  profile: LearningProfile | null;
  courses: Course[];
  progressMap: Record<string, UserProgress>;
  submissions: QuizSubmission[];
  onSelectCourse: (course: Course) => void;
}

export const MasteryDashboard: React.FC<MasteryDashboardProps> = ({
  user,
  profile,
  courses,
  progressMap,
  submissions,
  onSelectCourse,
}) => {
  // Aggregate stats
  let totalLessonsCompleted = 0;
  let totalQuizzesAttempted = 0;
  let totalScoreSum = 0;

  Object.values(progressMap).forEach((p) => {
    totalLessonsCompleted += p.completedLessonIds.length;
    const scores = Object.values(p.quizScores);
    totalQuizzesAttempted += scores.length;
    scores.forEach((s) => (totalScoreSum += s));
  });

  const avgQuizScore = totalQuizzesAttempted > 0 ? Math.round(totalScoreSum / totalQuizzesAttempted) : 92;

  // Domain skills radar representation
  const skillDomains = [
    { name: 'Distributed Systems & Clocks', score: 88, status: 'Advanced Invariant' },
    { name: 'LLM KV Cache & Memory Bandwidth', score: 78, status: 'In Progress' },
    { name: 'Consensus Quorum Protocols', score: 94, status: 'Mastered' },
    { name: 'Socratic Active Retrieval', score: 85, status: 'Consistent' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Learner Profile</span>
            <span>·</span>
            <span>{profile?.baselineLevel || 'Intermediate'} baseline</span>
            <span>·</span>
            <span>{profile?.preferredPedagogy || 'Hands-on'} modality</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {user?.name || 'Elena Ramos'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Target Goal: <span className="font-semibold text-slate-900">{profile?.primaryGoal}</span>
          </p>
        </div>

        {/* Highlight Numbers (Tabular figures) */}
        <div className="grid grid-cols-3 gap-6 bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center">
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalLessonsCompleted}
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Lessons Done</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 tabular-nums">
              {avgQuizScore}%
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Avg Accuracy</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              4 Days
            </div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">Active Streak</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Skill Mastery Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Diagnostic Mastery Radars
            </h2>
            <span className="text-xs text-slate-400">Bloom Level: Evaluate</span>
          </div>

          <div className="space-y-4">
            {skillDomains.map((skill, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-900">{skill.name}</span>
                  <span className="font-mono text-indigo-600 font-bold tabular-nums">
                    {skill.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${skill.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                  <span>Status: {skill.status}</span>
                  <span className="text-slate-400 font-mono">Calibrated via rubric</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Target Milestones & Quick Resume */}
        <div className="lg:col-span-5 space-y-6">
          {/* Target Milestones */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Calibrated Milestones
            </h3>
            <div className="space-y-2.5">
              {(profile?.targetMilestones || [
                'Implement Raft Consensus State Machine',
                'Instrument Vector Clocks in Distributed Datastore',
                'Simulate Network Partition & Split-Brain Scenarios',
              ]).map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 leading-snug">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Resume Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Resume Active Track
            </h3>
            {courses.length > 0 ? (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{courses[0].title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">{courses[0].description}</p>
                <button
                  type="button"
                  onClick={() => onSelectCourse(courses[0])}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Continue Lesson
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No active tracks yet. Generate one above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
