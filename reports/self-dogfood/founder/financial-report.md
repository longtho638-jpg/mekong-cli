# Financial Report — March 2026

**Period:** March 1–31, 2026 | **Status:** Pre-revenue

---

## P&L Summary

| Line Item | Amount | Notes |
|-----------|--------|-------|
| **Revenue** | $0 | Pre-launch, no paying customers |
| **COGS** | $0 | No LLM costs billed to customers yet |
| **Gross Profit** | $0 | — |
| **Operating Expenses** | -$23/mo | See breakdown below |
| **Net Income** | -$23/mo | Effectively infinite runway at $0 revenue |

---

## Infrastructure Costs (March 2026)

| Service | Plan | Cost/mo |
|---------|------|---------|
| Cloudflare Pages | Free | $0 |
| Cloudflare Workers | Free (100K req/day) | $0 |
| Vercel | Hobby | $0 |
| Fly.io | Hobby (256MB) | $3 |
| Supabase | Free tier | $0 |
| GitHub | Free (public repos) | $0 |
| Domain (mekong-cli.dev) | Annual ÷ 12 | $1.50 |
| OpenRouter (dev testing) | Pay-per-use | ~$18 |
| **Total** | | **~$22.50** |

---

## Cash Position

| Item | Amount |
|------|--------|
| Founder-funded runway | Personal savings |
| Monthly burn | ~$23 |
| Months of runway | Effectively unlimited (personal) |
| External funding | $0 |
| Revenue | $0 |

---

## Cost of First Customer

Marginal cost to serve one Starter customer ($49/mo):

| Cost | Amount |
|------|--------|
| LLM API calls (200 MCU × avg $0.05) | ~$10 |
| Polar.sh transaction fee (2.9% + $0.30) | ~$1.72 |
| Infra (incremental) | ~$0.50 |
| **Total COGS** | **~$12.22** |
| **Gross Margin** | **$36.78 (75%)** |

75% gross margin is healthy for SaaS. Improves with scale as fixed infra costs amortize.

---

## Unit Economics Preview

| Metric | Value |
|--------|-------|
| CAC (estimated, organic) | $0 (content-driven) |
| LTV (Starter, 12mo avg tenure) | $441 |
| LTV:CAC | ∞ (organic) |
| Payback period | Immediate (month 1) |

---

## March 2026 Activities (No Revenue Impact)

- Shipped Mekong CLI v5.0 (289 commands)
- Completed self-dogfood Phase 1 reports (founder, business, hr)
- Set up Polar.sh billing infrastructure
- Cloudflare R2 + secrets configured

---

## April 2026 Financial Priorities

- [ ] Publish to PyPI (unlock install tracking)
- [ ] Polar.sh webhook integration tested end-to-end
- [ ] First customer target: 1 Starter ($49)
- [ ] Set up basic P&L tracking (Notion or spreadsheet)
