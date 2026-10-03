import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'learner' | 'mentor' | 'admin';
  createdAt: string;
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
  updatedAt: string;
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

class RealtimeDatabase {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, string> = new Map(); // token -> userId
  private profiles: Map<string, LearningProfile> = new Map(); // userId -> profile
  private courses: Map<string, Course> = new Map();
  private progress: Map<string, UserProgress> = new Map(); // `${userId}:${courseId}` -> progress
  private submissions: Map<string, QuizSubmission> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();

  constructor() {
    this.seedInitialData();
  }

  // --- Real-time Event System ---
  public subscribe(listener: (event: { topic: string; data: any; timestamp: string }) => void) {
    this.eventEmitter.on('realtime_event', listener);
    return () => this.eventEmitter.off('realtime_event', listener);
  }

  public broadcast(topic: string, data: any) {
    const payload = { topic, data, timestamp: new Date().toISOString() };
    this.eventEmitter.emit('realtime_event', payload);
  }

  // --- Auth & Users ---
  public registerUser(name: string, email: string, password: string, role: 'learner' | 'mentor' | 'admin' = 'learner'): { user: User; token: string } {
    const existing = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('User already exists with this email address.');
    }
    const id = `user-${crypto.randomUUID()}`;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const user: User = {
      id,
      email,
      passwordHash,
      name,
      role,
      createdAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };
    this.users.set(id, user);

    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, id);

    this.broadcast('user:registered', { userId: id, name, role });
    return { user, token };
  }

  public loginUser(email: string, password: string): { user: User; token: string } {
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const user = Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === passwordHash);
    if (!user) {
      throw new Error('Invalid email or password.');
    }
    const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, user.id);
    return { user, token };
  }

  public getUserByToken(token: string): User | null {
    const userId = this.sessions.get(token);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // --- Learning Profiles ---
  public getProfile(userId: string): LearningProfile | null {
    return this.profiles.get(userId) || null;
  }

  public updateProfile(userId: string, profileData: Partial<LearningProfile>): LearningProfile {
    const existing = this.profiles.get(userId) || {
      id: `prof-${crypto.randomUUID()}`,
      userId,
      primaryGoal: 'Learn Machine Learning Systems',
      baselineLevel: 'intermediate',
      preferredPedagogy: 'hands-on',
      weeklyHours: 5,
      knownSkills: ['Python', 'Data Structures'],
      targetMilestones: ['Build an autonomous agent', 'Deploy vLLM on GPU'],
      updatedAt: new Date().toISOString(),
    };
    const updated: LearningProfile = {
      ...existing,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(userId, updated);
    this.broadcast('profile:updated', { userId, profile: updated });
    return updated;
  }

  // --- Courses ---
  public getCourses(): Course[] {
    return Array.from(this.courses.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getCourseById(id: string): Course | null {
    return this.courses.get(id) || null;
  }

  public saveCourse(course: Course): Course {
    this.courses.set(course.id, course);
    this.broadcast('course:created', { courseId: course.id, title: course.title });
    return course;
  }

  // --- Progress Tracking ---
  public getProgress(userId: string, courseId: string): UserProgress {
    const key = `${userId}:${courseId}`;
    if (!this.progress.has(key)) {
      const course = this.courses.get(courseId);
      const firstLessonId = course?.modules[0]?.lessons[0]?.id || '';
      const initial: UserProgress = {
        userId,
        courseId,
        completedLessonIds: [],
        currentLessonId: firstLessonId,
        quizScores: {},
        totalCompletionPercent: 0,
        lastActiveAt: new Date().toISOString(),
      };
      this.progress.set(key, initial);
      return initial;
    }
    return this.progress.get(key)!;
  }

  public markLessonComplete(userId: string, courseId: string, lessonId: string): UserProgress {
    const current = this.getProgress(userId, courseId);
    const completedSet = new Set(current.completedLessonIds);
    completedSet.add(lessonId);

    const course = this.courses.get(courseId);
    let totalLessons = 0;
    if (course) {
      course.modules.forEach(m => {
        totalLessons += m.lessons.length;
      });
    }

    const completedLessonIds = Array.from(completedSet);
    const totalCompletionPercent = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

    const updated: UserProgress = {
      ...current,
      completedLessonIds,
      currentLessonId: lessonId,
      totalCompletionPercent,
      lastActiveAt: new Date().toISOString(),
    };
    this.progress.set(`${userId}:${courseId}`, updated);
    this.broadcast('progress:updated', { userId, courseId, lessonId, percent: totalCompletionPercent });
    return updated;
  }

  // --- Submissions ---
  public saveSubmission(sub: QuizSubmission): QuizSubmission {
    this.submissions.set(sub.id, sub);
    const key = `${sub.userId}:${sub.courseId}`;
    const p = this.getProgress(sub.userId, sub.courseId);
    p.quizScores[sub.quizId] = sub.score;
    this.progress.set(key, p);

    this.broadcast('quiz:submitted', {
      userId: sub.userId,
      quizId: sub.quizId,
      score: sub.score,
      accuracy: sub.accuracyGrade,
    });
    return sub;
  }

  public getSubmissionsForUser(userId: string): QuizSubmission[] {
    return Array.from(this.submissions.values()).filter(s => s.userId === userId);
  }

  // --- Seed Data ---
  private seedInitialData() {
    // 1. Seed demo user
    const demoUser: User = {
      id: 'demo-learner-01',
      email: 'learner@skolve.dev',
      passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
      name: 'Elena Ramos',
      role: 'learner',
      createdAt: new Date().toISOString(),
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    };
    this.users.set(demoUser.id, demoUser);
    this.sessions.set('tok_demo_active', demoUser.id);

    this.profiles.set(demoUser.id, {
      id: 'prof-demo-01',
      userId: demoUser.id,
      primaryGoal: 'Master Distributed Systems & High-Throughput Architectures',
      baselineLevel: 'intermediate',
      preferredPedagogy: 'hands-on',
      weeklyHours: 6,
      knownSkills: ['TypeScript', 'Node.js', 'PostgreSQL Basics'],
      targetMilestones: ['Implement Raft Consensus in TypeScript', 'Build Multi-Node Fault Injection Harness'],
      updatedAt: new Date().toISOString(),
    });

    // 2. Course 1: Distributed Systems & Consensus
    const courseDist: Course = {
      id: 'course-dist-sys-01',
      userId: 'system',
      title: 'Modern Distributed Systems & Consensus Algorithms',
      description: 'A rigorous, first-principles exploration of consistency models, network partitions, vector clocks, and the Raft consensus state machine.',
      difficulty: 'intermediate',
      estimatedHours: 12,
      tags: ['Distributed Systems', 'Consensus', 'Raft', 'CAP Theorem', 'Fault Tolerance'],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      isPublic: true,
      modules: [
        {
          id: 'mod-dist-01',
          order: 1,
          title: 'Foundations of Distributed Time & Causality',
          description: 'Explore why physical clocks cannot be trusted across networked nodes and how logical clocks establish partial order.',
          lessons: [
            {
              id: 'les-dist-01',
              moduleId: 'mod-dist-01',
              order: 1,
              title: 'The Illusion of Wall Clocks & Clock Drift',
              durationMinutes: 25,
              summary: 'Understand quartz oscillator drift, NTP synchronization limits, and TrueTime monotonic guarantees.',
              contentMarkdown: `### The Physical Problem with Clocks

In a single-machine system, the CPU clock provides an intuitive sequence of events. However, in distributed architectures, **no two physical oscillators run at identical rates**.

Thermal fluctuations, aging crystals, and voltage irregularities produce **clock drift** (typically $10^{-6}$ to $10^{-5}$ seconds per second). Even with Network Time Protocol (NTP), network jitter bounds accuracy to milliseconds at best.

\`\`\`
Node A [t = 12:00:00.002] ──(Message)──> Node B [t = 12:00:00.001]
Result: An effect appears to precede its own cause!
\`\`\`

#### Leslie Lamport's Key Insight (1978)
If two events happen on the same process, their order is well-defined. If process $P_i$ sends message $m$ to process $P_j$, the send event *happened before* ($\to$) the receive event. We do not need synchronized wall clocks to determine causality—we need **monotonic causal counters**.`,
              interactiveSimulation: {
                type: 'consensus-visualizer',
                title: 'Vector Clock Causality Interactive Sandbox',
                description: 'Adjust message delay between 3 simulated nodes and inspect causal dependency order.',
              },
              codeSandbox: {
                language: 'typescript',
                starterCode: `// Implement Lamport Logical Clock tick and receive logic
class LamportClock {
  private time: number = 0;

  public tick(): number {
    this.time += 1;
    return this.time;
  }

  public update(receivedTime: number): number {
    // Fill in Lamport clock sync logic:
    // this.time = Math.max(this.time, receivedTime) + 1;
    this.time = Math.max(this.time, receivedTime) + 1;
    return this.time;
  }

  public getTime(): number {
    return this.time;
  }
}`,
                solutionCode: `class LamportClock {
  private time: number = 0;

  public tick(): number {
    this.time += 1;
    return this.time;
  }

  public update(receivedTime: number): number {
    this.time = Math.max(this.time, receivedTime) + 1;
    return this.time;
  }

  public getTime(): number {
    return this.time;
  }
}`,
              },
              quiz: {
                id: 'quiz-dist-01',
                type: 'multiple-choice',
                question: 'If event A happened before event B (A → B) under Lamport logical clocks, which statement is strictly true regarding their logical timestamps L(A) and L(B)?',
                options: [
                  'L(A) < L(B) is guaranteed, but L(A) < L(B) does NOT imply A caused B.',
                  'L(A) == L(B) because nodes synchronize via NTP.',
                  'L(A) < L(B) guarantees that A physically caused B in all reference frames.',
                  'L(A) > L(B) due to network transmission latency.',
                ],
                correctAnswerIndex: 0,
                explanation: 'Lamport timestamps guarantee that if A → B, then L(A) < L(B). However, the converse does not hold: two concurrent, unrelated events may have L(A) < L(B) simply due to process counter increments.',
              },
            },
            {
              id: 'les-dist-02',
              moduleId: 'mod-dist-01',
              order: 2,
              title: 'Vector Clocks & Concurrent Branch Detection',
              durationMinutes: 30,
              summary: 'How multi-dimensional vectors allow distributed datastores like Dynamo and Cassandra to detect concurrent updates.',
              contentMarkdown: `### Beyond Single Scalars: Vector Clocks

While Lamport clocks provide a total ordering, they cannot distinguish between:
1. Event A causally preceding Event B ($A \\to B$)
2. Event A and Event B happening **concurrently** ($A \\parallel B$)

A vector clock for a system of $N$ processes is an array of $N$ logical clocks:

$$V = [V[1], V[2], \\dots, V[N]]$$

#### Vector Clock Rules
- Before a process $P_i$ generates an event: $V_i[i] \\leftarrow V_i[i] + 1$
- When $P_i$ sends a message, it includes its vector $V_i$.
- When $P_j$ receives vector $V_{msg}$, it updates:
  $$V_j[k] \\leftarrow \\max(V_j[k], V_{msg}[k]) \\quad \\forall k$$
  $$V_j[j] \\leftarrow V_j[j] + 1$$

If neither $V_A \\le V_B$ nor $V_B \\le V_A$, the events are **concurrent conflicts** that require resolution!`,
              quiz: {
                id: 'quiz-dist-02',
                type: 'conceptual-short-answer',
                question: 'Explain what happens when a distributed shopping cart using vector clocks receives two concurrent writes: V1 = [P1: 2, P2: 1] and V2 = [P1: 1, P2: 3]. How does the system detect the conflict?',
                rubricKeywords: ['incomparable', 'concurrent', 'neither vector is strictly less', 'conflict reconciliation', 'sibling values'],
                explanation: 'Because V1 has a higher P1 value (2 > 1) but V2 has a higher P2 value (3 > 1), neither vector dominates the other. The system classifies the updates as concurrent siblings and preserves both versions until client-side reconciliation or CRDT merge.',
              },
            },
          ],
        },
        {
          id: 'mod-dist-02',
          order: 2,
          title: 'The Raft Consensus Protocol',
          description: 'Dissect leader election, log replication, heartbeats, and safety invariants in partitioned clusters.',
          lessons: [
            {
              id: 'les-dist-03',
              moduleId: 'mod-dist-02',
              order: 1,
              title: 'Leader Election & Split-Vote Defense',
              durationMinutes: 35,
              summary: 'Randomized election timeouts, term numbers, and majority quorum rules in Raft.',
              contentMarkdown: `### The Raft State Machine

Raft decomposes distributed consensus into three independent sub-problems:
1. **Leader Election:** Exactly one node must act as coordinator per term.
2. **Log Replication:** Leader accepts log entries and propagates them to a majority.
3. **Safety:** If any server has applied an entry at a given index, no other server will ever apply a different entry for that index.

\`\`\`
       [Follower] ──(Election timeout)──> [Candidate]
            ▲                                  │
            │          (Receives votes         │
            │           from majority)         │
            │                                  ▼
      (Discovers                      [Leader]
       higher term)
\`\`\`

#### Preventing Split-Vote Gridlock
If multiple followers time out simultaneously, randomized election timeouts (e.g. 150ms–300ms) stagger candidacy requests, ensuring one node almost always secures a quorum first.`,
              quiz: {
                id: 'quiz-dist-03',
                type: 'multiple-choice',
                question: 'In a 5-node Raft cluster, what is the minimum number of nodes required to form a valid quorum and commit an entry?',
                options: ['2 nodes', '3 nodes', '4 nodes', 'All 5 nodes'],
                correctAnswerIndex: 1,
                explanation: 'A majority quorum is defined as floor(N/2) + 1. For N = 5, floor(5/2) + 1 = 3 nodes.',
              },
            },
          ],
        },
      ],
    };
    this.courses.set(courseDist.id, courseDist);

    // 3. Course 2: Generative AI & LLM Systems Engineering
    const courseAI: Course = {
      id: 'course-ai-sys-02',
      userId: 'system',
      title: 'Generative AI & LLM Systems Engineering',
      description: 'Master Transformer self-attention, KV caching memory bottlenecks, continuous batching, and mixture-of-experts (MoE) routing algorithms.',
      difficulty: 'advanced',
      estimatedHours: 15,
      tags: ['LLM', 'Transformers', 'MoE', 'KV Cache', 'vLLM', 'Inference'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      isPublic: true,
      modules: [
        {
          id: 'mod-ai-01',
          order: 1,
          title: 'Transformer Architecture & Attention Scaling',
          description: 'Demystify Scaled Dot-Product Attention, causal masking, and memory footprints during autoregressive generation.',
          lessons: [
            {
              id: 'les-ai-01',
              moduleId: 'mod-ai-01',
              order: 1,
              title: 'Scaled Dot-Product Attention & Quadratic Complexity',
              durationMinutes: 30,
              summary: 'Mathematical derivation of Q, K, V projections and the O(N^2) context bottleneck.',
              contentMarkdown: `### The Core Attention Mechanism

Given input matrices $Q$ (Query), $K$ (Key), and $V$ (Value) of dimension $d_k$:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$

#### Why Scale by $\\sqrt{d_k}$?
For large projection dimensions $d_k$, the dot products grow large in magnitude, pushing the softmax function into regions with tiny gradients (gradient vanishing). Dividing by $\\sqrt{d_k}$ preserves unit variance when queries and keys are independent zero-mean variables.

#### The Autoregressive Inference Bottleneck: KV Cache
During token generation, recomputing Key and Value vectors for past tokens is redundant. By caching past $K$ and $V$ activations in GPU VRAM (KV Caching), inference changes from compute-bound to **memory bandwidth-bound**.`,
              quiz: {
                id: 'quiz-ai-01',
                type: 'multiple-choice',
                question: 'Why does autoregressive LLM decoding become memory bandwidth-bound rather than compute-bound when KV caching is enabled?',
                options: [
                  'Because for each single newly generated token, the entire multi-gigabyte KV cache must be loaded from GPU High Bandwidth Memory (HBM) into SRAM.',
                  'Because matrix multiplication is disabled during inference.',
                  'Because CPU-GPU PCIe transfers dominate every token step.',
                  'Because softmax computation requires O(N^3) floating point operations.',
                ],
                correctAnswerIndex: 0,
                explanation: 'During token generation (batch size = 1), generating each single token requires reading the entire previous context KV tensors from GPU HBM into cache, yielding very low arithmetic intensity (FLOPs/byte).',
              },
            },
          ],
        },
      ],
    };
    this.courses.set(courseAI.id, courseAI);

    // Seed progress for demo user
    this.markLessonComplete(demoUser.id, courseDist.id, 'les-dist-01');
  }
}

export const db = new RealtimeDatabase();
