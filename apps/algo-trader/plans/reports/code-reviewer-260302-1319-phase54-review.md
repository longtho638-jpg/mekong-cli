# Code Review — Phase 5.4

**Date:** 2026-03-02
**Reviewer:** code-reviewer agent

---

## Scope
- **Files reviewed:** 13 (6 new, 7 modified)
- **LOC analyzed:** ~1,354
- **TS typecheck:** PASS (0 errors)
- **P&L tests run:** 10/10 PASS

---

## Overall Assessment

Phase 5.4 is solid. Architecture is clean — the `PnlStore` interface with pluggable `InMemoryPnlStore`/`PrismaBackedPnlStore` is the right pattern. Walk-forward pipeline is well-structured. Dashboard mobile changes are minimal and correct. No security or type-safety blockers.

---

## Critical Issues

None.

---

## High Priority Findings

### 1. Production server uses `InMemoryPnlStore` — data lost on restart
**File:** `src/api/fastify-raas-server.ts:92`
```ts
const pnlStore = new InMemoryPnlStore();
const pnlService = new PnlSnapshotService(positionTracker, pnlStore);
```
`PrismaBackedPnlStore` exists but is never wired in production. Snapshots vanish on server restart. Acceptable for Phase 5.4 if persistence is deferred, but must be tracked.

**Fix:** Add env flag `USE_DB_PNL_STORE=true` to swap store, or document deferral in roadmap.

### 2. `parseInt(limit, 10)` silently returns `NaN` on non-numeric input
**File:** `src/api/routes/pnl-realtime-snapshot-history-routes.ts:51`
```ts
const limitNum = limit ? Math.min(parseInt(limit, 10), 500) : 100;
```
`parseInt('abc', 10)` → `NaN`. `Math.min(NaN, 500)` → `NaN`. Query then passes `limit: NaN` to store which uses `NaN ?? 100` → `NaN` (nullish coalescing won't catch NaN). Result: `slice(0, NaN)` returns empty array.

**Fix:**
```ts
const parsedLimit = limit ? parseInt(limit, 10) : 100;
if (limit && isNaN(parsedLimit)) return reply.status(400).send({ error: 'invalid_limit' });
const limitNum = Math.min(parsedLimit, 500);
```

---

## Medium Priority Improvements

### 3. File size violations
- `src/backtest/walk-forward-optimizer-pipeline.ts`: 219 lines (limit: 200)
- `dashboard/src/pages/reporting-page.tsx`: 279 lines (limit: 200)

`reporting-page.tsx` exceeds by 79 lines. Extract `MOCK_TRADES` generator and `exportCsv` into separate module files.

### 4. `as any` cast in auth middleware bypass
**File:** `src/api/fastify-raas-server.ts:77`
```ts
return authMiddleware(request as any, reply as any);
```
Pre-existing issue (not Phase 5.4 introduced), but worth tracking. Type the middleware to accept Fastify types properly.

### 5. `PnlSnapshot` schema lacks FK to `Tenant`
**File:** `prisma/schema.prisma:129-141`
```prisma
model PnlSnapshot {
  tenantId String  // raw field, no relation
```
No `@@relation` to `Tenant` model. If a tenant is deleted, orphan snapshots accumulate. Low risk in Phase 5.4 but breaks referential integrity at DB level.

**Fix:**
```prisma
tenant    Tenant   @relation(fields: [tenantId], references: [id])
```
and add `pnlSnapshots PnlSnapshot[]` to Tenant model.

### 6. `strategyFactory` ignores `params` in walk-forward test
**File:** `tests/backtest/walk-forward-optimizer-pipeline-window-oos-validation.test.ts:29`
```ts
const strategyFactory = (_params: Record<string, number>) => new RsiSmaStrategy();
```
Tests pass params but factory ignores them — optimizer picks "best" params but validation always runs same strategy config. Tests verify pipeline shape but not that param application works end-to-end. Acceptable for pipeline-level tests, but note in comments.

---

## Low Priority Suggestions

### 7. `useNow()` in `dashboard-page.tsx` does not update
```ts
function useNow(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}
```
Called once at render — `lastUpdate` is stale until next re-render triggered by store. Add `useEffect` with `setInterval` or remove the "Updated" timestamp if it's not reliably updating.

### 8. `_clear()` method on `InMemoryPnlStore` is public-ish
Prefixed with `_` but exported on the class. Not a security issue (test-only), but could use `@internal` JSDoc tag for clarity.

---

## Positive Observations

- `PnlStore` interface is clean — perfect for test/prod swap pattern
- Route input validation (date parsing, `isNaN` check for dates) is correct
- WebSocket `pnl` channel registration is minimal and correct — no over-engineering
- Walk-forward pipeline handles edge cases well: insufficient data, empty optResults, OOS failure
- `degradation` capped at 0 when `inSampleSharpe === 0` — avoids divide-by-zero
- `PrismaBackedPnlStore` uses dynamic import for `getPrisma` — avoids circular dep at module load
- All 10 P&L tests pass cleanly; test structure is readable
- Dashboard mobile responsive changes are minimal and correct — no regressions
- No secrets, no `@ts-ignore`, no TODO/FIXME in reviewed files

---

## Recommended Actions

1. **[High]** Guard `parseInt(limit)` against NaN — add `isNaN` check before `Math.min`
2. **[High]** Wire `PrismaBackedPnlStore` in production or explicitly document deferral in roadmap
3. **[Medium]** Add FK relation `PnlSnapshot → Tenant` in Prisma schema
4. **[Medium]** Extract `MOCK_TRADES` + `exportCsv` from `reporting-page.tsx` to bring under 200 lines
5. **[Low]** Fix `useNow()` to update on interval or remove stale timestamp display

---

## Metrics

| Metric | Value |
|---|---|
| TS errors | 0 |
| `any` types (new files) | 0 (1 pre-existing in fastify-raas-server.ts) |
| TODO/FIXME | 0 |
| Tests (P&L suite) | 10/10 PASS |
| Files over 200 lines | 2 (walk-forward: 219, reporting-page: 279) |

---

## Unresolved Questions

1. Is `InMemoryPnlStore` in production intentional (Phase 5.4 scope) or an oversight? If intentional, update roadmap to track `PrismaBackedPnlStore` wiring.
2. Walk-forward test uses fixed `RsiSmaStrategy` ignoring optimized params — is this acceptable for pipeline integration tests or should param application be verified separately?
