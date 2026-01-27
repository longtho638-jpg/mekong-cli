# Research Report: Tech Stack Optimization for SaaS Admin Dashboard Pro

## Executive Summary
For the $147 SaaS Admin Dashboard Pro, we recommend a "No-Vendor-Lock" strategy. We selected **TanStack Table v8** (headless) over MUI DataGrid to avoid forcing buyers into MUI X licensing for advanced features. For security, we utilize **Stateless JWT via Next.js Middleware** for edge-compatible RBAC. Billing relies on **Stripe Checkout + Webhooks** using Next.js App Router Route Handlers.

## Research Methodology
- **Sources**: Official docs (TanStack, MUI, Stripe, Next.js), Github discussions (2024-2025), and enterprise SaaS patterns.
- **Focus**: Performance, Licensing (Crucial for template sales), Developer Experience.

## Key Findings

### 1. Table Component Strategy: MUI DataGrid vs. TanStack Table

| Feature | MUI DataGrid (Community) | TanStack Table (v8) |
| :--- | :--- | :--- |
| **Type** | Component (Batteries included) | Headless (Logic only) |
| **Styling** | Locked to Material Design | 100% Custom (Use MUI Components) |
| **Performance** | Good for < 1000 rows | Excellent (Virtualization ready) |
| **Licensing** | **Risk**: Advanced features need Pro/Premium ($$$) | **Safe**: MIT License (Free) |
| **Bundle Size** | Heavy | Lightweight |

**Recommendation: TanStack Table v8**
- **Reason**: As a paid template, relying on MUI DataGrid Community limits the end-user (e.g., no server-side grouping or advanced filtering without them paying MUI).
- **Implementation**: Build a reusable `<DataTable />` component using TanStack logic + MUI `<Table />` UI components. This adds high value to the product.

### 2. RBAC Security Pattern (Next.js Middleware)

**Best Practice: Hybrid Approach**
1.  **Edge Middleware (`middleware.ts`)**:
    -   **Task**: Route protection only.
    -   **Mechanism**: Verify JWT (jose lib) -> Check `role` claim -> Rewrite/Redirect.
    -   **Performance**: Zero latency overhead (runs on Edge).
    -   **Rule**: NO database calls in middleware.
2.  **Layout/Page Level**:
    -   **Task**: Data fetching security.
    -   **Mechanism**: Server Components check session before DB query.
3.  **Client Level**:
    -   **Task**: UI hiding (Hide "Delete" button).
    -   **Mechanism**: `usePermission()` hook checking context.

**Security Matrix:**
- `Admin`: Access all `/admin/*`
- `Manager`: Access `/admin/*` except `/admin/settings`
- `User`: Access `/dashboard/*`

### 3. Stripe Integration (App Router)

**Architecture:**
- **Checkout**: Use **Server Actions** (`createCheckoutSession`) called from Client Components.
- **Webhooks**: `app/api/webhooks/stripe/route.ts`.
    -   *Crucial*: Must use `rawBody` for signature verification. Next.js App Router requires specific config to not parse body automatically for this route.
- **State Sync**:
    -   Webhook (`checkout.session.completed`) -> Update DB (`subscriptions` table).
    -   Client UI relies on DB state, not direct Stripe calls (for speed).

## Implementation Recommendations

### Quick Start: TanStack Table + MUI
```tsx
// components/ui/DataTable.tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

// Wrap headless logic with MUI presentation
// Adds value: "Pro" look with "Free" logic
```

### Quick Start: Middleware RBAC
```ts
// middleware.ts
import { NextResponse } from 'next/server';
import { verifyAuth } from './lib/auth';

export async function middleware(req) {
  const token = req.cookies.get('token');
  const verified = await verifyAuth(token);

  if (!verified) return NextResponse.redirect(new URL('/login', req.url));

  if (req.nextUrl.pathname.startsWith('/admin') && verified.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
}
```

### Common Pitfalls
1.  **MUI X Lock-in**: Using `DataGridPro` features in a template forces customers to buy a license. Avoid.
2.  **Middleware DB Calls**: Attempting to fetch user permissions from Postgres in Middleware causes timeouts on Vercel Edge. Keep roles in the JWT.
3.  **Webhook Idempotency**: Stripe sends events multiple times. Ensure DB updates handle duplicates gracefully.

## Resources
- [TanStack Table v8 Guide](https://tanstack.com/table/v8)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Stripe App Router Example](https://github.com/vercel/next.js/tree/canary/examples/with-stripe)
