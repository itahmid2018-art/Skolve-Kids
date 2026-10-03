import React from 'react';
import { Course, UserProgress } from '../types';
import { BookOpen, Sparkles, Clock, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface CourseCatalogProps {
  courses: Course[];
  progressMap: Record<string, UserProgress>;
  onSelectCourse: (course: Course) => void;
  onOpenGenerator: () => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({
  courses,
  progressMap,
  onSelectCourse,
  onOpenGenerator,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Editorial Hero Banner */}
      <div className="mb-10 bg-slate-900 text-white rounded-2xl p-8 sm:p-10 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-indigo-400 mb-2">
            AI-Tailored Education Platform
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Illuminating Personalized Paths to Mastery
          </h1>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Every learner thinks differently. Skolve utilizes multi-model Mixture of Experts reasoning to synthesize structured curricula, interactive sandboxes, and Socratic guidance calibrated to your exact goals.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenGenerator}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Synthesize New Curriculum</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle background accents */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Catalog Section Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Curricula</h2>
          <p className="text-xs text-slate-500">Rigorous tracks structured across foundational invariants and practical sandboxes.</p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {courses.length} courses cataloged
        </span>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const progress = progressMap[course.id];
          const percent = progress?.totalCompletionPercent || 0;
          const lessonCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

          return (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Zero-Pill clean metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                  <span className="capitalize">{course.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{course.estimatedHours} hrs</span>
                  <span aria-hidden="true">·</span>
                  <span>{course.modules.length} modules</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-indigo-600 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {course.description}
                </p>

                {/* Tags unboxed text */}
                <div className="flex flex-wrap gap-1.5 mt-4 text-[11px] text-slate-500">
                  {course.tags.slice(0, 3).map((tag, tIdx) => (
                    <span key={tIdx} className="bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{percent}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCourse(course)}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{percent > 0 ? 'Resume Course' : 'Begin Course'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
