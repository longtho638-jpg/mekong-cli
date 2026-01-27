# Phase 1: Setup & User Management

## Overview
Initialize the project with the enterprise stack and implement the core User Management module. This sets the foundation for the entire dashboard.

## Objectives
- [ ] Initialize Next.js 14+ (App Router) project.
- [ ] Setup UI Framework (MUI v5) with custom theme.
- [ ] Setup State Management (Zustand, TanStack Query).
- [ ] Implement Auth Skeleton (Login page, Middleware).
- [ ] Build Dashboard Layout (Sidebar, Topbar, Responsive).
- [ ] Implement User Management (List, Create, Edit, Delete).
- [ ] **Deliverable**: Functional User Dashboard.

## Architecture
- **Framework**: Next.js App Router.
- **Styling**: MUI v5 + Tailwind CSS (via MUI integration if needed, or pure MUI). *Decision: Pure MUI for consistency in Admin Templates.*
- **Data**: Mock API initially, then DB structure.
- **Table**: TanStack Table v8 wrapped in MUI components.

## Implementation Steps

### 1. Project Scaffolding
- Run `create-next-app` with TypeScript, ESLint.
- Install `metrics`, `@mui/material`, `@emotion/react`, `@emotion/styled`.
- Install `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`.
- Configure `tsconfig.json` paths.

### 2. Theming & Layout
- Create `src/theme/theme.ts` (Light/Dark mode).
- Create `src/components/layout/Sidebar.tsx`.
- Create `src/components/layout/Navbar.tsx`.
- Implement `DashboardLayout`.

### 3. Authentication (Skeleton)
- Create `src/middleware.ts` for route protection.
- Create Login Page `src/app/(auth)/login/page.tsx`.
- Setup `useAuth` hook with Zustand.

### 4. User Management Module
- **Data Layer**: Define `User` type.
- **Components**:
    - `UserTable.tsx` (using TanStack Table).
    - `UserActions.tsx` (Edit, Delete, Ban).
    - `AddUserModal.tsx` (React Hook Form).
- **Page**: `src/app/(dashboard)/users/page.tsx`.

## Verification
- Project builds without errors.
- Dark mode toggle works.
- User table renders with mock data.
- Responsive sidebar works on mobile.
