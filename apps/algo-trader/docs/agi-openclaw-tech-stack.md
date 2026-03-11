# Tech Stack: AGI OpenClaw Local LLM

**Date:** 2026-03-11
**Status:** Selected

---

## Core Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **LLM Runtime** | Ollama | Easiest setup, REST API, active maintenance |
| **Models** | Llama 3.1 8B, Mistral 7B, Qwen2.5 14B | Fast inference, good reasoning |
| **Quantization** | Q4_K_M | Best speed/quality tradeoff |
| **API Layer** | FastAPI | Python, async, OpenAPI docs |
| **Agent Framework** | Custom (existing OpenClaw) | Already built, MCU billing integrated |
| **Message Queue** | BullMQ (existing) | Redis-backed, reliable |
| **Database** | PostgreSQL (existing) | Persistent storage |
| **Cache** | Redis (existing) | Low-latency caching |
| **Monitoring** | Prometheus + Grafana (existing) | Metrics, alerting |

---

## Infrastructure

### Local Development
```yaml
llm:
  runtime: Ollama
  models:
    - llama3.1:8b (4GB)
    - mistral:7b (4GB)
    - qwen2.5:14b (8GB)
  gpu: CUDA (NVIDIA) or Metal (M1/M2)
  ram: 16GB minimum, 32GB recommended
```

### Production
```yaml
llm:
  runtime: vLLM (high throughput)
  models: Same as dev
  gpu: RTX 4090 (24GB) or A6000 (48GB)
  ram: 64GB
  replicas: 2+ for HA
```

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────┐
│  AlgoTrader Bot Engine                              │
│  src/core/BotEngine.ts                              │
└──────────────────┬──────────────────────────────────┘
                   │ Signal data
                   ▼
┌─────────────────────────────────────────────────────┐
│  AGI Decision Layer (New)                           │
│  src/agi/                                           │
│  ├── llm-client.ts  → Ollama API                    │
│  ├── sop-engine.ts  → Rule + LLM decision           │
│  ├── circuit-breaker.ts → Safety                    │
│  └── audit-logger.ts → Decision trail               │
└──────────────────┬──────────────────────────────────┘
                   │ Decision (BUY/SELL/HOLD)
                   ▼
┌─────────────────────────────────────────────────────┐
│  Execution Layer (Existing)                         │
│  src/execution/                                     │
│  ├── order-executor.ts                              │
│  └── risk-manager.ts                                │
└─────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/
├── agi/                              # New AGI layer
│   ├── llm-client.ts                 # Ollama integration
│   ├── sop-engine.ts                 # SOP execution
│   ├── circuit-breaker.ts            # Safety circuits
│   ├── audit-logger.ts               # Decision logging
│   ├── models/
│   │   ├── signal-analysis.ts        # LLM signal prompts
│   │   ├── regime-detection.ts       # Market regime
│   │   └── risk-assessment.ts        # Risk scoring
│   └── configs/
│       ├── ollama-config.yaml        # LLM config
│       └── sop-definitions.yaml      # Agent SOPs
│
├── core/
│   ├── llm_client.py                 # Extend with Ollama
│   └── agent_base.py                 # Base agent class
│
└── agents/
    ├── agi-signal-agent.ts           # Signal analysis
    ├── agi-risk-agent.ts             # Risk assessment
    └── agi-executor-agent.ts         # Trade execution
```

---

## API Design

### Ollama Client
```typescript
interface OllamaConfig {
  baseURL: string;      // http://localhost:11434
  model: string;        // llama3.1:8b
  timeout: number;      // 30000ms
  retry: number;        // 3
}

interface GenerateRequest {
  prompt: string;
  model?: string;
  stream?: boolean;
  options?: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
}

interface GenerateResponse {
  response: string;
  done: boolean;
  total_duration: number;
}
```

### SOP Engine
```typescript
interface SOP {
  id: string;           // agi-signal-sop
  name: string;         // AGI Signal Analysis
  purpose: string;      // Why this SOP exists
  triggers: Trigger[];  // When to activate
  inputs: Input[];      // Data sources
  decision: Decision;   // IF-THEN + LLM
  actions: Action[];    // What to execute
  safety: Safety;       // Kill switches
}
```

---

## Dependencies

### New (for AGI layer)
```json
{
  "ollama": "^0.5.0",
  "node-fetch": "^3.3.0",
  "pino": "^8.0.0"
}
```

### Existing (reuse)
```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.0",
  "fastify": "^5.0.0",
  "zod": "^3.22.0"
}
```

---

## Environment Variables

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT=30000
OLLAMA_MAX_RETRIES=3

# AGI Configuration
AGI_ENABLED=true
AGI_MIN_CONFIDENCE=0.6
AGI_MAX_TRADES_PER_HOUR=10
AGI_CIRCUIT_BREAKER_FAILURES=3

# Safety
AGI_MAX_DRAWDOWN_PERCENT=5
AGI_CONSECUTIVE_LOSSES_LIMIT=3
AGI_LATENCY_THRESHOLD_MS=1000
```

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Inference latency | <200ms | P95 |
| Decision throughput | 100/min | Sustained |
| Circuit breaker response | <10ms | P99 |
| Audit log write | <5ms | P99 |
| Model accuracy | >60% | Backtest |

---

## Migration Path

### Phase 1: Local Dev (Week 1)
- Install Ollama
- Add ollama-config.yaml
- Implement LLM client
- Test with backtest data

### Phase 2: Paper Trading (Week 2)
- Integrate with paper trading engine
- Add SOP definitions
- Implement circuit breakers
- Run 48-hour simulation

### Phase 3: Live Trading (Week 3)
- Small position sizing (1-2%)
- Monitor closely
- Gradual ramp-up

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination | High | Confidence threshold, human review |
| High latency | Medium | 7B models, Q4 quant, GPU |
| Model downtime | Medium | Fallback to rules-based |
| Overfitting | High | Out-of-sample testing |
| Regulatory | Low | Audit trail, kill switch |

---

**Approved:** Pending
**Next:** Implementation plan
