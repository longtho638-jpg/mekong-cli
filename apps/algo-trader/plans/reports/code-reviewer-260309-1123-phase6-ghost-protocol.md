# Code Review: Phase 6 Ghost Protocol

**Date:** 2026-03-09 | **Score: 7/10** | **Verdict: APPROVE with suggestions**

## Scope

- Files: 4 (max-order-limits.ts, phase6-ghost-routes.ts, fastify-raas-server.ts, config.phase6.json)
- LOC: ~480 (reviewed), ~127 new (routes + leverage additions)
- Focus: Security gates, leverage enforcement, type safety

## Overall Assessment

Solid implementation. ENTERPRISE gate correctly applied via `licenseAuthPlugin`. Leverage caps (FREE=1x, PRO=10x, ENTERPRISE=20x) properly enforced. Code follows existing patterns. A few medium-priority issues below.

## Critical Issues

None.

## High Priority

### H1: PUT /config does NOT persist changes (phase6-ghost-routes.ts:69-98)

The PUT endpoint reads config from file, merges body, but **never writes back**. Returns "updated" config that exists only in the response. Next GET will return the old file values.

**Impact:** Config changes silently lost. Misleading "configuration updated" response.

**Fix:** Either persist to file/KV store, or rename endpoint to something like `/config/preview` and clarify it is read-only. If intentional (in-memory only), add a comment and change response message.

### H2: Leverage check allows client-supplied tier override (phase6-ghost-routes.ts:62)

```typescript
const tier = body.tier ?? 'enterprise';
```

Client can pass `tier: "enterprise"` even if their actual license is FREE/PRO. The route is gated behind ENTERPRISE license so this is mitigated, but the API design allows tier spoofing within the endpoint. If the route gate is ever relaxed, this becomes a privilege escalation.

**Fix:** Extract tier from the validated license (via `LicenseService.getInstance().getTier()`) instead of trusting client input:

```typescript
const tier = LicenseService.getInstance().getTier();
```

### H3: Synchronous `require('fs')` and `require('path')` in routes (phase6-ghost-routes.ts:115-116)

Using CommonJS `require()` inline instead of ES module `import`. Works but:
- Bypasses tree-shaking
- Inconsistent with rest of codebase (ES imports throughout)
- Synchronous file read on every GET /status request

**Fix:** Use `import * as fs from 'fs'` at top, and consider caching the config with a TTL.

## Medium Priority

### M1: Config loaded from disk on every request (phase6-ghost-routes.ts:38,79)

`loadPhase6Config()` reads and parses JSON from disk on every GET /status and PUT /config call. Under load, this adds unnecessary I/O.

**Fix:** Cache config in module-level variable with optional invalidation timer (30-60s).

### M2: Leverage config duplicated between config.phase6.json and TIER_LEVERAGE_CAPS constant

`config.phase6.json` defines `leverage: { free: 1, pro: 10, enterprise: 20 }` and `max-order-limits.ts` defines `TIER_LEVERAGE_CAPS` with identical values. DRY violation.

**Fix:** Either load caps from config file or remove the leverage section from config.phase6.json. Single source of truth.

### M3: `as` type assertions for request body (phase6-ghost-routes.ts:53,70)

```typescript
const body = request.body as LeverageCheckBody;
```

Fastify supports JSON Schema validation natively. Using `as` bypasses runtime validation -- the manual `typeof` check below partially compensates but schema validation is more robust.

**Fix:** Add Fastify JSON Schema for request bodies to get runtime validation + type inference.

## Low Priority

### L1: `maxGlobal: 20` hardcoded magic number (phase6-ghost-routes.ts:106)

Should reference `TIER_LEVERAGE_CAPS.enterprise` or `Math.max(...Object.values(TIER_LEVERAGE_CAPS))`.

### L2: Missing `leverage <= 0` check (max-order-limits.ts:328)

`checkLeverageCap` only checks `> maxAllowed`. Leverage of 0 or negative passes. The route validates `>= 1` but the function itself does not.

**Fix:** Add guard in `checkLeverageCap`:
```typescript
if (requestedLeverage < 1) {
  return { passed: false, rejectedReason: 'Leverage must be >= 1', ... };
}
```

## Edge Cases Found by Scout

1. **Unknown tier fallback is correct**: `TIER_LEVERAGE_CAPS[normalizedTier] ?? TIER_LEVERAGE_CAPS.free` -- unknown tiers correctly default to FREE (1x). Good.
2. **No `checkLeverageCap` usage in actual execution path**: The function exists and the API endpoint calls it, but `phase6_ghost/` modules do NOT call it during order execution. Leverage enforcement only happens via the API validation endpoint, not at trade time. This is a gap if orders bypass the API check.
3. **`licenseAuthPlugin` uses singleton `LicenseService`**: All routes share same instance. If license state changes mid-request-cycle, concurrent requests could see inconsistent tier. Low risk in practice.
4. **Volume history uses `symbol.startsWith(tenantId)` filtering**: If tenantId is a prefix of another tenantId (e.g., "pro" is prefix of "production"), cross-tenant volume leakage could occur. Pre-existing issue, not introduced by Phase 6.

## Positive Observations

- ENTERPRISE gate applied at plugin level (not per-route) -- correct pattern
- `checkLeverageCap` is a pure function with clear interface -- testable
- Config fallback on file read error prevents crashes
- Leverage cap values match specification exactly (1x/10x/20x)
- No `any` types in new code
- File sizes within 200-line guideline (routes = 127 lines)

## Recommended Actions

1. **[H2]** Use server-side tier from LicenseService instead of client-supplied tier
2. **[H1]** Decide: persist config changes or make endpoint read-only
3. **[M2]** Eliminate leverage cap duplication (single source of truth)
4. **[L2]** Add `< 1` guard in `checkLeverageCap` function
5. **Edge Case #2** Wire `checkLeverageCap` into actual order execution path in phase6_ghost modules

## Metrics

- Type Coverage: Good (no `any` in reviewed files, 1 pre-existing `as any` in server.ts L100)
- Test Coverage: Tests exist at `tests/` but no phase6-specific leverage test file found
- Linting Issues: 0 in new files

## Unresolved Questions

1. Is the PUT /config endpoint intended to persist changes or is it intentionally in-memory/ephemeral?
2. Should `checkLeverageCap` be enforced at trade execution time (inside phase6_ghost modules) or only as an API validation endpoint?
3. Are there plans to open the leverage check endpoint to PRO tier users for self-service validation?
