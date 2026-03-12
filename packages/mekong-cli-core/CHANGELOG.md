# Changelog

All notable changes to `@mekong/cli-core` will be documented in this file.

## [0.8.0] - 2026-03-12

### ROIaaS Phase 5: ANALYTICS (HIEN-PHAP Dieu 6, Phase 5)

- **ROI Calculator** — `(timeSaved * hourlyRate + revGenerated - totalCost) / totalCost * 100`
- **AGI Score** — 0-100 per HIEN-PHAP Dieu 7.3 (progress 30%, activity 25%, success 25%, resilience 20%)
- **Revenue Tracker** — MRR/ARR/ARPU from subscription webhook events
- **Growth Analyzer** — MoM/WoW growth, churn rate, net revenue retention
- **Report Generator** — CLI tables + Markdown export
- **CLI**: `mekong analytics roi|agents|revenue|growth|export`
- 48 new tests (692 total)

## [0.7.0] - 2026-03-12

### ROIaaS Phase 4: METERING (HIEN-PHAP Dieu 6, Phase 4)

- **Metering Collector** — buffer/flush at 50 events or 30s, recordLlmCall/recordToolRun/recordSopRun
- **Metering Store** — JSONL monthly rotation (YYYY-MM.jsonl), date-range query
- **Usage Analyzer** — aggregate by category, overage detection, top models/tools
- **Usage Limiter** — checkLimit(), getRemaining(), daily reset UTC, enterprise = Infinity
- **Cost Calculator** — per-model token pricing (anthropic/openai/ollama/openrouter/deepseek)
- **CLI**: `mekong usage today|this-month|summary|export|limits`
- Wired metering into LLM router (auto-record after each call)
- 54 new tests (644 total)

## [0.6.0] - 2026-03-12

### ROIaaS Phase 3: WEBHOOK (HIEN-PHAP Dieu 6, Phase 3)

- **Webhook Verifier** — HMAC-SHA256 Standard Webhooks + legacy fallback, timestamp replay protection
- **Webhook Handler** — verify -> dedup -> dispatch -> persist pipeline
- **Subscription Manager** — handleCheckout/Update/Cancel, auto-create/upgrade/revoke license
- **Receipt Store** — JSONL, idempotent dedup by event ID
- **Polar Client** — native fetch, retry+backoff on 429
- **CLI**: `mekong billing status|receipts|webhook-test`
- 54 new tests (590 total)

## [0.5.0] - 2026-03-12

### ROIaaS Phase 2: LICENSE UI (HIEN-PHAP Dieu 6, Phase 2)

- **Key Generator** — generate RAAS-{TIER}-{16hex} keys, HMAC-signed
- **License Admin** — createKey/revokeKey/listKeys/rotateKey/validateAll/listExpiring
- **Audit Log** — append-only JSONL audit trail
- **Tier Manager** — upgrade/downgrade with prorated expiry
- **CLI**: `mekong license-admin create|list|revoke|rotate|audit`
- 46 new tests (536 total)

## [0.4.0] - 2026-03-12

### ROIaaS Phase 1: GATE (HIEN-PHAP Dieu 6, Phase 1)

- **License Store** — load/save/clear ~/.mekong/license.json, 0o600 perms
- **License Verifier** — HMAC-SHA256 verification, expiry check, 7-day grace period
- **License Gate** — validate(), canAccess(), getCurrentTier(), getQuotas()
- **Feature Map** — FEATURE_MAP array, tierMeetsMinimum(), getRequiredTier()
- **Middleware** — commander preAction hook for premium gating
- **Remote Client** — remote API validation + cache fallback
- **CLI**: `mekong license status|activate|deactivate|info|generate-test-key`
- 53 new tests (490 total)

## [0.3.0] - 2026-03-12

### Platform (Kaizen, MCP, Self-Improve, Plugins, Scheduler, SOP Templates)

- Kaizen Analytics engine, SOP Marketplace
- MCP server management, tool adapter, discovery
- Self-Improve module with feedback loop, skill evolution, prompt refiner, memory curator
- Plugin system, scheduler, SOP template library
- 185 new tests (437 total)

## [0.2.0] - 2026-03-12

### Business Modules (CRM, Finance, Dashboard, Integrations)

- CRM, Finance, Dashboard, Integration modules
- 132 new tests (252 total)

## [0.1.0] - 2026-03-12

### Core Engine

- LLM router, tools, agents, SOPs, memory
- SOP parser, executor, DAG
- ~120 tests
