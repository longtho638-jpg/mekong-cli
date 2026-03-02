# Mekong CLI v3.0.0 — Project Overview & PDR

**Version:** 3.0.0 (Open Source)
**Status:** Public MIT License
**Target:** Python 3.9+, PyPI distribution
**Repository:** https://github.com/yourusername/mekong-cli

## 1. Project Overview

Mekong CLI is an **open-source AI agent framework** that transforms high-level goals into executable automation pipelines. It implements the **Plan-Execute-Verify (PEV)** pattern with:

- Type-safe agents extending a common protocol
- Orchestration engine with DAG-based parallel execution
- Pluggable LLM providers (OpenAI, Gemini, offline models)
- Built-in credit/billing system for monetizing agent work (RaaS)
- Multi-tenant isolation for platform providers

### Core Problem Solved
Developers building AI-powered platforms need a framework that:
1. Safely decomposes goals into steps (avoids hallucinations)
2. Executes steps with rollback on failure (reliability)
3. Validates results against quality gates (safety)
4. Tracks credits/billing per task (monetization)

### Target Users
- **Developers** building autonomous agent systems
- **Platform creators** implementing RaaS (Revenue-as-a-Service)
- **Enterprises** deploying AI agents with audit trails and cost controls
- **Researchers** experimenting with agent orchestration patterns

### v3.0.0 Deliverables
- **Agent Protocol** — Type-safe interface for pluggable agents
- **DAG Scheduler** — Parallel task execution with dependency management
- **LLM Provider Abstraction** — Swap providers (OpenAI/Gemini/offline)
- **Credit System** — SQLite-backed multi-tenant billing
- **Python SDK** — Client library for submitting missions
- **FastAPI Server** — REST API with WebSocket streaming

## 2. Product Requirements (PDR)

### Functional Requirements (FR)

| ID | Requirement | Status |
|----|------------|--------|
| FR-AGENT-01 | Agents implement AgentProtocol (plan/execute/verify) | ✅ v3.0 |
| FR-SCHEDULE-01 | DAG scheduler executes steps in topological order | ✅ v3.0 |
| FR-SCHEDULE-02 | Parallel execution of independent steps | ✅ v3.0 |
| FR-PROVIDER-01 | Pluggable LLM providers with auto-failover | ✅ v3.0 |
| FR-PLUGIN-01 | Community plugins (PyPI + local ~/.mekong/plugins/) | ✅ v3.0 |
| FR-CREDIT-01 | Multi-tenant credit store (SQLite) | ✅ v3.0 |
| FR-BILLING-01 | Polar.sh webhook integration for payments | ✅ v3.0 |
| FR-SDK-01 | Python SDK for submitting missions | ✅ v3.0 |
| FR-ROLLBACK-01 | Automatic rollback on verification failure | ✅ v3.0 |

### Non-Functional Requirements (NFR)

| Area | Requirement | Target |
|------|------------|--------|
| Performance | Plan < 2s, Execute < 30s, Verify < 5s | Measured |
| Reliability | No silent task failures, clear error reporting | 99.5% |
| Type Safety | Zero `any` types in production code | 100% |
| Test Coverage | Unit + integration tests for all modules | >80% |
| Security | No secrets in code, input validation (Pydantic) | Verified |
| Scalability | Parallel agent execution, pluggable providers | Proven |

### Success Criteria

1. **Stability**: Zero silent task failures
2. **Adoption**: Community contributions on PyPI
3. **Quality**: All merged code passes type safety + tests
4. **Performance**: CLI startup < 1s, typical task execution < 1 min

## 3. Architecture Summary

| Component | Technology | Location | Purpose |
|-----------|-----------|----------|---------|
| **CLI** | Python 3.9+ / Typer / Rich | `src/main.py` | Command-line interface |
| **Core Engine** | Pydantic / Python | `src/core/` | PEV orchestration |
| **Agents** | AgentProtocol | `src/agents/` + plugins | Task executors |
| **Providers** | LLMProvider abstraction | `src/core/providers.py` | LLM backends |
| **Billing** | SQLite + Polar.sh | `src/raas/` | Credit system |
| **API Server** | FastAPI + WebSocket | `src/core/gateway.py` | REST + streaming |
| **Testing** | pytest | `tests/` | 62+ tests |
| **Package** | Poetry / PyPI | `pyproject.toml` | Distribution |

## 4. Key Features Breakdown

### PEV Pipeline (Plan-Execute-Verify)
Goal → Decomposed into steps with dependencies → Parallel execution → Quality validation → Credit deduction

### Agent System
Pluggable agents (Git, File, Shell) + community extensions via PyPI entry points or ~/.mekong/plugins/

### Credit Billing
Per-tenant credit ledger: simple tasks cost 1 credit, complex tasks cost 5+ credits

### DAG Execution
Dependency-aware scheduling: runs independent steps in parallel, waits on dependencies, cancels downstream on failure

## 5. Development Roadmap

| Version | Features | Timeline |
|---------|----------|----------|
| v3.0 (Current) | PEV engine, agents, DAG scheduler, credit billing | Shipped |
| v3.1 | Plugin marketplace, agent templates | Q2 2026 |
| v3.2 | Web dashboard (open-source), community recipes | Q3 2026 |
| v4.0 | Enterprise features: audit logs, RBAC, SLA tracking | Q4 2026 |

## 6. Licensing & Governance

- **License:** MIT
- **Governance:** Open source, community-driven
- **Contributing:** See CONTRIBUTING.md
- **Code of Conduct:** Included in repository
