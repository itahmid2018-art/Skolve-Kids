export interface User {
  id: string;
  email: string;
  name: string;
  role: 'learner' | 'mentor' | 'admin';
  avatarUrl?: string;
}

export interface LearningProfile {
  id: string;
  userId: string;
  primaryGoal: string;
  baselineLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredPedagogy: 'hands-on' | 'theory-first' | 'visual-simulation';
  weeklyHours: number;
  knownSkills: string[];
  targetMilestones: string[];
}

export interface LessonQuiz {
  id: string;
  type: 'multiple-choice' | 'conceptual-short-answer';
  question: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation: string;
  rubricKeywords?: string[];
}

export interface CourseLesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  contentMarkdown: string;
  interactiveSimulation?: {
    type: 'consensus-visualizer' | 'attention-matrix' | 'qubit-bloch-sphere';
    title: string;
    description: string;
  };
  codeSandbox?: {
    language: string;
    starterCode: string;
    solutionCode: string;
  };
  quiz?: LessonQuiz;
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  tags: string[];
  modules: CourseModule[];
  createdAt: string;
  isPublic: boolean;
}

export interface UserProgress {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  currentLessonId: string;
  quizScores: Record<string, number>;
  totalCompletionPercent: number;
  lastActiveAt: string;
}

export interface QuizSubmission {
  id: string;
  userId: string;
  quizId: string;
  lessonId: string;
  courseId: string;
  answerText: string;
  score: number;
  accuracyGrade: 'high' | 'partial' | 'low';
  feedbackText: string;
  misconceptions: string[];
  submittedAt: string;
}
