# Skolve AI Providers Diagnostic Test Run
**Run ID:** `test-run-1791039364492`  
**Timestamp:** `2026-10-03T14:56:04.492Z`  
**Summary:** 1 Passed · 1 Failed · 5 Skipped

| Provider | Status | Configured | Model | Latency | Diagnosis / Message |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Gemini** | ❌ FAILED | Yes | `gemini-3.8-flash` | 2860ms | Validation Failed: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}} |
| **OpenAI** | ⚠️ SKIPPED | No | `gpt-4o-mini` | — | Skipped: OPENAI_API_KEY is not configured in environment. |
| **Anthropic Claude** | ⚠️ SKIPPED | No | `claude-3-5-haiku-20241022` | — | Skipped: ANTHROPIC_API_KEY is not configured in environment. |
| **OpenRouter (MoE Gateway)** | ⚠️ SKIPPED | No | `qwen/qwen-2.5-72b-instruct` | — | Skipped: OPENROUTER_API_KEY is not configured in environment. |
| **Hugging Face Inference** | ⚠️ SKIPPED | No | `Qwen/Qwen2.5-Coder-32B-Instruct` | — | Skipped: HUGGINGFACE_API_KEY is not configured in environment. |
| **Ollama (Local LLM)** | ⚠️ SKIPPED | No | `qwen2.5:32b` | — | Local daemon offline: Cannot connect to Ollama at http://localhost:11434 (fetch failed). |
| **llama.cpp Server** | ✅ PASSED | Yes | `default` | 56ms | Validated: llama.cpp server is healthy (56ms response). |

## Diagnostic Notes & Remediation
### Google Gemini (FAILED)
- **Message:** Validation Failed: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
- **Details:** `ApiError: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}
    at throwErrorIfNotOK (/app/applet/node_modules/@google/genai/src/_api_client.ts:1109:24)
    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)
    at async <anonymous> (/app/applet/node_modules/@google/genai/src/_api_client.ts:654:9)
    at async Models.Models.generateContent (/app/applet/node_modules/@google/genai/src/models.ts:132:14)
    at async AIGateway.validateGemini (/app/applet/server/ai.ts:99:24)
    at async Promise.all (index 0)
    at async AIGateway.testAllProviders (/app/applet/server/ai.ts:556:84)
    at async <anonymous> (/app/applet/server.ts:429:24)`
- **Suggestions:**
  - Verify GEMINI_API_KEY is valid and active in Google AI Studio / Google Cloud Console.

### OpenAI (SKIPPED)
- **Message:** Skipped: OPENAI_API_KEY is not configured in environment.
- **Suggestions:**
  - Add OPENAI_API_KEY="sk-..." to .env to enable OpenAI models.

### Anthropic Claude (SKIPPED)
- **Message:** Skipped: ANTHROPIC_API_KEY is not configured in environment.
- **Suggestions:**
  - Add ANTHROPIC_API_KEY="sk-ant-..." to .env to enable Claude models.

### OpenRouter (MoE Gateway) (SKIPPED)
- **Message:** Skipped: OPENROUTER_API_KEY is not configured in environment.
- **Suggestions:**
  - Add OPENROUTER_API_KEY="sk-or-v1-..." to .env to access 100+ open-source MoE models.

### Hugging Face Inference (SKIPPED)
- **Message:** Skipped: HUGGINGFACE_API_KEY is not configured in environment.
- **Suggestions:**
  - Add HUGGINGFACE_API_KEY="hf_..." to .env for serverless open-weights.

### Ollama (Local LLM) (SKIPPED)
- **Message:** Local daemon offline: Cannot connect to Ollama at http://localhost:11434 (fetch failed).
- **Details:** `TypeError: fetch failed`
- **Suggestions:**
  - If you wish to use local open weights, start Ollama with "ollama serve".
  - Otherwise, leave unconfigured to use cloud providers.
