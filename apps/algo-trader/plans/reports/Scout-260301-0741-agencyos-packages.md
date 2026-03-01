# Scout Report: @agencyos Packages Ecosystem

**Date:** 2026-03-01  
**Project:** algo-trader (Mekong CLI)  
**Scope:** Packages directory at `/Users/macbookprom1/mekong-cli/packages/`

---

## Executive Summary

The `packages/` directory contains a mature, well-organized microservices SDK ecosystem with **85 total packages**:

- **52 vibe-* packages** (domain services: commerce, HR, payments, analytics, etc.)
- **10 Hub SDK packages** (unified facades aggregating related vibes)
- **Core/tooling packages** (shared, core, agents, integrations, etc.)
- **3 trading-specific packages** (trading-core, vibe-arbitrage-engine, vibe-billing-trading)

All packages follow **@agencyos/** namespace convention and are configured for **workspace:* dependencies** (monorepo-native).

---

## Trading Packages (Core Focus)

### 1. @agencyos/trading-core (v0.1.0)
**Path:** `/packages/trading-core/`  
**Status:** Production-ready  
**Role:** Foundation layer — reusable trading primitives

**Exports:**
```typescript
export * from './interfaces';      // Candle types, strategy types, exchange types
export * from './core';            // BaseStrategy, RiskManager, SignalGenerator
export * from './analysis';        // Technical indicators (RSI, SMA, etc.)
export * from './arbitrage';       // Cross-exchange arb monitoring
export * from './exchanges';       // Exchange adapters (Binance, OKX, Bybit)
```

**Structure:**
```
trading-core/
├── interfaces/              # Contract types
│   ├── candle-types.ts
│   ├── strategy-types.ts
│   ├── exchange-types.ts
│   ├── data-provider-types.ts
│   └── config-types.ts
├── core/                    # Base classes
│   ├── base-strategy.ts
│   ├── risk-manager.ts
│   ├── signal-generator.ts
│   └── signal-filter.ts
├── analysis/                # Technical analysis
│   └── technical-indicators.ts
├── arbitrage/               # Arb primitives
├── exchanges/               # Exchange adapters
│   ├── exchange-client-base.ts
│   ├── binance-exchange-adapter.ts
│   ├── okx-exchange-adapter.ts
│   └── bybit-exchange-adapter.ts
├── types/
│   └── technicalindicators.d.ts
├── index.ts
└── package.json
```

**Peer Dependencies:**
- `technicalindicators` ^3.1.0
- `ccxt` ^4.0.0

**Peer Package Dependencies:**
- `@agencyos/vibe-arbitrage-engine` (workspace:*)

---

### 2. @agencyos/vibe-arbitrage-engine (v0.1.0)
**Path:** `/packages/vibe-arbitrage-engine/`  
**Status:** Production-ready  
**Role:** High-performance arbitrage execution engine

**Exports:**
```typescript
export * from './arbitrage-types';
export * from './signal-scorer';              // Signal quality scoring
export * from './spread-history-tracker';     // Historical spread analysis
export * from './fee-calculator';
export * from './order-book-analyzer';        // Orderbook validation
export * from './adaptive-spread-threshold';  // Dynamic threshold logic
export * from './latency-optimizer';          // Latency-aware execution
export * from './emergency-circuit-breaker';  // Risk cutoffs
export * from './profit-tracker';             // P&L tracking
export * from './balance-rebalancer';         // Portfolio rebalancing
export * from './arbitrage-scanner';          // Spread detection
export * from './arbitrage-executor';         // Order execution
export * from './multi-exchange-connector';   // Exchange connectivity
export * from './real-time-price-aggregator'; // Price feeds
export * from './websocket-price-feed';       // WebSocket data
export * from './arbitrage-backtester';       // Backtesting
export * from './spread-detector-engine';     // Main orchestrator
export * from './arbitrage-orchestrator';     // Strategy coordination
export * from './strategies';                 // Strategy implementations
```

**Core Files (22 TypeScript modules):**
- Signal processing: signal-scorer, spread-history-tracker, fee-calculator
- Risk management: emergency-circuit-breaker, profit-tracker, balance-rebalancer
- Data feeds: real-time-price-aggregator, websocket-price-feed, multi-exchange-connector
- Execution: arbitrage-scanner, arbitrage-executor, order-book-analyzer
- Engines: spread-detector-engine, arbitrage-orchestrator, arbitrage-backtester
- Supporting: adaptive-spread-threshold, latency-optimizer, arb-logger, arbitrage-types

**Peer Dependencies:**
- `@agencyos/trading-core` (workspace:*)

---

### 3. @agencyos/vibe-billing-trading (v0.1.0)
**Path:** `/packages/vibe-billing-trading/`  
**Status:** Production-ready  
**Role:** Arbitrage billing hooks — fee tracking, profit analytics

**Exports:**
```typescript
export * from './fee-calculator-hook.ts';          // Fee calculation
export * from './profit-tracker-hook.ts';          // P&L tracking
export * from './arbitrage-billing-hook.ts';       // Net-profit analysis
```

**Peer Dependencies:**
- `@agencyos/trading-core` (workspace:*)

---

## Hub SDK Pattern Analysis

Hub SDKs aggregate related vibe packages into unified facades. Common structure:

### Example: @agencyos/fintech-hub-sdk
**Path:** `/packages/fintech-hub-sdk/`  
**Structure:**
```
fintech-hub-sdk/
├── index.ts                              # Main export
├── billing-facade.ts                     # Aggregates vibe-billing
├── payments-facade.ts                    # Aggregates vibe-payment, vibe-payment-router
├── subscriptions-facade.ts               # Aggregates vibe-subscription
├── revenue-facade.ts                     # Aggregates vibe-revenue
├── subscription-webhooks-facade.ts       # Aggregates vibe-subscription-webhooks
└── package.json
```

**Index Pattern:**
```typescript
export { BillingFacade } from './billing-facade';
export { PaymentsFacade } from './payments-facade';
export { SubscriptionsFacade } from './subscriptions-facade';
export { RevenueFacade } from './revenue-facade';
export { SubscriptionWebhooksFacade } from './subscription-webhooks-facade';
```

**Package.json Pattern:**
```json
{
  "name": "@agencyos/fintech-hub-sdk",
  "exports": {
    ".": "./index.ts",
    "./billing": "./billing-facade.ts",
    "./payments": "./payments-facade.ts",
    "./subscriptions": "./subscriptions-facade.ts",
    "./revenue": "./revenue-facade.ts",
    "./subscription-webhooks": "./subscription-webhooks-facade.ts"
  },
  "peerDependencies": {
    "@agencyos/vibe-billing": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*",
    "@agencyos/vibe-payment-router": "workspace:*",
    "@agencyos/vibe-stripe": "workspace:*",
    "@agencyos/vibe-money": "workspace:*",
    "@agencyos/vibe-embedded-finance": "workspace:*",
    "@agencyos/vibe-subscription": "workspace:*",
    "@agencyos/vibe-revenue": "workspace:*",
    "@agencyos/vibe-subscription-webhooks": "workspace:*"
  }
}
```

---

## All Hub SDKs (10 packages)

| Hub SDK | Sub-packages | Path |
|---------|--------------|------|
| **commerce-hub-sdk** | vibe-ecommerce, vibe-pos, vibe-fnb, vibe-composable-commerce | `/packages/commerce-hub-sdk/` |
| **education-hub-sdk** | LMS, assessment, student-analytics | `/packages/education-hub-sdk/` |
| **fintech-hub-sdk** | vibe-billing, vibe-payment, vibe-subscription, vibe-revenue, vibe-stripe, vibe-embedded-finance, vibe-subscription-webhooks | `/packages/fintech-hub-sdk/` |
| **healthcare-hub-sdk** | Healthcare services | `/packages/healthcare-hub-sdk/` |
| **industry-hub-sdk** | Industry-specific SDKs | `/packages/industry-hub-sdk/` |
| **ai-hub-sdk** | AI services | `/packages/ai-hub-sdk/` |
| **legal-hub-sdk** | Legal compliance services | `/packages/legal-hub-sdk/` |
| **media-hub-sdk** | Media/content services | `/packages/media-hub-sdk/` |
| **ops-hub-sdk** | Operations services | `/packages/ops-hub-sdk/` |
| **devtools-hub-sdk** | Developer tools | `/packages/devtools-hub-sdk/` |

---

## Vibe Packages (52 total)

### Payment & Billing (7 packages)
- `vibe-payment` — Payment processing
- `vibe-payment-router` — Multi-provider routing
- `vibe-billing` — Billing orchestration
- `vibe-billing-hooks` — Billing webhooks
- `vibe-billing-trading` — Trading-specific billing
- `vibe-stripe` — Stripe integration
- `vibe-payos-billing-types` — PayOS billing types

### Finance & Revenue (3 packages)
- `vibe-revenue` — Revenue analytics
- `vibe-money` — Money management
- `vibe-embedded-finance` — Embedded finance

### Commerce (4 packages)
- `vibe-ecommerce` — E-commerce platform
- `vibe-pos` — Point of sale
- `vibe-fnb` — Food & beverage
- `vibe-composable-commerce` — Composable commerce

### Organization & HR (2 packages)
- `vibe-hr` — HR management
- `vibe-customer-success` — Customer success

### Marketing & CRM (3 packages)
- `vibe-marketing` — Marketing platform
- `vibe-creator-economy` — Creator economy
- `vibe-crm` — CRM system

### Compliance & Identity (4 packages)
- `vibe-identity` — Identity management
- `vibe-compliance` — Compliance
- `vibe-compliance-auto` — Automated compliance
- `vibe-consent` — Consent management

### Analytics & Observability (3 packages)
- `vibe-analytics` — Analytics
- `vibe-observability` — System observability
- `vibe-video-intel` — Video intelligence

### Infrastructure & Integration (5 packages)
- `vibe-bridge` — Data bridge
- `vibe-supabase` — Supabase integration
- `vibe-notifications` — Notifications
- `vibe-newsletter` — Newsletter service
- `vibe-ops` — Operations

### AI & Safety (2 packages)
- `vibe-ai-safety` — AI safety
- `vibe-agents` — Agent orchestration

### Specialized Domains (15 packages)
- `vibe-robotics` — Robotics
- `vibe-physical-ai` — Physical AI
- `vibe-edge` — Edge computing
- `vibe-digital-therapeutics` — Digital health
- `vibe-digital-twin` — Digital twin
- `vibe-logistics` — Logistics
- `vibe-climate` — Climate
- `vibe-construction` — Construction
- `vibe-spatial` — Spatial computing
- `vibe-longevity` — Longevity
- `vibe-media-trust` — Media trust
- `vibe-wellbeing` — Wellbeing
- `vibe-wellness` — Wellness
- `vibe-dev` — Developer experience
- `vibe-ui` — UI components

---

## Core/Tooling Packages (13 packages)

| Package | Purpose |
|---------|---------|
| `core` | Core utilities |
| `shared` | Shared types & utilities |
| `agents` | Agent framework |
| `integrations` | Third-party integrations |
| `tooling` | Build tools & utilities |
| `business` | Business logic |
| `memory` | Memory management |
| `i18n` | Internationalization |
| `observability` | Observability SDK |
| `billing` | Billing core |
| `mekong-clawwork` | Mekong CLI worker |
| `mekong-moltbook` | Mekong notebook |
| `ui` | UI library (@mekong/ui) |

---

## Package Export Conventions

### Workspace Dependencies
All packages use `workspace:*` for internal dependencies:
```json
{
  "dependencies": {
    "@agencyos/trading-core": "workspace:*"
  }
}
```

### Main Entry Points
Standard pattern:
```json
{
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./submodule": "./submodule-facade.ts"
  }
}
```

### Files Published
Typically include:
- `*.ts` files (source)
- Directory globbing (e.g., `"strategies/"`)
- No build output (monorepo publish source directly)

---

## algo-trader App Dependencies

**Current deps (package.json):**
```json
{
  "dependencies": {
    "@agencyos/trading-core": "workspace:*",
    "@agencyos/vibe-arbitrage-engine": "workspace:*",
    "@agencyos/vibe-billing-trading": "workspace:*"
  }
}
```

**App structure:**
```
src/
├── arbitrage/        # Test suites for trading packages
│   ├── ArbitrageEngine.test.ts
│   ├── ArbitrageRound4-7.test.ts
│   ├── SpreadDetectorEngine.test.ts
│   └── vibe-billing-trading-hooks.test.ts
├── core/             # Bot engine, risk management, signals
│   ├── BotEngine.ts
│   ├── RiskManager.ts
│   ├── SignalGenerator.ts
│   ├── SignalFilter.ts
│   ├── StrategyEnsemble.ts
│   └── PortfolioRiskManager.ts
├── strategies/       # Strategy implementations
├── analysis/         # Market analysis
├── backtest/         # Backtesting harness
├── cli/              # CLI interface
└── index.ts          # Main entry
```

---

## Key Insights

### 1. **Dependency Isolation**
- Trading packages are **NOT interdependent** (clean separation)
- trading-core = foundation (zero arb dependencies)
- vibe-arbitrage-engine = depends on trading-core
- vibe-billing-trading = depends on trading-core only
- algo-trader = depends on all three

### 2. **Export Architecture**
- **Barrel exports** (`index.ts`) re-export all submodules
- **Conditional exports** via `"exports"` field for subpath imports
- **No package.json rewrites** — exports directly point to `.ts` files

### 3. **Hub SDK Pattern**
- Aggregates 2-10 related vibe packages
- Facade pattern — provides unified interface
- Each facade is a class with methods (e.g., BillingFacade)
- Implements contract but delegates to vibe packages

### 4. **Trading-Specific Gaps**
- No dedicated **trading-hub-sdk** yet (opportunity for future)
- Could aggregate: trading-core + vibe-arbitrage-engine + vibe-billing-trading
- Would follow fintech-hub-sdk pattern

### 5. **Type Safety**
- All packages are TypeScript-first (`main: "index.ts"`)
- No compiled JavaScript distributions (monorepo pattern)
- Source files distributed directly

---

## File Counts by Package Type

| Type | Count | Avg Files |
|------|-------|-----------|
| Hub SDKs (10) | ~10 files each | 1 index + 7-9 facades |
| Vibe packages (52) | 3-20 files each | Mixed |
| Trading packages (3) | 1-22 files each | Highly variable |
| Core/tooling (13) | 5-30 files each | Utility-dependent |

---

## Recommendations

1. **Trading Hub SDK** — Create `@agencyos/trading-hub-sdk` aggregating all 3 trading packages
2. **Exchange Registry** — Central registry of supported exchanges (currently Binance/OKX/Bybit)
3. **Strategy Templates** — Extract common strategy patterns to trading-core
4. **Billing Integration** — Deepen vibe-billing-trading hooks with usage-based metering

---

## Unresolved Questions

1. Are there existing arbitrage strategies in vibe-arbitrage-engine/strategies/?
2. What exchange adapters exist beyond Binance/OKX/Bybit?
3. Are there existing backtesting results/benchmarks documented?
4. Is there a strategy marketplace or gallery planned?

