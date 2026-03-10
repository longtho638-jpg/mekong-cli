# OpenClaw × Open-Source LLM — Kiến Trúc Triển Khai

> Vận hành Tôm Hùm autonomous trading company bằng LLM nguồn mở.
> Tiết kiệm chi phí — An toàn — Bảo mật.

---

## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────┐
│                    TÔM HÙM DAEMON                           │
│         (auto-cto-pilot.js + task-queue.js)                  │
│         Trading Cadence Scheduler → Decision Engine          │
└──────────────────────┬──────────────────────────────────────┘
                       │ localhost:9191 (KHÔNG ĐỔI)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LITELLM GATEWAY (Port 9191)                     │
│    Drop-in thay thế Antigravity Proxy — OpenAI-compatible    │
│                                                              │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│    │ TIER 1: LOCAL│  │ TIER 2: GPU  │  │ TIER 3: CLOUD API│ │
│    │ Ollama/Metal │  │ vLLM/SGLang  │  │ Claude/Gemini    │ │
│    │ Port 11434   │  │ Port 8081    │  │ (fallback)       │ │
│    │ Phi-4 14B    │  │ Qwen3-32B   │  │ Sonnet/Opus      │ │
│    │ $0/token     │  │ $0.15/1M    │  │ $15/1M           │ │
│    └──────────────┘  └──────────────┘  └──────────────────┘ │
│                                                              │
│    ROUTING RULES:                                            │
│    simple  → Tier 1 (health checks, lint fixes)              │
│    medium  → Tier 1 or Tier 2 (code review, bug fix)        │
│    complex → Tier 2 (architecture, security audit)           │
│    strategic → Tier 2 + Tier 3 fallback (planning)          │
└─────────────────────────────────────────────────────────────┘
```

### Zero Code Change
- Tôm Hùm vẫn gọi `localhost:9191` — không sửa config.js
- CC CLI vẫn nhận prompt qua tmux — không đổi brain-process-manager
- LiteLLM Gateway thay Antigravity Proxy — cùng API format

---

## 2. MODEL SELECTION

### Tier 1: Local (Mac M1/M2/M4 — Free)

| Model | Size | RAM | Speed | Use Case |
|-------|------|-----|-------|----------|
| **Phi-4-14B** Q4_K_M | 8GB | 12GB | ~8 t/s | Health checks, lint, simple fixes |
| **Qwen2.5-Coder-7B** Q4 | 4GB | 8GB | ~15 t/s | Code review, bug fixes |
| **DeepSeek-R1-7B** Q4 | 4GB | 8GB | ~12 t/s | Reasoning, test analysis |

**Setup:**
```bash
# Install Ollama (1 command)
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull phi4:14b-q4_K_M
ollama pull qwen2.5-coder:7b-instruct-q4_K_M
ollama pull deepseek-r1:7b

# Verify
ollama list
curl http://localhost:11434/api/tags
```

### Tier 2: GPU Server (RunPod/Lambda — $0.15-0.80/1M tokens)

| Model | VRAM | Speed | Use Case |
|-------|------|-------|----------|
| **Qwen2.5-Coder-32B** Q4_K_M | 24GB (RTX 4090) | ~25 t/s | Architecture, complex fixes |
| **DeepSeek-R1-Distill-32B** | 24GB | ~20 t/s | Strategic planning, CoT |
| **Llama 4 Scout 70B** | 48GB (A100) | ~15 t/s | Tool-calling, multi-step |

**Setup (vLLM on RunPod):**
```bash
# RunPod: RTX 4090 ($0.39/hr) or A100 ($0.79/hr)
pip install vllm
vllm serve Qwen/Qwen2.5-Coder-32B-Instruct \
  --quantization awq --max-model-len 32768 \
  --port 8081 --host 0.0.0.0

# SSH tunnel to local
ssh -L 8081:localhost:8081 user@runpod-ip
```

### Tier 3: Cloud API Fallback (existing)
- Claude Sonnet/Opus qua Antigravity Proxy
- Gemini 3 Flash/Pro qua Google API
- Chỉ dùng khi Tier 1+2 fail hoặc strategic missions

---

## 3. LITELLM GATEWAY CONFIG

```yaml
# litellm-config.yaml — Drop-in cho port 9191
model_list:
  # Tier 1: Local (free, fastest)
  - model_name: "local-fast"
    litellm_params:
      model: "ollama/phi4:14b-q4_K_M"
      api_base: "http://localhost:11434"

  - model_name: "local-coder"
    litellm_params:
      model: "ollama/qwen2.5-coder:7b-instruct-q4_K_M"
      api_base: "http://localhost:11434"

  # Tier 2: GPU Server (powerful, cheap)
  - model_name: "gpu-coder"
    litellm_params:
      model: "openai/Qwen2.5-Coder-32B-Instruct"
      api_base: "http://localhost:8081/v1"
      api_key: "not-needed"

  # Tier 3: Cloud Fallback
  - model_name: "claude-sonnet"
    litellm_params:
      model: "anthropic/claude-sonnet-4-6-20250514"
      api_key: "os.environ/ANTHROPIC_API_KEY"

  - model_name: "gemini-flash"
    litellm_params:
      model: "gemini/gemini-3-flash"
      api_key: "os.environ/GOOGLE_API_KEY"

router_settings:
  routing_strategy: "cost-based"  # cheapest first
  model_group_alias:
    "claude-sonnet-4-6-20250514": "local-coder"  # reroute Sonnet → local
    "claude-opus-4-6": "gpu-coder"               # reroute Opus → GPU
    "gemini-3-flash": "local-fast"                # reroute Gemini → local
  fallbacks:
    - ["local-coder", "gpu-coder", "claude-sonnet"]
    - ["local-fast", "local-coder", "gemini-flash"]
  retry_policy:
    max_retries: 2
    retry_after: 1
```

**Khởi động:**
```bash
pip install litellm[proxy]
litellm --config litellm-config.yaml --port 9191 --host 0.0.0.0
```

---

## 4. CHI PHÍ SO SÁNH

### Ước tính: 20M tokens/tháng (Tôm Hùm 24/7)

| Phương án | Chi phí/tháng | Tiết kiệm |
|-----------|---------------|------------|
| Claude Opus API only | **$300** | baseline |
| Claude Sonnet API only | **$60** | 80% |
| Mac M1 local (Phi-4/Qwen-7B) | **$30** (điện) | 90% |
| RTX 4090 owned (Qwen-32B) | **$50** (điện+hosting) | 83% |
| RunPod RTX 4090 rental | **$140** (24/7) | 53% |
| **Hybrid: Local + GPU fallback** | **$45** | **85%** |

### Break-even Analysis
- RTX 4090 (~$1,800) → hoàn vốn trong **7 tháng** vs Claude API
- Mac M1 đã có → **ROI ngay lập tức** (chỉ trả điện)

---

## 5. BẢO MẬT

### 5.1 Data Never Leaves Machine (Tier 1)
```
✅ Trading data, API keys, strategies → LOCAL ONLY
✅ Không gửi qua internet
✅ Không cần API key management
✅ Model weights verified qua SHA256 checksums
```

### 5.2 Network Isolation (Production)
```bash
# Firewall: chỉ cho phép local connections
iptables -A INPUT -p tcp --dport 9191 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 9191 -j DROP
iptables -A INPUT -p tcp --dport 11434 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 11434 -j DROP
```

### 5.3 GPU Server Security (Tier 2)
```
✅ SSH tunnel (encrypted) — không expose port ra internet
✅ WireGuard VPN giữa Mac ↔ GPU server
✅ API key authentication trên vLLM endpoint
✅ Disk encryption cho model weights + data
```

### 5.4 Model Supply Chain
```bash
# Verify model integrity
sha256sum Qwen2.5-Coder-32B-Instruct/model-00001-of-00007.safetensors
# Compare with HuggingFace published hashes

# Ollama auto-verifies SHA256 on pull
ollama pull qwen2.5-coder:7b --verify
```

---

## 6. TRIỂN KHAI TỪNG BƯỚC

### Phase 1: Local Only (1 ngày, $0)
```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b-instruct-q4_K_M

# 2. Install LiteLLM Gateway
pip install litellm[proxy]

# 3. Create config (copy from Section 3)
vim litellm-config.yaml

# 4. Stop Antigravity Proxy, start LiteLLM on same port
kill $(lsof -ti:9191)
litellm --config litellm-config.yaml --port 9191

# 5. Verify — Tôm Hùm should work unchanged
curl http://localhost:9191/health
node apps/openclaw-worker/task-watcher.js
```

### Phase 2: Add GPU Server (1 ngày, ~$50/mo)
```bash
# 1. Rent RunPod RTX 4090 ($0.39/hr)
# 2. Deploy vLLM with Qwen2.5-Coder-32B
# 3. SSH tunnel: ssh -L 8081:localhost:8081 runpod
# 4. Update litellm-config.yaml to include gpu-coder
# 5. Complex missions now route to 32B model
```

### Phase 3: Production Hardening (1 ngày)
```bash
# 1. WireGuard VPN setup
# 2. Firewall rules (Section 5.2)
# 3. Monitoring: Prometheus metrics from LiteLLM
# 4. Auto-restart: systemd service for LiteLLM + Ollama
# 5. Keep Claude/Gemini API as Tier 3 fallback
```

---

## 7. TRADING COMPANY ROUTING MAP

| Trading Command | Complexity | Model Route |
|----------------|------------|-------------|
| `/trading:exec-spec health` | SIMPLE | Tier 1: Phi-4 local |
| `/trading:sre uptime` | SIMPLE | Tier 1: Phi-4 local |
| `/trading:coo health` | MEDIUM | Tier 1: Qwen-7B local |
| `/trading:cfo review` | MEDIUM | Tier 1: Qwen-7B local |
| `/trading:backend quality` | MEDIUM | Tier 2: Qwen-32B GPU |
| `/trading:cto audit` | COMPLEX | Tier 2: Qwen-32B GPU |
| `/trading:ceo risk` | COMPLEX | Tier 2: Qwen-32B GPU |
| `/trading:all full quarterly` | STRATEGIC | Tier 2 + Tier 3 fallback |
| `/trading:founder:emergency` | CRITICAL | Tier 3: Claude Opus (accuracy) |

---

## 8. MONITORING

```bash
# LiteLLM built-in dashboard
litellm --config config.yaml --port 9191 --telemetry

# Metrics endpoint
curl http://localhost:9191/metrics
# → litellm_request_total, litellm_cost_total, litellm_latency_seconds

# Tôm Hùm integration: log model used per mission
# Already tracked in: data/llm-metrics.json
```

---

*Created: 2026-03-03 | Architecture v1.0*
*Tôm Hùm v29+ | LiteLLM Gateway | Ollama + vLLM*
