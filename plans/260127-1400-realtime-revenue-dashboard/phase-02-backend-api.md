# Phase 2: Backend API Endpoints

**Context Links:**
- [Main Plan](./plan.md)
- [Revenue Router](../../backend/api/routers/revenue.py)
- [Revenue Engine](../../antigravity/core/revenue/engine.py)

## Overview
**Priority:** High
**Status:** Planned
**Description:** Implement the actual logic for calculating revenue metrics in the backend, replacing static mock data.

## Key Insights
- Calculations should be idempotent and cacheable where possible.
- `RevenueEngine` needs to act as the single source of truth for financial math.

## Requirements
### Functional
- `GET /api/revenue/stats`: Return current MRR, ARR, LTV, Churn Rate.
- `GET /api/revenue/trend`: Return historical data for charts.
- `GET /api/revenue/transactions`: Return recent payments with pagination.

### Non-Functional
- Response time < 200ms for dashboard APIs.
- Proper error handling for database connection issues.

## Architecture
- **Service:** `RevenueEngine` class in Python.
- **Router:** FastAPI router in `backend/api/routers/revenue.py`.
- **Database:** Direct SQL queries via Supabase client or SQLAlchemy (prefer Supabase client for consistency with Auth).

## Related Code Files
- `backend/api/routers/revenue.py`
- `antigravity/core/revenue/engine.py` (or create if missing/move from `backend/services/revenue_service.py`)
- `backend/services/payment_service.py` (for reference)

## Implementation Steps
1.  **Refactor `RevenueEngine`:**
    - Connect to `payments` and `subscriptions` tables.
    - Implement `calculate_mrr()`: Sum of active subscription amounts.
    - Implement `calculate_churn()`: (Cancelled subs last 30 days / Active subs 30 days ago).
    - Implement `calculate_ltv()`: ARPU / Churn Rate.

2.  **Update API Router:**
    - Connect `GET /dashboard` to `RevenueEngine.get_stats()`.
    - Connect `GET /by-period` to `RevenueEngine.get_trend(period)`.

3.  **Add Transaction List:**
    - Implement `GET /transactions` endpoint returning `payments` ordered by `created_at` desc.

## Todo List
- [ ] Implement `RevenueEngine` class methods
- [ ] Update `backend/api/routers/revenue.py`
- [ ] Verify calculations against test data

## Success Criteria
- API returns accurate data reflecting the database state.
- MRR/ARR calculations match manual sum of active subscriptions.
