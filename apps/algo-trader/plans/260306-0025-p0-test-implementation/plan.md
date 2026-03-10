# P0 Critical Tests Implementation Plan

**Date:** 2026-03-06
**Goal:** Implement ~40 P0 tests for trading logic safety

---

## Dependency Graph

```
SignalFilter Tests ← signal-market-regime-detector tests
                         ↓
RiskManager Advanced Tests (independent)
```

---

## Parallel Execution Phases

### Phase 1: SignalFilter & Regime Detector (Owner: developer-1)
**File:** `phase-01-signal-filter-tests.md`
**Output:** `tests/core/SignalFilter.test.ts`
**Tests:** 20-25 tests
- Regime detection scenarios
- Signal scoring (4 components)
- Cooldown logic
- Volume confirmation
- Reject reasons

### Phase 2: RiskManager Advanced (Owner: developer-2)
**File:** `phase-02-risk-manager-advanced-tests.md`
**Output:** `tests/core/RiskManager-advanced.test.ts`
**Tests:** 10-12 tests
- calculateDynamicPositionSize()
- calculateAtrStopLoss()
- checkDrawdownLimit()
- calculateRiskAdjustedMetrics()
- calculateDynamicRiskParams()

### Phase 3: Integration & Verification (Owner: tester)
**File:** `phase-03-integration-verification.md`
**Tests:** Run full suite, verify coverage
- `npm test` - all tests pass
- Coverage report generation

---

## Environment Info

```
CWD: /Users/macbookprom1/mekong-cli/apps/algo-trader
Node: $(node -v)
NPM: $(npm -v)
Test Command: npm test
```

---

## Success Criteria

1. ✅ All new tests pass
2. ✅ No TypeScript errors
3. ✅ Coverage increases from 67% → ~75%
4. ✅ No flaky tests
