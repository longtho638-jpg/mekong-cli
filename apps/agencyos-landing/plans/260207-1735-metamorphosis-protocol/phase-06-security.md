# Phase 06: Security

> **Status**: Completed
> **Goal**: Implement Zod schema validation for all inputs.

## Actions
1.  **Validation Schemas**: Defined Zod schemas for Checkout and Webhooks.
2.  **API Routes**: Validated request bodies in `src/app/api/checkout` and `src/app/api/webhooks/polar`.
3.  **Environment**: Added build-time validation in `next.config.ts` (replaced `@t3-oss/env-nextjs` with lightweight check to save bundle size).
4.  **Headers**: Verified security headers in `next.config.ts` (HSTS, X-Frame-Options, etc. were already present).

## Execution
- [x] Create `src/lib/schemas/` for Zod schemas (`checkout.ts`, `webhook.ts`).
- [x] Integrate Zod validation in API routes.
- [x] Add build-time environment variable checks.
- [x] Verify security headers.

## Success Criteria
- [x] All user inputs validated.
- [x] API routes return 400 on invalid input (handled by Zod).
- [x] Security headers present (HSTS, X-Frame-Options).
