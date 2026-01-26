# Installation Guide

Follow these steps to integrate the Payment Integration Kit into your Next.js project.

## Prerequisites

*   A Next.js project (App Router recommended).
*   A Stripe account (standard or express).
*   Node.js & npm/yarn/pnpm installed.

## Step 1: Install Dependencies

Run the following command in your project root:

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js date-fns lucide-react
# or
yarn add stripe @stripe/stripe-js @stripe/react-stripe-js date-fns lucide-react
```

## Step 2: Configure Environment Variables

1.  Copy the contents of `payment-integration-kit/.env.example` to your project's `.env.local` or `.env` file.
2.  Go to your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
3.  Copy the **Publishable Key** to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
4.  Copy the **Secret Key** to `STRIPE_SECRET_KEY`.

## Step 3: Set Up the Webhook Endpoint

Stripe needs to notify your application about events (payments, new subscriptions, etc.).

1.  Create a file at `app/api/webhooks/route.ts` (if using App Router) or `pages/api/webhooks.ts` (Pages Router).

**For App Router (`app/api/webhooks/route.ts`):**

```typescript
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { processStripeEvent } from "@/path/to/payment-integration-kit/backend/webhooks/stripe-webhook-handler"; // Adjust path

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  try {
    await processStripeEvent(body, signature);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: \`Webhook Error: \${error.message}\` },
      { status: 400 }
    );
  }
}
```

> **Note**: You may need to copy the `backend` folder from this kit into your project (e.g., `lib/payments/backend`) to import `processStripeEvent` correctly.

## Step 4: Configure Stripe Webhooks

1.  Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks).
2.  Click **Add endpoint**.
3.  **Local Development**: Use the Stripe CLI to forward events.
    ```bash
    stripe listen --forward-to localhost:3000/api/webhooks
    ```
    The CLI will give you a **Webhook Secret** (`whsec_...`). Add this to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

4.  **Production**: Set the URL to `https://yourdomain.com/api/webhooks`. Select events to listen to:
    *   `payment_intent.succeeded`
    *   `payment_intent.payment_failed`
    *   `customer.subscription.created`
    *   `customer.subscription.updated`
    *   `customer.subscription.deleted`
    *   `invoice.payment_succeeded`
    *   `invoice.payment_failed`

## Step 5: Implement Backend API Routes

You need API routes to create checkout sessions and portal sessions.

**Create Checkout Session (`app/api/create-checkout-session/route.ts`):**

```typescript
import { stripe } from "@/lib/payments/backend/lib/stripe-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { priceId, customerId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription", // or "payment"
    payment_method_types: ["card"],
    customer: customerId, // Optional: if you have a customer ID
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true\`,
    cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true\`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Create Portal Session (`app/api/create-portal-session/route.ts`):**

```typescript
import { stripe } from "@/lib/payments/backend/lib/stripe-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { customerId } = await req.json();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard\`,
  });

  return NextResponse.json({ url: session.url });
}
```

## Step 6: Use Frontend Components

Copy the `components` folder into your project and use them in your pages.

**Example: Pricing Page (`app/pricing/page.tsx`)**

```tsx
import { PricingTable } from "@/components/pricing/pricing-table";

const plans = [
  {
    id: "price_123", // Stripe Price ID
    name: "Starter",
    price: "$29",
    interval: "month",
    features: ["Feature A", "Feature B"],
  },
  // ...
];

export default function PricingPage() {
  return <PricingTable plans={plans} />;
}
```
