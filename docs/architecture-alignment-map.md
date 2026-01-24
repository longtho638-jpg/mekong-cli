# Architecture Alignment Map: .claude ↔ mekong-cli

**Date**: 2026-01-24
**Status**: Preliminary Mapping

This document maps the Agentic Infrastructure (`.claude/`) to the Core Business Logic (`mekong-cli/antigravity/core` & `cli/`). This alignment ensures that the AI agents operate on the same logic paths as the CLI application.

## 1. Workflows ↔ Core Engines

| .claude Workflow | mekong-cli Implementation | Description |
|------------------|---------------------------|-------------|
| `revenue-workflow.md` | `antigravity/core/revenue_engine.py`<br>`antigravity/core/money_maker.py` | Revenue tracking, pricing strategy, and financial optimization. |
| `deployment-workflow.md` | `antigravity/core/ops_engine.py`<br>`antigravity/core/infrastructure.py` | Deployment automation, infrastructure management. |
| `code-review-workflow.md` | `antigravity/core/code_guardian.py`<br>`antigravity/core/ez_pr.py` | Automated code review, PR management, and quality gates. |
| `kanban.md` | `antigravity/core/kanban/`<br>`antigravity/core/vibe_workflow.py` | Task management, project state, and Vibe workflow execution. |
| `testing-workflow.md` | `antigravity/core/code_guardian.py` | Test execution and verification strategies. |
| `crm-workflow.md` | `antigravity/core/client_magnet/`<br>`antigravity/core/sales_pipeline.py` | CRM, lead management, and sales pipeline logic. |

## 2. Skills ↔ Core Logic

| .claude Skill | mekong-cli Implementation | Description |
|---------------|---------------------------|-------------|
| `antibridge` | `antigravity/core/bridge.py` (assumed)<br>`antigravity/core/control.py` | Bridge between CLI and Mobile/External agents. |
| `payment-integration` | `antigravity/core/finance/`<br>`antigravity/core/pricing.py` | Payment gateway logic, pricing tiers. |
| `ai-multimodal` | `antigravity/core/ml/` | Machine learning facades and multimodal processing. |
| `mcp-management` | `antigravity/core/mcp_manager.py`<br>`antigravity/core/mcp_orchestrator.py` | Management of MCP servers and tool dispatching. |
| `copywriting` | `antigravity/core/content_factory/` | Content generation and copy optimization. |
| `research` | `antigravity/core/scout/`<br>`antigravity/core/knowledge/` | Codebase exploration and knowledge retrieval. |
| `code-review` | `antigravity/core/code_guardian.py` | Static analysis and code quality checks. |

## 3. Commands ↔ CLI Commands

| .claude Command | mekong-cli Command | Implementation Path |
|-----------------|--------------------|---------------------|
| `/revenue` | `mekong revenue` | `cli/commands/revenue.py` (implied) |
| `/scout` | `mekong scout` | `antigravity/core/scout/` |
| `/deploy` | `mekong deploy` | `cli/commands/deploy.py` (implied) |
| `/test` | `mekong test` | `cli/commands/test.py` (implied) |
| `/plan` | `mekong plan` | `antigravity/core/vibe_orchestrator.py` |
| `/start` | `mekong start` | `cli/entrypoint.py` |
| `/onboard` | `mekong onboard` | `cli/onboard.py` |

## 4. Hooks ↔ Lifecycle Events

| .claude Hook | mekong-cli Lifecycle | Description |
|--------------|----------------------|-------------|
| `privacy-block.cjs` | `antigravity/core/hook_executor.py` | Pre-execution checks for privacy/security. |
| `model-router.cjs` | `antigravity/core/command_router.py` | Routing requests to appropriate models/agents. |
| `session-init.cjs` | `antigravity/core/agency_dna.py` | Session initialization and context loading. |
| `win-win-win-gate.cjs` | `antigravity/core/moat_engine.py` | Strategic alignment verification. |

## 5. Gaps & Refactoring Candidates

- **Hardcoded Values**: Check `antigravity/core/config.py` vs `.claude/config/` to ensure single source of truth.
- **Duplication**: `antigravity/core/agent_swarm.py` seems to duplicate some `claude-flow` functionality. Review for consolidation.
- **Orchestration**: `antigravity/core/agent_orchestrator.py` needs to align with `claude-flow` protocols.
