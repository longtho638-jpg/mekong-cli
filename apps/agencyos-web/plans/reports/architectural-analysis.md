# Architectural Analysis: agencyos-web

## 1. Current State Assessment
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Backend/Auth**: Supabase (@supabase/ssr)
- **State Management**: Local React state (useState). Note: `CLAUDE.md` mentions Context/Zustand, but implementation is currently missing.

## 2. Decoupling & Modularization Opportunities

### A. Authentication Logic
**Current:**
- Logic embedded directly in `app/auth/login/page.tsx`.
- Manual validation functions mixed with UI code.
- Direct Supabase client usage in the event handler.

**Problem:**
- Hard to test.
- Code duplication if other auth forms (register, reset password) are added.
- tight coupling between UI and Auth implementation.

**Recommendation:**
- Extract auth logic into a hook (e.g., `useLogin`) or a service layer.
- Use `zod` for schema validation instead of manual helper functions.

### B. Data Access Layer
**Current:**
- Direct `supabase.auth.signInWithPassword` calls in components.

**Problem:**
- Components know too much about the backend implementation.
- Hard to mock for testing.

**Recommendation:**
- Create a `services/auth.ts` or similar module to encapsulate Supabase calls.
- This allows swapping the backend or mocking it easily.

### C. Feature Organization
**Current:**
- Flat structure in `app` directory.
- `components/ui` exists for generic atoms.

**Problem:**
- As features grow (Dashboard, Profile, Settings), the `app` folder will become cluttered if business logic isn't separated.

**Recommendation:**
- Adopt a feature-based structure (e.g., `features/auth`, `features/dashboard`).
- Keep `app` directory strictly for routing and layout.

### D. Configuration & Constants
**Current:**
- Magic strings for routes (`/dashboard`, `/auth/login`) in `middleware.ts`.

**Recommendation:**
- centralized route configuration object to avoid typo-induced bugs and circular dependencies.

## 3. Scalability & Maintainability Gaps

- **Validation**: Missing `zod` integration despite being a standard practice.
- **State**: Missing global state management (Context/Zustand) for user session data across the app.
- **Testing**: No tests found (no `__tests__` or `.test.tsx` files observed in the file listing).
