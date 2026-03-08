---
title: "Phase 6: Overage Billing & Quota Enforcement"
description: "Implement overage billing cho Sophia AI Factory, extend RaaS Gateway với quota enforcement, integrate Stripe webhook"
status: pending
priority: P1
effort: 8h
branch: master
tags: [billing, overage, quota, stripe, raas-gateway, sophia-ai-factory]
created: 2026-03-08
---

# Phase 6: Overage Billing & Quota Enforcement

> **ROIaaS Dual-Stream:** Engineering ROI (license key gate) + Operational ROI (subscription overage)

## Tổng quan

Implement hệ thống overage billing và quota enforcement cho RaaS ecosystem, cho phép:
- Real-time quota checking tại edge (RaaS Gateway)
- Auto-charge overage qua Stripe Billing
- Hiển thị quota/overage trong Analytics Dashboard

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SOPHIA AI FACTORY                           │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Analytics Dashboard │  │ Quota Status API │  │ Overage Webhook │  │
│  │ (React/Next.js) │  │ (REST endpoints) │  │ (Stripe → API)    │  │
│  └─────────────────┘  └──────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────────┐
│                         RaaS Gateway (CF Worker)                    │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Quota Check  │  │ KV Usage Meter   │  │ Rate Limiting        │  │
│  │ Middleware   │  │ (real-time)      │  │ (per tenant)         │  │
│  └──────────────┘  └──────────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ JWT/mk_ API Key Auth + Certificate Auth + Suspension Check   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ Sync Usage
┌─────────────────────────────────────────────────────────────────────┐
│                         Algo Trader (Backend)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Overage Calculator│  │ Stripe Usage Sync│  │ Usage Tracker    │  │
│  │ (ts)             │  │ (ts)             │  │ (Prisma/Postgres)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Các phase chính

| Phase | Tên | Effort | Status |
|-------|-----|--------|--------|
| 1 | Quota Enforcement Middleware (RaaS Gateway) | 2h | ⏳ pending |
| 2 | Quota Status API Endpoint | 1h | ⏳ pending |
| 3 | Stripe Webhook Integration | 2h | ⏳ pending |
| 4 | Analytics Dashboard Updates | 2h | ⏳ pending |
| 5 | Tests & Verification | 1h | ⏳ pending |

---

## Phase Files

- [Phase 01: Quota Enforcement Middleware](./phase-01-quota-enforcement-middleware.md)
- [Phase 02: Quota Status API](./phase-02-quota-status-api.md)
- [Phase 03: Stripe Webhook Integration](./phase-03-stripe-webhook.md)
- [Phase 04: Analytics Dashboard Updates](./phase-04-analytics-dashboard.md)
- [Phase 05: Tests & Verification](./phase-05-tests-verification.md)

---

## Tài liệu tham khảo

- RaaS Gateway: `apps/raas-gateway/index.js`
- KV Usage Meter: `apps/raas-gateway/src/kv-usage-meter.js`
- Overage Calculator: `apps/algo-trader/src/billing/overage-calculator.ts`
- Stripe Usage Sync: `apps/algo-trader/src/billing/stripe-usage-sync.ts`
- RaaS Auth Client: `src/core/raas_auth.py`
- Analytics Dashboard: `apps/sophia-ai-factory/apps/sophia-ai-factory/src/app/[locale]/dashboard/analytics/`

---

## Success Criteria

- [ ] RaaS Gateway reject requests vượt quota limit
- [ ] `/v1/quota/status` endpoint hoạt động
- [ ] Stripe webhook auto-trigger overage charges
- [ ] Analytics dashboard hiển thị quota usage + overage charges
- [ ] Tests pass (unit + integration)
- [ ] Production verification OK

---

## Unresolved Questions

1. **Quota limits per tier:** Cần xác định cụ thể giới hạn cho mỗi tier (free/starter/growth/pro/enterprise)
2. **Overage pricing:** Cần confirm pricing model từ Stripe/Polar
3. **Grace period:** Có cần grace period trước khi reject requests không?
4. **Notification:** Có cần email/Slack notification khi sắp vượt quota không?
