# Mekong CLI v5.0 — Architecture Document
**Date:** 2026-03-11 | **Scope:** PEV Engine + DAG + 5-Layer Cascade + RaaS

---

## 1. Overview

Mekong CLI is a Python-based RaaS (Recipe-as-a-Service) Agency Operating System. It wraps LLM inference behind a Plan-Execute-Verify (PEV) engine, exposes CLI commands mapped to business workflows, and offers an HTTP gateway for remote orchestration.

---

## 2. PEV Engine (`src/core/`)

The core execution model: every user goal flows through 3 phases.

```
User Goal
   │
   ▼
┌──────────────────┐
│  PLAN            │  RecipePlanner → Recipe (steps[])
│  src/core/       │  LLM or deterministic fallback
│  planner.py      │  NLU classification (IntentClassifier)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  EXECUTE         │  RecipeExecutor → StepResult[]
│  executor.py     │  Shell / LLM / API / MCP dispatch
│  orchestrator.py │  DAG step ordering, parallel branches
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  VERIFY          │  OutputVerifier → VerificationResult
│  verifier.py     │  Binh Pháp checks (type safety, no TODOs)
│                  │  Rollback on failure
└──────────────────┘
```

**Key types:**
- `Recipe` — name, description, steps[], tags
- `RecipeStep` — order, title, description, command, agent, depends_on[]
- `OrchestrationResult` — status, step_results[], errors, success_rate
- `OrchestrationStatus` — SUCCESS | PARTIAL | FAILED

---

## 3. DAG Step Execution

Steps support `depends_on: []` forming a directed acyclic graph. The orchestrator resolves execution order and enables parallel branches when dependencies allow.

```
Step 1 (setup)
   ├── Step 2a (lint)     ┐
   ├── Step 2b (test)     ├── parallel fan-out
   └── Step 2c (build)    ┘
          │
          ▼
       Step 3 (deploy)   — waits for 2a+2b+2c
```

Implementation: `src/core/orchestrator.py` (~1022 lines — tech debt candidate).

---

## 4. 5-Layer Command Cascade

Commands are organized in 5 business layers, each mapping to a domain:

| Layer | Prefix | Domain | Example Commands |
|-------|--------|--------|-----------------|
| 1 Founder | annual/okr/swot | Strategy | `annual`, `fundraise`, `pitch` |
| 2 Business | sales/marketing | Operations | `sales`, `finance`, `hr` |
| 3 Product | plan/sprint | Roadmap | `plan`, `sprint`, `scope` |
| 4 Engineer | cook/fix/code | Execution | `cook`, `review`, `deploy` |
| 5 Ops | audit/health | Monitoring | `audit`, `health`, `security` |

Total: **289 commands** across 5 layers.

Registration flow:
```
app = typer.Typer()
register_all_commands(app)       # src/cli/commands_registry.py
register_legacy_commands(app)    # src/cli/command_registry_legacy.py
register_core_commands(app)      # src/cli/core_commands.py
register_start_command(app)      # src/cli/start_command.py
register_trace_command(app)      # src/cli/trace_command.py
```

---

## 5. RaaS Gateway Architecture

The HTTP gateway (`src/gateway.py`) exposes the PEV engine via REST:

```
POST /cmd
  Authorization: Bearer $MEKONG_API_TOKEN
  Body: { "goal": "...", "strict": true }
  → OrchestrationResult (JSON)

GET  /health         → { "status": "ok" }
GET  /presets        → PRESET_ACTIONS[]
POST /cmd/preset     → execute preset action
GET  /status         → AGI subsystem health
GET  /memory         → recent execution history
POST /swarm/dispatch → remote node dispatch
GET  /metrics        → Prometheus-compatible metrics
```

Auth: bearer token via `MEKONG_API_TOKEN` env var. HTTP 402 on zero MCU balance.

MCU billing: 1 credit per successful mission. Deducted after verification pass.

---

## 6. AGI v2 Subsystems (9 total)

| Subsystem | Module | Purpose |
|-----------|--------|---------|
| NLU | `src/core/nlu.py` | Intent classification |
| Memory | `src/core/memory.py` | Execution history |
| Reflection | `src/core/reflection.py` | Post-execution learning |
| World Model | `src/core/world_model.py` | State + side-effect prediction |
| Tool Registry | `src/core/tool_registry.py` | Dynamic tool discovery |
| Browser Agent | `src/core/browser_agent.py` | HTTP/page analysis |
| Collaboration | `src/core/collaboration.py` | Multi-agent review/debate |
| Code Evolution | `src/core/code_evolution.py` | Self-improvement analysis |
| Vector Memory | `src/core/vector_memory_store.py` | Semantic search over history |

Consciousness Score (0-100) aggregates all 9 subsystem health metrics.

---

## 7. LLM Router

Universal 3-variable config, any provider:

```bash
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_API_KEY=sk-or-v1-...
LLM_MODEL=anthropic/claude-sonnet-4
```

Fallback chain: OpenRouter → DashScope → DeepSeek → Anthropic → OpenAI → Google → Ollama → OfflineProvider (deterministic templates).

---

## 8. Key Architectural Concerns

- `src/main.py` at 1898 lines violates 200-line rule — refactor in progress
- `src/core/orchestrator.py` at 1022 lines — split candidate
- Coverage at 19-26% — low for mission-critical PEV engine
- Silent `except Exception: pass` blocks in AGI dashboard (intentional degradation)
