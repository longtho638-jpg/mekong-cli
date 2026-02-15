# Architectural Improvements Proposal: agencyos-web

## 1. Feature-Based Directory Structure
Currently, the application uses a flat structure. We propose moving to a domain-driven feature structure to improve maintainability as the application grows.

**Proposed Structure:**
```
src/
├── app/                 # Next.js App Router (Routes only)
│   ├── (auth)/          # Route group for auth
│   │   └── login/
│   │       └── page.tsx
│   └── dashboard/
│       └── page.tsx
├── features/            # Feature-based modules
│   ├── auth/            # Auth feature
│   │   ├── components/  # Auth-specific UI (LoginForm)
│   │   ├── hooks/       # Auth hooks (useLogin)
│   │   ├── services/    # Auth API services
│   │   ├── types/       # Auth types
│   │   └── schemas.ts   # Zod validation schemas
│   └── dashboard/       # Dashboard feature
│       └── ...
├── components/          # Shared UI components (atoms/molecules)
│   └── ui/              # Shadcn UI
├── lib/                 # Core utilities
│   ├── supabase/        # Supabase clients
│   └── utils.ts         # Helper functions
├── config/              # App-wide configuration
│   └── routes.ts        # Centralized route constants
└── store/               # Global state (Zustand)
    └── use-user-store.ts
```

## 2. Service Layer Abstraction
Decouple the UI from direct Supabase calls.

**Current:**
```typescript
// Inside Component
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

**Proposed:**
`features/auth/services/auth-service.ts`:
```typescript
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const supabase = createClient();
    return await supabase.auth.signInWithPassword(credentials);
  },
  // ... other methods
};
```

## 3. State Management (Zustand)
Implement the `Zustand` store mentioned in the project documentation (`CLAUDE.md`) but missing from dependencies.

- **Action**: Install `zustand`.
- **Usage**: Manage global user session state, UI settings (sidebar toggle, theme), and feature-specific global data.

## 4. Form Validation (Zod)
Replace manual validation with `zod` and `react-hook-form`.

- **Action**: Install `zod` and `react-hook-form`.
- **Benefit**: Robust schema validation, type inference, and reduced boilerplate.

**Example Schema:**
```typescript
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

## 5. Configuration Management
Centralize magic strings and configuration.

`config/routes.ts`:
```typescript
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  DASHBOARD: {
    ROOT: '/dashboard',
    // ...
  },
} as const;
```

## 6. Testing Strategy
Introduce a testing framework to ensure reliability.

- **Unit Tests**: `vitest` or `jest` for utility functions and hooks.
- **Component Tests**: `react-testing-library` for UI components.
- **E2E Tests**: `playwright` (already standard in Vercel ecosystems) for critical flows (Login, Dashboard loading).

## 7. Next Steps (Implementation Plan)
1.  **Refactor**: Move existing `auth` logic to `features/auth`.
2.  **Install**: Add `zustand`, `zod`, `react-hook-form`.
3.  **Config**: Create `config/routes.ts` and update `middleware.ts`.
4.  **Service**: Create `auth-service.ts` and integrate into `LoginForm`.
