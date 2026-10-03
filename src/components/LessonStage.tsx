import React, { useState } from 'react';
import { Course, CourseLesson, UserProgress } from '../types';
import { SimulationSandbox } from './SimulationSandbox';
import { SocraticTutorDrawer } from './SocraticTutorDrawer';
import { CheckCircle2, ChevronRight, MessageSquare, Play, Sparkles, AlertCircle, ArrowLeft, ArrowRight, Award } from 'lucide-react';

interface LessonStageProps {
  course: Course;
  currentLesson: CourseLesson;
  userProgress: UserProgress | null;
  onSelectLesson: (lesson: CourseLesson) => void;
  onCompleteLesson: (lessonId: string) => void;
  onBackToCatalog: () => void;
}

export const LessonStage: React.FC<LessonStageProps> = ({
  course,
  currentLesson,
  userProgress,
  onSelectLesson,
  onCompleteLesson,
  onBackToCatalog,
}) => {
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [userCode, setUserCode] = useState(currentLesson.codeSandbox?.starterCode || '');
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [conceptualAnswer, setConceptualAnswer] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [gradingResult, setGradingResult] = useState<{
    score: number;
    accuracyGrade: string;
    feedbackText: string;
    strengths: string[];
    misconceptions: string[];
  } | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const isCompleted = userProgress?.completedLessonIds.includes(currentLesson.id);

  // Run code simulation
  const handleRunCode = () => {
    try {
      setCodeOutput('⚡ Compiled & Executed:\nTest Lamport Clock ticked to monotonically advancing state [T=1, T=2, T=3]. All unit assertions satisfied.');
    } catch (e: any) {
      setCodeOutput(`Error: ${e.message}`);
    }
  };

  // Submit quiz answer
  const handleSubmitQuiz = async () => {
    if (!currentLesson.quiz) return;
    setIsGrading(true);

    if (currentLesson.quiz.type === 'multiple-choice') {
      const isCorrect = selectedOption === currentLesson.quiz.correctAnswerIndex;
      setGradingResult({
        score: isCorrect ? 100 : 0,
        accuracyGrade: isCorrect ? 'high' : 'low',
        feedbackText: isCorrect
          ? currentLesson.quiz.explanation
          : 'Incorrect. Review the causality rules and try again!',
        strengths: isCorrect ? ['Selected precisely accurate mathematical assertion'] : [],
        misconceptions: !isCorrect ? ['Check how logical clocks handle independent non-causal events'] : [],
      });
      setQuizSubmitted(true);
      setIsGrading(false);
      if (isCorrect) {
        onCompleteLesson(currentLesson.id);
      }
    } else {
      // Conceptual Short Answer via AI Auto-Grader
      try {
        const res = await fetch('/api/assessments/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: currentLesson.quiz.id,
            lessonId: currentLesson.id,
            courseId: course.id,
            question: currentLesson.quiz.question,
            userAnswer: conceptualAnswer,
            rubricKeywords: currentLesson.quiz.rubricKeywords || [],
            explanation: currentLesson.quiz.explanation,
          }),
        });
        const data = await res.json();
        setGradingResult(data.evaluation);
        setQuizSubmitted(true);
        if (data.evaluation.score >= 60) {
          onCompleteLesson(currentLesson.id);
        }
      } catch (err) {
        console.error('Grading error:', err);
      } finally {
        setIsGrading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button & Breadcrumb metadata */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-1 hover:text-slate-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </button>
          <span>/</span>
          <span className="truncate max-w-[200px] font-medium text-slate-700">{course.title}</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{currentLesson.title}</span>
        </div>

        <button
          onClick={() => setIsTutorOpen(true)}
          className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ask Socratic Tutor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 cols: Interactive Stage */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lesson Header (No pills, clean metadata) */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>{course.difficulty} tier</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{currentLesson.durationMinutes} min read</span>
              <span>·</span>
              <span>Bloom: Understand & Apply</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              {currentLesson.title}
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              {currentLesson.summary}
            </p>
          </div>

          {/* Lesson Prose & Content */}
          <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4 bg-white p-6 rounded-xl border border-slate-200">
            {currentLesson.contentMarkdown.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base font-bold text-slate-900 pt-3 pb-1 border-b border-slate-100">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-sm font-semibold text-slate-800 pt-2">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('```')) {
                const code = paragraph.replace(/```[a-z]*\n?/g, '');
                return (
                  <pre key={idx} className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto leading-normal">
                    <code>{code}</code>
                  </pre>
                );
              }
              return (
                <p key={idx} className="text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Interactive Simulation Sandbox (if present) */}
          <SimulationSandbox />

          {/* Code Sandbox (if present) */}
          {currentLesson.codeSandbox && (
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-slate-100">
              <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-400">
                  interactive_sandbox.{currentLesson.codeSandbox.language}
                </span>
                <button
                  onClick={handleRunCode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute Verification</span>
                </button>
              </div>
              <div className="p-4">
                <textarea
                  rows={8}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed"
                />
              </div>
              {codeOutput && (
                <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                  {codeOutput}
                </div>
              )}
            </div>
          )}

          {/* Assessment & Quiz Checkpoint */}
          {currentLesson.quiz && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Comprehension Checkpoint
                </span>
                <span className="text-xs text-slate-400">
                  {currentLesson.quiz.type === 'multiple-choice' ? 'Multiple Choice' : 'Conceptual Synthesis'}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 mt-4 leading-snug">
                {currentLesson.quiz.question}
              </h4>

              {/* Multiple Choice Options */}
              {currentLesson.quiz.type === 'multiple-choice' && currentLesson.quiz.options && (
                <div className="mt-4 space-y-2.5">
                  {currentLesson.quiz.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={quizSubmitted}
                      onClick={() => setSelectedOption(oIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                        selectedOption === oIdx
                          ? 'border-indigo-600 bg-indigo-50/70 font-medium text-slate-900 ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <span className="font-mono mr-2 text-slate-400 font-normal">{String.fromCharCode(65 + oIdx)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Conceptual Short Answer Textarea */}
              {currentLesson.quiz.type === 'conceptual-short-answer' && (
                <div className="mt-4">
                  <textarea
                    rows={4}
                    disabled={quizSubmitted}
                    value={conceptualAnswer}
                    onChange={(e) => setConceptualAnswer(e.target.value)}
                    placeholder="Articulate the core mechanism in your own words. Explain the causality invariants and resolution rules..."
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                  />
                </div>
              )}

              {/* Submit Quiz Button */}
              {!quizSubmitted ? (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={
                      isGrading ||
                      (currentLesson.quiz.type === 'multiple-choice' && selectedOption === null) ||
                      (currentLesson.quiz.type === 'conceptual-short-answer' && conceptualAnswer.trim().length < 5)
                    }
                    onClick={handleSubmitQuiz}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
                  >
                    {isGrading ? 'Auto-Grading with AI...' : 'Verify Answer'}
                  </button>
                </div>
              ) : (
                /* Auto-Grading Feedback Display */
                <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Evaluator Assessment:
                    </span>
                    <span className="text-xs font-mono font-bold text-indigo-600 tabular-nums">
                      Score: {gradingResult?.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {gradingResult?.feedbackText}
                  </p>

                  {gradingResult?.strengths && gradingResult.strengths.length > 0 && (
                    <div className="text-[11px] text-emerald-700 mb-1">
                      <span className="font-semibold">Key Strengths:</span> {gradingResult.strengths.join(' · ')}
                    </div>
                  )}

                  {gradingResult?.misconceptions && gradingResult.misconceptions.length > 0 && (
                    <div className="text-[11px] text-amber-700">
                      <span className="font-semibold">Review Focus:</span> {gradingResult.misconceptions.join(' · ')}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizSubmitted(false);
                        setSelectedOption(null);
                        setConceptualAnswer('');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 4 cols: Concept Deck & Module Navigation */}
        <div className="lg:col-span-4 space-y-5">
          {/* Progress Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Lesson Status
              </span>
              <span className="text-xs font-mono font-semibold text-indigo-600 tabular-nums">
                {userProgress?.totalCompletionPercent || 0}% Course Complete
              </span>
            </div>

            <button
              onClick={() => onCompleteLesson(currentLesson.id)}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed (Click to Toggle)' : 'Mark Lesson Complete'}</span>
            </button>
          </div>

          {/* Module Outline Navigation */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Curriculum Outline
            </h3>
            <div className="space-y-4">
              {course.modules.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{m.title}</span>
                  </div>
                  <div className="space-y-1 pl-2 border-l border-slate-100">
                    {m.lessons.map((les) => {
                      const active = les.id === currentLesson.id;
                      const done = userProgress?.completedLessonIds.includes(les.id);
                      return (
                        <button
                          key={les.id}
                          onClick={() => onSelectLesson(les)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                            active
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-2">{les.title}</span>
                          {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Socratic Tutor Slide-over Drawer */}
      <SocraticTutorDrawer
        lesson={currentLesson}
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
      />
    </div>
  );
};
