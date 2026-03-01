---
title: "AGI Vibe Coding Factory — Open Source Transformation"
description: "Transform mekong-cli into a public PyPI-publishable AGI framework with pluggable agents, DAG execution, and autonomous daemon"
status: completed
priority: P1
effort: 40h
branch: master
tags: [agi, open-source, refactor, pypi, agents, daemon]
created: 2026-03-01
---

# AGI Vibe Coding Factory — Master Plan

## Vision
Transform mekong-cli from internal tooling into a public open-source **Vibe Coding Factory** — a Python AGI framework built on Plan-Execute-Verify (PEV) pattern with pluggable LLM providers, DAG-based parallel execution, and autonomous daemon capabilities.

## Phase Overview

| # | Phase | Priority | Effort | Status | Depends On |
|---|-------|----------|--------|--------|------------|
| 1 | Agent Protocol Redesign | P1 | 4h | ✅ done | — |
| 2 | DAG Parallel Execution | P1 | 8h | ✅ done | Phase 1 |
| 3 | Provider Abstraction | P1 | 4h | ✅ done | — |
| 4 | Daemon Generalization | P2 | 8h | ✅ done | Phase 1, 3 |
| 5 | Plugin System | P2 | 4h | ✅ done | Phase 1 |
| 6 | Package Restructure | P1 | 6h | ✅ done | Phase 1-5 |
| 7 | Docs & Examples | P2 | 6h | ✅ done | Phase 6 |

## Dependency Graph
```
Phase 1 (Agent Protocol) ──┬──→ Phase 2 (DAG Execution)
                           ├──→ Phase 4 (Daemon) ←── Phase 3 (Providers)
                           └──→ Phase 5 (Plugins)
Phase 3 (Providers) ───────────→ Phase 4 (Daemon)
All Phases ─────────────────────→ Phase 6 (Package) ──→ Phase 7 (Docs)
```

## Critical Constraints
- Python 3.9+ (system python macOS)
- 62 existing tests must pass throughout
- `mekong cook` backward compatible
- Files < 200 lines each
- YAGNI/KISS/DRY

## Key Architecture Decision
Keep `src/` → `mekong/` rename as LAST step (Phase 6) to avoid breaking tests mid-refactor. All protocol/DAG/plugin work happens on current `src/` structure first.

## Research Reports
- [Core Engine Analysis](../reports/researcher-260301-2010-core-engine-analysis.md)
- [OpenClaw Architecture](../reports/researcher-260301-2010-openclaw-architecture-analysis.md)

## Success Criteria
- [ ] `pip install mekong-cli` works from PyPI
- [ ] `mekong cook "hello world"` runs end-to-end
- [ ] Custom agent registerable via entry_points
- [ ] Parallel recipe steps execute concurrently
- [ ] No Antigravity/Binh Phap hardcoding in public code
- [ ] Autonomous daemon configurable via YAML
- [ ] 80%+ test coverage maintained
