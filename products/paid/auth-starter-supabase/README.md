# Auth Starter (Supabase)

A production-ready authentication package for Next.js applications using Supabase. Save 20+ hours of development time with secure, pre-built components and hooks.

## Features

- 🔐 **Complete Auth Flows**: Login, Signup, Forgot Password, Reset Password
- 🛡️ **Protected Routes**: Client-side guards & Server-side middleware
- 🔄 **Session Management**: Automatic token refresh and state synchronization
- 🎨 **Production UI**: Tailwind CSS styling, dark mode ready, loading states
- ⚡ **Next.js 14+**: Support for App Router and Server Components
- 🔒 **Type-Safe**: Full TypeScript support with Zod validation (optional)

## What's Included

```
auth-starter-supabase/
├── components/         # Pre-built UI components
│   ├── auth/           # Login, Signup, Forms
│   └── protected/      # Route guards
├── hooks/              # Custom React hooks (useAuth, useUser)
├── lib/                # Supabase client/server utilities
├── middleware/         # Next.js middleware for route protection
└── types/              # TypeScript definitions
```

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Wrap your App**
   Add the `AuthProvider` to your layout:
   ```tsx
   // app/layout.tsx
   import { AuthProvider } from '@/components/auth/auth-provider';

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <AuthProvider>{children}</AuthProvider>
         </body>
       </html>
     );
   }
   ```

4. **Protect Routes**
   Use the provided middleware or `ProtectedRoute` component.

   ```tsx
   // app/dashboard/page.tsx
   import ProtectedRoute from '@/components/protected/protected-route';

   export default function Dashboard() {
     return (
       <ProtectedRoute>
         <h1>Only visible to logged in users</h1>
       </ProtectedRoute>
     );
   }
   ```

See [INSTALL.md](./INSTALL.md) for detailed setup instructions.
