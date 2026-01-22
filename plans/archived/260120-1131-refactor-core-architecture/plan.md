---
title: "10x Codebase Refactoring - Core Architecture"
description: "Comprehensive refactoring plan to eliminate technical debt, enforce 200-line limit, improve type safety, and prepare for go-live"
status: pending
priority: P0
effort: 16h
branch: refactor/core-architecture-10x
tags: [refactoring, architecture, technical-debt, vibe]
created: 2026-01-20
---

# 10x Codebase Refactoring - Core Architecture

> **Muc tieu:** Refactor `antigravity/` and `cli/` directories to eliminate technical debt, enforce strict adherence to `.claude/rules`, and achieve go-live readiness.

## Executive Summary

### Technical Debt Inventory

| Category | Count | Severity |
|----------|-------|----------|
| Files > 200 lines | 15+ | CRITICAL |
| Files using `Any` type | 20+ | HIGH |
| Duplicate `get_stats()` patterns | 20+ | MEDIUM |
| Inconsistent return types | 10+ | MEDIUM |
| Global singleton patterns | 5+ | LOW |

### Priority Files (By Line Count)

| File | Lines | Priority | Action |
|------|-------|----------|--------|
| `infrastructure/opentelemetry/tracer.py` | 599 | P0 | Split into 3 modules |
| `infrastructure/opentelemetry/processors.py` | 586 | P0 | Split into 3 modules |
| `infrastructure/opentelemetry/exporters.py` | 525 | P0 | Split into 3 modules |
| `core/ml/models.py` | 327 | P1 | Split by domain |
| `core/agent_swarm/engine.py` | 327 | P1 | Already modularized - verify |
| `infrastructure/scale.py` | 317 | P1 | Split into modules |
| `core/revenue/ai.py` | 314 | P1 | Extract strategies |
| `antigravity/cli/__init__.py` | 308 | P1 | Extract sub-modules |
| `core/registry.py` | 261 | P2 | Extract helpers |
| `core/control/analytics.py` | 257 | P2 | Extract reporters |
| `core/checkpointing.py` | 254 | P2 | Split save/restore |
| `cli/entrypoint.py` | 251 | P2 | Extract command groups |

## Execution Phases

- [ ] Phase 1: Infrastructure Layer (P0 - Critical)
- [ ] Phase 2: Core Engines (P1 - High)
- [ ] Phase 3: Type Safety (P1 - High)
- [ ] Phase 4: DRY Violations (P2 - Medium)
- [ ] Phase 5: CLI Layer (P2 - Medium)
- [ ] Phase 6: Testing & Verification (P0 - Required)
- [ ] Phase 7: Documentation & Delivery (P1 - Required)

## Dependencies

- All tests must pass before each phase commit
- Code review required after each phase
- No breaking changes to public APIs

## Success Criteria

1. All files <= 200 lines
2. Zero `Any` types in public APIs
3. 100% test pass rate
4. Type coverage > 90%
5. Adherence to YAGNI/KISS/DRY

## Related Files

- Phase details: See `phase-*.md` files
- Research: `./research/` (if needed)
- Reports: `./reports/` (after completion)
