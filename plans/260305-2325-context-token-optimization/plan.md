# Context Token Optimization Plan (5→10)

**Mục tiêu:** Giảm context token usage từ 5→10 điểm bằng modularization các file >200 lines.

---

## 📊 Analysis Summary

### File lớn cần modularize (>200 lines):

| File | Lines | Priority |
|------|-------|----------|
| `src/core/orchestrator.py` | 688 | 🔴 CRITICAL |
| `src/core/gateway/gateway_main.py` | 627 | 🔴 CRITICAL |
| `src/core/cross_session_intelligence.py` | 626 | 🔴 CRITICAL |
| `src/core/agi_loop.py` | 505 | 🟡 HIGH |
| `src/core/learning_tracker.py` | 504 | 🟡 HIGH |
| `src/core/verifier.py` | 465 | 🟡 HIGH |
| `src/core/decision_maker.py` | 451 | 🟡 HIGH |
| `src/core/planner.py` | 450 | 🟡 HIGH |
| `src/core/llm_client.py` | 445 | 🟡 HIGH |
| `src/core/prompt_cache.py` | 400 | 🟢 MEDIUM |

**Total:** 4,761 lines cần refactor → target ~150-200 lines/file

---

## 🎯 Modularization Strategy

### Phase 1: `orchestrator.py` (688 lines → 5 files)

**File mới:**
1. `src/core/orchestrator.py` (~150 lines) - Main class, delegate methods
2. `src/core/orchestrator/execution.py` (~200 lines) - Step execution logic
3. `src/core/orchestrator/verification.py` (~150 lines) - Verification logic
4. `src/core/orchestrator/rollback.py` (~150 lines) - Rollback handling
5. `src/core/orchestrator/reporting.py` (~100 lines) - Display report logic

### Phase 2: `gateway_main.py` (627 lines → 4 files)

### Phase 3: `cross_session_intelligence.py` (626 lines → 4 files)

### Phase 4: `agi_loop.py` + `learning_tracker.py` → Refactor vào `src/core/agi/`

### Phase 5: Core utils (`verifier.py`, `planner.py`, `llm_client.py`)

---

## ✅ Verification Criteria

1. **Build check:** `python3 -m pytest --collect-only` passes
2. **Test suite:** All 1311 tests passing
3. **File size:** All source files <200 lines
4. **Import check:** No circular dependencies
5. **Functionality:** `mekong cook` command works end-to-end

---

## 📝 Notes

- Giữ nguyên public API để không break existing code
- Dùng `__all__` exports rõ ràng
- Mỗi file mới có docstring đầy đủ
- Type hints cho tất cả functions
