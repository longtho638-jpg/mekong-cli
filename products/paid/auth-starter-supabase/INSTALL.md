# Installation Guide

Follow these steps to integrate the Auth Starter into your Next.js project.

## Prerequisites

- Next.js 13/14+ project (App Router recommended)
- Supabase project (create one at [database.new](https://database.new))

## Step 1: Copy Files

Copy the contents of this package into your project source directory (e.g., `src/` or `app/`).

Recommended structure:
```
src/
  components/
    auth/           <-- Copy here
    protected/      <-- Copy here
  hooks/            <-- Copy here
  lib/              <-- Copy here
  middleware/       <-- Copy here
  types/            <-- Copy here
```

## Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr next-themes
# Optional: Install icons
npm install lucide-react
```

## Step 3: Setup Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

You can find these keys in your Supabase Dashboard > Project Settings > API.

## Step 4: Setup Middleware

Create or update `middleware.ts` in your project root (or `src/`):

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from './middleware/auth-middleware'; // Adjust path

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

## Step 5: Create Auth Routes

Create the page files for the auth flows in your App Router:

**`app/auth/login/page.tsx`**
```tsx
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </div>
  );
}
```

Repeat for:
- `app/auth/signup/page.tsx` -> `SignupForm`
- `app/auth/forgot-password/page.tsx` -> `ForgotPasswordForm`
- `app/auth/reset-password/page.tsx` -> `ResetPasswordForm`

## Step 6: Auth Callback

Create a route handler for auth callbacks (email verification, password reset):

**`app/auth/callback/route.ts`**
```typescript
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
```

## Troubleshooting

- **Redirect Loop**: Check your middleware logic in `middleware/auth-middleware.ts`.
- **Session not persisting**: Ensure `supabase-ssr` is configured correctly with cookie handling.
- **Styling issues**: Ensure Tailwind CSS is configured in your project.
