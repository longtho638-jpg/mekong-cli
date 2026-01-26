# Setup Guide

Follow these steps to get your Email Marketing Automation Kit up and running in less than 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn

## Installation

1.  **Clone or Unzip** the project files.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```

## Configuration

1.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```bash
    RESEND_API_KEY=re_123456789
    SENDGRID_API_KEY=SG.123456789
    ```

    *Note: You only need one of these to get started, but providing both enables the automatic fallback feature.*

## Running the Preview Server

The kit comes with a Next.js-based preview server that allows you to view and test your emails in real-time.

```bash
npm run dev
```

Navigate to `http://localhost:3000/preview` (assuming you set up a page to render the `EmailPreview` component, or use the API directly).

## Sending Your First Email

You can send an email using the provided API route:

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Hello World",
    "template": "welcome",
    "data": { "customerName": "Developer" }
  }'
```

## Deployment

This kit is designed to be integrated into your existing Next.js application or deployed as a microservice.

### Integrating into Next.js App
1.  Copy the `templates/` folder to your project.
2.  Copy `services/` and `utils/` folders.
3.  Install `@react-email/components` and `resend`.
4.  Use `renderTemplate` and `sendEmail` functions in your API routes or Server Actions.

### Deploying as Microservice
1.  Deploy this entire folder to Vercel or any Node.js host.
2.  Expose the `/api/send` endpoint.
3.  Secure the endpoint with an API key middleware (optional but recommended).
