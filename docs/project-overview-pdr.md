# Mekong CLI v3.0.0 — Project Overview & PDR

**Version:** 3.0.0 (AGI Vibe Coding Factory)
**Status:** Open Source (MIT License)
**Target:** Python 3.9+, PyPI distribution

## 1. Project Overview

**Mekong CLI** is an AGI Vibe Coding Factory framework transforming service-based agencies into outcome-driven automation engines. Enables developers to:

- Build type-safe AI agents implementing `plan → execute → verify`
- Orchestrate parallel task execution via DAG scheduling
- Plug in custom LLM providers (Gemini, OpenAI, Ollama, offline)
- Create shareable recipes (automation templates)
- Deploy autonomous daemons for 24/7 processing

### Philosophy
> "We don't sell tools. We sell Outcomes."

### v3.0.0 Features
- **Phase 1**: Type-safe AgentProtocol + AgentRegistry
- **Phase 2**: Parallel DAG execution (ThreadPoolExecutor)
- **Phase 3**: Pluggable LLM provider abstraction (auto-failover)
- **Phase 4**: Autonomous daemon (watcher → classifier → executor → gate → DLQ)
- **Phase 5**: Community plugins (PyPI + ~/.mekong/plugins/)
- **Phase 6**: PyPI package shim (`import mekong` works)

## 2. Product Requirements (PDR)

### Functional Requirements

**FR-AGENT-01**: Agents implement AgentProtocol
- `name` property identifies agent
- `plan(input: str) → Task[]` decomposes goals
- `execute(task: Task) → Result` executes atomic tasks
- `verify(result: Result) → bool` validates output

**FR-SCHEDULE-01**: DAG scheduler executes steps in topological order
- Identifies ready steps (dependencies satisfied)
- Runs independent steps in parallel (ThreadPoolExecutor)
- Cancels downstream on failure (transitive)

**FR-PROVIDER-01**: LLMProvider abstraction supports pluggable backends
- Built-in: GeminiProvider, OpenAICompatibleProvider, OfflineProvider
- Custom providers subclass LLMProvider
- Circuit-breaker failover on quota/error

**FR-PLUGIN-01**: Plugin system discovers agents + providers
- Entry points for PyPI packages (`mekong.agents`, `mekong.providers`)
- Local plugins in `~/.mekong/plugins/*.py`
- Plugin failures logged (never crash CLI)

**FR-DAEMON-01**: Autonomous daemon processes tasks 24/7
- Watcher monitors task directory
- Classifier pre-routes to agents
- Executor runs task → Verifier validates → Journal logs
- Failed tasks in DLQ (operator review)

### Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Performance** | Plan < 2s, Execute < 30s per task, Verify < 5s |
| **Reliability** | No task data loss, graceful provider failover |
| **Scalability** | Parallel agent execution, pluggable providers |
| **Maintainability** | Zero `any` types, >80% test coverage, documented code |
| **Security** | No secrets in code, input validation (Pydantic), type-safe |

## 3. Architecture Summary

| Component | Tech | Location |
|-----------|------|----------|
| **CLI** | Python 3.9+ / Typer | `src/main.py` |
| **Engine** | Python / Pydantic | `src/core/` |
| **Agents** | AgentProtocol | `src/agents/` + plugins |
| **Providers** | LLMProvider | `src/core/providers.py` |
| **Daemon** | Python threading | `src/daemon/` |
| **Testing** | pytest | `tests/` |
| **Package** | Poetry / PyPI | `mekong/` shim + `src/` impl |

## 4. Success Metrics

- **Stability**: Zero silent task failures, clear error reporting
- **Adoption**: Community contributions (plugins on PyPI)
- **Quality**: All merged code passes type safety + tests
- **Performance**: CLI startup < 1s, recipe execution < 1min for typical workflows
