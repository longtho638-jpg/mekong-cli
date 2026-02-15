# Architectural Review Report: agencyos-web

## Scope
- Files: `apps/agencyos-web/app/auth/login/page.tsx`, `apps/agencyos-web/app/layout.tsx`, `apps/agencyos-web/app/page.tsx`, `apps/agencyos-web/next.config.ts`, `apps/agencyos-web/package.json`, `apps/agencyos-web/middleware.ts`, `apps/agencyos-web/lib/supabase/client.ts`, `apps/agencyos-web/lib/supabase/server.ts`, `apps/agencyos-web/lib/utils.ts`, `apps/agencyos-web/components.json`
- LOC: Approximately 300-400 lines across key files (excluding auto-generated code and node_modules).
- Focus: Recent changes, architecture for scalability and maintainability.
- Scout findings: The scouting focused on understanding the current architecture, dependencies, and state management within the Next.js App Router context. It highlighted the direct integration of Supabase client in UI components and the flat file structure for pages.

## Overall Assessment
The `agencyos-web` application is built on a modern stack (Next.js 16 App Router, TypeScript, Tailwind CSS) providing a strong foundation. However, there are clear opportunities for improving modularity, decoupling services, and establishing best practices for state management, validation, and testing. Implementing the proposed improvements will significantly enhance scalability, maintainability, and developer experience.

## Decoupling and Modularization Opportunities

### 1. Authentication Logic
- **Problem**: Authentication logic is tightly coupled with the UI in `app/auth/login/page.tsx`, including manual validation. This leads to reduced testability and potential code duplication.
- **Recommendation**: Extract authentication logic into a dedicated React hook (e.g., `useLogin`) or a service layer. Implement robust input validation using a library like `zod`.

### 2. Data Access Layer
- **Problem**: UI components directly interact with Supabase client calls (e.g., `supabase.auth.signInWithPassword`). This creates tight coupling to the backend implementation, making testing and future backend migrations challenging.
- **Recommendation**: Abstract Supabase interactions behind a `services` layer (e.g., `features/auth/services/auth-service.ts`). This allows for easier mocking, testing, and potential swapping of backend providers.

### 3. Feature Organization
- **Problem**: The current file structure is relatively flat, with core Next.js `app` and `components/ui` directories. As the application scales, this can lead to disorganization and difficulty locating feature-specific code.
- **Recommendation**: Adopt a feature-based directory structure (`src/features/auth`, `src/features/dashboard`). This organizes code by domain, improving discoverability and separation of concerns.

### 4. Configuration and Constants
- **Problem**: Magic strings are used for navigation routes (e.g., `/dashboard`, `/auth/login`) in `middleware.ts` and other components, increasing the risk of typos and refactoring difficulties.
- **Recommendation**: Centralize all route paths and other application-wide constants in a `config/routes.ts` file.

## Scalability and Maintainability Gaps

### 1. State Management
- **Problem**: While `CLAUDE.md` mentions React Context/Zustand, the observed codebase primarily relies on local React state. Without a global state management solution, managing shared application state (e.g., user session, notifications, theme) becomes cumbersome and error-prone as the app grows.
- **Recommendation**: Implement `Zustand` for global state management. This will provide a lightweight and efficient way to manage application-wide data.

### 2. Form Validation
- **Problem**: Manual validation functions are embedded directly in components (`app/auth/login/page.tsx`), which can be less robust and harder to maintain compared to dedicated validation libraries.
- **Recommendation**: Integrate `zod` for schema-based validation, combined with `react-hook-form` for efficient form handling. This improves validation robustness, provides type safety, and reduces boilerplate.

### 3. Testing Strategy
- **Problem**: No explicit testing framework or test files were observed in the initial review. Lack of automated tests poses significant risks to code quality, refactoring confidence, and long-term maintainability.
- **Recommendation**: Implement a comprehensive testing strategy including `vitest` (or Jest) for unit/integration tests, `react-testing-library` for UI components, and `playwright` for end-to-end (E2E) testing of critical user flows.

## Recommended Actions
1.  **Introduce Feature-Based Structure**: Create a `src/features` directory and begin migrating existing features (e.g., `auth`) into it.
2.  **Implement Service Layer**: Create `features/auth/services/auth-service.ts` to abstract Supabase authentication calls.
3.  **Integrate Zustand**: Install `zustand` and create a global store for user session management.
4.  **Integrate Zod & React Hook Form**: Install these libraries and refactor `app/auth/login/page.tsx` to use them for form validation.
5.  **Centralize Routes**: Create `config/routes.ts` and update all route references.
6.  **Establish Testing Pipeline**: Set up `vitest` and `playwright` (or equivalent) and begin writing tests for core functionalities.

## Metrics
- Type Coverage: Currently unknown, but `CLAUDE.md` mandates zero `any` types. Achieving this requires strict type checking and enforcement.
- Test Coverage: 0% (based on observation, no test files found). Aim for >80% for unit tests.
- Linting Issues: Not explicitly checked, but `eslint` is configured in `package.json`.

## Unresolved Questions
- What is the current status of the internationalization (`next-intl`) implementation?
- Are there existing design patterns or architectural decisions that influenced the current structure not explicitly documented?
- What are the performance metrics (build time, LCP) for the application currently?
- Is there an existing error tracking solution in place?

This report concludes the architectural review of `agencyos-web`.
