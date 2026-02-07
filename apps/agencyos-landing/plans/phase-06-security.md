---
title: "Phase 06: Security"
description: "Harden the application with security headers, environment validation, and input validation."
status: completed
priority: P1
effort: 2h
branch: master
tags: [security, headers, validation, zod]
created: 2026-02-07
---

# Phase 06: Security

## 1. Context & Objectives

**Goal**: ensure the application is secure by default. This involves setting strict HTTP headers, validating all environment variables at build time, and ensuring all API endpoints validate their inputs.

**Current Status**:
- `src/app/api/checkout/route.ts` already uses Zod.
- `next.config.ts` is missing security headers.
- Environment validation file needs to be located or created.

## 2. Implementation Plan

### 2.1. Security Headers
- [ ] Update `next.config.ts` to include:
    - `X-DNS-Prefetch-Control`
    - `Strict-Transport-Security` (HSTS)
    - `X-Frame-Options` (DENY)
    - `X-Content-Type-Options` (nosniff)
    - `Referrer-Policy` (origin-when-cross-origin)
    - `Permissions-Policy` (camera=(), microphone=(), geolocation=())

### 2.2. Environment Validation
- [ ] Create `src/env.ts` using `@t3-oss/env-nextjs` to define and validate:
    - `NEXT_PUBLIC_BASE_URL`
    - `NEXT_PUBLIC_POLAR_PRICE_STARTER`
    - `NEXT_PUBLIC_POLAR_PRICE_PRO`
    - `POLAR_ACCESS_TOKEN` (server-side)
    - `POLAR_ORGANIZATION_ID` (server-side)
    - `POLAR_WEBHOOK_SECRET` (server-side)

### 2.3. Input Validation
- [ ] Audit `src/app/api/webhooks/polar/route.ts` for additional validation if needed.

## 3. Verification

- **Headers**: Inspect response headers in browser DevTools or use `curl -I`.
- **Env**: Try building with missing env vars to ensure it fails.
- **API**: Test endpoints with invalid data to ensure 400 Bad Request.

## 4. Next Steps
- Proceed to Phase 10: Theme or Phase 11: Final.
