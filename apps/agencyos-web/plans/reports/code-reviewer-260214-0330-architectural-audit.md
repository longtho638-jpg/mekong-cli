# Code Review: Architectural Audit — AgencyOS Web

## Scope
- Files: `app/`, `components/`, `lib/supabase/`
- LOC: ~500
- Focus: Next.js App Router, Supabase Integration, 10x Architectural Improvements
- Scout findings: Missing middleware, outdated `CLAUDE.md`, lack of i18n, flat structure.

## Overall Assessment
The project is in its early stages with a clean but minimal foundation. It successfully implements a basic landing page and a client-side login flow using Supabase. However, it lacks critical infrastructure for a production-ready RaaS dashboard, specifically regarding session management, security middleware, and organized component architecture.

## Critical Issues
- **CRITICAL: Missing Supabase Middleware**: There is no `middleware.ts`. In a Next.js App Router app using `@supabase/ssr`, middleware is **mandatory** to refresh the user's session before it expires. Without it, users will be randomly logged out when the token expires, and server-side route protection is impossible.
- **SECURITY: Client-Side Routing Protection Only**: Currently, protection is likely only handled via `router.push("/")` in the login page. There is no server-side enforcement to prevent unauthorized access to potential future dashboard routes.

## High Priority
- **Architecture: Outdated `CLAUDE.md`**: The local `CLAUDE.md` references a `src/` directory and components that do not exist (e.g., `NetworkPage`, `WithdrawalPage`). This creates confusion for agents and developers.
- **i18n: Hardcoded Strings**: Violates Binh Phap Rule 8. All strings in `app/page.tsx` and `app/auth/login/page.tsx` are hardcoded. This will make localization (VI/EN) difficult.

## Medium Priority
- **Component Organization**: All components are currently in `components/ui/`. As the app grows, business-logic-aware components should be separated into `features/` or `components/modules/`.
- **Boilerplate Cleanup**: `app/layout.tsx` still contains generic "Create Next App" metadata.

## Low Priority
- **Flat Structure**: While functional, moving to a `src/` directory as suggested by `CLAUDE.md` would improve modularity and align with ecosystem standards.

## 10x Impact Architectural Improvements

### 1. Unified Session & Security Layer (Middleware)
Implement a robust `middleware.ts` that:
- Refreshes Supabase sessions.
- Implements a "Guard" pattern to redirect unauthenticated users from `/dashboard/*` to `/auth/login`.
- Redirects authenticated users away from `/auth/login` to `/dashboard`.

### 2. "Zone-Based" Component Architecture
Restructure `components/` to follow the Binh Phap "Xu Shi" principle:
- `components/ui/`: Pure, atomic shadcn components (stateless).
- `components/layout/`: Shared layout elements (Header, Sidebar).
- `features/`: Domain-specific components (e.g., `features/network/`, `features/revenue/`) that contain business logic and Supabase hooks.

### 3. Server-First Supabase Data Fetching
Transition from client-side fetching to Next.js Server Components.
- Use `lib/supabase/server.ts` to fetch data in `page.tsx` files.
- Leverage `Suspense` and `loading.tsx` for granular loading states, improving LCP and SEO.

### 4. Binh Phap i18n Protocol Integration
Implement a type-safe i18n system (e.g., `next-intl` or a custom lightweight solution) to centralize all strings. This ensures compliance with Rule 8 and prepares the dashboard for global RaaS operations.

### 5. Type-Safe Action Pattern
Replace client-side auth handlers with **Next.js Server Actions**. This moves sensitive logic to the server, reduces bundle size, and simplifies error handling.

## Metrics
- Type Coverage: 100% (No `any` found)
- Test Coverage: 0% (No tests found)
- Linting Issues: 0 (Baseline standard)

## Unresolved Questions
- Is there a planned migration to the `src/` directory, or should `CLAUDE.md` be updated to reflect the flat root structure?
- What is the preferred i18n library for the AgencyOS ecosystem (next-intl vs simple json mapping)?
