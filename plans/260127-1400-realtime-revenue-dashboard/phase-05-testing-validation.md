# Phase 5: Testing & Validation

**Context Links:**
- [Main Plan](./plan.md)

## Overview
**Priority:** High
**Status:** Planned
**Description:** Verify accuracy of financial data and stability of real-time features.

## Key Insights
- Financial data must be accurate; off-by-one errors in dates or rounding errors in currency are unacceptable.

## Requirements
### Functional
- Backend unit tests for `RevenueEngine`.
- Frontend integration tests (can use Playwright or manual verify).

## Architecture
- **Pytest:** Backend testing.
- **Manual QA:** Dashboard verification.

## Related Code Files
- `backend/tests/unit/test_revenue_engine.py`

## Implementation Steps
1.  **Backend Tests:**
    - Test MRR calculation with mixed currency (mocking exchange rates if needed, or assume USD).
    - Test Churn calculation with known set of active/cancelled subs.

2.  **Manual Verification:**
    - Create a test subscription.
    - Verify MRR increases.
    - Cancel subscription.
    - Verify Churn updates (might need to manipulate dates to trigger churn logic).
    - Process a payment.
    - Verify Real-time update on dashboard.

## Todo List
- [ ] Write `test_revenue_engine.py`
- [ ] Perform End-to-End manual test
- [ ] Document any known limitations

## Success Criteria
- All backend tests pass.
- Dashboard reflects reality in end-to-end test scenario.
