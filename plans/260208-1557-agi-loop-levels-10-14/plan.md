---
title: "AGI Loop Levels 10-14"
description: "Implement Memory, NLU, Telegram, Self-Evolution, and AGI Certification to reach v1.0.0"
status: pending
priority: P1
effort: 5h
branch: master
tags: [agi, core, levels-10-14, v1.0.0]
created: 2026-02-08
---

# AGI Loop Levels 10-14 Implementation Plan

## Goal
Evolve Mekong CLI from v0.6.0 (L9 Scheduler) to v1.0.0 (L14 AGI Certification).
Add memory, NLU, Telegram, self-evolution, and autonomous loop with governance.

## Current State
- **Version:** v0.6.0, 215 tests, ~4k LOC core
- **Stack:** Python 3.9.6, Typer+Rich CLI, FastAPI gateway, EventBus singleton
- **Patterns:** dataclass models, `__all__` exports, unittest.TestCase, YAML persistence

## Phases

| # | Level | Name | Version | New Tests | Files | Status |
|---|-------|------|---------|-----------|-------|--------|
| 1 | L10 | [Memory & Learning](phase-01-memory-and-learning-l10.md) | v0.7.0 | 20+ | 4 | pending |
| 2 | L11 | [NLU Brain](phase-02-nlu-brain-l11.md) | v0.8.0 | 25+ | 4 | pending |
| 3 | L12 | [Telegram Commander](phase-03-telegram-commander-l12.md) | v0.9.0 | 25+ | 4 | pending |
| 4 | L13 | [Self-Evolution](phase-04-self-evolution-l13.md) | v0.10.0 | 25+ | 4 | pending |
| 5 | L14 | [AGI Certification](phase-05-agi-certification-l14.md) | v1.0.0 | 40+ | 4 | pending |

## Execution Order
Strictly sequential: L10 -> L11 -> L12 -> L13 -> L14.
Each level: implement -> test -> commit -> push.

## Dependencies
- L11 depends on L10 (NLU uses MemoryStore for smart routing)
- L12 depends on L11 (Telegram uses NLU to parse commands)
- L13 depends on L10+L11 (Self-Evolution uses memory + NLU patterns)
- L14 depends on ALL prior levels (orchestrates full loop)

## Key Constraints
- Max 200 lines per file
- Type hints on all functions
- Docstrings on all classes/public methods
- unittest.TestCase pattern, `test_*.py` naming
- YAML persistence in `.mekong/`
- EventBus integration for all new events
- `__all__` exports in every module

## Verification
After each level: `python3 -m pytest tests/ -v --tb=short`
Final target: 350+ tests for v1.0.0
