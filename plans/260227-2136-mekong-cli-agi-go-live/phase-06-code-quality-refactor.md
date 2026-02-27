---
phase: 2
title: "Code Quality & Refactor"
status: pending
priority: P1
effort: 4h
depends_on: [phase-01]
---

# Phase 2: Code Quality & Refactor

## Context Links

- Research: [CLI Engine Readiness](research/researcher-01-cli-engine-readiness.md)
- Rules: development-rules.md (200 LOC limit), binh-phap-quality.md (6 fronts)

## Overview

Refactor 3 files vượt 200 LOC limit + cleanup tech debt (console.log, TODO, @ts-ignore). Tuân thủ 6 Quality Fronts của Binh Pháp.

## Key Insights

- 3 files vi phạm nặng: `gateway.py` (748), `telegram_bot.py` (742), `orchestrator.py` (547)
- Python codebase → focus `any` type trong type hints, không phải TS `any`
- Đây là post-blocker work — không cần hoàn thành trước go-live nhưng cần cho maintainability

## Requirements

### Functional
- Mỗi file ≤ 200 LOC sau refactor
- Không break existing imports/functionality
- Tất cả tests vẫn pass sau refactor

### Non-functional
- Module boundaries rõ ràng
- Mỗi module single responsibility

## Related Code Files

### Cần refactor
- `src/core/gateway.py` (748 LOC) → split thành 4+ modules
- `src/core/telegram_bot.py` (742 LOC) → split thành 4+ modules
- `src/core/orchestrator.py` (547 LOC) → split thành 3+ modules

### Cần cleanup
- `src/core/*.py` — grep console/print statements
- `src/agents/*.py` — type hint audit
- `tests/*.py` — grep TODO/FIXME

## Architecture

### gateway.py Split Plan

```
src/core/gateway.py (748 LOC) →
├── gateway.py          # FastAPI app init, middleware (≤100 LOC)
├── gateway_routes.py   # Route handlers (≤200 LOC)
├── gateway_auth.py     # Auth middleware, token validation (≤150 LOC)
└── gateway_models.py   # Pydantic request/response models (≤150 LOC)
```

### telegram_bot.py Split Plan

```
src/core/telegram_bot.py (742 LOC) →
├── telegram_bot.py         # Bot init, webhook handler (≤100 LOC)
├── telegram_handlers.py    # Command handlers (≤200 LOC)
├── telegram_keyboards.py   # Inline keyboards (≤150 LOC)
└── telegram_utils.py       # Formatting, parsing (≤150 LOC)
```

### orchestrator.py Split Plan

```
src/core/orchestrator.py (547 LOC) →
├── orchestrator.py          # RecipeOrchestrator class (≤200 LOC)
├── orchestrator_rollback.py # Rollback + recovery logic (≤150 LOC)
└── orchestrator_hooks.py    # Pre/post hooks, event emit (≤150 LOC)
```

## Implementation Steps

### 1. Refactor gateway.py (1.5h)

1. Đọc gateway.py, identify logical boundaries
2. Extract route handlers → `gateway_routes.py`
3. Extract auth logic → `gateway_auth.py`
4. Extract Pydantic models → `gateway_models.py`
5. Update imports trong gateway.py
6. Run: `python3 -m pytest tests/test_gateway.py -v`

### 2. Refactor telegram_bot.py (1.5h)

1. Extract command handlers → `telegram_handlers.py`
2. Extract keyboards → `telegram_keyboards.py`
3. Extract utils → `telegram_utils.py`
4. Run: `python3 -m pytest tests/test_telegram_bot.py -v`

### 3. Refactor orchestrator.py (45min)

1. Extract rollback logic → `orchestrator_rollback.py`
2. Extract hooks → `orchestrator_hooks.py`
3. Run: `python3 -m pytest tests/test_orchestrator_integration.py -v`

### 4. Tech Debt Cleanup (15min)

```bash
# Quality Front checks (Binh Pháp)
grep -rn "print(" src/core/ src/agents/ --include="*.py" | grep -v "def\|#"
grep -rn "TODO\|FIXME" src/ tests/
grep -rn "type: ignore" src/ --include="*.py"
```

Fix findings hoặc document cho backlog.

## Todo List

- [ ] Split `gateway.py` → 4 modules, each ≤200 LOC
- [ ] Split `telegram_bot.py` → 4 modules, each ≤200 LOC
- [ ] Split `orchestrator.py` → 3 modules, each ≤200 LOC
- [ ] Remove stray `print()` statements
- [ ] Resolve TODO/FIXME hoặc convert thành issues
- [ ] Full test suite pass after refactor

## Success Criteria

- `wc -l src/core/*.py` → mọi file ≤ 200 LOC
- `python3 -m pytest tests/ -v` → 0 FAILED
- `grep -rn "print(" src/core/ | wc -l` → giảm ≥50%

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Import circular dependency sau split | Code crash | Careful dependency ordering, use `__init__.py` re-exports |
| External code depends on old import paths | Break consumers | Keep gateway.py as facade, re-export from sub-modules |
| Test fixtures assume monolith structure | Tests fail | Update test imports cùng lúc refactor |

## Security Considerations

- Không expose internal helper functions trong public modules
- Auth logic tách riêng → dễ audit hơn

## Next Steps

→ Phase 5 (Docs) — update architecture docs với module structure mới
