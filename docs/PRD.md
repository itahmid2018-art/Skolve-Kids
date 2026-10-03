# Product Requirements Document (PRD)
## Project: Skolve - AI-Tailored Education Platform
**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Delivery Window:** 12-Week MVP  

---

## 1. Executive Summary & Vision
Skolve is an adaptive, AI-native personalized learning platform. Conventional online education platforms (MOOCs, static video courses, textbook repositories) suffer from severe dropout rates (frequently exceeding 85%) due to rigid curricula, lack of real-time diagnostic interventions, and misalignment with a student's prior knowledge and cognitive pacing.

Skolve solves this by dynamically architecting custom, end-to-end courses on any technical, scientific, or conceptual subject. Using Mixture of Experts (MoE) LLMs and real-time streaming, Skolve diagnoses the learner's baseline proficiency, structures an optimal pedagogical sequence (following Bloom's Taxonomy), provides interactive sandboxes, and offers continuous Socratic tutoring with automated rubric-based grading.

---

## 2. Target User Personas

### Persona A: Elena Ramos (The Career Switcher)
- **Profile:** 29-year-old financial analyst transitioning into Machine Learning Engineering.
- **Pain Points:** Traditional courses spend hours on basic Python variables she already knows, yet rush through vector calculus and gradient descent where she needs focused intuition.
- **Goal:** High-yield, tailored curriculum bridging financial modeling to PyTorch and distributed training.
- **Usage Pattern:** 45-minute daily micro-sessions with immediate coding verification.

### Persona B: David Chen (The Self-Taught Computer Science Student)
- **Profile:** 20-year-old undergraduate seeking deep conceptual understanding of Operating Systems and Distributed Systems.
- **Pain Points:** Static textbooks lack interactive visual models of memory paging, locks, and consensus algorithms.
- **Goal:** Dynamic visual simulations paired with deep conceptual questions that challenge edge-case thinking.
- **Usage Pattern:** Long weekend deep-dives (2–3 hours) with hands-on algorithm sandboxes.

### Persona C: Dr. Maya Patel (The Corporate Technical Lead)
- **Profile:** 38-year-old engineering manager training a team of 15 backend engineers on LLM fine-tuning and retrieval pipelines.
- **Pain Points:** Off-the-shelf courses are generic; team members have varying levels of linear algebra and infrastructure experience.
- **Goal:** Standardized yet modular course tracks with real-time progress visibility, automated skill verification, and project rubrics.

---

## 3. Core Problem Statements & Value Propositions

| Problem in Modern EdTech | Skolve Solution | Pedagogical Justification |
| :--- | :--- | :--- |
| **Linear, One-Size-Fits-All Syllabus** | Dynamic MoE-generated curriculum tailored to specific goals, background, and time limit. | *Vygotsky's Zone of Proximal Development (ZPD)* |
| **Passive Consumption (Video Glaze)** | Active two-zone learning: conceptual reading paired with interactive sandboxes and code execution. | *Constructivist Learning & Active Recall* |
| **Delayed or Absent Feedback** | Real-time Socratic AI tutor and instant rubric-based quiz evaluation with misconception diagnosis. | *Formative Assessment Theory* |
| **Course Abandonment** | Real-time mastery radars, streak tracking, and micro-milestone completions. | *Intrinsic Motivation & Self-Determination Theory* |

---

## 4. Functional Requirements (FR)

### Module 1: Authentication & User Profiles (FR-01 to FR-03)
- **FR-01 (Authentication Lifecycle):** Support secure user registration, login, and session persistence. Provide guest/demo instant access with seamless account upgrade.
- **FR-02 (Learning Profile Wizard):** Multi-step onboarding capturing:
  - Primary goal (e.g., "Build an autonomous AI agent in TypeScript").
  - Current baseline skill level (Beginner, Intermediate, Advanced).
  - Learning modality (Hands-on practical, Theory-first, or Visual simulation).
  - Weekly time commitment (e.g., 2 hours/week vs. 10 hours/week).
- **FR-03 (Role-Based Permissions):** Support `learner`, `mentor`, and `admin` roles for access control and administrative analytics.

### Module 2: AI Curriculum Generation Engine (FR-04 to FR-06)
- **FR-04 (Algorithmic Syllabus Generation):** Accept natural language query + learner profile to produce structured JSON course hierarchies:
  - Course metadata (Title, Description, Prerequisites, Total Estimated Time).
  - Modules (3–6 progressive modules with thematic cohesion).
  - Lessons (3–5 lessons per module with explicit learning objectives).
  - Comprehension checkpoints (Quizzes and practical exercises).
- **FR-05 (Real-Time Generation Streaming):** Stream curriculum generation live via Server-Sent Events (SSE) so the user experiences zero perceptible wait time.
- **FR-06 (Curriculum Customization):** Allow learners to regenerate specific lessons, add custom sub-topics, or adjust depth on demand.

### Module 3: Interactive Lesson Delivery & Sandbox (FR-07 to FR-09)
- **FR-07 (Two-Zone Learning Environment):**
  - *Zone 1 (Interactive Stage):* Clean conceptual prose, highlighted syntax, step-by-step mathematical derivations, and live interactive visualizers.
  - *Zone 2 (Control & Concept Deck):* Code editor / scratchpad, lesson outline navigation, progress toggles, and Socratic tutor panel.
- **FR-08 (Socratic AI Tutor):** Live chat drawer where learners can highlight any paragraph, code snippet, or formula and ask for:
  - "Explain with an intuition-first analogy"
  - "Give me a counter-example"
  - "Step through this code line-by-line"
  - "Provide a progressively revealed hint without spoiling the solution"
- **FR-09 (Progressive Disclosure):** Multi-step reveal for complex multi-part problems to reduce cognitive load.

### Module 4: Assessments, Auto-Grading & Analytics (FR-10 to FR-12)
- **FR-10 (Assessment Engine):** Diverse question types including Multiple Choice (MCQ), Conceptual Short-Answer, and Code Implementation.
- **FR-11 (AI Rubric-Based Auto-Grader):** Submissions graded instantly against pedagogical rubrics (Accuracy, Completeness, Conceptual Depth, Edge-Case Handling), providing constructive diagnostic feedback.
- **FR-12 (Real-Time Mastery Dashboard):** Aggregates completion percentage, average quiz accuracy, active streak, and recommended next study modules.

---

## 5. Non-Functional Requirements (NFR)
- **NFR-01 (Performance & Latency):** First token for course generation stream $\le 1.2\text{s}$; lesson navigation $\le 150\text{ms}$; quiz auto-grading response $\le 2.0\text{s}$.
- **NFR-02 (Reliability & Offline Fallback):** Platform must function reliably under network intermittency. If cloud LLM is unreachable, system gracefully falls back to deterministic local curricula and offline simulation tools.
- **NFR-03 (Design & Accessibility):** Full WCAG AA contrast compliance (4.5:1 text, 3:1 large elements), responsive layout across 375px mobile to 1440px desktop, zero decorative pill clutter, and strict tabular numerals for all metrics.
- **NFR-04 (Data Integrity & Real-Time Sync):** Progress changes broadcast via real-time SSE pub/sub to keep all open tabs synchronized within 200ms.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)
- **Course Completion Rate:** Target $\ge 45\%$ for generated curricula (vs. industry MOOC standard of 5–10%).
- **Active Recall Engagement:** $\ge 80\%$ of active users completing at least one quiz checkpoint per lesson.
- **Socratic Tutor Utilization:** Average of 2.8 queries per lesson session.
- **Day-14 Retention:** $\ge 40\%$ return rate for enrolled learners.
