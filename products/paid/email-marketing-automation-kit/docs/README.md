# Antigravity Email Marketing Automation Kit

Stop wrestling with HTML tables and email clients. This kit provides production-ready, responsive email templates built with React Email, along with a robust multi-provider sending infrastructure.

## Features

- **13+ Production-Ready Templates**: Transactional, Welcome Sequences, and Newsletters.
- **Multi-Provider Support**: Built-in integration for Resend (Primary) and SendGrid (Fallback).
- **React Email**: Write emails using modern React components and Tailwind CSS.
- **Preview Tool**: Browser-based previewer with mobile/desktop toggle.
- **Testing Utilities**: Spam score checker, HTML validator, and link checker.
- **Type-Safe**: 100% TypeScript.

## Architecture

```
email-marketing-automation-kit/
├── templates/          # React Email components
├── services/           # Email sending logic & provider integration
├── pages/api/          # Next.js API routes for sending & previewing
├── components/         # UI components for the preview tool
└── utils/              # Testing utilities (Spam check, etc.)
```

## Quick Start

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Copy `.env.example` to `.env` and add your API keys.
    ```bash
    cp .env.example .env
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Open Preview Tool**:
    Visit `http://localhost:3000/preview` to see your templates.

## Licensing

Standard License: Use in unlimited personal and commercial projects.
Extended License: Use in client projects or redistribution.

Copyright © 2026 Antigravity. All rights reserved.
