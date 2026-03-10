# Research Report: Open-Source LLM Architecture for Autonomous Agent Daemon

**Date:** 2026-03-03 | **Scope:** Replace Claude/Gemini API in OpenClaw/Tôm Hùm

---

## Executive Summary

Self-hosting is cost-effective at **~14M tokens/month** vs Claude Opus API. For Tôm Hùm's 24/7 daemon pattern, **SGLang + Qwen2.5-Coder-32B** (on cloud GPU) or **Ollama + Llama 4 70B** (on Mac M-series local) is the recommended stack. Drop-in OpenAI-compatible API means zero code changes to existing Antigravity Proxy routing.

---

## 1. Best Open-Source Models (March 2026)

| Model | Size | HumanEval | SWE-bench | Context | Mac M1 |
|-------|------|-----------|-----------|---------|--------|
| **Qwen2.5-Coder** | 32B | 92.7% | 41.2% | 128K | M2 Ultra (64GB) |
| **DeepSeek-R1-Distill** | 32B | 90.2% | 48.5% | 128K | M2 Max (64GB) |
| **Llama 4 Scout** | 70B | 91.5% | 45.8% | 128K | M2/M3 Ultra |
| **Mistral Large 3** | 123B | 92.0% | 43.5% | 128K | Cloud only |
| **MiniMax M2.5** | 200B+ | 94.5% | **80.2%** | 256K | Cloud only |
| **Phi-4** | 14B | 82.6% | 31.0% | 128K | **M1 16GB** |

**Recommendations by task:**
- Code review + bug fixing → **Qwen2.5-Coder-32B** (best code-specific SOTA)
- Architecture planning + reasoning → **DeepSeek-R1-Distill-32B** (chain-of-thought)
- Trading analysis + tool-use → **Llama 4 Scout 70B** (best native tool-calling)
- M1 16GB local only → **Phi-4-14B** (fits, ~8 t/s on Metal)

Context window: all top models support 128K — sufficient for codebase understanding.

---

## 2. Self-Hosted Inference Engines

| Engine | Throughput | Apple Silicon | OpenAI API | 24/7 Stability | Setup |
|--------|-----------|---------------|------------|----------------|-------|
| **SGLang** | Ultra-high | Good | Native | Best (RadixAttn) | Moderate |
| **vLLM** | Ultra-high | vLLM-MLX | Native | Good | Moderate |
| **Ollama** | Moderate | **Excellent** | Native | **Best (M-series)** | Minimal |
| **llama.cpp** | Moderate | Excellent | Via server | Good | Moderate |
| **TGI** | High | Limited | Native | Maintenance mode | Docker |
| **LocalAI** | Moderate | Good | **Best compat** | Good | Minimal |

**Winner for Tôm Hùm daemon:**
- **SGLang** (cloud GPU): RadixAttention caches system prompt prefix → 30-50% less compute per agentic loop. Native JSON-constrained output = no hallucinated tool-call schemas.
- **Ollama** (Mac local): Zero-config, handles VRAM/RAM swap gracefully, stable REST API for long uptime.

---

## 3. Cost Comparison

### API Costs
| Provider | Input (1M tokens) | Output (1M tokens) |
|----------|-------------------|-------------------|
| Claude Opus 4.5 | $5.00 | $25.00 |
| Claude Sonnet 4.5 | $1.50 | $7.50 |
| GPT-4o | $2.50 | $10.00 |

### Self-Hosted Costs
| Option | Monthly Cost | Notes |
|--------|-------------|-------|
| RTX 4090 (owned) | ~$129/mo | $79 electricity + $50 depreciation |
| RunPod A100 (80GB) | ~$800/mo | On-demand, 24/7 |
| RunPod H100 (80GB) | ~$2,000/mo | On-demand, 24/7 |
| Lambda Labs A100 | ~$1,000/mo | Reserved pricing |
| vast.ai A100 (spot) | ~$400-600/mo | Variable, interruptions |
| Mac M2 Ultra (owned) | ~$30/mo | Electricity only, already owned |

### Break-Even Analysis
- **RTX 4090 vs Claude Opus**: Break-even at ~14.3M tokens/month (~$143/mo API cost)
- **RunPod A100 vs Claude Opus**: Break-even at ~87M tokens/month (rarely justified)
- **Mac M1/M2 (owned) vs any API**: Immediate ROI if machine already owned

**Verdict:** For Tôm Hùm's typical workload (code review, task dispatch, bug fixes), local Mac inference with Ollama is **free after hardware cost** if machine is already owned.

---

## 4. Security Considerations

| Concern | Self-Hosted | API |
|---------|-------------|-----|
| Data leaves machine | Never | Always |
| API key management | Not needed | Required |
| Trading strategy leakage | Zero risk | Risk exists |
| Model verification | SHA256 checksums (GGUF) | N/A |
| Network isolation | Full air-gap possible | N/A |
| Audit trail | Complete local logs | Vendor logs |

GGUF model checksums from Hugging Face allow cryptographic verification — no tampered weights risk.

---

## 5. Production Architecture

### Recommended: Hybrid Router (Drop-in for Antigravity Proxy)

```
Tôm Hùm → http://localhost:9191 (existing)
             ↓
         LiteLLM Gateway (port 9191)
             ↓
    ┌────────────────────────────────┐
    │ Route by task complexity:      │
    │                                │
    │ simple tasks → Ollama:11434    │
    │   (Phi-4/Qwen2.5-7B local)    │
    │                                │
    │ complex tasks → SGLang:8000    │
    │   (Qwen2.5-Coder-32B)         │
    │                                │
    │ fallback → Claude/Gemini API   │
    │   (existing Antigravity Proxy) │
    └────────────────────────────────┘
```

LiteLLM is OpenAI-compatible → zero code changes to existing codebase.

### Model Routing Rules
```yaml
routes:
  - pattern: "code_review|bug_fix"
    model: "ollama/qwen2.5-coder:32b"
  - pattern: "architecture|planning"
    model: "ollama/deepseek-r1:32b"
  - pattern: "trading_analysis|complex"
    model: "ollama/llama4:70b"
  - fallback: "claude-opus-4-5"  # existing proxy
```

### Quantization Tradeoffs
| Quant | Size (32B) | Quality Loss | Speed |
|-------|-----------|--------------|-------|
| FP16 | 64GB | 0% | Slow |
| Q8_0 | 32GB | ~1% | Fast |
| **Q4_K_M** | **18GB** | **~3%** | **Best** |
| Q3_K_M | 14GB | ~7% | Faster |

**Recommendation:** Q4_K_M — best quality/size ratio for 32B models on M2 Ultra (192GB RAM).

### Mac M-Series Local Inference Speed
| Chip | RAM | Model | Speed |
|------|-----|-------|-------|
| M1 Pro | 16GB | Phi-4-14B (Q4) | ~8 t/s |
| M2 Max | 32GB | Qwen2.5-Coder-32B (Q4) | ~15 t/s |
| M2 Ultra | 64GB | Llama 4 70B (Q4) | ~10 t/s |
| M4 Max | 128GB | Llama 4 70B (Q8) | ~20 t/s |

---

## Concrete Recommendations for OpenClaw/Tôm Hùm

1. **Immediate (Mac M1 16GB):** Install Ollama + Phi-4 → use for simple task routing/dispatch, keep Claude API for complex reasoning
2. **Short-term (Mac M2+ or cloud):** Ollama + Qwen2.5-Coder-32B (Q4_K_M) → handles 80% of coding tasks locally
3. **Production (cloud GPU):** SGLang + Qwen2.5-Coder-32B → 24/7 daemon, ~15 t/s, RadixAttention caches Tôm Hùm's system prompt
4. **Router:** LiteLLM on port 9191 → drop-in Antigravity Proxy replacement, add `LITELLM_MODEL_MAP` env var, zero code changes

---

## Unresolved Questions

1. Does Tôm Hùm's actual token volume exceed 14M/month? (Determines if RTX 4090 purchase is justified)
2. M1 MacBook in use — is it 16GB or 32GB? (Determines which models can run locally)
3. Is network isolation required for trading strategies? (Determines if cloud GPU is acceptable)
4. LiteLLM adds ~10ms latency per call — acceptable for Tôm Hùm's mission loop timing?
5. DeepSeek-R1 weights originated from Chinese lab — acceptable for production trading system?
