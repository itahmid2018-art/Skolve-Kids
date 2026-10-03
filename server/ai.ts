import { GoogleGenAI, Type } from '@google/genai';
import { Course, CourseModule, CourseLesson } from './db.js';
import crypto from 'crypto';

// Initialize server-side Google GenAI client according to instructions:
// User-Agent must be set to 'aistudio-build' in httpOptions
const ai = new GoogleGenAI({
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

export class AIGateway {
  private hasValidKey(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 10 && !key.includes('MY_GEMINI_API_KEY'));
  }

  // --- 1. Course Generation ---
  public async generateCourse(params: CourseGenerationPromptParams): Promise<Course> {
    if (this.hasValidKey()) {
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
        console.warn('Gemini course generation encountered issue, utilizing intelligent fallback:', err);
      }
    }

    // High-Fidelity Pedagogical Fallback Generator
    return this.generateFallbackCourse(params);
  }

  // --- 2. Socratic AI Tutor Chat ---
  public async socraticTutorResponse(
    message: string,
    lessonContext: { title: string; summary: string; contentMarkdown: string },
    history: { role: 'user' | 'model'; text: string }[] = []
  ): Promise<string> {
    if (this.hasValidKey()) {
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
    if (this.hasValidKey()) {
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

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
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
