# Initial Idea Document: Skolve - Tailored AI Education Platform

## Platform Overview
**Name:** Skolve  
*Etymology:* Inspired by scholarship, cognitive evolution, and problem solving; signaling an adaptive, personalized trajectory rather than a rigid, one-size-fits-all curriculum.

Skolve is an AI-native education platform that translates learner goals, current baseline skills, cognitive preferences, and time budgets into fully structured, interactive curricula with automated pedagogical assessment.

---

## 1. Recommended AI Architecture (Open-Source MoE & Multi-Model Inference)

### Primary Open-Source Mixture of Experts (MoE) & Dense LLM Models
All recommended open weights carry permissive Apache 2.0 or MIT-compatible commercial use:

| Model | Architecture | Active / Total Params | Context Window | Target Pedagogical Role |
| :--- | :--- | :--- | :--- | :--- |
| **Qwen3-235B-A22B** | MoE | 22B active / 235B total | 128K | Core curriculum design, Socratic reasoning, lesson generation |
| **Qwen3-30B-A3B** | MoE | 3B active / 30B total | 128K | Rapid assessment generation, quiz scoring, hint generator |
| **Qwen3-32B** | Dense | 32B dense | 128K | Lesson summarization, edge devices, high-throughput Q&A |
| **Qwen2.5-Coder-72B** | Dense | 72B dense | 128K | Programming exercises, code verification, AST feedback |
| **Phi-4** | Dense | 14B dense | 16K | Ultra-low latency conversational tutor, on-device mobile |

### Serving & Inference Infrastructure
- **Development & Prototyping:** Ollama (`http://localhost:11434/api/generate`) with OpenAI-compatible REST schema.
- **Production High-Throughput Serving:** vLLM with PagedAttention, continuous batching, and INT4/AWQ quantization running on NVIDIA A100/H100 instances.
- **Cloud Managed Fallback / Elastic Scale:** OpenRouter and HuggingFace Dedicated Inference Endpoints with model routing based on latency SLAs and cost budgets.
- **Google GenAI Integration:** Integrated `@google/genai` (Gemini 3.8 Flash) for high-speed streaming generation, complex reasoning, and multimodal capabilities.

### Vector Knowledge Base & Retrieval-Augmented Generation (RAG)
- **Vector Database:** Weaviate / Pinecone for indexing textbooks, verified academic curricula, open-source code repositories, and problem sets.
- **Orchestration Layer:** LlamaIndex / LangChain pipeline with hybrid dense + BM25 sparse search and reranking.

---

## 2. JavaScript / TypeScript Full-Stack Specifications
- **Frontend:** React 19, TypeScript, Tailwind CSS, Motion for fluid layout micro-interactions.
- **Backend:** Node.js + Express with Vite middleware integration for unified developer experience.
- **Real-Time Layer:** Server-Sent Events (SSE) and WebSocket pub/sub bus for zero-latency streaming of generated curricula, live Socratic chat, and multi-client progress syncing.
- **Database & Persistence:** Relational / document persistent schema with ACID properties, user profiles, course state trees, exercise evaluations, and audit logs.
- **Authentication:** Token and session-based authentication with role-based access control (Learner, Educator, Administrator).

---

## 3. Core MVP Feature Breakdown (The 12-Week Target)
1. **User Onboarding & Learning Profile Wizard:** Collects domain interest, prerequisites, target timeline, and preferred pedagogy (hands-on projects vs. conceptual first-principles).
2. **AI Course Generation Engine:** Generates multi-tier syllabus with modules, actionable lessons, comprehension checkpoints, and hands-on exercises.
3. **Structured Lesson Delivery Sandbox:** Distraction-free two-zone learning interface with progressive concept disclosure and embedded code/math sandboxes.
4. **Automated Assessment & Socratic Feedback:** Formative quizzes (multiple choice, conceptual short-answer, and code submission) with rubric-grounded AI evaluation.
5. **Real-time Learner Mastery Dashboard:** Real-time completion rates, mastery score radars, spaced-repetition reminders, and dynamic next-step suggestions.
6. **Unified Developer & Production API Layer:** Clean abstracted endpoints connecting the frontend to inference engines (Ollama, vLLM, and Gemini API proxy).

---

## 4. MVP Phase-Wise 12-Week Roadmap
- **Phase 1: Foundation & Design (Weeks 1–2):** Architecture scaffolding, database schema, auth models, prototype generation prompts.
- **Phase 2: AI Pipeline & Backend (Weeks 3–5):** Course generation endpoint, streaming JSON parsing, assessment rubric evaluation, vector store scaffolding.
- **Phase 3: Frontend & Learner Experience (Weeks 6–8):** Onboarding wizard, course landing, lesson stage, quiz viewer, real-time telemetry.
- **Phase 4: Polish, Testing & Launch (Weeks 9–12):** vLLM GPU migration, load testing (50–100 concurrent learners), hallucination safeguards, beta rollout.

---

## 5. Economic & Cost Projections (MVP Phase)
- **GPU Server (vLLM on 1x A100 80GB):** $500–$1,200/month (Lambda Labs / RunPod)
- **Database & Storage:** $25–$50/month
- **Application Hosting & Edge CDN:** $20–$40/month
- **Vector Indexing (Weaviate Serverless):** $49/month
- **Total Projected Monthly Burn:** ~$600–$1,400/month (utilizing free-tier APIs and local Ollama during early development).
