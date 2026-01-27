# SendGrid Setup Guide

This guide explains how to configure the Email Marketing Kit to use SendGrid as your email service provider.

## Prerequisites

1.  A [Twilio SendGrid](https://sendgrid.com) account.
2.  A verified Sender Identity (Single Sender Verification or Domain Authentication).

## Configuration

1.  **Get your API Key**:
    *   Log in to your SendGrid dashboard.
    *   Go to **Settings** > **API Keys**.
    *   Create a new key with "Mail Send" permissions (Full Access is easiest for starting, but Restricted is more secure).
    *   Copy the key (e.g., `SG.xxxx...`).

2.  **Update Environment Variables**:
    *   Open your `.env` file.
    *   Set `SENDGRID_API_KEY` to your API key.
    *   Ensure `DEFAULT_FROM_EMAIL` matches your verified Sender Identity.

    ```bash
    SENDGRID_API_KEY=SG.xxxx...
    DEFAULT_FROM_EMAIL=you@yourdomain.com
    ```

    *Note: If `RESEND_API_KEY` is also set, the system defaults to Resend. Remove or comment out `RESEND_API_KEY` to force SendGrid usage.*

3.  **Restart the Worker**:
    *   If running with Docker: `docker-compose restart worker`
    *   If running locally: Restart your ARQ worker process.

## Verification

To verify the integration:

1.  Create a test campaign.
2.  Check the logs. You should see `provider="sendgrid"`.
3.  Check your SendGrid Activity Feed.
