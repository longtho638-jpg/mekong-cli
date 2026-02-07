# Phase 06: Security

> **Status**: Pending
> **Goal**: Implement Zod schema validation for all inputs.

## Actions
1.  **Validation Schemas**: Define Zod schemas for all forms and API inputs.
2.  **API Routes**: Validate request bodies in `src/app/api/`.
3.  **Environment**: Validate `process.env` using `@t3-oss/env-nextjs` or similar.
4.  **Headers**: Configure security headers in `next.config.ts`.

## Execution
- [ ] Create `src/lib/schemas/` for Zod schemas.
- [ ] Integrate Zod with React Hook Form (if used).
- [ ] Add input validation middleware/logic to API routes.

## Success Criteria
- [ ] All user inputs validated.
- [ ] API routes return 400 on invalid input.
- [ ] Security headers present (HSTS, X-Frame-Options).
