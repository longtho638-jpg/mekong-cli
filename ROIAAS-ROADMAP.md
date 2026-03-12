# MEKONG-CLI ROIaaS ROADMAP
# Ánh xạ HIEN-PHAP-ROIAAS Điều 6 (5-Phase DNA) → Implementation Versions

> **"Mọi dòng code viết ra phải quy đổi thành ROI."** — Hiến Pháp ROIaaS v1.0

---

## Version → ROIaaS Phase Mapping

| Version | ROIaaS Phase | Tên | Mô Tả | New Tests | Total Tests |
|---------|-------------|-----|--------|-----------|-------------|
| v0.1 | — | Core Engine | LLM router, tools, agents, SOPs, memory | ~120 | ~120 |
| v0.2 | — | Business Modules | CRM, Finance, Dashboard, Integrations | ~132 | ~252 |
| v0.3 | — | Platform | Kaizen, Marketplace, MCP, Self-Improve, Plugins, Scheduler, SOP Templates | ~185 | 437 |
| **v0.4** | **Phase 1 GATE** | License Gate | LicenseKey, HMAC verify, feature gating, tier enforcement, CLI `mekong license` | ~55 | ~490 |
| **v0.5** | **Phase 2 LICENSE UI** | License Admin | Key generator, admin CRUD, audit log, tier migration, CLI `mekong license-admin` | ~55 | ~540 |
| **v0.6** | **Phase 3 WEBHOOK** | Payment Integration | Polar.sh webhooks, subscription manager, receipt store, CLI `mekong billing` | ~50 | ~590 |
| **v0.7** | **Phase 4 METERING** | Usage Metering | Event collector, JSONL store, analyzer, limiter, cost calculator, CLI `mekong usage` | ~55 | ~640 |
| **v0.8** | **Phase 5 ANALYTICS** | ROI Analytics | ROI calculator, AGI scorer, revenue tracker, growth analyzer, CLI `mekong analytics` | ~55 | ~690 |

---

## Dependency Graph

```
v0.1 Core Engine
  └── v0.2 Business Modules
        └── v0.3 Platform (Kaizen/MCP/Self-Improve/Plugins)
              └── v0.4 GATE (License enforcement)
                    └── v0.5 LICENSE UI (Admin management)
                          └── v0.6 WEBHOOK (Polar.sh payment → auto-license)
                                └── v0.7 METERING (Usage tracking + limits)
                                      └── v0.8 ANALYTICS (ROI dashboard)
```

---

## ROIaaS DNA Completion Tracker

| DNA Phase | Version | Status | Engineering ROI | Operational ROI |
|-----------|---------|--------|-----------------|-----------------|
| Phase 1 GATE | v0.4 | PLANNED | Dev Key gating for premium CLI commands | — |
| Phase 2 LICENSE UI | v0.5 | PLANNED | Admin tools for key management | Owner dashboard for license ops |
| Phase 3 WEBHOOK | v0.6 | PLANNED | Auto-provisioning via payment events | Self-service checkout → instant access |
| Phase 4 METERING | v0.7 | PLANNED | Usage-based billing per LLM/tool/SOP | Cost visibility for business owners |
| Phase 5 ANALYTICS | v0.8 | PLANNED | AGI Score + agent performance | ROI dashboard, revenue, growth KPIs |

---

## Dual Revenue Stream (per HIEN-PHAP Điều 2)

### Engineering ROI (Dev Key)
- v0.4: `RAAS_LICENSE_KEY` gates premium agents, deep intelligence
- v0.7: Usage limits enforce fair consumption per tier
- v0.8: AGI Score measures agent swarm effectiveness

### Operational ROI (User UI)
- v0.5: Admin dashboard manages customer licenses
- v0.6: Payment webhook automates subscription lifecycle
- v0.8: Revenue/growth analytics for business decisions

---

## Tier Model (from v0.4 onwards)

| Tier | Price/mo | LLM/day | Tools/day | SOPs/day | Features |
|------|----------|---------|-----------|----------|----------|
| Free | $0 | 100 | 50 | 10 | run, sop, status |
| Starter | $49 | 1,000 | 500 | 100 | + crm, finance, dashboard |
| Pro | $149 | 10,000 | 5,000 | 1,000 | + kaizen, marketplace, plugins, mcp |
| Enterprise | $499 | Unlimited | Unlimited | Unlimited | + self-improve, custom agents, priority |

---

## Implementation Specs

- [IMPLEMENTATION-SPEC-v0.1.md](./IMPLEMENTATION-SPEC-v0.1.md)
- [IMPLEMENTATION-SPEC-v0.2.md](./IMPLEMENTATION-SPEC-v0.2.md)
- [IMPLEMENTATION-SPEC-v0.3.md](./IMPLEMENTATION-SPEC-v0.3.md)
- [IMPLEMENTATION-SPEC-v0.4.md](./IMPLEMENTATION-SPEC-v0.4.md) — GATE
- [IMPLEMENTATION-SPEC-v0.5.md](./IMPLEMENTATION-SPEC-v0.5.md) — LICENSE UI
- [IMPLEMENTATION-SPEC-v0.6.md](./IMPLEMENTATION-SPEC-v0.6.md) — WEBHOOK
- [IMPLEMENTATION-SPEC-v0.7.md](./IMPLEMENTATION-SPEC-v0.7.md) — METERING
- [IMPLEMENTATION-SPEC-v0.8.md](./IMPLEMENTATION-SPEC-v0.8.md) — ANALYTICS

---

_ROIaaS DNA Roadmap v1.0 | March 2026_
_Ánh xạ: HIEN-PHAP-ROIAAS.md Điều 6 → mekong-cli v0.4-v0.8_
