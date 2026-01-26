# Provider Configuration Guide

This guide explains how to configure supported webhook providers to send events to your Webhook Manager Kit instance.

## General Configuration

1.  Deploy your Webhook Manager Kit (see [DEPLOYMENT.md](DEPLOYMENT.md)).
2.  Your Receiver URL will be: `https://your-domain.com/api/v1/receiver/{provider}`
    *   Example: `https://api.myapp.com/api/v1/receiver/stripe`
3.  Set the corresponding secret in your `.env` file.

---

## Stripe

1.  Go to your [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2.  Click **Add endpoint**.
3.  Enter your URL: `https://your-domain.com/api/v1/receiver/stripe`
4.  Select events to listen to (e.g., `payment_intent.succeeded`, `charge.failed`).
5.  Click **Add endpoint**.
6.  Reveal the **Signing secret** (starts with `whsec_`).
7.  Add to `.env`:
    ```env
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

## GitHub

1.  Go to your Repository Settings > **Webhooks**.
2.  Click **Add webhook**.
3.  Payload URL: `https://your-domain.com/api/v1/receiver/github`
4.  Content type: `application/json`.
5.  Secret: Generate a random string (e.g., using `openssl rand -hex 20`).
6.  Add to `.env`:
    ```env
    GITHUB_WEBHOOK_SECRET=your_random_string
    ```

## Shopify

1.  Go to Settings > **Notifications**.
2.  Scroll down to **Webhooks** and click **Create webhook**.
3.  Event: Select topic (e.g., `Order creation`).
4.  Format: `JSON`.
5.  URL: `https://your-domain.com/api/v1/receiver/shopify`
6.  Webhook API version: (Latest).
7.  Save.
8.  Scroll down to the bottom to find your **Client secret** (or specific webhook secret if provided).
9.  Add to `.env`:
    ```env
    SHOPIFY_WEBHOOK_SECRET=your_secret
    ```

## Gumroad

1.  Go to Settings > **Advanced**.
2.  Under **Ping**, enter your URL: `https://your-domain.com/api/v1/receiver/gumroad`
3.  Gumroad does not strictly sign webhooks with a header secret like others. It relies on the secure URL or verifying the sale ID via API back-check.
4.  For this kit, you can set an optional secret in `.env` if you wish to enforce custom validation logic later, or leave it blank to accept all Gumroad pings (validated by ensuring `resource_name` exists).
    ```env
    GUMROAD_WEBHOOK_SECRET=optional_secret
    ```

---

## Adding New Providers

To add a new provider:

1.  Create a new Verifier class in `backend/app/services/verification/providers.py`.
2.  Update `backend/app/api/endpoints/receiver.py` to handle the new provider route and verification call.
3.  Add the secret config to `backend/app/core/config.py`.
