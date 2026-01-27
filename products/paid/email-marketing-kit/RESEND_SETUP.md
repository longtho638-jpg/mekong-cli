# Resend Setup Guide

This guide explains how to configure the Email Marketing Kit to use Resend as your email service provider.

## Prerequisites

1.  A [Resend](https://resend.com) account.
2.  A verified domain on Resend (recommended for production).

## Configuration

1.  **Get your API Key**:
    *   Log in to your Resend dashboard.
    *   Go to **API Keys** and create a new key.
    *   Copy the key (e.g., `re_123456789...`).

2.  **Update Environment Variables**:
    *   Open your `.env` file.
    *   Set `RESEND_API_KEY` to your API key.
    *   Ensure `DEFAULT_FROM_EMAIL` matches a verified domain or the testing domain provided by Resend (e.g., `onboarding@resend.dev`).

    ```bash
    RESEND_API_KEY=re_123456789...
    DEFAULT_FROM_EMAIL=you@yourdomain.com
    ```

3.  **Restart the Worker**:
    *   If running with Docker: `docker-compose restart worker`
    *   If running locally: Restart your ARQ worker process.

## Verification

To verify the integration:

1.  Create a test campaign or use the API to trigger an email.
2.  Check the logs of the worker service. You should see "Email sent successfully" with `provider="resend"`.
3.  Check your Resend dashboard to see the delivered email.

## Troubleshooting

*   **403 Forbidden**: Your API key might be invalid or missing permissions.
*   **422 Unprocessable Entity**: The `from` address might be incorrect or unverified.
*   **Rate Limits**: Resend has rate limits. The kit handles standard sending, but be aware of your plan limits.
