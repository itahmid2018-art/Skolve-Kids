# Development Plan & Phase-Wise Roadmap
## Project: Skolve - AI Personalized Education Platform
**Target Timeline:** 12-Week MVP Cycle  
**Engineering Methodology:** Test-Driven Development (TDD) with Continuous Verification  

---

## 1. Roadmap Overview & Timeline

```
Week:      W1  W2  W3  W4  W5  W6  W7  W8  W9  W10 W11 W12
Phase 1:  [======]                                        (Foundation, Auth & Real-Time DB)
Phase 2:          [==========]                            (AI Pipeline, MoE Serving & Streaming)
Phase 3:                      [==========]                (Frontend Learner UX & Interactive Stage)
Phase 4:                                  [==========]    (Testing, Load Benchmarking & Hardening)
```

---

## 2. Phase 1: Foundation, Auth & Real-Time Database (Weeks 1–2)

### Primary Goals
Scaffold full-stack TypeScript architecture, set up the real-time persistent data engine, configure session-based user authentication, and create the core domain schemas.

### Detailed Engineering Tasks
- [x] **Task 1.1: Full-Stack Project Scaffolding:** Express + Vite server integration in `server.ts`, TypeScript configuration, Tailwind CSS setup.
- [x] **Task 1.2: Real-Time In-Memory & Persistent Database Engine (`server/db.ts`):**
  - Thread-safe repository patterns for `users`, `learning_profiles`, `courses`, `modules`, `lessons`, `quizzes`, `submissions`, and `live_sessions`.
  - Real-Time Pub/Sub Event Bus emitting SSE events (`course:updated`, `progress:synced`, `tutor:response`).
- [x] **Task 1.3: User Authentication System (`/api/auth/*`):**
  - Registration, login, session token validation, and demo profile switching.
  - Role verification (`learner`, `mentor`, `admin`).
- [x] **Task 1.4: Base Seed Data & Schema Validation:**
  - Standardized JSON schema for course structures and learner profiles.
  - Pre-seeded flagship courses: *Modern Distributed Systems*, *Generative AI & LLM Systems Engineering*, and *Applied Quantum Computing Fundamentals*.

### Testing Gate for Phase 1
- **Unit Tests:** Password hashing, session token expiration, role authorization guards.
- **Integration Tests:** REST endpoints (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
- **Data Persistence Test:** Verify entity relational integrity and cascade deletions (deleting course cascades to modules and lessons).
- **Pass Criteria:** 100% test pass on auth routes; token validation responds in $\le 5\text{ms}$.

---

## 3. Phase 2: AI Pipeline & Real-Time Streaming Backend (Weeks 3–5)

### Primary Goals
Build the multi-model AI course generation engine, integrate `@google/genai` (Gemini 3.8 Flash) with local/cloud open-source MoE fallback (Qwen3-235B / Ollama API compatibility), implement SSE streaming, and build the automated grading engine.

### Detailed Engineering Tasks
- [x] **Task 2.1: Model Gateway & Multi-Provider Router (`server/ai.ts`):**
  - Primary provider: Google GenAI (`gemini-3.8-flash`) using `@google/genai` SDK on the server side.
  - Secondary provider: Ollama / vLLM local API (`http://localhost:11434/v1/chat/completions`) for Qwen3-32B / Qwen3-235B.
  - Deterministic Fallback Engine: High-fidelity pedagogical generator when offline or in sandboxed test environments.
- [x] **Task 2.2: Real-Time Course Generation Stream (`/api/courses/generate-stream`):**
  - Server-Sent Events (SSE) streaming chunks of JSON curriculum as they are synthesized.
  - Incremental JSON parsing to yield modules and lessons progressively.
- [x] **Task 2.3: Socratic AI Tutor API (`/api/tutoring/chat-stream`):**
  - Contextual system prompts loaded with the current lesson's exact objectives, formula derivations, and code snippets.
  - Guardrails enforcing Socratic pedagogy (never outputting direct homework answers immediately; asking guiding questions first).
- [x] **Task 2.4: Rubric-Based Quiz Auto-Grader (`/api/assessments/grade`):**
  - Automated grading across 4 dimensions: Conceptual Accuracy, Completeness, Technical Depth, and Misconception Identification.
  - Returns score (0–100), detailed narrative feedback, and targeted review recommendations.

### Testing Gate for Phase 2
- **Unit Tests:** Prompt injection sanitization, JSON schema validator for generated courses, rubric score normalizer.
- **Integration Tests:** SSE stream connection lifecycle, client disconnect cleanup, error propagation when API quotas are exceeded.
- **AI Output Quality Benchmarks (Pedagogical Evaluation):**
  - Test set of 20 diverse learning prompts (from "Rust async runtime" to "Organic Chemistry reaction mechanisms").
  - Automated verification that generated curricula adhere to prerequisites and Bloom's taxonomy.
- **Pass Criteria:** Valid JSON curriculum generated $\ge 98\%$ of runs; first streaming token within $1.2\text{s}$.

---

## 4. Phase 3: Frontend & Learner Experience (Weeks 6–8)

### Primary Goals
Construct the responsive, high-performance web interface following the Universal Frontend Design Constitution and EdTech Guidelines.

### Detailed Engineering Tasks
- [x] **Task 3.1: Top Bar & Application Navigation:**
  - 3-zone Top Bar Contract: Brand mark ("Skolve"), clean navigation links, user profile badge, and primary action.
- [x] **Task 3.2: Interactive Learning Profile & Onboarding Wizard:**
  - Step 1: Goal articulation with domain chips and goal examples.
  - Step 2: Skill baseline self-assessment with prerequisite checks.
  - Step 3: Pedagogy preference selection (Code-first, Visual-first, First-principles).
- [x] **Task 3.3: Dynamic Curriculum Generator & Live Preview:**
  - Real-time generation visualizer with module expanding animation, lesson count, and difficulty estimation.
  - One-click curriculum launch or section regeneration.
- [x] **Task 3.4: Two-Zone Lesson Stage & Sandbox:**
  - Stage: Clean typography, markdown rendering, formulas, syntax-highlighted code blocks, and interactive simulation widgets.
  - Concept Deck: Outline drawer, collapsible Socratic tutor, notes scratchpad, and lesson completion check.
- [x] **Task 3.5: Interactive Assessment & Auto-Grader View:**
  - Instant multiple-choice checking + short-answer AI submission with visual feedback and misconception breakdowns.
- [x] **Task 3.6: Real-Time Learner Mastery Dashboard:**
  - Real-time completion progress, quiz accuracy metrics, active study streak, and recommended next milestones.

### Testing Gate for Phase 3
- **Component Unit Tests:** Form validation, step navigation, interactive quiz selection, audio/visual state toggles.
- **Cross-Browser & Responsiveness Tests:** Verified at 375px (mobile), 768px (tablet), 1024px (small desktop), and 1440px (desktop).
- **Accessibility Audit:** Lighthouse Accessibility $\ge 95$; zero color-contrast violations; keyboard navigation (`Tab`, `Enter`, `Escape`) fully supported.
- **Pass Criteria:** Zero layout overflow; zero console warnings; zero dead buttons or mock clicks.

---

## 5. Phase 4: Production Polish, Load Testing & Hardening (Weeks 9–12)

### Primary Goals
Performance optimization, stress testing, edge-case hardening, telemetry instrumentation, and deployment documentation.

### Detailed Engineering Tasks
- [ ] **Task 4.1: vLLM Production Inference Setup:**
  - Dockerized deployment of vLLM with Qwen3-235B-A22B INT4 on Lambda Labs / RunPod.
  - Benchmark continuous batching under simulated concurrent requests.
- [x] **Task 4.2: Comprehensive Developer & Team Documentation:**
  - Root `README.md`, `docs/PRD.md`, `docs/DEVELOPMENT_PLAN.md`, `docs/INSTALLATION.md`, `docs/LOCAL_TESTING.md`, `docs/TECHNICAL_SPECIFICATIONS.md`, `docs/FUTURE_ROADMAP.md`.
- [x] **Task 4.3: In-App Interactive Test Runner & Documentation Viewer:**
  - Embedded developer modal allowing instant execution of API smoke tests, inspecting database state, and reading live project documentation without leaving the browser!
- [x] **Task 4.4: Error Boundaries & Network Resilience:**
  - Graceful degradation when offline or when AI endpoints rate-limit.
  - Toast notification system with actionable recovery steps.

### Testing Gate for Phase 4
- **Load Testing:** Simulated 50 concurrent course generations and 200 concurrent active lesson readers using Apache Bench / k6.
- **Security Audit:** OWASP Top 10 review, XSS mitigation on rendered markdown, rate limiting on `/api/*` endpoints.
- **Pass Criteria:** Server error rate $\le 0.1\%$; P95 response time for static assets $\le 50\text{ms}$; P95 for cached API calls $\le 80\text{ms}$.
