# Scout Report: Mekong CLI Codebase Structure

**Date:** 2026-03-01  
**Scope:** Package ecosystem, SDK patterns, App structure  
**Work Context:** `/Users/macbookprom1/mekong-cli`

---

## Executive Summary

Mekong CLI is a **monorepo with 114 packages + 33 apps**. The SDK ecosystem follows a well-established **Hub-Package + Vibe-Module pattern** where:

1. **35 Hub-SDKs** — Domain-specific facades (commerce-hub-sdk, fintech-hub-sdk, etc.)
2. **55 Vibe-Modules** — Core functionality packages (vibe-payment, vibe-subscription, etc.)
3. **Core packages** — Shared utilities (cleo, ui, billing, build-optimizer, docs, etc.)

All packages use **pnpm workspace**, TypeScript strict mode, and follow the **Plan-Execute-Verify** DNA pattern.

---

## 1. Packages Directory Structure

**Location:** `/Users/macbookprom1/mekong-cli/packages/`  
**Total Packages:** 114

### 1.1 Hub-Package SDKs (35 total)

**Pattern:** `*-hub-sdk` packages that aggregate domain-specific functionality

**Examples:**
- `commerce-hub-sdk` — e-commerce, POS, F&B
- `education-hub-sdk` — LMS, assessments, student analytics
- `fintech-hub-sdk` — billing, payments, subscriptions, revenue
- `healthcare-hub-sdk`, `legal-hub-sdk`, `logistics-hub-sdk`, `media-hub-sdk`, etc.

**Complete List (35):**
```
agritech-hub-sdk, ai-hub-sdk, automotive-hub-sdk, commerce-hub-sdk,
construction-hub-sdk, creator-marketing-hub-sdk, devtools-hub-sdk,
education-hub-sdk, energy-hub-sdk, events-hub-sdk, fashion-hub-sdk,
fintech-hub-sdk, fnb-hub-sdk, gaming-hub-sdk, govtech-hub-sdk,
healthcare-hub-sdk, hospitality-hub-sdk, identity-compliance-sdk,
industry-hub-sdk, infra-hub-sdk, insurtech-hub-sdk, legal-hub-sdk,
logistics-hub-sdk, manufacturing-hub-sdk, media-hub-sdk,
mobility-hub-sdk, real-estate-hub-sdk, saas-hub-sdk, 
sustainability-hub-sdk, supply-chain-hub-sdk, telecom-hub-sdk,
travel-hub-sdk, web3-hub-sdk, webhook-billing-sdk, wellness-hub-sdk
```

### 1.2 Hub-SDK Internal Structure

**File Pattern per Hub-SDK:**
- `index.ts` — Clean barrel re-export
- `*-facade.ts` — Domain-specific facades (2-5 per hub)
- `package.json` — Workspace metadata + exports
- `tsconfig.json` — TypeScript compiler config
- **Total files per SDK:** 5-8 files
- **Size:** Minimal, focused on re-exports

**Example: commerce-hub-sdk**
```
commerce-hub-sdk/
├── index.ts (23 lines)
├── ecommerce-facade.ts (15 lines)
├── pos-facade.ts (12 lines)
├── fnb-facade.ts (10 lines)
├── package.json
└── tsconfig.json
```

**Package.json Pattern:**
```json
{
  "name": "@agencyos/commerce-hub-sdk",
  "version": "0.1.0",
  "description": "Unified commerce SDK...",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./ecommerce": "./ecommerce-facade.ts",
    "./pos": "./pos-facade.ts",
    "./fnb": "./fnb-facade.ts"
  },
  "license": "MIT",
  "publishConfig": { "access": "public" },
  "peerDependencies": {
    "@agencyos/vibe-ecommerce": "workspace:*",
    "@agencyos/vibe-pos": "workspace:*",
    "@agencyos/vibe-fnb": "workspace:*",
    "@agencyos/vibe-composable-commerce": "workspace:*"
  }
}
```

### 1.3 Vibe-Modules (55 total)

**Pattern:** `vibe-*` packages that implement concrete domain logic

**Examples:**
- `vibe-payment` — Provider-agnostic payment SDK (PayOS, VNPay, MoMo)
- `vibe-subscription` — Plan lifecycle, trials, churn analysis
- `vibe-ecommerce` — Cart, orders, promotion, pricing engines
- `vibe-pos` — Restaurant POS operations
- `vibe-fnb` — F&B menu & inventory management
- `vibe-auth` — Authentication & authorization
- `vibe-billing` — Billing orchestration
- `vibe-stripe`, `vibe-supabase` — Provider-specific adapters

**Complete List (55):**
```
vibe, vibe-agent, vibe-agents, vibe-ai-safety, vibe-analytics,
vibe-arbitrage-engine, vibe-auth, vibe-billing, vibe-billing-hooks,
vibe-billing-trading, vibe-bridge, vibe-climate, vibe-compliance,
vibe-compliance-auto, vibe-composable-commerce, vibe-consent,
vibe-construction, vibe-creator-economy, vibe-crm, vibe-customer-success,
vibe-dev, vibe-digital-therapeutics, vibe-digital-twin, vibe-ecommerce,
vibe-edge, vibe-embedded-finance, vibe-fnb, vibe-food-tech, vibe-hr,
vibe-identity, vibe-logistics, vibe-longevity, vibe-marketing,
vibe-media-trust, vibe-money, vibe-newsletter, vibe-notifications,
vibe-observability, vibe-ops, vibe-payment, vibe-payment-router,
vibe-payos-billing-types, vibe-physical-ai, vibe-pos, vibe-revenue,
vibe-robotics, vibe-space-tech, vibe-spatial, vibe-stripe,
vibe-subscription, vibe-subscription-webhooks, vibe-supabase, vibe-ui,
vibe-video-intel, vibe-wellbeing, vibe-wellness
```

### 1.4 Vibe-Module Internal Structure (Example: vibe-payment)

**Files:**
- `index.ts` — Main entry + re-exports
- `types.ts` — Type definitions
- `autonomous-webhook-handler.ts` — Webhook processing logic
- `billing-webhook-orchestrator.ts` — Multi-provider orchestration
- `payos-adapter.ts` — PayOS-specific adapter
- `payment-analytics-types.ts` — Analytics instrumentation
- `retry-with-backoff.ts` — Resilience pattern
- `package.json`, `tsconfig.json`

**Size Constraint:** Files stay <200 lines (modular extraction pattern)

**Latest Extraction (commit 38200639):**
- `vibe-subscription` refactored from 271→135 lines in index.ts
- New files: `subscription-engine.ts` (97L), `usage-meter.ts` (35L), `churn-analyzer.ts` (53L)
- All files <200 lines

### 1.5 Core Packages

**Foundation:**
- `core/` — Core framework (may be nested)
- `vibe/` — Base vibe framework
- `agents/` — Agent framework
- `cleo/` — Task management CLI framework

**Business Logic:**
- `billing/` — Billing domain
- `business/` — Business utilities

**Developer Tools:**
- `build-optimizer/` — Build pipeline optimization
- `integrations/` — External connectors
- `ui/` — Shared UI components
- `i18n/` — Internationalization

**Documentation:**
- `docs/` — Shared documentation

---

## 2. Apps Directory Structure

**Location:** `/Users/macbookprom1/mekong-cli/apps/`  
**Total Apps:** 33

### 2.1 Major Applications (Sample)

| App | Type | Purpose |
|-----|------|---------|
| `sophia-ai-factory` | Monorepo | Video SaaS platform |
| `agencyos-web` | Next.js | Main dashboard |
| `agencyos-landing` | Next.js | Marketing landing page |
| `apex-os` | Full-stack | Trading platform |
| `well` | Full-stack | Health/wellness app |
| `anima119` | Full-stack | E-commerce (oriental medicine) |
| `84tea` | Full-stack | Tea franchise management |
| `openclaw-worker` | Node.js daemon | Autonomous task orchestration |
| `algo-trader` | Python/Node | Algorithmic trading engine |
| `api` | FastAPI | Core API service |
| `engine` | Python | Plan-Execute-Verify engine |
| `agentic-brain` | Agentic | Antigravity brain service |
| `raas-gateway` | Cloudflare Worker | Cloud API gateway |
| `raas-demo` | Demo | RaaS demonstration |
| `starter-template` | Template | Boilerplate |
| `analytics` | Full-stack | Analytics service |
| `dashboard` | Next.js | Admin dashboard |
| `com-anh-duong-10x` | Full-stack | Restaurant POS + customer app |
| `sophia-ai-factory` | Full-stack | AI video creation SaaS |

### 2.2 App Internal Structure (Example: sophia-ai-factory)

```
apps/sophia-ai-factory/
├── .agent/                    # Agent configuration
├── .antigravity/              # Antigravity integration
├── .claude/                   # ClaudeKit DNA
├── .github/                   # GitHub Actions
├── .opencode/                 # Code analysis
├── .playwright-mcp/           # E2E testing
├── .vscode/                   # IDE config
├── apps/                      # Nested sub-apps
├── docs/                      # App documentation
├── node_modules/              # Dependencies
├── plans/                      # Plan documentation (32 dirs)
├── scripts/                    # Custom scripts
├── AGENTS.md, GEMINI.md       # Agent documentation
├── CLAUDE.md                   # Local constitution
├── README.md                   # Project overview
├── package.json               # Workspace metadata
└── all_files.txt              # File inventory
```

---

## 3. Workspace Configuration

**Root package.json workspaces:**
```json
{
  "workspaces": [
    "frontend",
    "packages/*",
    "packages/core/*",
    "packages/integrations/*",
    "packages/business/*",
    "packages/ui/*",
    "packages/tooling/*",
    "apps/*"
  ]
}
```

**Package Manager:** pnpm 9.15.0

**Build System:** Turbo for multi-package builds

---

## 4. SDK Extraction Patterns

### 4.1 Two-Layer Pattern

**Layer 1: Vibe-Module (Concrete)**
- Actual implementation logic
- Types, algorithms, domain-specific operations
- Can depend on other vibe-modules

**Layer 2: Hub-SDK (Facade)**
- Aggregates 2-5 related vibe-modules
- Clean re-export of public API
- No implementation, only facade
- Defines public contracts

**Data Flow:**
```
App/Feature Code
    ↓
Hub-SDK (aggregator facade)
    ├→ vibe-payment
    ├→ vibe-subscription  
    ├→ vibe-billing
    └→ vibe-revenue
        ↓
    Core Implementations
```

### 4.2 Recent Extraction Examples

**Commit d9b4da6a** (feat: 10 Hub-Package SDKs + vibe-subscription-webhooks):
- Created 10 new Hub-SDKs
- Extracted vibe-subscription-webhooks from core functionality
- Pattern established for domain-driven packages

**Commit 38200639** (refactor: vibe-subscription modular extraction):
- Split large index.ts (271 lines) into 3 focused files
- subscription-engine.ts — Plan lifecycle logic
- usage-meter.ts — Limit checking & upgrade suggestions
- churn-analyzer.ts — Risk scoring & recommendations
- All files respect <200 line constraint

### 4.3 Extraction Process

**Typical Pattern:**
1. Identify domain cohesion (e.g., subscription, payment, commerce)
2. Create vibe-module with concrete implementation
3. Create facade with sub-path exports
4. Update peerDependencies in facade
5. Each file <200 lines (split if needed)

---

## 5. TypeScript Configuration

**Standard tsconfig.json (all packages):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "skipLibCheck": true
  },
  "include": ["*.ts"]
}
```

**Enforced:** Strict TypeScript, no `any` types

---

## 6. Naming Conventions

### 6.1 Package Names
- **Hub-SDKs:** `@agencyos/{domain}-hub-sdk`
- **Vibe-Modules:** `@agencyos/vibe-{domain}`
- **Other:** `@agencyos/{purpose}` (e.g., billing, ui)
- **Scope:** Always `@agencyos/`

### 6.2 File Names
- **kebab-case** for file names (e.g., `subscription-engine.ts`)
- **snake_case** for Python test files (`test_*.py`)
- **PascalCase** for exported types/interfaces

### 6.3 Export Patterns
```typescript
// index.ts — clean barrel export
export { CartEngine } from './ecommerce-facade';
export { OrderEngine } from './pos-facade';

// Sub-path exports in package.json
"exports": {
  ".": "./index.ts",
  "./ecommerce": "./ecommerce-facade.ts",
  "./pos": "./pos-facade.ts"
}
```

---

## 7. Dependencies & Peer Dependencies

### 7.1 Pattern
- **dependencies:** Usually empty in SDKs (no runtime deps)
- **peerDependencies:** Vibe-modules required by facade
- **workspace:* resolution:** Local monorepo dependency

**Example (fintech-hub-sdk):**
```json
{
  "peerDependencies": {
    "@agencyos/vibe-billing": "workspace:*",
    "@agencyos/vibe-payment": "workspace:*",
    "@agencyos/vibe-subscription": "workspace:*",
    "@agencyos/vibe-revenue": "workspace:*"
  }
}
```

### 7.2 No Circular Dependencies
- Facade → Vibe-Module dependency only
- Vibe-Modules can depend on other vibe-modules
- No vibe-module depends on hub-sdk

---

## 8. Key Insights

### 8.1 Strengths

✅ **Well-organized monorepo** with clear 114-package ecosystem  
✅ **Two-layer SDK architecture** (Hub + Vibe) scales across domains  
✅ **Strict TypeScript + 200-line constraint** ensures code quality  
✅ **Facet pattern** allows fine-grained sub-path imports  
✅ **Workspace setup** enables pnpm build/test across packages  
✅ **Recent refactoring** (commit 38200639) shows active modularization  

### 8.2 Patterns to Follow

1. **Extract to vibe-module** when adding domain logic (>100 lines)
2. **Create hub-sdk facade** to aggregate related vibe-modules
3. **Use sub-path exports** for fine-grained imports
4. **Keep files <200 lines** and split into modules
5. **No circular dependencies** — plan dependency graph first

### 8.3 Ecosystem Health

- **35 Hub-SDKs** covering all major domains (commerce, fintech, education, healthcare, legal, logistics, media, etc.)
- **55 Vibe-Modules** providing deep functionality
- **Recent activity:** Multiple ecosystem expansion commits in Feb 2026
- **Maintenance:** Active extraction and refactoring pattern

---

## 9. File Discovery Commands

```bash
# All packages
ls -d /Users/macbookprom1/mekong-cli/packages/*/

# All Hub-SDKs
ls -d /Users/macbookprom1/mekong-cli/packages/*-hub-sdk/

# All Vibe-Modules  
ls -d /Users/macbookprom1/mekong-cli/packages/vibe-*/

# All Apps
ls -d /Users/macbookprom1/mekong-cli/apps/*/

# Package count: 114 | App count: 33
```

---

## 10. Recommendations for SDK Extraction

### When to Extract a Vibe-Module
- ✅ Domain-specific logic (payment, subscription, etc.)
- ✅ >100 lines of code
- ✅ Reusable across multiple apps
- ✅ Clear, focused responsibility

### When to Create a Hub-SDK
- ✅ Aggregating 2-5 related vibe-modules
- ✅ Defining public contract for domain
- ✅ Enabling sub-path imports for fine-grained access

### File Structure Template

```
{domain}-hub-sdk/
├── index.ts                    # Clean barrel export
├── {subdomain1}-facade.ts      # Sub-module 1 re-export
├── {subdomain2}-facade.ts      # Sub-module 2 re-export
├── package.json                # Exports + peerDeps
├── tsconfig.json               # TS config
└── [optional] dist/            # Build output
```

---

## Conclusion

Mekong CLI's **114-package ecosystem with Hub-SDK + Vibe-Module pattern** is a mature, scalable SDK architecture. The recent extraction activity (Feb-Mar 2026) demonstrates active ecosystem growth. All future SDKs should follow this established pattern:

1. **vibe-{domain}** — Concrete implementation
2. **{domain}-hub-sdk** — Facade aggregator
3. **Sub-path exports** — Fine-grained access
4. **<200 line files** — Modular constraint
5. **No circular deps** — Clean dependency graph

