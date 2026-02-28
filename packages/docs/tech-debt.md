# Technical Debt & Maintenance Log

> **"Be honest about the debt, or it will bankrupt you."**

## Frontend (Next.js)

### 🔴 High Priority
- **PayPal TypeScript Types**:
  - **Issue**: The `paypal-js` integration in `checkout.tsx` lacks strict typing (currently using `any` or loose types).
  - **Risk**: Potential runtime errors during payment processing.
  - **Fix**: Install `@types/paypal-checkout-components` or define proper interfaces for the PayPal SDK window objects.

- **Payment API Integration**:
  - **Issue**: `checkout.tsx` is currently using mock/placeholder calls for the backend API.
  - **Fix**: Wire up `fetch('/api/v1/payments/paypal/create-order', ...)` and handle responses correctly.

### 🟡 Medium Priority
- **MD3 Compliance**:
  - **Issue**: UI components in `frontend/` are not fully compliant with Material Design 3 (M3) strict mode.
  - **Fix**: Update Tailwind classes to use MD3 design tokens (e.g., `bg-[var(--md-sys-color-surface)]`) and standard components.

## Backend (FastAPI)

### 🟡 Medium Priority
- **Webhook Signature Verification**:
  - **Issue**: While implemented, the webhook secrets need to be rigorously tested with "live" keys to ensure signature matching algorithms are exact for each provider (Stripe/PayPal/Gumroad).
  - **Fix**: Add integration tests with real (sandbox) webhook payloads.

## Infrastructure

### 🟢 Low Priority
- **Secrets Management**:
  - **Issue**: Currently relying on `.env` files and GitHub Secrets.
  - **Improvement**: Move to Google Secret Manager for production secrets in the future.
