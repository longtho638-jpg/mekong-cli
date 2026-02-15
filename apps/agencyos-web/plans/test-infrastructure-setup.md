# Plan: Testing Infrastructure Setup for AgencyOS Web

## Goal
Establish a robust testing environment using Jest and React Testing Library for the Next.js project `agencyos-web`, ensuring CI/CD compatibility and high code quality.

## Phase 1: Environment Setup
- [ ] **Dependencies**: Install necessary packages:
    - `jest`
    - `jest-environment-jsdom`
    - `@testing-library/react`
    - `@testing-library/dom`
    - `@testing-library/jest-dom`
    - `ts-node` (for jest.config.ts)
    - `@types/jest`
- [ ] **Configuration**:
    - Create `jest.config.ts` using `next/jest` for automatic Next.js config loading.
    - Create `jest.setup.ts` to extend jest matchers.
- [ ] **Scripts**: Update `package.json` with:
    - `"test": "jest"`
    - `"test:watch": "jest --watch"`
    - `"test:ci": "jest --ci --coverage"`

## Phase 2: Initial Test Implementation
- [ ] **Target**: `app/auth/login/page.tsx`
- [ ] **Action**: Create `app/auth/login/__tests__/page.test.tsx` (or co-located `page.test.tsx`).
- [ ] **Scope**:
    - Verify page renders without crashing.
    - Check for essential elements (form, inputs, submit button).
    - Mock `useRouter` if used.

## Phase 3: Execution & Verification
- [ ] Run `npm run test` or `pnpm test`.
- [ ] Analyze coverage report.
- [ ] Fix any immediate configuration or test failures.
