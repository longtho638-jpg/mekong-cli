# Antigravity Payment Integration Kit

**Save 30+ hours of development time with this production-ready Stripe integration kit.**

This kit provides a complete, secure, and type-safe foundation for accepting payments and managing subscriptions in your Next.js application.

## 🚀 Features

*   **One-Time Payments**: Seamless checkout for digital or physical goods.
*   **Subscription Management**: Full lifecycle handling (create, update, cancel, pause).
*   **Secure Webhooks**: Built-in signature verification to prevent spoofing.
*   **Pricing Tables**: Responsive, beautiful pricing UI components.
*   **Customer Portal**: Let users manage their own billing details.
*   **Invoice History**: Display past invoices to your users.
*   **Type-Safe**: 100% TypeScript coverage for Stripe events and components.
*   **PCI Compliance**: Uses Stripe Elements to ensure card data never touches your server.

## 🛠 Tech Stack

*   **Framework**: Next.js 14+ (App Router compatible)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Payments**: Stripe SDK & React Stripe Elements
*   **Icons**: Lucide React

## 📦 What's Inside?

```
payment-integration-kit/
├── backend/
│   ├── webhooks/       # Event handlers for PaymentIntents, Subscriptions, Invoices
│   ├── lib/            # Stripe client initialization & verification logic
│   └── types/          # TypeScript definitions for Stripe events
├── components/
│   ├── checkout/       # Stripe Payment Element form
│   ├── subscription/   # Plan switching & Billing Portal
│   ├── invoices/       # Invoice history list
│   └── pricing/        # Pricing tables
├── hooks/              # React hooks for Stripe, Checkout, and Subscriptions
└── .env.example        # Configuration template
```

## ⚡️ Quick Start

1.  **Install Dependencies**:
    ```bash
    npm install stripe @stripe/stripe-js @stripe/react-stripe-js date-fns lucide-react
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env` and add your Stripe API keys.

3.  **Create API Route**:
    Create `app/api/webhooks/route.ts` and use the provided handler (see `INSTALL.md` for details).

4.  **Use Components**:
    Import `PricingTable` or `SubscriptionManager` into your page.

## 📖 Documentation

*   [Installation Guide](INSTALL.md) - Step-by-step setup instructions.
*   [Security Guide](SECURITY.md) - Webhook verification & best practices.

## 📄 License

Proprietary - For use in your own projects or client work. Redistribution as a standalone starter kit is prohibited.
