# Phase 08: Types

> **Status**: Pending
> **Goal**: Enforce strict TypeScript mode and fix all 'any' types.

## Actions
1.  **Config**: Ensure `strict: true` in `tsconfig.json`.
2.  **Audit**: `grep -r ": any" src`.
3.  **Remediation**: Replace `any` with specific interfaces/types.
4.  **Generics**: Use generics for reusable components/functions.

## Execution
- [ ] Fix implicit any errors.
- [ ] Define proper types for API responses.
- [ ] Update ESLint to error on `any`.

## Success Criteria
- [ ] `tsc` passes with no errors.
- [ ] Zero usage of `any` (explicit or implicit).
