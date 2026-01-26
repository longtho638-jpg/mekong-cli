# 🔌 Integration Guide

This guide details how to connect the individual applications within the bundle to work as a unified system.

## 1. Connecting Landing Page to Auth

The Landing Page (`apps/landing`) needs to redirect users to the Auth application (`apps/auth`) for sign-up and login.

### Configuration
In `apps/landing/.env.local`:
```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3002
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3001
```

### Usage in Components
Use these variables in your Call-to-Action (CTA) buttons:

```tsx
// apps/landing/components/Navbar.tsx
const loginUrl = `${process.env.NEXT_PUBLIC_AUTH_URL}/login`;
const signupUrl = `${process.env.NEXT_PUBLIC_AUTH_URL}/register`;

<Button href={loginUrl}>Log In</Button>
<Button href={signupUrl}>Get Started</Button>
```

## 2. Shared Authentication State

To share login state between `apps/auth` and `apps/dashboard`, you have two primary strategies:

### Strategy A: Subdomain Cookies (Recommended for Prod)
If your apps are hosted on subdomains (e.g., `auth.acme.com` and `app.acme.com`), simply set the cookie domain in your Auth provider config.

**NextAuth Configuration (`apps/auth`):**
```ts
// apps/auth/lib/auth.ts
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      domain: '.acme.com', // Note the leading dot
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

### Strategy B: JWT Verification (Bundled Default)
The Dashboard validates the JWT issued by the Auth app.

1.  **Shared Secret**: Ensure `NEXTAUTH_SECRET` or `JWT_SECRET` is **identical** in both `apps/auth/.env` and `apps/dashboard/.env`.
2.  **Middleware**: `apps/dashboard/middleware.ts` decodes the token.

## 3. Integrating Payment Kit

The Payment Kit (`packages/payment-integration`) is designed to be imported.

### In `apps/landing` (Pricing Page)
Import the pricing components to display plans.

```tsx
import { PricingTable } from '@antigravity/payment-integration';

export default function PricingPage() {
  return <PricingTable />;
}
```

### In `apps/api` (Webhooks)
The API needs to handle Stripe webhooks.

1.  Ensure `apps/api` dependencies include the local package (check `package.json`):
    ```json
    "dependencies": {
      "@antigravity/payment-integration": "workspace:*"
    }
    ```
2.  Register the webhook route in `apps/api/src/routes/webhooks.ts`:
    ```ts
    import { stripeWebhookHandler } from '@antigravity/payment-integration/backend';
    router.post('/stripe', stripeWebhookHandler);
    ```

## 4. Database & Prisma

Both `apps/api` and `apps/auth` (if using Database adapter) need access to the same database.

1.  **Shared Schema**: Ideally, keep a single `schema.prisma` file. By default, it resides in `apps/api/prisma/schema.prisma`.
2.  **Generate Client**: When you run `prisma generate`, it creates the client.
3.  **Import**: Other apps can import the generated client or use a shared database package.

**Best Practice**: In this bundle, `apps/api` owns the database. Other apps should communicate with the DB via HTTP requests to the API, rather than connecting directly, to decouple logic.

## 5. Environment Variables Checklist

Ensure these are consistent across all `.env` files:

*   `DATABASE_URL`
*   `REDIS_URL`
*   `JWT_SECRET` / `NEXTAUTH_SECRET`
*   `STRIPE_SECRET_KEY`

---
**Need more help?** Check the individual `README.md` inside each app folder for specific integration details.
