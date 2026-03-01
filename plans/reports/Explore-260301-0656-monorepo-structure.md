# Mekong CLI Monorepo Exploration Report

**Date:** 2026-03-01 | **Explorer:** Explore Agent

---

## Executive Summary

Mekong CLI is a sophisticated monorepo implementing a **Hub-Package SDK Extraction Pattern** — taking business domain logic and consolidating it into shared, reusable facade packages in `packages/`. The ecosystem has evolved from monolithic apps to a modular architecture with:

- **412 ClaudeKit skills** (`.claude/skills/`)
- **70+ packages** (shared SDKs + domain logic)
- **34 apps** (business units consuming SDKs)

Recent commits show a deliberate pattern: extract domain-specific code → create Hub-Package SDK facade → expose via sub-paths → sync new .claude/skills for discoverability.

---

## 1. `.claude/skills/` Directory (ClaudeKit Ecosystem)

**Total Count:** 412 skill directories

**Structure:** Each skill is a self-contained module in `.claude/skills/{skill-name}/`

**Key Observations:**
- Massive skill catalog organized by domain (AI, commerce, agents, compliance, etc.)
- Skills auto-activate via ClaudeKit system
- Recent extraction (b60da2ad) added 8 new domain skills:
  - `llmops-ai-observability` (observability)
  - `embedded-finance-baas` (embedded finance)
  - `composable-commerce-mach` (composable commerce)
  - `agentic-commerce` (commerce automation)
  - `ecommerce-agent`, `live-commerce`, `vietnamese-ecommerce` (e-commerce variants)
  - And others for fnb-food-tech, digital-twin, logistics, construction, notifications

**Pattern:** New SDK extractions automatically trigger new skill creation for discoverability.

---

## 2. `packages/` Directory (Shared SDK Ecosystem)

**Total Count:** 70+ package directories

### Core Hub-Package SDKs (Recently Extracted)

| Package | Version | Purpose | Sub-paths |
|---------|---------|---------|-----------|
| `@agencyos/webhook-billing-sdk` | 0.1.0 | Webhook verification + billing hooks facade | `./webhook`, `./billing`, `./types` |
| `@agencyos/commerce-hub-sdk` | (inferred 0.1.0) | E-commerce + POS + F&B operations | `./ecommerce`, `./pos`, `./fnb` |
| `@agencyos/identity-compliance-sdk` | (inferred 0.1.0) | DID + KYC/AML + consent | 3 sub-paths (DID, compliance, consent) |

### Vibe Domain SDKs (70+ packages)

Organized by business domain:

**Finance/Payments:**
- `vibe-billing`, `vibe-billing-hooks`, `vibe-billing-trading`
- `vibe-payment`, `vibe-payment-router`
- `vibe-stripe`, `vibe-subscription`
- `multi-org-billing-sdk`
- `webhook-billing-sdk`

**Commerce/Retail:**
- `vibe-ecommerce`, `vibe-fnb`, `vibe-pos`
- `vibe-composable-commerce`
- `commerce-hub-sdk`

**Specialized Domains:**
- `vibe-ai-safety`, `vibe-analytics`, `vibe-arbitrage-engine`
- `vibe-compliance`, `vibe-compliance-auto`, `vibe-consent`
- `vibe-construction`, `vibe-creator-economy`, `vibe-crm`
- `vibe-customer-success`, `vibe-digital-twin`
- `vibe-embedded-finance`, `vibe-food-tech`
- `vibe-hr`, `vibe-identity`, `vibe-logistics`
- `vibe-media-trust`, `vibe-newsletter`, `vibe-notifications`
- `vibe-robotics`, `vibe-space-tech`

**Foundation:**
- `vibe`, `vibe-agents`, `vibe-auth`, `vibe-ui`
- `vibe-dev`, `vibe-edge`

### Architecture & Tooling

- `build-optimizer` — Build pipeline optimization
- `trading-core` — Exchange adapters (Binance, OKX, Bybit)
- `core/` — Foundation utilities
- `ui/` — UI component library
- `shared/` — Shared utilities
- `i18n/` — Internationalization

**pnpm workspace:** All packages in `packages/` auto-discovered via wildcard (enables flat resolution)

---

## 3. `apps/` Directory (Business Units)

**Total Count:** 34 app directories

### Tier 1: Revenue-Generating Apps

- `sophia-ai-factory` — Video SaaS (payments, AI pipeline)
- `apex-os` — Trading platform (.ai/ agent structure)
- `84tea` — Vietnamese tea franchise (MD3 brand guidelines)
- `anima119` — Fermented Oriental medicine e-commerce
- `agencyos-web` — Dashboard & admin panel
- `agencyos-landing` — Marketing landing page

### Tier 2: Infrastructure & Gateways

- `openclaw-worker` — 🦞 Tôm Hùm autonomous daemon
- `raas-gateway` — Cloud API gateway (Telegram webhooks)
- `antigravity-gateway` — Antigravity integration
- `engine` — Core Python engine (Plan-Execute-Verify)
- `api` — Backend API service
- `worker` — Background job processing

### Tier 3: Specialized Services

- `agentic-brain` — Brain orchestration
- `algo-trader` — Algorithmic trading
- `analytics` — Analytics service
- `developers` — Developer tools
- `stealth-engine` — Stealth operations
- `vibe-coding-cafe` — Coding infrastructure

### Tier 4: Sales & Support

- `sophia-proposal` — Sales proposals, competitive pitches
- `com-anh-duong-10x` — Restaurant POS + customer app
- `well` — Wellness/health platform
- `project` — Project management

### Tier 5: Content & Bots

- `sophia-video-bot` — Telegram content delivery bot
- `sa-dec-flower-hunt` — Specialized application
- `landing` — Landing pages
- `starter-template` — Boilerplate
- `web` — Web hosting
- `docs` — Documentation
- `dashboard` — Dashboard (generic)
- `admin` — Admin console
- `tasks` — Task management
- `raas-demo` — RaaS demo
- `project` — Project infrastructure
- `gemini-proxy-clone` — Gemini proxy clone

---

## 4. Recent Extraction Pattern (Last 5 Commits)

### Commit Analysis

```
f90108d0 — refactor(raas): extract vibe-payment PayOS webhook handlers → @agencyos/vibe-billing-trading SDK
2328eaf6 — refactor(algo-trader): remove orphan billing hooks shim, extract to @agencyos/vibe-billing-trading
b60da2ad — feat(ecosystem): extract 3 Hub-Package SDKs + 8 business domain skills
b7aa800d — refactor(trading-core): complete exchange adapter extraction, remove shim layer
4117e840 — feat(vibe-arbitrage-engine): extract arbitrage engine to @agencyos/vibe-arbitrage-engine
```

### Extraction Pattern Identified

**Step 1: Create Hub-Package SDK**
- Example: `@agencyos/commerce-hub-sdk` consolidates e-commerce, POS, F&B
- Structure:
  ```
  packages/commerce-hub-sdk/
  ├── index.ts                  # Main export
  ├── ecommerce-facade.ts       # E-commerce operations
  ├── pos-facade.ts             # POS operations
  ├── fnb-facade.ts             # F&B operations
  ├── package.json              # v0.1.0, @agencyos/* namespace
  └── tsconfig.json
  ```

**Step 2: Sub-path Exports**
- `import { createCartEngine } from '@agencyos/commerce-hub-sdk/ecommerce'`
- `import { createOrderEngine } from '@agencyos/commerce-hub-sdk/pos'`
- `import { createMenuEngine } from '@agencyos/commerce-hub-sdk/fnb'`
- Enables consumers to import only needed facades

**Step 3: Update pnpm-workspace**
- Add `packages/*` wildcard for flat package resolution
- Enables `workspace:*` dependency specification

**Step 4: Create Aligned Skills**
- 8 new `.claude/skills/` created for discoverability:
  - `llmops-ai-observability` ← observability
  - `embedded-finance-baas` ← embedded finance
  - `composable-commerce-mach` ← composable commerce
  - `agentic-commerce` ← commerce automation
  - `fnb-food-tech` ← F&B tech
  - `digital-twin` ← digital twins
  - `logistics-supply-chain` ← logistics
  - `construction-project` ← construction

**Step 5: Update Apps**
- Apps switch from consuming orphan code → consuming from Hub-Package SDKs
- Example: `algo-trader` removed old billing hooks, now uses `@agencyos/vibe-billing-trading`

---

## 5. Package Naming Convention

All Hub-Package SDKs follow:

```
@agencyos/{category-hub-sdk}
├── index.ts                      # Main export
├── {subdomain}-facade.ts         # Each sub-domain
├── package.json                  # Version 0.1.0, publishConfig.access = public
├── tsconfig.json
└── README (implied, not checked)
```

**Version:** All new SDKs start at `0.1.0` (pre-release)

**Namespace:** `@agencyos/*` (company namespace)

**License:** MIT

---

## 6. Dependency Management

**pnpm workspaces:** Flat resolution via `packages/*`

**Peer Dependencies Pattern:**
```json
"peerDependencies": {
  "@agencyos/vibe-stripe": "workspace:*",
  "@agencyos/vibe-payment-router": "workspace:*",
  "@agencyos/vibe-billing-hooks": "workspace:*",
  "@agencyos/vibe-subscription": "workspace:*"
}
```

**Rationale:** Prevents duplicate instances, allows apps to specify exact versions

---

## 7. Key Insights

### Architectural Evolution
1. **Phase 1:** Monolithic apps with embedded domain logic
2. **Phase 2:** Extract common logic → vibe-* SDKs (70+)
3. **Phase 3:** Consolidate related SDKs → Hub-Package facades
4. **Phase 4:** Sync skills for AI discoverability

### Scaling Pattern
- **Extraction reduces code duplication** across apps
- **Hub-Package SDKs create single source of truth** for domain logic
- **Sub-path exports enable selective imports** (tree-shaking friendly)
- **Aligned skills improve AI agent context** when working on domain problems

### Governance
- Each SDK has its own `package.json` (semantic versioning)
- Workspace resolution ensures consistency
- `v0.1.0` indicates active development phase
- MIT license + public access for ecosystem sharing

---

## 8. File Organization Summary

```
mekong-cli/
├── .claude/skills/          ← 412 skill directories (ClaudeKit ecosystem)
├── packages/                ← 70+ domain SDKs (shared layer)
│   ├── commerce-hub-sdk/    ← Hub-Package (3 facades)
│   ├── webhook-billing-sdk/ ← Hub-Package
│   ├── identity-compliance-sdk/ ← Hub-Package
│   ├── vibe-*/              ← 60+ domain-specific SDKs
│   └── core/, shared/, ui/  ← Foundation
├── apps/                    ← 34 business units
│   ├── sophia-ai-factory/   ← Revenue-generating
│   ├── openclaw-worker/     ← Tôm Hùm daemon
│   ├── apex-os/             ← Trading platform
│   └── ...
└── CLAUDE.md                ← Root constitution
```

---

## Unresolved Questions

1. **Skill Discovery Mechanism:** How does `.claude/skills/` auto-sync with new SDK extractions? Is this manual or automated?
2. **Hub-Package Deprecation:** What happens to old vibe-* SDKs if consolidated into Hub-Package? Do they remain or get archived?
3. **Version Bump Strategy:** When upgrading from v0.1.0 to v0.2.0+, what triggers the release?
4. **CI/CD Pipeline:** How are `packages/*` tested in isolation vs. integrated tests with apps?
5. **Documentation:** Is there a manifest or registry documenting all 70+ packages and their relationships?

