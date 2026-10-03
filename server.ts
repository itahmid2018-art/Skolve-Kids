import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';
import { aiGateway } from './server/ai.js';
import { errorLogger } from './server/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Auth helper middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    // If no token provided, fall back to default demo user for seamless interaction
    const demoUser = db.getAllUsers().find(u => u.email === 'learner@skolve.dev');
    if (demoUser) {
      (req as any).user = demoUser;
      return next();
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  (req as any).user = user;
  next();
}

// ==============================================================================
// 1. Health & Diagnostic Endpoints
// ==============================================================================
app.get('/api/health', async (req: Request, res: Response) => {
  const providerStatus = await aiGateway.getProvidersStatus();
  res.json({
    status: 'healthy',
    version: '1.0.0',
    app: 'Skolve - AI Education Platform',
    activeProvider: providerStatus.activeProvider,
    availableProvidersCount: providerStatus.providers.filter(p => p.isConfigured).length,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Provider Management Endpoints
app.get('/api/ai/providers', async (req: Request, res: Response) => {
  const status = await aiGateway.getProvidersStatus();
  res.json(status);
});

app.post('/api/ai/providers/select', (req: Request, res: Response) => {
  const { providerId } = req.body;
  if (!providerId) {
    return res.status(400).json({ error: 'providerId is required' });
  }
  const selected = aiGateway.setActiveProvider(providerId);
  res.json({ activeProvider: selected, message: `Active AI provider switched to ${selected}` });
});

// ==============================================================================
// 2. Authentication & User Profiles
// ==============================================================================
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const result = db.registerUser(name, email, password, role || 'learner');
    res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = db.loginUser(email, password);
    res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = db.getProfile(user.id);
  res.json({ user, profile });
});

app.post('/api/auth/switch-demo', (req: Request, res: Response) => {
  const { persona } = req.body;
  const users = db.getAllUsers();
  let targetUser = users.find(u => u.role === 'learner');

  if (persona === 'mentor') {
    targetUser = users.find(u => u.role === 'mentor') || targetUser;
  }
  if (!targetUser) {
    targetUser = users[0];
  }

  const token = 'tok_demo_active';
  res.json({ user: targetUser, token, profile: db.getProfile(targetUser.id) });
});

app.get('/api/profile', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = db.getProfile(user.id);
  res.json({ profile });
});

app.put('/api/profile', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const updated = db.updateProfile(user.id, req.body);
  res.json({ profile: updated });
});

// ==============================================================================
// 3. Courses & Curriculum
// ==============================================================================
app.get('/api/courses', (req: Request, res: Response) => {
  const courses = db.getCourses();
  res.json({ courses });
});

app.get('/api/courses/:id', (req: Request, res: Response) => {
  const course = db.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json({ course });
});

// Real-time Course Generation Stream (Server-Sent Events)
app.post('/api/courses/generate-stream', async (req: Request, res: Response) => {
  const { goal, level, pedagogy, hoursPerWeek, knownSkills } = req.body;

  if (!goal) {
    return res.status(400).json({ error: 'Goal is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('progress', { stage: 'analyzing_goal', percent: 15, message: 'Diagnosing prerequisite concepts...' });

    await new Promise(r => setTimeout(r, 400));
    sendEvent('progress', { stage: 'structuring_modules', percent: 45, message: 'Constructing pedagogical sequence (Bloom taxonomy)...' });

    const course = await aiGateway.generateCourse({
      goal,
      level: level || 'intermediate',
      pedagogy: pedagogy || 'hands-on',
      hoursPerWeek: Number(hoursPerWeek) || 5,
      knownSkills: knownSkills || [],
    });

    await new Promise(r => setTimeout(r, 400));
    sendEvent('progress', { stage: 'synthesizing_checkpoints', percent: 80, message: 'Synthesizing comprehension checkpoints and rubrics...' });

    // Save generated course in database
    db.saveCourse(course);

    await new Promise(r => setTimeout(r, 300));
    sendEvent('progress', { stage: 'complete', percent: 100, message: 'Curriculum generated and ready!' });
    sendEvent('complete', { course });
    res.end();
  } catch (err: any) {
    sendEvent('error', { error: err.message || 'Generation failed' });
    res.end();
  }
});

// Standard non-streaming generate endpoint
app.post('/api/courses/generate', async (req: Request, res: Response) => {
  try {
    const { goal, level, pedagogy, hoursPerWeek, knownSkills } = req.body;
    const course = await aiGateway.generateCourse({
      goal: goal || 'Distributed Systems',
      level: level || 'intermediate',
      pedagogy: pedagogy || 'hands-on',
      hoursPerWeek: Number(hoursPerWeek) || 5,
      knownSkills,
    });
    db.saveCourse(course);
    res.json({ course });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Progress
app.get('/api/courses/:id/progress', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const progress = db.getProgress(user.id, req.params.id);
  res.json({ progress });
});

app.post('/api/courses/:id/lessons/:lessonId/complete', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const updated = db.markLessonComplete(user.id, req.params.id, req.params.lessonId);
  res.json({ progress: updated });
});

// ==============================================================================
// 4. Socratic AI Tutoring & Live Discussion
// ==============================================================================
app.post('/api/tutoring/chat', async (req: Request, res: Response) => {
  try {
    const { message, lessonId, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find lesson context
    let lessonContext = {
      title: 'Current Lesson',
      summary: 'General educational context',
      contentMarkdown: '',
    };

    const courses = db.getCourses();
    for (const c of courses) {
      for (const m of c.modules) {
        const found = m.lessons.find(l => l.id === lessonId);
        if (found) {
          lessonContext = {
            title: found.title,
            summary: found.summary,
            contentMarkdown: found.contentMarkdown,
          };
          break;
        }
      }
    }

    const reply = await aiGateway.socraticTutorResponse(message, lessonContext, history || []);
    res.json({ reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Tutor error' });
  }
});

// ==============================================================================
// 5. Assessments & Rubric Auto-Grading
// ==============================================================================
app.post('/api/assessments/grade', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { quizId, lessonId, courseId, question, userAnswer, rubricKeywords, explanation } = req.body;

    if (!userAnswer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const evaluation = await aiGateway.gradeAssessment(
      question || 'Explain the concept',
      userAnswer,
      rubricKeywords || [],
      explanation || ''
    );

    // Persist submission
    const sub = db.saveSubmission({
      id: `sub-${Date.now()}`,
      userId: user.id,
      quizId: quizId || 'quiz-default',
      lessonId: lessonId || 'lesson-default',
      courseId: courseId || 'course-default',
      answerText: userAnswer,
      score: evaluation.score,
      accuracyGrade: evaluation.accuracyGrade,
      feedbackText: evaluation.feedbackText,
      misconceptions: evaluation.misconceptions,
      submittedAt: new Date().toISOString(),
    });

    res.json({ evaluation, submission: sub });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================================================================
// 6. Real-Time Pub/Sub Event Stream (SSE)
// ==============================================================================
app.get('/api/realtime/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: new Date().toISOString() })}\n\n`);

  // Subscribe to real-time database events
  const unsubscribe = db.subscribe(event => {
    res.write(`event: ${event.topic}\ndata: ${JSON.stringify(event.data)}\n\n`);
  });

  // Heartbeat interval to maintain connection alive
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// ==============================================================================
// 7. Developer & Automated Smoke Test Hub
// ==============================================================================
app.get('/api/dev/db-dump', (req: Request, res: Response) => {
  res.json({
    usersCount: db.getAllUsers().length,
    coursesCount: db.getCourses().length,
    courses: db.getCourses().map(c => ({ id: c.id, title: c.title, modules: c.modules.length })),
  });
});

app.post('/api/dev/run-smoke-tests', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const tests: { name: string; status: 'passed' | 'failed'; durationMs: number; details: string }[] = [];

  // Test 1: Real-time DB CRUD
  try {
    const t0 = Date.now();
    const courses = db.getCourses();
    if (courses.length >= 2) {
      tests.push({ name: 'Database Query Integrity', status: 'passed', durationMs: Date.now() - t0, details: `Retrieved ${courses.length} courses successfully.` });
    } else {
      tests.push({ name: 'Database Query Integrity', status: 'failed', durationMs: Date.now() - t0, details: 'Expected at least 2 pre-seeded courses.' });
    }
  } catch (e: any) {
    tests.push({ name: 'Database Query Integrity', status: 'failed', durationMs: 0, details: e.message });
  }

  // Test 2: Auth Validation
  try {
    const t0 = Date.now();
    const login = db.loginUser('learner@skolve.dev', 'password123');
    if (login.token && login.user.email === 'learner@skolve.dev') {
      tests.push({ name: 'User Authentication & Token Hash', status: 'passed', durationMs: Date.now() - t0, details: 'Valid credentials generated valid token.' });
    } else {
      tests.push({ name: 'User Authentication & Token Hash', status: 'failed', durationMs: Date.now() - t0, details: 'Auth check returned malformed response.' });
    }
  } catch (e: any) {
    tests.push({ name: 'User Authentication & Token Hash', status: 'failed', durationMs: 0, details: e.message });
  }

  // Test 3: Socratic AI Tutor Guardrails
  try {
    const t0 = Date.now();
    const reply = await aiGateway.socraticTutorResponse(
      'Why do distributed systems require quorums?',
      { title: 'Consensus', summary: 'Distributed nodes', contentMarkdown: '' },
      []
    );
    if (reply && reply.length > 20) {
      tests.push({ name: 'Socratic AI Tutor Prompting', status: 'passed', durationMs: Date.now() - t0, details: `Generated ${reply.length} chars of pedagogical response.` });
    } else {
      tests.push({ name: 'Socratic AI Tutor Prompting', status: 'failed', durationMs: Date.now() - t0, details: 'Response empty or too brief.' });
    }
  } catch (e: any) {
    tests.push({ name: 'Socratic AI Tutor Prompting', status: 'failed', durationMs: 0, details: e.message });
  }

  // Test 4: Assessment Auto-Grader
  try {
    const t0 = Date.now();
    const grade = await aiGateway.gradeAssessment(
      'What causes clock drift?',
      'Thermal variations in quartz crystals cause physical frequencies to slightly diverge across machines.',
      ['thermal', 'quartz', 'diverge', 'frequency'],
      'Quartz crystals oscillate at temperature-dependent rates.'
    );
    if (grade.score >= 70 && grade.accuracyGrade) {
      tests.push({ name: 'Rubric-Based AI Auto-Grader', status: 'passed', durationMs: Date.now() - t0, details: `Correctly graded answer with score ${grade.score}/100 (${grade.accuracyGrade}).` });
    } else {
      tests.push({ name: 'Rubric-Based AI Auto-Grader', status: 'failed', durationMs: Date.now() - t0, details: `Unexpected grading: ${JSON.stringify(grade)}` });
    }
  } catch (e: any) {
    tests.push({ name: 'Rubric-Based AI Auto-Grader', status: 'failed', durationMs: 0, details: e.message });
  }

  const allPassed = tests.every(t => t.status === 'passed');
  res.json({
    suite: 'Skolve Automated Smoke Suite',
    status: allPassed ? 'success' : 'failure',
    totalDurationMs: Date.now() - startTime,
    passCount: tests.filter(t => t.status === 'passed').length,
    failCount: tests.filter(t => t.status === 'failed').length,
    tests,
  });
});

// Run Full Multi-Provider Test Suite & Save Timestamped Logs to testing/errors/
app.post('/api/dev/test-providers', async (req: Request, res: Response) => {
  try {
    const testRecord = await aiGateway.testAllProviders();
    res.json(testRecord);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Provider diagnostic run failed' });
  }
});

// Retrieve Latest Error / Diagnostic Logs
app.get('/api/dev/error-logs', (req: Request, res: Response) => {
  const latestRun = errorLogger.getLatestRun();
  const logFiles = errorLogger.listLogFiles();
  res.json({
    latestRun,
    logFiles,
    directory: 'testing/errors',
  });
});

// ==============================================================================
// 8. Static / Vite Middlewares Mounting
// ==============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`✨ Skolve AI Education Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
