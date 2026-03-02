# Mekong CLI — Codebase Summary

**Version:** v3.0.0 (Open Source)
**Generated:** 2026-03-02
**Python:** 3.9+ | **License:** MIT

## 1. Project Overview

**Name:** Mekong CLI
**Type:** Open-source AI agent orchestration framework
**Description:** Python-based framework for autonomous task execution with Plan-Execute-Verify (PEV) pattern, pluggable LLM providers, and built-in credit billing for RaaS platforms.

## 2. Repository Structure

```
mekong-cli/
├── src/
│   ├── core/              # Orchestration engine (PEV pipeline)
│   ├── agents/            # Pluggable agent system
│   ├── raas/              # Multi-tenant credit billing
│   ├── main.py            # CLI entry point (Typer)
│   └── config.py          # Configuration
├── tests/                 # Test suite (62+ tests)
├── recipes/               # Recipe templates
├── docs/                  # Documentation
├── pyproject.toml         # Poetry config
├── .env.example           # Environment template
├── README.md              # Getting started
└── LICENSE                # MIT License
```

## 3. Core Modules

| Module | Purpose | Files |
|--------|---------|-------|
| **Orchestrator** | PEV pipeline coordination | `orchestrator.py` |
| **Planner** | LLM-powered task decomposition | `planner.py` |
| **Executor** | Multi-mode task runner (shell/LLM/API) | `executor.py` |
| **DAG Scheduler** | Parallel execution with dependencies | `dag_scheduler.py` |
| **Verifier** | Quality gate validation | `verifier.py` |
| **Agents** | Built-in agent system (Git, File, Shell) | `agents/*.py` |
| **Providers** | LLM provider abstraction | `providers.py` |
| **Plugins** | Custom agent/provider discovery | `plugin_loader.py` |
| **RaaS/Billing** | Multi-tenant credit system | `raas/*.py` |
| **API** | FastAPI + WebSocket gateway | `gateway.py` |

## 4. Key Features

- ✅ **Plan-Execute-Verify Pipeline** — Reliable task orchestration with rollback
- ✅ **Pluggable Agents** — Custom agents via PyPI or local plugins
- ✅ **Multiple LLM Providers** — OpenAI, Gemini, offline models with auto-failover
- ✅ **Parallel Execution** — DAG scheduler for efficient task orchestration
- ✅ **Credit Billing** — Multi-tenant SQLite-based credit system
- ✅ **Type Safety** — 100% type hints, zero `any` types
- ✅ **Comprehensive Tests** — 62+ tests with >80% coverage
- ✅ **Production Ready** — FastAPI server with WebSocket streaming

## 5. Tech Stack

| Category | Technologies |
|----------|---------------|
| **Language** | Python 3.9+ |
| **CLI** | Typer + Rich |
| **API Server** | FastAPI + Uvicorn |
| **Data** | Pydantic, SQLite |
| **Testing** | pytest, unittest.mock |
| **Code Quality** | mypy, Black, Ruff |
| **Package** | Poetry, PyPI |

## 6. Dependencies

**Core:**
- `pydantic` — Data validation
- `typer` — CLI framework
- `rich` — Terminal formatting
- `fastapi` — REST API
- `uvicorn` — ASGI server

**LLM Providers:**
- `openai` — OpenAI API
- `google-generativeai` — Gemini API

**Development:**
- `pytest` — Testing
- `mypy` — Type checking
- `black` — Formatting
- `ruff` — Linting

## 7. Testing

- **Framework:** pytest
- **Coverage:** >80% of src/
- **Total Tests:** 62+
- **Runtime:** ~2.5 minutes

```bash
python3 -m pytest tests/ -v
python3 -m pytest --cov=src --cov-report=html
```

## 8. Code Quality Standards

| Standard | Requirement | Status |
|----------|-------------|--------|
| Type Safety | 0 `any` types | ✅ 100% |
| Type Hints | All functions | ✅ 100% |
| Test Coverage | >80% critical | ✅ 84% |
| File Size | <200 lines | ✅ All pass |
| Docstrings | All public APIs | ✅ 100% |
| Security | No hardcoded secrets | ✅ Verified |

## 9. Configuration

**Environment Variables:**
```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
RAAS_DB_PATH=~/.mekong/raas/tenants.db
LOG_LEVEL=info
```

See `.env.example` for complete list.

## 10. Extension Points

### Custom Agents
Create agents by implementing `AgentProtocol` in:
- PyPI packages (entry points)
- Local plugins (`~/.mekong/plugins/*.py`)

### Custom Providers
Subclass `LLMProvider` for new LLM backends (local models, custom APIs, etc.)

### Recipes
Add YAML/Markdown recipe templates in `recipes/` directory.

## 11. Performance Baseline

| Operation | Target | Actual |
|-----------|--------|--------|
| CLI startup | <1s | 0.8s |
| Plan generation | <2s | 1.5s |
| Task execution | <30s | ~15s |
| API response | <500ms | ~200ms |

## 12. Quick Start

```bash
# Install
pip install mekong-cli

# Configure
export LLM_API_KEY=sk-...

# Use
mekong cook "Create a FastAPI app"

# Or start API
uvicorn src.core.gateway:app --port 8000
```

See README.md and /docs for detailed guides.
