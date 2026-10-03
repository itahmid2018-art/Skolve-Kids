# Installation & Local Setup Guide
## Project: Skolve - AI Personalized Education Platform

This guide walks through setting up Skolve on your local workstation for development, running the integrated Vite + Express server, configuring AI inference providers (Google GenAI and local Ollama MoE), and managing the real-time database.

---

## 1. System Requirements

- **Node.js:** v18.18.0 or newer (v20+ recommended)
- **Package Manager:** `npm` (v9+) or `pnpm` (v8+)
- **Operating System:** macOS, Linux (Ubuntu/Debian/Fedora), or Windows via WSL2
- **Optional for Local MoE Inference:**
  - **Ollama:** Installed from [ollama.com](https://ollama.com)
  - **RAM / VRAM:** $\ge 16\text{GB}$ system RAM for Qwen3-32B or Phi-4; $\ge 24\text{GB}$ VRAM for larger MoE weights.

---

## 2. Quickstart (Under 2 Minutes)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/skolve.git
cd skolve

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start full-stack development server (Express backend + Vite frontend)
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 3. Environment Variables Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Core Configuration
PORT=3000
APP_URL="http://localhost:3000"
DEFAULT_AI_PROVIDER="auto" # Options: auto, gemini, openai, anthropic, openrouter, huggingface, ollama, llamacpp
TESTING_ERROR_LOG_DIR="testing/errors"

# 1. Google Gemini (Native / Default in AI Studio)
GEMINI_API_KEY="your-gemini-key"
GEMINI_MODEL="gemini-3.8-flash"

# 2. OpenAI (Optional)
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"

# 3. Anthropic Claude (Optional)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_BASE_URL="https://api.anthropic.com/v1"
ANTHROPIC_MODEL="claude-3-5-haiku-20241022"

# 4. OpenRouter (Optional - Multi-Model Gateway)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="qwen/qwen-2.5-72b-instruct"

# 5. Hugging Face Inference (Optional)
HUGGINGFACE_API_KEY="hf_..."
HUGGINGFACE_ENDPOINT_URL="https://router.huggingface.co/hf-inference/v1"
HUGGINGFACE_MODEL="Qwen/Qwen2.5-Coder-32B-Instruct"

# 6. Local Ollama (Optional)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:32b"

# 7. Local llama.cpp (Optional)
LLAMACPP_BASE_URL="http://localhost:8080"
LLAMACPP_MODEL="default"
```

---

## 4. Setting Up Local Open-Source MoE via Ollama (Optional)

If you prefer using purely local open-source models for zero-cost generation:

1. **Install Ollama:**
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull the Recommended Models:**
   ```bash
   # Fast reasoning and curriculum synthesis (Dense 32B)
   ollama pull qwen2.5:32b
   # Or lightweight assistant (14B)
   ollama pull phi4
   ```

3. **Verify Ollama Server:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

4. Skolve's backend will automatically detect the local Ollama instance on `http://localhost:11434` if configured, and route requests accordingly!

---

## 5. Development Scripts Reference

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Starts the Express full-stack server with Vite middleware mounted on port 3000. Supports live backend code reloads and frontend asset serving. |
| `npm run test:providers` | `tsx testing/providers.test.ts` | Executes multi-provider diagnostic test suite and generates timestamped error logs in `testing/errors/`. |
| `npm run build` | `vite build` | Compiles the production React single-page application into `/dist`. |
| `npm run lint` | `tsc --noEmit` | Runs full TypeScript static type checking across the entire client and server codebase. |
| `npm run clean` | `rm -rf dist` | Clears compiled production bundles. |

---

## 6. Troubleshooting Common Issues

### Issue A: Port 3000 is Already in Use
```bash
# Find process holding port 3000
lsof -i :3000
# Terminate the lingering process
kill -9 <PID>
```

### Issue B: Gemini API Key Not Injected
- In local development, verify that `.env` contains `GEMINI_API_KEY="AIzaSy..."`.
- In Google AI Studio, the key is provided directly in the Secrets panel.
- Even without an API key, Skolve includes an **intelligent pedagogical fallback engine** that continues generating structured courses, grading quizzes, and answering Socratic questions without crashing.

### Issue C: HMR / WebSocket Disconnects
- In sandboxed iFrame environments, Hot Module Replacement (HMR) is disabled via `DISABLE_HMR=true` to prevent browser flicker during agent edits. If running locally, you can enable standard HMR by leaving `DISABLE_HMR` unset.
