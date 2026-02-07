# Code Review Report: Security Headers & i18n Verification

**Date:** 2026-02-07
**Reviewer:** code-reviewer (a061d15)
**Scope:** Phase 4 (i18n) + Phase 6 (Security) of AgencyOS Landing Metamorphosis

---

## Code Review Summary

### Scope
- Files reviewed: `next.config.ts`, `vercel.json`, `src/middleware.ts`, `src/i18n/request.ts`, `src/i18n/config.ts`, `messages/en.json`, `messages/vi.json`, `src/app/[locale]/layout.tsx`, `src/components/providers/analytics-provider.tsx`, `src/lib/vibe-analytics-client.ts`, `src/lib/polar-checkout-client.ts`, `src/components/motion/lazy-motion-provider.tsx`
- Lines of code analyzed: ~600
- Review focus: Security headers, CSP, i18n correctness

### Overall Assessment

The project had solid foundational security headers (HSTS, X-Frame-Options, X-Content-Type-Options) but was **missing the most important header: Content-Security-Policy (CSP)**. The i18n setup had a **bug in `request.ts`** using the deprecated `locale` parameter instead of `requestLocale` (next-intl v4 API). Both issues are now fixed.

---

## Critical Issues

### 1. [FIXED] Missing Content-Security-Policy header
**Severity:** Critical
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/next.config.ts`

CSP was completely absent. Without CSP, the application is vulnerable to XSS attacks even with other headers present. CSP is the primary defense against injection attacks.

**Fix applied:** Added comprehensive CSP with:
- `default-src 'self'` - blocks all external resources by default
- `script-src 'self' 'unsafe-inline'` - needed for JSON-LD `dangerouslySetInnerHTML`
- `style-src 'self' 'unsafe-inline'` - needed for framer-motion inline styles
- `img-src 'self' data: blob: https:` - allows images from any HTTPS source
- `connect-src` allowlists Polar.sh API and Vercel analytics
- `frame-ancestors 'none'` - prevents clickjacking (complements X-Frame-Options)
- `object-src 'none'` - blocks Flash/Java embeds
- `upgrade-insecure-requests` - forces HTTPS

### 2. [FIXED] i18n `request.ts` using deprecated API
**Severity:** Critical
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/i18n/request.ts`

The callback used `{ locale }` but next-intl v4.8.2 provides `{ requestLocale }` (a `Promise<string | undefined>`). The old `locale` parameter is an optional override, not the URL segment locale. This could cause locale resolution to silently fail or always use the fallback.

**Fix applied:** Updated to `{ requestLocale }` with proper `await`, validation, and fallback to `defaultLocale`.

---

## High Priority Findings

### 3. [BLOCKED] Build fails due to glass-button.tsx TS error
**Severity:** High (but not from this review's scope)
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/components/glass/glass-button.tsx:111`

```
Type 'ReactNode | MotionValueNumber | MotionValueString' is not assignable to type 'ReactNode'.
```

This error was introduced by a parallel agent (Task #41: GlassButton glow micro-interaction). The `{children}` is wrapped in a motion container that returns incompatible types. **This blocks `npm run build`.**

**Recommended fix:** Cast or type-narrow the children, or ensure the motion wrapper's return type matches `ReactNode`.

### 4. [FIXED] Header inconsistencies between next.config.ts and vercel.json
**Severity:** High

| Header | next.config.ts (before) | vercel.json (before) |
|---|---|---|
| Referrer-Policy | `origin-when-cross-origin` | `strict-origin-when-cross-origin` |
| Permissions-Policy | Includes `browsing-topics=()` | Missing `browsing-topics=()` |
| X-XSS-Protection | Not present | `1; mode=block` (deprecated) |

**Fix applied:** Harmonized both files to use `strict-origin-when-cross-origin`, include `browsing-topics=()`, and removed deprecated `X-XSS-Protection`.

---

## Medium Priority Improvements

### 5. Deprecated middleware convention warning
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/middleware.ts`

Next.js 16.1.6 warns: `The "middleware" file convention is deprecated. Please use "proxy" instead.`

The current middleware correctly handles locale routing via `next-intl/middleware`. Migration to the "proxy" convention should be planned but is not urgent since it still works.

### 6. Duplicated metadata between layout.tsx and messages/*.json
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/app/[locale]/layout.tsx:34-45`

The `metadataMap` object in layout.tsx duplicates the `meta` section from `messages/en.json` and `messages/vi.json`. Should use `getTranslations()` instead for DRY compliance.

### 7. Mock analytics and checkout clients
**Files:**
- `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/lib/vibe-analytics-client.ts` - 3 TODO comments
- `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/src/lib/polar-checkout-client.ts` - 2 TODO comments

Both are mock implementations. The CSP `connect-src` has been pre-configured for Polar.sh and Vercel analytics to avoid breaking changes when real SDKs are integrated.

### 8. .env.example references Stripe, not Polar.sh
**File:** `/Users/macbookprom1/mekong-cli/apps/agencyos-landing/.env.example`

Per project rules (payment-provider.md), Polar.sh is the only payment provider. The .env.example still references `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.

---

## Low Priority Suggestions

### 9. Consider nonce-based CSP in future
Currently using `'unsafe-inline'` for `script-src` due to JSON-LD `dangerouslySetInnerHTML`. Next.js supports nonce-based CSP which would be stricter. This requires more complex setup with `generateNonce()` in middleware.

### 10. `export const dynamic = 'force-dynamic'` in layout.tsx
Line 20 of layout.tsx forces all pages to be server-rendered. This disables static generation for all routes under `[locale]`. Consider if this is intentional or if some pages could be statically generated.

---

## Positive Observations

- Translation files (en.json, vi.json) have **perfect structural parity** - all 104 keys match, all arrays match length
- i18n config is clean with proper TypeScript typing (`Locale` type, `as const`)
- `LazyMotion` with `domAnimation` is a good performance choice - avoids loading full framer-motion bundle
- HSTS is configured with `preload` and 2-year max-age - production-grade
- Zod validation on checkout API route - proper input validation
- `generateStaticParams` correctly generates locale params
- JSON-LD structured data is comprehensive

---

## Changes Made

| File | Change |
|---|---|
| `next.config.ts` | Added CSP header, fixed Referrer-Policy to `strict-origin-when-cross-origin` |
| `vercel.json` | Added CSP header, removed deprecated X-XSS-Protection, added `browsing-topics=()` to Permissions-Policy |
| `src/i18n/request.ts` | Fixed to use `requestLocale` (next-intl v4 API) instead of deprecated `locale` |

---

## Recommended Actions (Priority Order)

1. **[BLOCKING]** Fix `glass-button.tsx` TS error (line 111) - build is broken
2. **[DONE]** CSP header added to both next.config.ts and vercel.json
3. **[DONE]** i18n request.ts fixed for next-intl v4 API
4. **[DONE]** Header inconsistencies harmonized
5. Update `.env.example` to reference Polar.sh instead of Stripe
6. Plan migration from `middleware.ts` to `proxy` convention (Next.js 16+ deprecation)
7. Replace mock analytics/checkout with real SDK integrations
8. Consider nonce-based CSP when real external scripts are added

---

## Metrics

- TypeScript errors: 1 (pre-existing, from `glass-button.tsx`, not from this review's changes)
- Build status: BLOCKED by glass-button.tsx TS error
- Security headers: 7/7 configured (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP, X-DNS-Prefetch-Control)
- i18n parity: 104/104 keys match between en.json and vi.json
- CSP directives: 11 directives covering all major vectors

---

## Unresolved Questions

1. Is `export const dynamic = 'force-dynamic'` in layout.tsx intentional? It disables static generation for all locale routes.
2. Should the CSP be made stricter with nonces when moving from mock to real analytics/checkout SDKs?
3. When will the middleware-to-proxy migration be prioritized given the Next.js 16 deprecation warning?
