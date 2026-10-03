# Skolve — AI-Tailored Education Platform

> **Adaptive, tailored AI learning platform generating structured curricula, real-time interactive lessons, and AI-graded assessments powered by open MoE & LLM architectures.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google%20GenAI-Gemini%203.8%20Flash-orange.svg)](https://ai.google.dev/)

---

## 🌟 Executive Overview

Skolve dynamically designs personalized, end-to-end courses on any technical or scientific subject. Grounded in Bloom's Revised Taxonomy and cognitive learning theory, Skolve diagnoses the learner's baseline proficiency, structures an optimal pedagogical sequence, delivers lessons in a distraction-free two-zone stage, provides a live Socratic AI tutor, and performs rubric-based automated assessment with instant diagnostic feedback.

---

## 🚀 Key Features

- **Personalized Onboarding Wizard:** Diagnoses goals, baseline skills, learning modality (Hands-on vs. Theory-first), and weekly time budgets.
- **Dynamic AI Curriculum Generator:** Generates structured syllabi with modules, lesson objectives, and comprehension checkpoints via real-time streaming.
- **Two-Zone Interactive Learning Stage:**
  - *Zone 1 (Interactive Stage):* Clean conceptual prose, code sandboxes, interactive math/code visualizers, and formula derivations.
  - *Zone 2 (Control & Concept Deck):* Module outline, lesson progress tracking, and collapsible Socratic AI tutor.
- **Socratic AI Tutor:** Context-aware assistant that guides learners with intuitions, analogies, and progressive hints rather than flat answers.
- **Rubric-Based AI Auto-Grader:** Formative assessments with automated rubric scoring (0–100), misconception analysis, and targeted remediation.
- **Real-Time Database & Event Bus:** Persistent user profiles, course enrollment, lesson state trees, and Server-Sent Events (SSE) synchronization.
- **Built-in Developer Hub & Test Runner:** In-app testing panel to run automated smoke test suites and inspect live database state in real-time.

---

## 📚 Project Documentation Hub

Detailed specifications and architectural guides are maintained in the `/docs` directory:

| Document | Purpose |
| :--- | :--- |
| **[`initial-idea-doc.md`](./initial-idea-doc.md)** | Initial analysis, open-source MoE research (Qwen3-235B, Qwen3-30B, Qwen3-32B), infrastructure, and cost modeling. |
| **[`docs/PRD.md`](./docs/PRD.md)** | Full Product Requirements Document (Personas, Functional FR-01–FR-12, Non-Functional, Success Metrics). |
| **[`docs/DEVELOPMENT_PLAN.md`](./docs/DEVELOPMENT_PLAN.md)** | Phase-wise roadmap (Phases 1–4) with test gates and verification criteria at each milestone. |
| **[`docs/INSTALLATION.md`](./docs/INSTALLATION.md)** | Step-by-step installation, local Ollama open-source MoE setup, and production deployment guide. |
| **[`docs/LOCAL_TESTING.md`](./docs/LOCAL_TESTING.md)** | Local testing guide, `curl` commands, SSE streaming validation, and pre-PR test checklist. |
| **[`docs/TECHNICAL_SPECIFICATIONS.md`](./docs/TECHNICAL_SPECIFICATIONS.md)** | System architecture, real-time database schemas, API contracts, and multi-model gateway routing. |
| **[`docs/FUTURE_ROADMAP.md`](./docs/FUTURE_ROADMAP.md)** | Future architecture: Multi-Agent Orchestration, Weaviate RAG, Gemini Live Voice, and LMS integration. |

---

## 🛠️ Quickstart & Local Setup

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-org/skolve.git
cd skolve

# Install dependencies
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env to supply your GEMINI_API_KEY if testing cloud LLM features.
# Note: Skolve includes an intelligent pedagogical fallback engine if running offline!
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Running Smoke & Verification Tests

You can test Skolve in two ways:
1. **In-Browser:** Click **"Doc & Test Hub"** in the top navigation bar to run the full automated API smoke test suite.
2. **Terminal:**
   ```bash
   # Run TypeScript compilation & linting
   npm run lint

   # Test backend health check
   curl http://localhost:3000/api/health
   ```

---

## 🏗️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Node.js, Express, TSX runner, Server-Sent Events (SSE).
- **Database:** Real-time in-memory store with ACID operations, pub/sub event bus, and persistent JSON snapshotting.
- **AI Engine:** Google GenAI (`@google/genai` with `gemini-3.8-flash`), Ollama / vLLM API gateway for open-source MoE (Qwen3).

---

## 📄 License
Apache-2.0 License.
