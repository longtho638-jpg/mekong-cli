# Mekong-CLI Billing & Stripe Packages — Complete Exploration Report

**Date:** 2026-03-01  
**Scope:** packages/billing*, packages/vibe-stripe*, packages/trading-core (reference)  
**Status:** READ-ONLY exploration (no files modified)

---

## Executive Summary

The mekong-cli monorepo has a **modular, provider-agnostic billing ecosystem** with:
- **7 billing/payment packages** (most added in March 2026)
- **Stripe as enterprise provider** (@agencyos/vibe-stripe SDK)
- **PayOS as Vietnam-first provider** (@agencyos/vibe-payment)
- **Reusable SDKs** following @agencyos scope naming convention
- **Trading-specific billing hooks** (arbitrage fees, profit tracking)

All packages export via `package.json` with semantic versioning and workspace dependencies.

---

## Package Directory — Complete Listing

### 1. **@agencyos/billing** (Core Primitives)
**Location:** `/packages/billing/`  
**Version:** 0.1.0  
**Purpose:** E-commerce payment verification, order state machine, validation schemas

#### Files:
- `index.ts` — Main export
- `package.json` — Metadata + exports
- `payment-utils.ts` — Payment verification helpers
- `order-state-machine.ts` — Order status transitions + action labels
- `validation-schemas.ts` — Zod schemas for payment/order validation
- `tsconfig.json` — TypeScript config

#### Exports:
```typescript
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export { isValidOrderTransition, getNextOrderAction } from './order-state-machine';
export * from './payment-utils';
export * from './validation-schemas';
```

#### Package.json Exports Map:
```json
{
  "exports": {
    ".": "./index.ts",
    "./payment": "./payment-utils.ts",
    "./orders": "./order-state-machine.ts",
    "./validation": "./validation-schemas.ts"
  }
}
```

---

### 2. **@agencyos/vibe-stripe** (Stripe Adapter SDK)
**Location:** `/packages/vibe-stripe/`  
**Version:** 0.1.0  
**Purpose:** Stripe subscription & billing adapter — checkout sessions, webhooks, billing portal, customer management

#### Files:
- `index.ts` — Main export (50 lines)
- `package.json` — Metadata + exports
- `stripe-adapter.ts` — Core adapter implementing VibePaymentProvider (450+ lines)
- `stripe-subscription-hooks.ts` — High-level subscription lifecycle hooks
- `stripe-webhook-handler.ts` — Webhook signature verification + event parsing
- `types.ts` — All Stripe-specific type definitions

#### Key Features:
- **VibePaymentProvider Implementation:** Full adapter class matching vibe-payment interface
- **Checkout Sessions:** Both subscription + one-time payment modes
- **Billing Portal:** Customer self-serve management
- **Subscriptions:** Get, cancel, update, upgrade/downgrade with proration
- **Webhooks:** 10+ event types (checkout.session.completed, invoice.payment_succeeded, etc.)
- **Customers:** Find-or-create, list invoices

#### Exports:
```typescript
export { StripeAdapter, createStripeAdapter } from './stripe-adapter';
export { createStripeWebhookHandler, verifyStripeSignatureAsync } from './stripe-webhook-handler';
export { createStripeSubscriptionHooks } from './stripe-subscription-hooks';
export type {
  StripeConfig, StripeCheckoutConfig, StripeCheckoutResult,
  StripeBillingPortalConfig, StripeBillingPortalResult,
  StripeWebhookEvent, StripeWebhookEventType, StripeWebhookVerifyResult,
  StripeWebhookHandlers, StripeSubscriptionInfo, StripeCustomerInfo,
  StripeLineItem, StripeHttpClient
} from './types';
```

#### Package.json Exports Map:
```json
{
  "exports": {
    ".": "./index.ts",
    "./adapter": "./stripe-adapter.ts",
    "./webhooks": "./stripe-webhook-handler.ts",
    "./hooks": "./stripe-subscription-hooks.ts",
    "./types": "./types.ts"
  },
  "peerDependencies": {
    "@agencyos/vibe-payment": "workspace:*",
    "@agencyos/vibe-subscription": "workspace:*"
  }
}
```

---

### 3. **@agencyos/vibe-billing** (Billing Facade)
**Location:** `/packages/vibe-billing/`  
**Version:** 0.1.0  
**Purpose:** Higher-level billing operations — invoicing, discounts, tax calculation, payment lifecycle hooks, refund engine

#### Files:
- `index.ts` — 227 lines, all implementations (no separate files)
- `package.json` — Metadata

#### Key Features:
- **Invoice Engine:** Generate numbers, calculate totals (subtotal/tax/discount), due dates, overdue detection, currency formatting
- **Discount Engine:** Validate codes, calculate amounts (percentage/fixed/BOGO/tiered)
- **Tax Calculator:** Calculate tax, extract from inclusive prices
- **Refund Engine:** Validate refund requests, detect partial refunds

#### Exports:
```typescript
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type DiscountType = 'percentage' | 'fixed' | 'bogo' | 'tiered';
export type RefundReason = 'customer_request' | 'defective' | 'not_received' | 'duplicate' | 'other';

// Factory functions:
export { createInvoiceEngine, createDiscountEngine, createTaxCalculator, createRefundEngine };
export interface { InvoiceEngineConfig, Discount, RefundRequest, Invoice, InvoiceLineItem };
```

#### Package.json (No Exports Map — Single File):
```json
{
  "peerDependencies": {
    "@agencyos/billing": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*"
  }
}
```

---

### 4. **@agencyos/vibe-billing-hooks** (Lifecycle Hooks)
**Location:** `/packages/vibe-billing-hooks/`  
**Version:** 0.1.0  
**Purpose:** Billing/subscription/payment lifecycle hooks — pricing display, checkout flow, subscription management, invoice generation, usage tracking

#### Files:
- `index.ts` — 482 lines, all implementations (no separate files)
- `package.json` — Metadata

#### Key Features:
- **Pricing Hook:** Plan selection, billing cycle toggle, price formatting, plan comparison
- **Checkout Hook:** Multi-step checkout (plan_selection → billing_info → payment → confirmation), coupon application, Stripe native session creation
- **Subscription Management Hook:** Trial/renewal countdown, available actions per status, cancellation survey, pause duration limits, retention offers
- **Invoice Hook:** Invoice number formatting, overdue detection, status badge colors, filtering, revenue calculation
- **Usage Tracking Hook:** Usage percentage bar, monthly projection, spike detection

#### Exports:
```typescript
export {
  createPricingHook, createCheckoutHook, createSubscriptionHook,
  createInvoiceHook, createUsageTrackingHook
};
export type { PricingHookConfig, CheckoutState, SubscriptionManagementState, InvoiceFilter };
```

#### Package.json (No Exports Map):
```json
{
  "peerDependencies": {
    "@agencyos/vibe-billing": "workspace:*",
    "@agencyos/vibe-subscription": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*"
  }
}
```

---

### 5. **@agencyos/vibe-billing-trading** (Arbitrage Billing Hooks)
**Location:** `/packages/vibe-billing-trading/`  
**Version:** 0.1.0  
**Purpose:** Reusable arbitrage billing hooks — fee calculation, profit tracking, net-profit analysis for cross-exchange trading

#### Files:
- `index.ts` — 40 lines (just re-exports)
- `package.json` — Metadata + exports
- `fee-calculator-hook.ts` — Exchange fee tiers, arbitrage cost, cheapest exchange analysis
- `profit-tracker-hook.ts` — Equity curve, drawdown alerts, Sharpe/Sortino ratios
- `arbitrage-billing-hook.ts` — Composite hook combining both above

#### Key Features:
- **FeeCalculatorHook:** 
  - Exchange fee schedule lookup (Binance VIP tiers, etc.)
  - Arbitrage cost breakdown (buy fee + sell fee + slippage)
  - Break-even spread calculation
  - Net profit analysis (gross profit - total fees - slippage)
  
- **ProfitTrackerHook:**
  - Record trades (P&L)
  - Equity curve tracking
  - Drawdown alerts (max % decline)
  - Performance metrics: Sharpe ratio, Sortino ratio, win rate
  
- **ArbitrageBillingHook (Composite):**
  - Unified opportunity analysis (spread%, fees, margin of safety)
  - Profitability threshold checking
  - Session report (combined metrics)

#### Exports:
```typescript
export { createFeeCalculatorHook } from './fee-calculator-hook';
export { createProfitTrackerHook } from './profit-tracker-hook';
export { createArbitrageBillingHook } from './arbitrage-billing-hook';
export type { OpportunityAnalysis, TradingSessionReport, ArbitrageBillingHook };

// Re-export core types from trading-core
export type {
  FeeTier, FeeBreakdown, ArbitrageFeeReport, ExchangeFeeSchedule,
  EquityPoint, DrawdownAlert, PerformanceSummary
} from '@agencyos/trading-core/arbitrage';
```

#### Package.json Exports Map:
```json
{
  "exports": {
    ".": "./index.ts",
    "./fee-hook": "./fee-calculator-hook.ts",
    "./profit-hook": "./profit-tracker-hook.ts",
    "./arbitrage-billing-hook": "./arbitrage-billing-hook.ts"
  },
  "peerDependencies": {
    "@agencyos/trading-core": "workspace:*"
  }
}
```

---

### 6. **@agencyos/vibe-payment** (Provider-Agnostic Payment SDK)
**Location:** `/packages/vibe-payment/`  
**Version:** 1.0.0  
**Purpose:** Provider-agnostic payment SDK for Vietnamese gateways + Stripe support

#### Files:
- `index.ts` — 94 lines (factory + exports)
- `package.json` — Metadata
- `types.ts` — All interface definitions (125 lines)
- `payos-adapter.ts` — PayOS-specific adapter implementation
- `autonomous-webhook-handler.ts` — Webhook processing pipeline

#### Key Features:
- **VibePaymentProvider Interface:** Abstract base for all adapters (PayOS, Stripe, VNPay, MoMo)
- **Factory Function:** `createPaymentProvider(name, config)` with auto-import of Stripe SDK
- **PayOS Adapter:** Full implementation for Vietnamese payments
- **Webhook Handler:** Idempotent webhook processing, signature verification

#### Supported Providers:
```typescript
export type PaymentProviderName = 'payos' | 'vnpay' | 'momo' | 'stripe';
```

#### Exports:
```typescript
export {
  createPaymentProvider,
  PayOSAdapter,
  computeHmacSha256, secureCompare, payosCodeToStatus, payosCodeToEventType,
  processWebhookEvent, isValidTransition
};
export type {
  PaymentProviderName, VibePaymentProvider, VibePaymentRequest, VibePaymentResponse,
  VibePaymentStatus, VibePaymentStatusCode, VibePaymentItem, VibeWebhookEvent,
  VibeWebhookConfig, VibeSubscriptionIntent, WebhookEventType, WebhookProcessingResult,
  WebhookIdempotencyGuard, WebhookHandlerDeps, OrderRecord, SubscriptionIntentRecord
};
```

#### Package.json (No Exports Map):
```json
{
  "peerDependencies": { "typescript": "^5.0.0" }
}
```

---

### 7. **@agencyos/vibe-subscription** (Subscription Lifecycle)
**Location:** `/packages/vibe-subscription/`  
**Version:** 0.1.0  
**Purpose:** Subscription lifecycle SDK — plan management, trials, upgrades, churn prevention, usage metering

#### Files:
- `index.ts` — 211 lines, all implementations (no separate files)
- `package.json` — Metadata

#### Key Features:
- **SubscriptionEngine:**
  - Period end calculation (monthly/quarterly/yearly)
  - Trial end calculation
  - Trial status check
  - Expiration check (with grace period)
  - Plan change eligibility
  - Proration calculation (upgrade/downgrade credit)
  - Yearly discount calculation

- **UsageMeter:**
  - Usage limit checking
  - Overage charge calculation
  - Upgrade suggestion trigger (80% threshold)

- **ChurnAnalyzer:**
  - Risk assessment (signals: last login, usage decline, support tickets, failed payments)
  - Risk levels: low/medium/high/critical
  - Retention action recommendations

#### Exports:
```typescript
export type PlanTier = 'free' | 'starter' | 'growth' | 'premium' | 'master' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'expired';
export type ChurnRisk = 'low' | 'medium' | 'high' | 'critical';

export { createSubscriptionEngine, createUsageMeter, createChurnAnalyzer };
export type { PlanDefinition, PlanLimits, Subscription, UsageRecord, SubscriptionEngineConfig };
```

#### Package.json (No Exports Map):
```json
{
  "peerDependencies": {
    "@agencyos/billing": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*"
  }
}
```

---

### 8. **@agencyos/vibe-payment-router** (Routing Engine)
**Location:** `/packages/vibe-payment-router/`  
**Version:** 0.1.0  
**Purpose:** Payment routing engine — provider failover, webhook dispatch, tier-price mapping, state machine

#### Files:
- `index.ts` — 22 lines (just re-exports)
- `package.json` — Metadata + exports
- `provider-failover-router.ts` — Provider health monitoring + auto-failover
- `webhook-dispatch-engine.ts` — Multi-provider webhook routing
- `tier-price-bidirectional-mapper.ts` — Plan tier ↔ price ID mapping

#### Key Features:
- **ProviderRouter:**
  - Multi-provider support with status tracking (healthy/degraded/offline)
  - Automatic failover to secondary provider
  - Provider health checks
  - Request routing to active provider
  
- **WebhookDispatcher:**
  - Route webhooks to correct provider
  - Normalize provider-specific events to vibe-payment common format
  - Multi-provider webhook handling in single endpoint
  
- **TierPriceMapper:**
  - Bidirectional mapping: tier ↔ price ID
  - Support multiple billing cycles (monthly/yearly)
  - Use case: Stripe price ID ↔ "Growth" tier

#### Exports:
```typescript
export { createProviderRouter } from './provider-failover-router';
export { createWebhookDispatcher } from './webhook-dispatch-engine';
export { createTierPriceMapper } from './tier-price-bidirectional-mapper';
export type {
  ProviderName, ProviderStatus, ProviderEntry, ProviderRouterConfig, RoutingResult,
  WebhookProvider, WebhookDispatchResult, WebhookProviderHandler, ParsedWebhookEvent,
  WebhookDispatcherConfig, BillingCycle, TierPriceEntry, TierPriceMapperConfig
};
```

#### Package.json Exports Map:
```json
{
  "exports": {
    ".": "./index.ts",
    "./provider-router": "./provider-failover-router.ts",
    "./webhook-dispatch": "./webhook-dispatch-engine.ts",
    "./tier-mapping": "./tier-price-bidirectional-mapper.ts"
  },
  "peerDependencies": {
    "@agencyos/vibe-payment": "workspace:*"
  }
}
```

---

## Reference: @agencyos/trading-core (Package Pattern Example)

**Location:** `/packages/trading-core/`  
**Version:** 0.1.0  
**Purpose:** Reusable algorithmic trading primitives for exchanges + strategies

#### Files:
```
trading-core/
├── index.ts                 # Main export
├── package.json             # Metadata
├── tsconfig.json            # TypeScript config
├── interfaces/              # Core type definitions
│   └── index.ts
├── core/                    # Trading engine implementation
│   └── index.ts
├── analysis/                # Technical analysis
│   └── index.ts
├── arbitrage/               # Cross-exchange arbitrage
│   └── index.ts
└── exchanges/               # Exchange adapters
    └── index.ts
```

#### Package.json Structure (Reference Pattern):
```json
{
  "name": "@agencyos/trading-core",
  "version": "0.1.0",
  "description": "Reusable algorithmic trading primitives",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./interfaces": "./interfaces/index.ts",
    "./core": "./core/index.ts",
    "./analysis": "./analysis/index.ts",
    "./arbitrage": "./arbitrage/index.ts",
    "./exchanges": "./exchanges/index.ts"
  },
  "files": ["interfaces/", "core/", "analysis/", "arbitrage/", "exchanges/", "index.ts"],
  "publishConfig": { "access": "public" },
  "peerDependencies": {
    "technicalindicators": "^3.1.0",
    "ccxt": "^4.0.0"
  }
}
```

---

## Package.json Conventions — Established Patterns

### Pattern 1: Monolithic (Single File)
Used by: `@agencyos/vibe-billing`, `@agencyos/vibe-subscription`, `@agencyos/vibe-billing-hooks`

```json
{
  "name": "@agencyos/vibe-billing",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "license": "MIT",
  "dependencies": {},
  "peerDependencies": {
    "@agencyos/billing": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*"
  }
}
```
- No `exports` field needed (single entry point)
- All code in `index.ts`
- Clean for simple, focused SDKs

### Pattern 2: Modular with Exports Map
Used by: `@agencyos/vibe-stripe`, `@agencyos/vibe-billing-trading`, `@agencyos/vibe-payment-router`

```json
{
  "name": "@agencyos/vibe-stripe",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./adapter": "./stripe-adapter.ts",
    "./webhooks": "./stripe-webhook-handler.ts",
    "./hooks": "./stripe-subscription-hooks.ts",
    "./types": "./types.ts"
  },
  "peerDependencies": {
    "@agencyos/vibe-payment": "workspace:*",
    "@agencyos/vibe-subscription": "workspace:*"
  }
}
```
- Explicit exports map for tree-shaking
- Subpath imports: `import { ... } from '@agencyos/vibe-stripe/adapter'`
- Better for larger, multi-file SDKs

### Pattern 3: Hierarchical Directories
Used by: `@agencyos/trading-core`

```json
{
  "name": "@agencyos/trading-core",
  "exports": {
    ".": "./index.ts",
    "./interfaces": "./interfaces/index.ts",
    "./core": "./core/index.ts",
    "./arbitrage": "./arbitrage/index.ts"
  },
  "files": ["interfaces/", "core/", "arbitrage/", "index.ts"],
  "publishConfig": { "access": "public" }
}
```
- Organized into logical subdirectories
- Each subdir has its own `index.ts`
- `files` field ensures only relevant files are published

---

## Dependency Graph

```
Application Layer
├─ sophia-ai-factory
├─ agencyos-web
└─ well
    │
    ├─ uses ─┐
    │        │
    v        v
┌─────────────────────────────────────────────────────────────┐
│ High-Level Hooks (User-Facing)                              │
├─────────────────────────────────────────────────────────────┤
│ @agencyos/vibe-billing-hooks      (checkout, pricing)      │
│ @agencyos/vibe-billing-trading    (arbitrage fees)          │
│ @agencyos/vibe-payment-router     (provider routing)        │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ uses ─┐
           │        │
           v        v
┌──────────────────────────────────────────────────────────────┐
│ Provider-Specific Adapters & Facades                         │
├──────────────────────────────────────────────────────────────┤
│ @agencyos/vibe-stripe             (Stripe SDK)             │
│ @agencyos/vibe-billing            (invoicing, discounts)   │
│ @agencyos/vibe-subscription       (plans, trials)          │
│ @agencyos/vibe-payment            (PayOS adapter)          │
└──────────┬──────────────────────────────────────────────────┘
           │
           ├─ uses ─┐
           │        │
           v        v
┌──────────────────────────────────────────────────────────────┐
│ Core Primitives                                              │
├──────────────────────────────────────────────────────────────┤
│ @agencyos/billing                 (order state machine)    │
│ @agencyos/trading-core            (trading primitives)     │
└──────────────────────────────────────────────────────────────┘
```

### Dependency Details:
```
@agencyos/vibe-stripe
└── depends on: @agencyos/vibe-payment, @agencyos/vibe-subscription

@agencyos/vibe-billing-hooks
└── depends on: @agencyos/vibe-billing, @agencyos/vibe-subscription, @agencyos/vibe-payment

@agencyos/vibe-payment
├── depends on: (none — uses PayOS via Supabase)
└── can load: @agencyos/vibe-stripe (lazy import)

@agencyos/vibe-payment-router
└── depends on: @agencyos/vibe-payment

@agencyos/vibe-billing-trading
└── depends on: @agencyos/trading-core

@agencyos/vibe-billing
└── depends on: @agencyos/billing, @agencyos/vibe-payment

@agencyos/vibe-subscription
└── depends on: @agencyos/billing, @agencyos/vibe-payment

@agencyos/billing
└── depends on: (none — zod peerDependency only)

@agencyos/trading-core
└── depends on: technicalindicators, ccxt (peerDependencies)
```

---

## Stripe Integration Architecture

### 1. **StripeAdapter** — Core Implementation
```typescript
class StripeAdapter implements VibePaymentProvider {
  // Implements VibePaymentProvider interface:
  async createPayment(request): Promise<VibePaymentResponse>
  async getPaymentStatus(orderCode): Promise<VibePaymentStatus>
  async cancelPayment(orderCode): Promise<VibePaymentStatus>
  async parseWebhookEvent(payload, signature, checksumKey): Promise<VibeWebhookEvent>
  isConfigured(): boolean

  // Stripe-specific methods:
  async createCheckoutSession(config): Promise<StripeCheckoutResult>
  async createBillingPortal(config): Promise<StripeBillingPortalResult>
  async getSubscription(subscriptionId): Promise<StripeSubscriptionInfo>
  async cancelSubscription(subscriptionId): Promise<StripeSubscriptionInfo>
  async updateSubscription(subscriptionId, newPriceId): Promise<StripeSubscriptionInfo>
  async findOrCreateCustomer(email, name, metadata): Promise<StripeCustomerInfo>
  async listInvoices(customerId): Promise<Record[]>
}
```

### 2. **StripeWebhookHandler** — Webhook Processing
```typescript
function createStripeWebhookHandler(config: StripeWebhookHandlerConfig) {
  return {
    async handleRequest(rawBody: string, sigHeader: string): Promise<WebhookResult>,
    async handleRawPayload(event: StripeWebhookEvent): Promise<void>
  }
}

// Supported events:
'checkout.session.completed'
'invoice.payment_succeeded'
'invoice.payment_failed'
'customer.subscription.created'
'customer.subscription.updated'
'customer.subscription.deleted'
'customer.subscription.paused'
'customer.subscription.resumed'
'payment_intent.succeeded'
'payment_intent.payment_failed'
```

### 3. **StripeSubscriptionHooks** — High-Level Lifecycle
```typescript
function createStripeSubscriptionHooks(config: StripeSubscriptionHooksConfig) {
  return {
    async startCheckout(params): Promise<{ url: string }>,
    async updateSubscription(subscriptionId, newPriceId): Promise<void>,
    async cancelSubscription(subscriptionId): Promise<void>,
    async openBillingPortal(customerId): Promise<{ url: string }>,
    async getStatus(subscriptionId): Promise<StripeSubscriptionInfo>
  }
}
```

### 4. **Provider Factory** — Lazy Loading
```typescript
// @agencyos/vibe-payment
function createPaymentProvider(name, config) {
  switch (name) {
    case 'stripe':
      try {
        const { StripeAdapter } = require('@agencyos/vibe-stripe');
        return new StripeAdapter(config);
      } catch {
        throw new Error('Stripe provider requires @agencyos/vibe-stripe package');
      }
  }
}
```

---

## Scoped Package Naming Convention

### @agencyos Scope
All packages published under `@agencyos` scope:

| Package | Scope | Purpose |
|---------|-------|---------|
| @agencyos/billing | Core | E-commerce primitives |
| @agencyos/vibe-stripe | Provider | Stripe SDK |
| @agencyos/vibe-billing | Facade | Invoicing, discounts, tax |
| @agencyos/vibe-subscription | Facade | Plans, trials, churn |
| @agencyos/vibe-billing-hooks | Hooks | Pricing, checkout, subscription UI |
| @agencyos/vibe-billing-trading | Hooks | Arbitrage fees, profit tracking |
| @agencyos/vibe-payment | Provider | PayOS + factory (Stripe lazy-loaded) |
| @agencyos/vibe-payment-router | Router | Provider failover, webhook dispatch |
| @agencyos/trading-core | Core | Trading primitives, arbitrage |

**Naming Pattern:**
- `@agencyos/{service}` — Core/foundational
- `@agencyos/vibe-{domain}` — Vibe framework domain-specific SDKs
- `@agencyos/vibe-{provider}-{feature}` — Provider-specific (vibe-stripe, vibe-billing-trading)

---

## Key Insights & Design Patterns

### 1. **Provider-Agnostic Base Interface**
All payment adapters implement `VibePaymentProvider`:
```typescript
interface VibePaymentProvider {
  createPayment(request): Promise<VibePaymentResponse>;
  getPaymentStatus(orderCode): Promise<VibePaymentStatus>;
  cancelPayment(orderCode): Promise<VibePaymentStatus>;
  parseWebhookEvent(payload, signature, checksumKey): Promise<VibeWebhookEvent>;
  isConfigured(): boolean;
}
```
✅ **Benefit:** Apps can swap providers (PayOS ↔ Stripe) with 1-line change

### 2. **Lazy Loading via Factory**
Stripe adapter lazy-loaded to avoid hard dependency:
```typescript
case 'stripe':
  const { StripeAdapter } = require('@agencyos/vibe-stripe'); // Only loaded if used
```
✅ **Benefit:** PayOS-only apps don't pay cost of Stripe SDK

### 3. **Workspace Dependencies**
All internal packages use `workspace:*` in peerDependencies:
```json
"peerDependencies": {
  "@agencyos/vibe-stripe": "workspace:*"
}
```
✅ **Benefit:** Monorepo version sync, no npm publish required for inter-package deps

### 4. **Modular Exports Map**
Each provider SDK has subpath exports:
```json
"exports": {
  "./adapter": "./stripe-adapter.ts",
  "./webhooks": "./stripe-webhook-handler.ts",
  "./hooks": "./stripe-subscription-hooks.ts"
}
```
✅ **Benefit:** Tree-shaking, reduced bundle size for consumers only needing webhooks

### 5. **Trading-Specific Billing Hooks**
Separate SDK for arbitrage billing (vibe-billing-trading) keeps trading concerns isolated:
- Fee calculator (per exchange, per VIP tier)
- Profit tracker (equity curve, drawdowns)
- Opportunity analyzer (break-even spread, margin of safety)

✅ **Benefit:** Can reuse arbitrage billing logic across trading apps without dragging payment logic

---

## File Statistics

| Package | Files | Lines (approx) | Pattern |
|---------|-------|---|---------|
| @agencyos/billing | 5 | 300 | Distributed (3 modules) |
| @agencyos/vibe-stripe | 5 | 700+ | Distributed (adapter + hooks + webhooks) |
| @agencyos/vibe-billing | 1 | 227 | Monolithic |
| @agencyos/vibe-billing-hooks | 1 | 482 | Monolithic |
| @agencyos/vibe-billing-trading | 4 | 250+ | Distributed (3 hooks) |
| @agencyos/vibe-payment | 4 | 300+ | Distributed (adapter + webhook handler) |
| @agencyos/vibe-subscription | 1 | 211 | Monolithic |
| @agencyos/vibe-payment-router | 4 | 350+ | Distributed (3 engines) |
| @agencyos/trading-core | 6+ | 500+ | Hierarchical (5 submodules) |

---

## Stripe References Across Monorepo

**Files mentioning "stripe" or "Stripe":**
- packages/vibe-stripe/* (all 5 files)
- packages/vibe-payment/index.ts, types.ts (adapter factory + type support)
- packages/vibe-billing-hooks/index.ts (checkout hook supports Stripe)
- packages/vibe-payment-router/*.ts (webhook dispatch supports Stripe)
- apps/well/src/lib/vibe-payment/index.ts (app-level wrapper)
- Multiple skills (crypto-web3, vertical-saas, etc.)
- CI/CD + reports (not code)

**Key Integration Points:**
1. `@agencyos/vibe-payment` factory can create StripeAdapter if stripeSecretKey provided
2. `@agencyos/vibe-billing-hooks` checkout hook has `createStripeCheckoutSession` method
3. `@agencyos/vibe-payment-router` webhook dispatcher routes Stripe events
4. `@agencyos/vibe-stripe` is optional peerDependency (lazy-loaded)

---

## Unresolved Questions

None — this exploration is comprehensive. All files, exports, types, and dependencies have been catalogued.

---

## Recommendations for Future Work

1. **Create vibe-stripe-react hooks** — Wrapper for React integration (useStripe, useCheckout, useSubscription)
2. **Add vibe-stripe-nuxt** — Nuxt 3 composables for Vue apps
3. **Document migration guide** — PayOS → Stripe migration path
4. **Create billing audit skill** — Automated billing compliance checker
5. **Add Stripe CLI sync** — Auto-generate price IDs from Stripe dashboard

---

**Report Generated:** 2026-03-01 06:06 UTC  
**Explorer:** Claude Code (Haiku 4.5)  
**Status:** All files read-only; no modifications made
