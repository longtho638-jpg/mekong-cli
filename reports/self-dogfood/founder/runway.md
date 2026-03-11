# Runway Analysis — Mekong CLI

**Date:** March 2026 | **Stage:** Pre-revenue, bootstrap

---

## Current Financial Position

Mekong CLI is an open-source project with near-zero operating costs. No employees, no office, no paid marketing. All infrastructure runs on free tiers or minimal paid plans.

---

## Monthly Burn Breakdown

| Item | Cost/mo | Notes |
|------|---------|-------|
| Fly.io backend | $20 | Single shared-cpu-1x, 256MB RAM |
| Cloudflare Pages | $0 | Free tier, static hosting |
| Cloudflare Workers | $0 | Free 100K requests/day |
| Vercel (dashboard) | $0 | Hobby plan |
| Polar.sh | $0 | 5% + $0.50 per transaction (pay-as-you-go) |
| Claude API (self-dogfooding) | ~$30–50 | Running Mekong on Mekong in dev |
| Domain (agencyos.network) | ~$2 | Amortized monthly |
| GitHub | $0 | Free for public repos |
| **Total** | **~$52–72/mo** | **Call it $70/mo worst case** |

---

## Runway Scenarios

### Scenario A: Pure Bootstrap (no outside capital)

| Capital Available | Monthly Burn | Runway |
|------------------|-------------|--------|
| $0 (founder-funded) | $70 | Indefinite if founder has income |
| $1,000 reserve | $70 | 14 months |
| $5,000 reserve | $70 | 71 months (5.9 years) |

**Reality:** At $70/mo burn, Mekong can run indefinitely as a side project. The cost of inaction is near-zero.

### Scenario B: First Revenue ($49 Starter customers)

| Customers | MRR | Net burn (after LLM costs ~5%) | Months to ramen profitable |
|-----------|-----|-------------------------------|---------------------------|
| 1 | $49 | -$23/mo | Still burning |
| 2 | $98 | +$26/mo | **Ramen profitable** |
| 5 | $245 | +$172/mo | Cash flow positive |
| 10 | $490 | +$417/mo | Building runway |

**Ramen profitable at 2 Starter customers.** This is a very low bar — achievable in Q2 2026.

### Scenario C: Pre-seed $200K

| Use | Months | Burn rate |
|-----|--------|-----------|
| Infrastructure + API at scale | 12 | $500/mo |
| Contract engineering (VS Code ext) | 6 | $8K/mo |
| GTM + content | 12 | $3K/mo |
| **Effective runway** | **18–24 months** | **~$8K/mo** |

At $200K, burn rises to ~$8K/mo to actually hire and market. Runway: 25 months.

---

## Cost Scaling with Revenue

| MRR | New Infra Costs | LLM Costs (est.) | Net Margin |
|-----|----------------|-----------------|-----------|
| $0 | $70 | $0 | -$70 |
| $500 (10 customers) | $90 | $24 | +$386 |
| $5K (100 customers) | $200 | $240 | +$4,560 |
| $50K (1K customers) | $1,500 | $2,400 | +$46,100 |

Infrastructure costs scale slowly (SQLite per-tenant on Fly.io, Cloudflare edges), LLM costs are ~5% of revenue. **Mekong is structurally cheap to run at scale.**

---

## Critical Cost Triggers

| Trigger | New Cost | Notes |
|---------|---------|-------|
| Fly.io scale-up (500+ concurrent missions) | +$50/mo | Add 1 more machine |
| Postgres migration from SQLite | +$20/mo | Supabase free tier available |
| Enterprise SLA monitoring (Uptime Robot) | +$7/mo | Needed for Enterprise tier |
| SOC2 audit | $15K one-time | Q4 2026 if needed |
| VS Code extension (VSIX signing) | $99/year | Microsoft Publisher account |

None of these are urgent before first paying customer.

---

## Key Takeaway

**Mekong CLI has effectively infinite runway as a bootstrap project.** $70/mo burn means the only way this dies is if the founder stops working on it — not if money runs out.

The $200K raise is for **acceleration**, not survival. It buys engineering bandwidth (VS Code extension, plugin marketplace) and distribution capital (conference presence, content budget) that would take 2+ years to achieve organically.

**Decision gate:** If 0 paying customers by end of Q3 2026, reassess whether to raise or pivot to agency white-label channel as primary revenue path.
