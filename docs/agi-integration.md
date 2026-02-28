# AGI Integration Layer — Setup Guide

> Version: v2026.2.28 | Binh Pháp: 第十三篇 用間 — Intelligence Network

## Overview

The AGI Integration Layer adds three capabilities to Mekong CLI:

```
┌─────────────────────────────────────────────────────────────┐
│                  AGI Integration Layer                       │
├──────────────────┬──────────────────┬───────────────────────┤
│  Memory Layer    │  Observability   │  Self-Healing         │
│  Mem0 + Qdrant   │  Langfuse        │  Aider CLI Bridge     │
│  packages/memory │  packages/obs..  │  openclaw-worker/lib  │
└──────────────────┴──────────────────┴───────────────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
   Vector search      Trace + spans       Auto code fix
   YAML fallback      JSON fallback       CC CLI fallback
```

---

## Prerequisites

- Docker Desktop >= 4.20 (for `include:` directive support)
- Python 3.9+ with pip
- Node.js 18+
- `pipx` (optional, for Aider install)

---

## Quick Start (3 commands)

```bash
# 1. Start AGI infrastructure
docker compose -f docker/docker-compose.agi.yml up -d

# 2. Install Python packages
pip install -e packages/memory -e packages/observability

# 3. Verify health
curl http://localhost:6333/healthz   # Qdrant → {"title":"qdrant","version":"..."}
curl http://localhost:3100/api/public/health  # Langfuse → {"status":"ok"}
```

---

## Architecture

```
mekong cook "goal"
     │
     ▼
RecipeOrchestrator
     ├── MemoryFacade.search()        → Qdrant semantic recall
     │        └── YAML fallback       → substring search
     ├── ObservabilityFacade.start_trace()  → Langfuse trace
     │        └── TelemetryCollector  → JSON on disk
     └── RecipeExecutor.run()
              └── on failure → tryAiderFix()  → Aider CLI
                       └── on failure → CC CLI mission dispatch
```

---

## Memory Layer

### Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `QDRANT_URL` | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_COLLECTION` | `mekong_agent_memory` | Vector collection name |
| `OPENAI_API_KEY` | — | Required for Mem0 embeddings |
| `MEMORY_PROVIDER` | `auto` | `auto` \| `yaml` (force YAML-only) |

### API Reference

```python
from packages.memory.memory_facade import get_memory_facade

facade = get_memory_facade()
facade.connect()  # returns True if Qdrant+Mem0 ready, False = YAML fallback

# Store
facade.add("deployed app v2.1 successfully", user_id="cto-agent:session-1")

# Recall
results = facade.search("deployment history", user_id="cto-agent:session-1")
# returns: [{"memory": "...", "score": 0.92}, ...]

# Delete
facade.forget(memory_id="abc-123")

# Status
status = facade.get_provider_status()
# {"vector_ready": True, "qdrant_connected": True, "mem0_available": True,
#  "active_provider": "mem0+qdrant"}

facade.close()
```

### YAML Fallback

When Qdrant is unavailable, `MemoryFacade` returns `False`/`[]` and callers
automatically fall back to `MemoryStore` (substring search, `.mekong/memory.yaml`).
No code changes required — graceful degradation is built in.

---

## Observability Layer

### Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `LANGFUSE_HOST` | `http://localhost:3100` | Langfuse server URL |
| `LANGFUSE_PUBLIC_KEY` | — | From Langfuse dashboard → Settings → API Keys |
| `LANGFUSE_SECRET_KEY` | — | From Langfuse dashboard → Settings → API Keys |

### Dashboard Setup

1. Open `http://localhost:3100`
2. Create account (first user = admin)
3. Create project → copy Public Key + Secret Key
4. Add to `.env`:
   ```
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   ```

### API Reference

```python
from packages.observability.observability_facade import ObservabilityFacade

facade = ObservabilityFacade.instance()

facade.start_trace("deploy app", user_id="cto-agent")
facade.record_step(1, "install deps", duration=2.5, exit_code=0)
facade.record_step(2, "run tests", duration=8.1, exit_code=0, self_healed=True)
facade.record_llm_call(model="claude-opus-4-6", input_tokens=500, output_tokens=200, cost=0.02)
facade.record_error("build warning: unused import")
facade.finish_trace("success")

# Singleton reset (tests only)
ObservabilityFacade.reset()
```

### @traced Decorator

```python
from packages.observability.trace_decorator import traced

@traced(name="install-dependencies")
def install_deps(recipe):
    # Automatically creates a Langfuse span measuring duration
    # Captures exceptions and marks span as "error"
    subprocess.run(["pip", "install", "-r", "requirements.txt"])
```

### JSON Fallback

When Langfuse is unavailable, `TelemetryCollector` writes to
`.mekong/telemetry/execution_trace.json`. Both backends are always attempted;
Langfuse failure never blocks the JSON path.

---

## Self-Healing Layer

### Configuration

Aider routes LLM calls through Antigravity Proxy (port 9191).

```yaml
# .aider.conf.yml (project root)
openai-api-base: http://localhost:9191
model: gemini-3-flash-preview
auto-commits: true
yes: true
no-browser: true
```

### Install Aider

```bash
pipx install aider-chat
# verify
aider --version
```

### API Reference (Node.js)

```javascript
const { tryAiderFix, isAiderAvailable, extractAffectedFiles } = require('./lib/aider-bridge');

// Check availability
if (!isAiderAvailable()) {
  console.log('Aider not installed — self-heal disabled');
}

// Extract files from error output
const files = extractAffectedFiles(errorLog);
// returns: ["src/core/planner.py", "lib/executor.js"] (max 5)

// Attempt fix
const result = await tryAiderFix({
  projectDir: '/path/to/project',
  errorLog: buildOutput,
  testCmd: 'npm run build',
  maxAttempts: 2,          // optional, default 2
});
// result: { success: true, attempts: 1, duration: 12500, diff: "..." }
// result: { success: false, attempts: 2, duration: 25000, reason: "max_attempts" }
```

### Failure Reasons

| `reason` | Meaning |
|----------|---------|
| `not_installed` | `aider` not on PATH |
| `overheating` | M1 thermal guard active (load > 8 or RAM < 200MB) |
| `no_files` | No source file paths found in error log |
| `max_attempts` | All attempts failed verification |

---

## Docker Compose Commands

```bash
# Start all AGI services
docker compose -f docker/docker-compose.agi.yml up -d

# Start individual service
docker compose -f docker/docker/qdrant/docker-compose.yml up -d
docker compose -f docker/docker/langfuse/docker-compose.yml up -d

# View logs
docker compose -f docker/docker-compose.agi.yml logs -f

# Stop all
docker compose -f docker/docker-compose.agi.yml down

# Stop + remove volumes (full reset)
docker compose -f docker/docker-compose.agi.yml down -v
```

---

## Troubleshooting

### Qdrant not reachable

```bash
curl http://localhost:6333/healthz
# Expected: {"title":"qdrant","version":"..."}
# If fails: docker compose -f docker/docker-compose.agi.yml up -d qdrant
```

### Langfuse 500 errors

```bash
# Check DB is up
docker compose -f docker/docker-compose.agi.yml ps
# Restart just langfuse
docker compose -f docker/docker-compose.agi.yml restart langfuse-server
```

### Mem0 embeddings fail

```bash
# Ensure OPENAI_API_KEY is set
echo $OPENAI_API_KEY
# Or route through Antigravity Proxy:
export OPENAI_BASE_URL=http://localhost:9191
```

### Aider self-heal skipped (overheating)

```bash
# Check M1 thermal state
node -e "const {isSafeToScan}=require('./apps/openclaw-worker/lib/m1-cooling-daemon'); console.log(isSafeToScan())"
# Wait for system to cool, or reduce background load
```

---

## Running Tests

```bash
# AGI integration tests only
python3 -m pytest tests/test_memory_qdrant.py tests/test_langfuse.py tests/test_aider_bridge.py -v

# Full suite (406+ tests, ~2.5 min)
python3 -m pytest

# With coverage
python3 -m pytest tests/test_memory_qdrant.py tests/test_langfuse.py --cov=packages
```
