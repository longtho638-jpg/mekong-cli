# Revenue Engine — RaaS Credit Pipeline Design
*Mekong CLI v5.0 | March 2026*

## Business Model Overview

| Tier | Price/mo | MCU Credits | Cost/MCU | Target Segment |
|------|----------|-------------|----------|----------------|
| Starter | $49 | 200 | $0.245 | Solo devs, experimenters |
| Pro | $149 | 1,000 | $0.149 | Small teams, agencies |
| Enterprise | $499 | Unlimited | ~$0.05–0.10 | Large teams, high volume |

**Revenue Architecture:** Subscription-first (monthly recurring) + credit top-ups + API access fees.

---

## Credit Pipeline Flow

```
Customer pays via Polar.sh
  → Webhook → /raas/webhook_bridge.py
  → Credit granted → SQLite (src/raas/credits.py)
  → Mission submitted → mcu_gate.py checks balance
  → Task executed → credit deducted (1/3/5 MCU by complexity)
  → Audit trail → billing_audit.py + usage_analytics.py
```

**Mission cost tiers (MISSION_COSTS in credits.py):**
- `simple`: 1 MCU (grep, status, quick commands)
- `standard`: 3 MCU (cook, plan, code tasks)
- `complex`: 5 MCU (full deploy, multi-agent DAGs)

---

## Revenue Projections (Conservative)

### Year 1 Targets

| Month | Starter | Pro | Enterprise | MRR |
|-------|---------|-----|------------|-----|
| M1 | 5 | 1 | 0 | $394 |
| M3 | 25 | 8 | 1 | $2,917 |
| M6 | 80 | 30 | 5 | $9,390 |
| M12 | 250 | 100 | 20 | $32,180 |

**ARR at M12:** ~$386K (conservative)

### Revenue Mix Target (Steady State)
- 40% Starter subscriptions
- 45% Pro subscriptions
- 15% Enterprise (high LTV, low churn)
- +10% credit top-ups (overage revenue)

---

## Credit Top-Up Strategy

Beyond monthly allotment, sell top-up packs:

| Pack | Credits | Price | Per MCU |
|------|---------|-------|---------|
| Mini | 50 | $14.99 | $0.30 |
| Standard | 200 | $49.99 | $0.25 |
| Bulk | 1,000 | $199 | $0.199 |

**Rationale:** Keeps users in-product instead of churning when they hit limits. Pro users who need 1,200 MCU in a sprint month will buy a mini top-up.

---

## Polar.sh Integration (Current State)

- Webhook bridge: `src/raas/webhook_bridge.py` + `webhook_dispatcher.py`
- Idempotency: `billing_idempotency.py` prevents double-credit
- Audit trail: `billing_audit.py` + `billing_reconciliation.py`
- Proration: `billing_proration.py` handles mid-cycle upgrades

**Missing:** Polar.sh checkout page links are not wired to live product IDs. Need to configure products on Polar dashboard and store IDs in env.

---

## Churn Risk & Retention

| Risk Factor | Mitigation |
|-------------|-----------|
| Credits expire unused | Rollover 25% of unused credits to next month |
| Users hit limits unexpectedly | SMS/email alert at 80% usage via `credit_rate_limiter.py` |
| Onboarding friction | QUICKSTART.md + `mekong company/init` guided setup |
| No visible ROI | `mekong status` shows missions completed, time saved estimate |

---

## Revenue Levers (Priority Order)

1. **Activate Polar.sh products** — no revenue flows until checkout links are live
2. **Credit alert emails** — drive top-up conversions at 80% usage
3. **Usage analytics dashboard** — make value visible to retain Pro/Enterprise
4. **Annual plans** (20% discount) — reduce churn, improve cash flow
5. **Team seats** (add-on $10/seat) — expand Pro plan ARPU

---

## Unit Economics

| Metric | Starter | Pro | Enterprise |
|--------|---------|-----|------------|
| LTV (12mo) | $588 | $1,788 | $5,988 |
| Churn target | <8%/mo | <4%/mo | <2%/mo |
| Payback period | <1mo | <1mo | <1mo |
| LLM cost/MCU | ~$0.02–0.05 | same | same |
| Gross margin | ~80–90% | ~87% | ~90% |

**Infra cost is near-zero** (Cloudflare free tier + Fly.io $0-20). LLM API calls are the primary variable cost. At scale, negotiate OpenRouter volume pricing.
