# Code Review: @agencyos/vibe-stripe

**Date:** 2026-03-01
**Reviewer:** code-reviewer
**Scope:** `packages/vibe-stripe/` — 6 files, ~440 LOC

---

## Code Review Summary

### Scope
- Files reviewed: `package.json`, `index.ts`, `types.ts`, `stripe-adapter.ts`, `stripe-subscription-hooks.ts`, `stripe-webhook-handler.ts`
- Lines of code analyzed: ~440
- Review focus: Security, type safety, error handling, API design, edge cases

### Overall Assessment
The package is well-structured with clear separation of concerns (adapter / hooks / webhook handler). The API design is clean and developer-friendly. However, there is one **critical security vulnerability** in the webhook handler that must be fixed before this package can be trusted in production.

---

## Critical Issues

### [CRITICAL] `verifyWebhookSignature` in `stripe-webhook-handler.ts` SKIPS HMAC verification

**File:** `/Users/macbookprom1/mekong-cli/packages/vibe-stripe/stripe-webhook-handler.ts`, lines 133–174

The synchronous `verifyWebhookSignature` function — used as the **default path** in `handleRequest` — does NOT actually compute or compare an HMAC signature. It only:
1. Parses the header
2. Checks timestamp tolerance
3. Validates JSON structure

Then returns `{ valid: true, event }` without ever verifying the HMAC. A comment at line 160–162 acknowledges this:
```ts
// Note: Actual HMAC verification requires async crypto.subtle
// For synchronous verification, use node:crypto in Node.js environments.
// This structural implementation parses and validates the event format.
```

**Impact:** Any HTTP request with a valid timestamp and correct JSON structure passes signature verification. An attacker can forge arbitrary webhook events (fake subscription creations, payment successes, etc.).

**Fix:** `handleRequest` MUST use the async path with real HMAC. Replace the internal call or make `handleRequest` async and delegate to `verifyStripeSignatureAsync`. The `verifyStripeSignatureAsync` function (lines 180–230) is correctly implemented with Web Crypto — it just isn't wired to the main handler.

```ts
// stripe-webhook-handler.ts — fix handleRequest to use real HMAC
async handleRequest(rawBody: string, signatureHeader: string): Promise<WebhookResult> {
  const verification = await verifyStripeSignatureAsync(rawBody, signatureHeader, webhookSecret);
  if (!verification.valid || !verification.event) {
    return { status: 'error', message: verification.error ?? 'Invalid signature' };
  }
  // ... rest unchanged
}
```

The old sync `verifyWebhookSignature` function should be deleted entirely to prevent future misuse.

---

## High Priority Findings

### [HIGH] `getPaymentStatus` doesn't filter by `orderCode` — always returns first session

**File:** `stripe-adapter.ts`, lines 69–88

```ts
const sessions = await this.stripeGet<{ data: Record<string, unknown>[] }>(
  '/checkout/sessions',
  { limit: '1' },  // ← no filter by metadata.orderCode
);
const session = sessions.data[0];
```

Returns the most recent session regardless of `orderCode`. The comment on line 70 acknowledges Stripe doesn't natively index by `orderCode` but the correct fix is to pass `metadata[orderCode]=<value>` as a query param to filter server-side, or iterate pages to find a match.

**Impact:** Wrong payment status returned for all orders except the most recent one.

---

### [HIGH] `cancelPayment` is a no-op

**File:** `stripe-adapter.ts`, lines 90–93

```ts
async cancelPayment(orderCode: number, _reason?: string): Promise<VibePaymentStatus> {
  // Stripe checkout sessions can't be cancelled directly — expire them
  return this.getPaymentStatus(orderCode);
}
```

Silently does nothing. Given this implements `VibePaymentProvider`, callers expect cancellation to occur. Should either call `POST /checkout/sessions/{id}/expire` with the resolved session ID, or throw `new Error('cancelPayment not supported for Stripe — use cancelSubscription instead')`.

---

### [HIGH] `verifyStripeSignatureAsync` uses non-constant-time string comparison

**File:** `stripe-webhook-handler.ts`, lines 220–222

```ts
if (computedSig !== expectedSig) {
```

JavaScript `!==` on hex strings is vulnerable to timing attacks. Should use a constant-time comparison. In Node.js environments use `crypto.timingSafeEqual`. For Web Crypto environments, compare `Uint8Array` buffers byte-by-byte in constant time, or use a polyfill.

**Note:** The sync version in `stripe-adapter.ts` line 422 correctly uses `crypto.timingSafeEqual`.

---

### [HIGH] `package.json` exports raw `.ts` source — no build output

**File:** `package.json`

```json
"main": "index.ts",
"exports": { ".": "./index.ts", ... }
```

Shipping `.ts` as the `main`/`exports` entry works only in bundler-aware monorepos. For any consumer that uses `require()` or runs Node directly this will fail. No `tsconfig.json` exists in the package directory, and there are no build scripts.

**Impact:** Package is only usable inside the workspace with bundler support. Should add a `tsconfig.json`, a build step (`tsc` or `tsup`), and point `main`/`exports` to compiled output in `dist/`.

---

## Medium Priority Improvements

### [MEDIUM] Pervasive use of `Record<string, unknown>` — low type safety

**Files:** `types.ts` (lines 82–127), `stripe-adapter.ts` (many), `stripe-subscription-hooks.ts` line 179

Webhook handlers and the `listInvoices` return `Record<string, unknown>`:
```ts
onCheckoutCompleted?: (session: Record<string, unknown>) => Promise<void>;
async getInvoices(customerId: string, limit = 10): Promise<Record<string, unknown>[]>
```

These should have typed interfaces matching the relevant Stripe objects (checkout session, invoice, subscription). Without types, consumers must cast everything themselves and type errors aren't caught at compile time.

**Suggestion:** Define `StripeCheckoutSession`, `StripeInvoice`, `StripeSubscriptionObject` interfaces in `types.ts` (even minimal ones) and use them in webhook handler callbacks and `listInvoices`.

---

### [MEDIUM] `mapSubscription` uses deprecated `plan` field

**File:** `stripe-adapter.ts`, lines 352–366

```ts
const plan = sub.plan as Record<string, unknown> | undefined;
```

The `plan` field on a Stripe subscription object is deprecated in newer API versions (2022-11-15+). Current API returns `items.data[0].price` instead. Since `DEFAULT_API_VERSION = '2023-10-16'`, the `plan` field may be absent or always `undefined`, causing `planAmount`, `currency`, and `priceId` to always return defaults.

**Fix:**
```ts
const items = sub.items as Record<string, unknown>;
const item = (items?.data as Record<string, unknown>[])?.[0];
const price = item?.price as Record<string, unknown> | undefined;
// use price.unit_amount, price.currency, price.id
```

---

### [MEDIUM] `@ts-expect-error` used for peer dependency imports

**Files:** `stripe-adapter.ts` line 14, `stripe-subscription-hooks.ts` line 13

```ts
// @ts-expect-error — monorepo workspace resolution at build time
import type { VibePaymentProvider, ... } from '@agencyos/vibe-payment';
```

This disables type checking on the import entirely. If `vibe-payment`'s types change, errors will be silently swallowed. Should be resolved via proper `tsconfig.json` with `paths` mappings or pnpm workspace symlinks, allowing TypeScript to resolve without suppressing errors.

---

### [MEDIUM] No input validation on public API surface

Several entry points accept unchecked strings:
- `createStripeAdapter({ secretKey })` — validates presence but not format (should warn if not `sk_` prefix)
- `startCheckout({ email })` — email format not validated before sending to Stripe API
- `trialDays` — not validated as positive integer; negative value sent to Stripe causes a 400
- `limit` in `listInvoices` — no upper bound check (Stripe max is 100)

---

### [MEDIUM] `openBillingPortal` uses `defaultSuccessUrl` as fallback `returnUrl`

**File:** `stripe-subscription-hooks.ts`, line 129

```ts
returnUrl: params.returnUrl ?? defaultSuccessUrl,
```

The billing portal `returnUrl` semantically differs from a checkout success URL. If `defaultSuccessUrl = '/checkout/success'`, users returning from the portal land on a success page with no context. Should default to a dedicated billing/dashboard URL or require explicit `returnUrl`.

---

## Low Priority Suggestions

### [LOW] `allow_promotion_codes` defaulted to `true` silently

**File:** `stripe-adapter.ts`, line 139

```ts
if (config.allowPromotionCodes !== false) {
  body.allow_promotion_codes = 'true';
}
```

Opt-out rather than opt-in for promotion codes. Merchants may be unaware coupons are enabled by default. Should default to `false` and require explicit `allowPromotionCodes: true`.

---

### [LOW] `cancelPayment` `_reason` param is permanently unused

**File:** `stripe-adapter.ts`, line 90
Underscore prefix indicates intent to ignore — but the reason string is also not stored anywhere or passed to `POST /checkout/sessions/{id}/expire` (which does accept a cancel reason). Once cancellation is properly implemented, reason should be forwarded.

---

### [LOW] `StripeSubscriptionInfo.status` missing `'incomplete_expired'`

**File:** `types.ts`, line 99

Stripe returns `incomplete_expired` as a subscription status but it's absent from the union. Casting from API response will silently succeed (TypeScript cast), but if downstream code does a switch/exhaustive check, it'll be missed.

---

### [LOW] `require('node:crypto')` inside function body

**File:** `stripe-adapter.ts`, line 414

```ts
const crypto = require('node:crypto');
```

Dynamic `require` inside a function called on every webhook event. Should be a top-level import or replaced with the Web Crypto path (which already exists in `stripe-webhook-handler.ts`). Mixing two crypto implementations across the same package is inconsistent.

---

## Positive Observations

- `verifyStripeSignatureAsync` (webhook handler) is correctly implemented: parses header, checks timestamp tolerance, computes HMAC via Web Crypto, performs comparison.
- `handleRequest` has a clean 4-step flow: verify → idempotency → route → mark processed.
- Idempotency hook (`isProcessed`/`markProcessed`) is a good optional interface — lets consumers plug in Redis/DB without coupling.
- `WebhookResult` discriminated union is well-typed and forces callers to handle all outcomes.
- `createStripeAdapter` factory validates `secretKey` presence before constructing.
- HTTP helpers (`stripePost`, `stripeGet`, `stripeDel`) centralize auth header injection cleanly.
- URL parameter encoding via `URLSearchParams` prevents injection.
- `Math.round(params.amount * 100)` in `startPayment` correctly handles floating point for cent conversion.
- Timestamp tolerance (5 min) is correctly applied in both verification paths.

---

## Recommended Actions

1. **[CRITICAL — fix immediately]** Wire `handleRequest` to call `verifyStripeSignatureAsync` (real HMAC) instead of the dummy sync path. Delete `verifyWebhookSignature`.
2. **[HIGH]** Fix `getPaymentStatus` to filter by `orderCode` in the Stripe API query (`metadata[orderCode]=<value>`).
3. **[HIGH]** Implement `cancelPayment` via `POST /checkout/sessions/{id}/expire` or throw an explicit error.
4. **[HIGH]** Add constant-time comparison in `verifyStripeSignatureAsync` (replace `!==` with buffer comparison).
5. **[HIGH]** Add `tsconfig.json` + build script; point `package.json` exports to `dist/`.
6. **[MEDIUM]** Replace `Record<string, unknown>` in webhook callbacks with typed interfaces.
7. **[MEDIUM]** Fix `mapSubscription` to read from `items.data[0].price` instead of deprecated `plan`.
8. **[MEDIUM]** Remove `@ts-expect-error` by configuring `paths` in `tsconfig.json`.
9. **[MEDIUM]** Add basic input validation (email format, positive `trialDays`, `limit` ≤ 100).
10. **[LOW]** Change `allowPromotionCodes` default to `false`.
11. **[LOW]** Add `incomplete_expired` to `StripeSubscriptionInfo['status']` union.

---

## Metrics

- Type Coverage: ~65% — heavy use of `Record<string, unknown>` and casts reduces effective coverage
- Test Coverage: 0% — no test files present
- Linting Issues: 1 known (`require()` in function body)
- Critical Security Issues: 1 (webhook HMAC bypass)
- No `any` types used (positive) — but excessive cast-based typing reduces safety similarly

---

## Unresolved Questions

1. Are `@agencyos/vibe-payment` and `@agencyos/vibe-subscription` packages published anywhere, or are they workspace-only? The `@ts-expect-error` suggests they may not be resolvable at TS compile time — this needs a definitive answer before the package can be distributed.
2. Is this package intended for Node.js only, Cloudflare Workers only, or both? The crypto approach differs between the two code paths and should be standardized based on target runtime.
3. Who owns idempotency persistence? The `isProcessed`/`markProcessed` hooks are optional — is there a recommended default implementation (e.g., in-memory set) for simpler deployments?
