# Antigravity Starter Bundle (v1.0.0)

> **Build faster. Ship stronger. Scale simpler.**

Welcome to the Antigravity Starter Bundle, the ultimate collection of production-ready kits designed to accelerate your SaaS development. This bundle brings together 7 essential building blocks, pre-configured and ready to integrate, saving you hundreds of hours of coding and configuration.

## 📦 What's Inside?

This bundle contains the following products:

1.  **AgencyOS Workspace Template** (`products/agencyos-workspace`)
    *   A complete Next.js workspace with dashboard, layout, and theming.
    *   *Status:* **Ready**

2.  **Social Auth Kit** (`products/social-auth-kit`)
    *   Seamless social login integration (Google, GitHub) for your apps.
    *   *Status:* **Ready**

3.  **User Preferences Kit** (`products/user-preferences-kit`)
    *   Manage user settings (theme, notifications, language) with ease.
    *   *Status:* **Ready**

4.  **Webhook Manager Kit** (`products/webhook-manager-kit`)
    *   Receive, verify, and process webhooks reliably.
    *   *Status:* *Coming Soon (Update available via `git pull` or download)*

5.  **API Rate Limiter Kit** (`products/api-rate-limiter-kit`)
    *   Protect your API endpoints from abuse and overuse.
    *   *Status:* *Coming Soon*

6.  **Database Migration Kit** (`products/database-migration-kit`)
    *   Robust schema management and migration tools.
    *   *Status:* *Coming Soon*

7.  **Email Marketing Kit** (`products/email-marketing-kit`)
    *   Transactional emails and marketing campaigns made simple.
    *   *Status:* *Coming Soon*

## 🚀 Getting Started

We've made setup incredibly easy. You can install all ready products with a single script.

### Option 1: The "I want it all now" approach (Recommended)

Run the master installation script:

```bash
cd setup
./install-all.sh
```

This will:
1.  Check for required dependencies (Node.js, Docker).
2.  Install dependencies for all active products.
3.  Set up environment variables (.env files).
4.  Run initial tests to ensure everything is working.

### Option 2: Docker Composition

Launch the entire stack at once:

```bash
cd setup
docker-compose up -d
```

### Option 3: Individual Installation

Navigate to any product folder and follow its specific `README.md`.

```bash
cd products/social-auth-kit
npm install
npm run dev
```

## 📚 Documentation

*   **[Quick Start Guide](QUICK_START.md):** Get up and running in 15 minutes.
*   **[Architecture Overview](ARCHITECTURE.md):** Understand how the pieces fit together.
*   **[Product Index](PRODUCT_INDEX.md):** Detailed docs for each kit.
*   **[FAQ](FAQ.md):** Common questions and answers.

## 🔄 Updates

As new kits (Webhook, Rate Limiter, etc.) are released, you will receive an email notification with a download link for the updated bundle.

## 🆘 Support

If you encounter any issues, please reach out to our support team at [support@antigravity.dev](mailto:support@antigravity.dev) or open an issue in the private GitHub repository if you have access.

---

**Antigravity** - *Defy the friction of development.*
