# Local Testing & Verification Document
## Project: Skolve - AI Personalized Education Platform

This document outlines the testing protocols for verifying Skolve locally, including automated API smoke testing, real-time Server-Sent Events (SSE) validation, user authentication verification, and course generation benchmarks.

---

## 1. Testing Philosophy & Test Pyramid

Skolve employs a four-tiered verification strategy:
1. **Static Analysis & Type Verification:** TypeScript compiler checks (`tsc --noEmit`) to guarantee zero compile-time anomalies.
2. **API Endpoint Smoke Tests:** Automated HTTP request sequences verifying JSON schemas and status codes.
3. **Real-Time Streaming Verification:** Testing Server-Sent Events (SSE) connections, heartbeats, and buffer flushing.
4. **Pedagogical Quality Benchmarks:** Ensuring AI-generated curricula meet pedagogical criteria (no empty modules, correct sequence of difficulty, valid quiz rubrics).

---

## 2. In-App Interactive Test Runner

Skolve comes equipped with a built-in **Developer Hub & Test Runner** directly accessible from the top navigation bar or footer.
- **Accessing the Runner:** Click the **"Doc & Test Hub"** link in the header or press `Ctrl + /` (`Cmd + /`).
- **Features:**
  - One-click execution of 6 automated test suites (Auth, Real-time DB, Course Stream, Socratic Tutor, Quiz Auto-Grader, and SSE Health).
  - Real-time execution logs with response latencies.
  - Live inspection of the database store (inspect active users, courses, and submissions).
  - Embedded documentation reader for PRD, Technical Specs, and Installation.

---

## 3. Manual API Testing via `curl`

You can verify all backend services directly from your terminal while the dev server is active on `http://localhost:3000`:

### Test 1: Health & System Diagnostics
```bash
curl -i http://localhost:3000/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "aiEngine": "gemini-3.8-flash (or local fallback)",
  "realtimeConnections": 1,
  "uptimeSeconds": 142
}
```

### Test 2: User Registration & Session Validation
```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.learner@skolve.dev",
    "password": "SecurePassword123!",
    "name": "Alex Mercer",
    "role": "learner"
  }'

# 2. Login with registered credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.learner@skolve.dev",
    "password": "SecurePassword123!"
  }'
```
**Expected Response:**
Returns user profile object with session `token`.

### Test 3: Real-Time Course Generation Stream (SSE)
```bash
curl -N -X POST http://localhost:3000/api/courses/generate-stream \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Build an Autonomous Agent in TypeScript",
    "level": "intermediate",
    "pedagogy": "hands-on",
    "hoursPerWeek": 5
  }'
```
**Expected Output:**
Streams chunked SSE events:
```text
event: progress
data: {"stage": "structuring_modules", "percent": 25}

event: module
data: {"id": "m1", "title": "Agent Perception & ReAct Loops"}

event: complete
data: {"courseId": "course-12345", "status": "ready"}
```

### Test 4: Socratic AI Tutor Streaming
```bash
curl -N -X POST http://localhost:3000/api/tutoring/chat-stream \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "lesson-dist-01",
    "message": "Why do distributed consensus algorithms require a quorum instead of a simple majority?",
    "history": []
  }'
```
**Expected Output:**
Streams progressive Socratic explanation guiding the learner toward split-brain failure modes rather than giving a flat definition.

### Test 5: Rubric-Based Quiz Auto-Grader
```bash
curl -X POST http://localhost:3000/api/assessments/grade \
  -H "Content-Type: application/json" \
  -d '{
    "quizId": "quiz-dist-01",
    "question": "What occurs during a network partition if a distributed database favors Availability over Consistency (AP)?",
    "userAnswer": "Nodes on each side of the partition will continue accepting writes, leading to split-brain data conflicts that must be reconciled later.",
    "rubric": {
      "keyConcepts": ["split-brain", "eventual consistency", "divergent writes"],
      "maxScore": 100
    }
  }'
```
**Expected Response:**
```json
{
  "score": 95,
  "accuracy": "high",
  "feedback": "Exceptional clarity. You correctly identified split-brain writes and the necessity of reconciliation.",
  "strengths": ["Clear explanation of split-brain", "Accurate AP classification"],
  "misconceptionsIdentified": []
}
```

---

## 4. Automated Test Checklist Before Pull Requests

| Verification Step | Command / Action | Pass Criteria |
| :--- | :--- | :--- |
| **Static Types** | `npm run lint` | 0 errors, 0 warnings. |
| **Build Compilation** | `npm run build` | `/dist` bundle generated without chunk warning or CSS syntax error. |
| **Auth Guard Integrity** | Attempt accessing private course progress with invalid token | Returns `401 Unauthorized`. |
| **SSE Reconnection** | Simulate client network drop in browser DevTools | Client auto-reconnects within 3s without duplicate messages. |
| **Responsiveness** | Emulate viewport at 375px $\times$ 667px (iPhone SE) | No horizontal scrolling; menu toggle operates smoothly. |
| **Color Contrast** | Chrome DevTools Lighthouse audit | $\ge 95$ Accessibility score. |
