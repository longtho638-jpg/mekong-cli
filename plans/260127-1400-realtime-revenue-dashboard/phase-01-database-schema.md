# Phase 1: Database Schema Updates

**Context Links:**
- [Main Plan](./plan.md)
- [Supabase Schema](../../supabase/migrations/)

## Overview
**Priority:** High
**Status:** Planned
**Description:** Enhance the existing database schema to support real-time revenue tracking and complex metric calculations (MRR, LTV, Churn).

## Key Insights
- We need to track subscription status changes history to calculate churn accurately.
- Real-time updates rely on Supabase Realtime, so we need to enable replication for relevant tables.
- Aggregating millions of payment records on the fly is slow; we need materialized views or summary tables for historical trends.

## Requirements
### Functional
- Track `mrr` and `arr` at the subscription level.
- Store historical revenue snapshots for trend analysis.
- Enable `supabase_realtime` publication for `payments` and `subscriptions`.

### Non-Functional
- efficient querying for dashboard load (indexes).
- Data integrity for financial records.

## Architecture
- **Tables:** `subscriptions`, `payments`, `revenue_snapshots` (new).
- **Views:** `revenue_stats_view` (for quick aggregation).
- **Triggers:** Update `revenue_snapshots` on new payments? Or use a scheduled job? (Scheduled job is safer for write throughput, but real-time requires triggers or client-side increment).

## Related Code Files
- `supabase/migrations/20260127_revenue_dashboard_schema.sql` (New)

## Implementation Steps
1.  **Create `revenue_snapshots` table:**
    - `date` (date, PK)
    - `total_revenue` (numeric)
    - `mrr` (numeric)
    - `active_subscribers` (int)
    - `churned_subscribers` (int)

2.  **Update `subscriptions` table:**
    - Ensure `amount` and `currency` columns exist and are correct types.
    - Add `mrr_amount` generated column (or managed by application) for easier summing.

3.  **Enable Realtime:**
    - `alter publication supabase_realtime add table payments;`
    - `alter publication supabase_realtime add table subscriptions;`

4.  **Create Indexes:**
    - `payments(created_at)` for trend queries.
    - `subscriptions(status, current_period_end)` for churn queries.

## Todo List
- [ ] Create migration file `supabase/migrations/20260127_revenue_dashboard_schema.sql`
- [ ] Define `revenue_snapshots` table
- [ ] Add indexes to `payments` and `subscriptions`
- [ ] Enable Realtime replication
- [ ] Apply migration locally

## Success Criteria
- `revenue_snapshots` table exists.
- Realtime events are received when a row is inserted into `payments`.
- Queries for "Last 30 days revenue" run in < 50ms.
