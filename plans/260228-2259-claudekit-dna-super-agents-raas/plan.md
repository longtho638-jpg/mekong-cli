---
title: "ClaudeKit DNA -> Super Agents Marketplace cho Mekong CLI + AgencyOS RaaS"
description: "Xay dung he thong Super Agents marketplace dua tren ClaudeKit DNA, mo hinh Department/Role/Task, execution-based RaaS"
status: pending
priority: P1
effort: 32h
branch: master
tags: [agents, marketplace, raas, claudekit, dna]
created: 2026-02-28
---

# ClaudeKit DNA -> Super Agents Marketplace

## Tong Quan

Xay dung Agent Marketplace/Registry cho phep:
- **Dinh nghia** Super Agents theo chuan DNA (skills + commands + guardrails)
- **To chuc** theo Department/Role/Task (nhu AIforWork nhung EXECUTABLE)
- **Tao moi** agents tu skill atoms bang Agent Factory
- **Thuc thi** pay-per-execution qua RaaS layer
- **Phan phoi** open-source cho cong dong

## Nguyen Tac Thiet Ke

- YAGNI: v0.1 chi can agent manifest + registry + CLI commands
- KISS: Dung Python (AgentBase pattern da co) + YAML manifest
- DRY: Tai su dung ClaudeKit SKILL.md pattern, khong phat minh format moi

## Phases

| # | Phase | Trang Thai | Effort | File |
|---|-------|-----------|--------|------|
| 1 | Agent DNA Standard | pending | 8h | [phase-01](./phase-01-agent-dna-standard.md) |
| 2 | Agent Registry & CLI | pending | 8h | [phase-02](./phase-02-agent-registry-cli.md) |
| 3 | Agent Factory | pending | 8h | [phase-03](./phase-03-agent-factory.md) |
| 4 | RaaS Execution Layer | pending | 5h | [phase-04](./phase-04-raas-execution-layer.md) |
| 5 | Open Source Distribution | pending | 3h | [phase-05](./phase-05-open-source-distribution.md) |

## Phu Thuoc Chinh

- Phase 1 (DNA Standard) -> Phase 2 (Registry) -> Phase 3 (Factory)
- Phase 1 + 2 -> Phase 4 (RaaS)
- Phase 1 + 2 + 3 -> Phase 5 (Distribution)

## Code Da Co (Leverage)

| Component | Path | Tai Su Dung |
|-----------|------|-------------|
| AgentBase | `src/core/agent_base.py` | Base class cho Super Agents |
| AGENT_REGISTRY | `src/agents/__init__.py` | Mo rong thanh marketplace registry |
| RecipeRegistry | `src/core/registry.py` | Pattern cho agent discovery |
| load_agents_dynamic() | `src/core/registry.py` | Dynamic agent loading |
| packages/agents/ | `packages/agents/` | 18 hubs + 41 mekongAgents + 34 ops |
| ClaudeKit Skills | `.claude/skills/` | 271 skill atoms |

## Rui Ro

1. Scope creep: RaaS billing/auth phuc tap -> giu v0.1 chi local execution
2. License: Kiem tra vibeship-spawner-skills cho phep commercial resale khong
3. Agent quality: Can test framework rieng -> Phase 3 giai quyet
