# Future Project Documentation & Architectural Evolution
## Project: Skolve - AI Personalized Education Platform
**Target Horizon:** Post-MVP (Quarters 3–4)  

This document details upcoming architectural phases, technical specifications for advanced integrations, and long-term product enhancements for the engineering team.

---

## 1. Multi-Agent Pedagogical Orchestration (MAPO)

In post-MVP releases, Skolve will transition from a single-prompt pipeline to a collaborative trio of specialized agents using the Mixture of Experts framework:

```
                      ┌─────────────────────────────────┐
                      │    Orchestrator Agent (Master)  │
                      └──────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│Curriculum Designer│      │  Socratic Tutor  │       │  Code & Rubric   │
│     Agent        │       │      Agent       │       │ Evaluator Agent  │
│(Qwen3-235B /     │       │(Phi-4 / Gemini   │       │(Qwen2.5-Coder-   │
│Gemini 3.8 Flash) │       │Live Voice API)   │       │ 72B)             │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

1. **Curriculum Designer Agent:**
   - Synthesizes long-form multi-week syllabi with adaptive graph dependency resolution (Topological sorting of concept prerequisites).
2. **Socratic Tutor Agent:**
   - Maintains continuous multi-turn learner memory, cognitive fatigue detection, and adaptive explanation restructuring.
3. **Code & Rubric Evaluator Agent:**
   - Executes user-submitted code in isolated WebAssembly / Firecracker micro-VM containers, validating abstract syntax trees (AST) and algorithmic efficiency.

---

## 2. Retrieval-Augmented Generation (RAG) with Weaviate

To prevent hallucinations in advanced STEM disciplines (advanced organic chemistry, quantum mechanics, compiler optimization):

- **Vector Database:** Weaviate Serverless instance.
- **Index Contents:** Curated open-access textbooks (OpenStax, MIT OpenCourseWare), documentation specifications, and peer-reviewed educational problem sets.
- **Hybrid Search Strategy:**
  - Dense semantic retrieval via `gemini-embedding-2-preview` or `text-embedding-3-large`.
  - BM25 sparse keyword search for exact function names, syntax keywords, and theorem titles.
  - Cross-encoder reranker to surface top-3 relevant context passages for lesson generation.

---

## 3. Real-Time Multimodal Voice Tutoring (Gemini Live API)

Leveraging the `@google/genai` Live API (`gemini-3.8-live` and `gemini-3.8-flash-tts`):
- **Hands-Free Audio Study Mode:** Learners can talk directly to their Socratic tutor while commuting or exercising.
- **Ultra-Low Latency:** Bi-directional PCM streaming over WebSockets with barge-in interruption detection (tutor pauses talking the moment user speaks).
- **Dual-Speaker Podcasts:** Automated generation of 10-minute recap audio podcasts for every generated module, featuring two AI hosts discussing the concepts.

---

## 4. Institutional LMS Standards & Enterprise SSO

For deployment within universities and enterprise training environments:
- **LTI 1.3 (Learning Tools Interoperability):** Seamless embedding into Canvas, Blackboard, Moodle, and Schoology.
- **SCORM 2004 / xAPI (Experience API):** Export generated courses as standards-compliant e-learning packages with grade passback.
- **Enterprise SSO:** SAML 2.0 and OIDC support for Okta, Azure Active Directory, and Google Workspace.

---

## 5. Peer Collaborative Study Rooms

- WebRTC peer-to-peer data channels for collaborative coding sandboxes.
- Synchronized simulation state: two students can simultaneously manipulate parameters in an interactive science visualizer while an AI moderator guides discussion.
