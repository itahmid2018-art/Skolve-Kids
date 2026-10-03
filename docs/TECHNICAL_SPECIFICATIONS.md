# Technical Specifications & System Architecture
## Project: Skolve - AI Personalized Education Platform
**Target Audience:** Core Engineering Team, DevOps, Security Reviewers  
**Version:** 1.0.0  

---

## 1. System Architecture Overview

Skolve is structured as a full-stack, event-driven web application with a modular server architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT (Browser SPA)                             │
│  React 19 + TypeScript + Tailwind CSS (Vite Bundler)                        │
│  ┌────────────────────┐ ┌─────────────────────┐ ┌────────────────────────┐  │
│  │ Two-Zone Stage     │ │ Socratic Tutor Dock │ │ Mastery Radar Dashboard│  │
│  └─────────┬──────────┘ └──────────┬──────────┘ └───────────┬────────────┘  │
└────────────┼───────────────────────┼────────────────────────┼───────────────┘
             │ HTTP / JSON           │ SSE Streams            │ SSE Pub/Sub
             ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FULL-STACK BACKEND (Express / TS)                     │
│  Mounted on Port 3000 alongside Vite Middlewares (Development)              │
│                                                                             │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │ Auth & Session Guard  │ │ Real-Time Pub/Sub    │ │ AI Gateway Router  │  │
│  │ (JWT/Session Tokens)  │ │ Event Bus (SSE)      │ │ Multi-Provider     │  │
│  └──────────┬────────────┘ └──────────┬───────────┘ └──────────┬─────────┘  │
│             │                         │                        │            │
│             ▼                         ▼                        ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Real-Time Persistent Database Engine (Memory + Atomic File-Backing)   │  │
│  │ Collections: Users, LearningProfiles, Courses, Modules, Submissions   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             AI INFERENCE ENGINES                            │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │ Cloud: Google GenAI           │     │ Local / Self-Hosted: vLLM/Ollama│  │
│  │ Model: gemini-3.8-flash       │     │ Model: Qwen3-235B / Qwen3-32B   │  │
│  └───────────────────────────────┘     └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Real-Time Database Schema & Entity Relationships

The data layer is managed via `server/db.ts` utilizing an ACID-compliant, thread-safe in-memory store with atomic JSON snapshot persistence and real-time event broadcasting.

### 2.1 Entity: User
```typescript
interface User {
  id: string;                    // UUID v4
  email: string;                 // Unique, validated email
  passwordHash: string;          // Salted hash
  name: string;                  // Display name
  role: 'learner' | 'mentor' | 'admin';
  createdAt: string;             // ISO-8601
  avatarUrl?: string;
  learningProfileId?: string;
}
```

### 2.2 Entity: LearningProfile
```typescript
interface LearningProfile {
  id: string;
  userId: string;
  primaryGoal: string;           // e.g. "Master Distributed Systems"
  baselineLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredPedagogy: 'hands-on' | 'theory-first' | 'visual-simulation';
  weeklyHours: number;           // e.g. 5
  knownSkills: string[];         // e.g. ["Python", "Basic SQL"]
  targetMilestones: string[];
  updatedAt: string;
}
```

### 2.3 Entity: Course
```typescript
interface Course {
  id: string;
  userId: string;                // Author or generated for learner
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  tags: string[];
  modules: CourseModule[];
  createdAt: string;
  isPublic: boolean;
}

interface CourseModule {
  id: string;
  order: number;
  title: string;
  description: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  contentMarkdown: string;       // Rich formatted pedagogical content
  codeSandbox?: {
    language: string;
    starterCode: string;
    expectedOutput?: string;
  };
  quiz?: LessonQuiz;
}

interface LessonQuiz {
  id: string;
  type: 'multiple-choice' | 'conceptual-short-answer';
  question: string;
  options?: string[];            // Present if multiple-choice
  correctAnswerIndex?: number;   // Present if multiple-choice
  explanation: string;
  rubricKeywords?: string[];     // Present if conceptual
}
```

### 2.4 Entity: Submission & Progress
```typescript
interface UserProgress {
  userId: string;
  courseId: string;
  completedLessonIds: string[];
  currentLessonId: string;
  quizScores: Record<string, number>; // quizId -> score (0-100)
  totalCompletionPercent: number;
  lastActiveAt: string;
}

interface QuizSubmission {
  id: string;
  userId: string;
  quizId: string;
  lessonId: string;
  courseId: string;
  answerText: string;
  score: number;                 // 0-100
  accuracyGrade: 'high' | 'partial' | 'low';
  feedbackText: string;
  misconceptions: string[];
  submittedAt: string;
}
```

---

## 3. API Contract Specifications

### 3.1 Authentication Endpoints
- `POST /api/auth/register`: Creates new user account. Returns `{ user, token }`.
- `POST /api/auth/login`: Authenticates credentials. Returns `{ user, token }`.
- `GET /api/auth/me`: Verifies active session token. Returns current user profile.
- `POST /api/auth/switch-demo`: Instantly switches active context to pre-configured demo personas for evaluation.

### 3.2 Course & Curriculum Endpoints
- `GET /api/courses`: Lists available catalog and user's generated courses.
- `GET /api/courses/:id`: Retrieves full course structure with modules and lessons.
- `POST /api/courses/generate-stream`: **Server-Sent Events (SSE)** endpoint.
  - **Request Body:** `{ goal, level, pedagogy, hoursPerWeek, knownSkills }`
  - **Stream Protocol:** Emits `progress`, `module`, `lesson`, and `complete` events.
- `POST /api/courses/:id/enroll`: Enrolls the authenticated user in the course.

### 3.3 Interactive Learning & Tutoring
- `POST /api/tutoring/chat-stream`: Real-time Socratic AI conversation.
  - **Request Body:** `{ lessonId, message, history, contextSnippet }`
  - **Stream Response:** Tokens streamed with progressive hint delimiters.
- `POST /api/assessments/grade`: AI auto-grader evaluating answers against rubrics.
  - **Request Body:** `{ quizId, question, userAnswer, rubric }`
  - **Response:** `{ score, accuracy, feedback, strengths, misconceptionsIdentified }`

### 3.4 Real-Time Event Bus (Pub/Sub)
- `GET /api/realtime/events`: Persistent SSE stream subscription.
  - Broadcasts live events:
    - `progress:updated`: Triggered when any module or quiz is completed.
    - `course:created`: Triggered when curriculum generation finishes.
    - `streak:incremented`: Daily active recall milestone achieved.

---

## 4. AI Multi-Model Gateway & Routing Logic

The AI gateway (`server/ai.ts`) handles request dispatching, prompt synthesis, rate limit mitigation, and fallback handling:

```
User Prompt ──► [AI Gateway Router]
                     │
                     ├─► [1] Google GenAI SDK (@google/genai)
                     │       Model: gemini-3.8-flash (Primary Cloud API)
                     │
                     ├─► [2] Local Ollama / vLLM HTTP Gateway (Optional)
                     │       Model: Qwen3-235B / Qwen3-32B
                     │
                     └─► [3] Deterministic Pedagogical Generator (Offline Guard)
                             Guarantees zero crashes if keys are absent or rate-limited
```

### Prompt Engineering Guidelines (Socratic Guardrails)
1. **Never Give Flat Answers:** The tutor prompt instructs the model to guide the learner using analogy and contradiction analysis.
2. **Context Window Injection:** The current lesson's markdown and learning objectives are injected into the system prompt.
3. **Structured Output Enforcement:** For curriculum generation, strict JSON schemas are enforced via `responseSchema` or type-safe fallback parsers.
