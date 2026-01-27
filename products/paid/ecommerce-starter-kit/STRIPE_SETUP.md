# Stripe Setup Guide

This guide will help you configure Stripe for payments and webhooks.

## 1. Create a Stripe Account

If you don't have one, sign up at [stripe.com](https://stripe.com).

## 2. API Keys

1. Go to **Developers** -> **API Keys** in your Stripe Dashboard.
2. Copy the **Publishable Key** (`pk_test_...`) and add it to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env.local`.
3. Copy the **Secret Key** (`sk_test_...`) and add it to `STRIPE_SECRET_KEY` in `.env.local`.

## 3. Webhook Configuration (Local Development)

To test payments locally, you need the Stripe CLI to forward webhooks to your localhost.

1. **Install Stripe CLI**:
   - macOS (Homebrew): `brew install stripe/stripe-cli/stripe`
   - Windows: Download from Stripe website.

2. **Login**:
   ```bash
   stripe login
   ```

3. **Listen for events**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks
   ```

4. **Get Webhook Secret**:
   The CLI will output a webhook signing secret (`whsec_...`).
   Copy this value and add it to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## 4. Webhook Configuration (Production)

1. Go to **Developers** -> **Webhooks** in Stripe Dashboard.
2. Click **Add endpoint**.
3. Enter your production URL: `https://your-domain.com/api/webhooks`.
4. Select events to listen for. Essential event:
   - `checkout.session.completed`
5. Click **Add endpoint**.
6. Reveal the **Signing secret** and add it to your production environment variables.

## 5. Testing Payments

1. Ensure your app is running (`npm run dev`) and Stripe CLI is listening.
2. Add an item to cart and proceed to checkout.
3. Use [Stripe Test Cards](https://stripe.com/docs/testing) to complete the purchase.
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any valid ZIP (e.g., 10001)

4. Check your Supabase `orders` table to see the new order.
