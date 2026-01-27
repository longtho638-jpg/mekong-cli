# Phase 4: Real-time Subscriptions

**Context Links:**
- [Main Plan](./plan.md)

## Overview
**Priority:** Medium
**Status:** Planned
**Description:** Connect the frontend to Supabase Realtime to receive instant updates when new payments occur, updating the UI without a refresh.

## Key Insights
- We only need to listen for `INSERT` on `payments` to update the total revenue and transaction list.
- For MRR/Churn, it might be better to re-fetch the stats API on change rather than calculating locally (complexity).

## Requirements
### Functional
- When a new payment is inserted into the DB, the "Total Revenue" card should update instantly.
- The "Recent Transactions" list should slide in the new transaction at the top.

### Non-Functional
- Minimal latency (< 500ms).
- Graceful handling of connection loss/reconnect.

## Architecture
- **Supabase Client:** Used in the frontend `useRealtimePayments` hook.
- **Channel:** `postgres_changes` event filter.

## Related Code Files
- `apps/dashboard/hooks/use-realtime-payments.ts` (New)
- `apps/dashboard/app/[locale]/dashboard/revenue/page.tsx`

## Implementation Steps
1.  **Create Custom Hook:**
    - `useRealtimePayments(initialData)`
    - Subscribe to `table: payments, event: INSERT`.

2.  **Handle Event:**
    - On `INSERT`:
        - Prepend payload.new to `transactions` state.
        - Add payload.new.amount to `totalRevenue` state.
        - Trigger `queryClient.invalidateQueries(['revenue-stats'])` to refresh complex metrics.

3.  **Integrate into Page:**
    - Wrap the components with the hook logic.

## Todo List
- [ ] Create `useRealtimePayments` hook
- [ ] Add subscription logic
- [ ] Test with manual DB insert

## Success Criteria
- Inserting a row into `payments` table (via SQL Editor) immediately shows up on the open dashboard.
