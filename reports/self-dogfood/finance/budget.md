# 2026 Budget — Infrastructure, LLM Credits, Marketing
*Mekong CLI v5.0 | Open Source Project | March 2026*

## Budget Philosophy

Mekong is MIT-licensed, bootstrapped, and deliberately lean. Every cost line must either:
1. Directly enable revenue (infra, payment processing), or
2. Accelerate growth (marketing, community)

No vanity spend. No annual SaaS subscriptions for internal tooling — we use Mekong itself.

---

## Infrastructure Costs

| Service | Tier | Monthly | Annual | Notes |
|---------|------|---------|--------|-------|
| Cloudflare Pages | Free | $0 | $0 | Frontend CDN |
| Cloudflare Workers | Free (100K req/day) | $0 | $0 | Edge API |
| Vercel | Hobby/Free | $0 | $0 | SSR app layer |
| Fly.io | Scale-to-zero | $5–20 | $60–240 | Backend API, scales with usage |
| GitHub Actions | Free (public repo) | $0 | $0 | CI/CD (25 workflows) |
| PyPI | Free | $0 | $0 | Package distribution |
| Domain (mekong.sh) | Cloudflare Registrar | $10 | $120 | DNS included |
| **Infra Total** | | **$15–30** | **$180–360** | Near-zero infra model |

---

## LLM API Costs (Internal — Development & Testing)

Mekong is BYOK for users. But internal development and CI testing consumes LLM credits.

| Use Case | Provider | Est. Monthly Tokens | Cost |
|----------|----------|-------------------|------|
| Development/testing | OpenRouter (cheapest model) | ~2M tokens | $4–8 |
| CI integration tests | DeepSeek / local Ollama | ~500K tokens | $0–1 |
| Demo account (for sales) | Claude Sonnet | ~500K tokens | $3–5 |
| **LLM Total** | | | **$7–14/mo** |

**Note:** At $0.002–0.005/1K tokens for budget models, internal LLM costs stay trivial until scale.

---

## Payment Processing

| Item | Rate | Monthly (at $3K MRR) | Notes |
|------|------|--------------------|-------|
| Polar.sh transaction fee | 4% + $0.40 | ~$160 | Standard Polar rate |
| Stripe (legacy, removal pending) | N/A | $0 | Being replaced |
| **Processing Total** | | **~$160** | Decreases as % at scale |

---

## Marketing Budget

| Line Item | Monthly | Q2 Total | Notes |
|-----------|---------|----------|-------|
| Twitter/X promotion | $67 | $200 | Boost best-performing posts |
| Reddit ads | $33 | $100 | r/devops targeting |
| Canva Pro (design) | $15 | $45 | Social graphics, PH assets |
| Product Hunt extras | $0 | $0 | Free to submit |
| Blog hosting | $0 | $0 | Uses existing Cloudflare Pages |
| **Marketing Total** | **$115** | **$345** | Lean Q2 launch budget |

---

## Tooling & Services

| Tool | Cost | Notes |
|------|------|-------|
| Email (Resend) | $0–20/mo | Free up to 3K emails/mo |
| Discord Nitro (community) | $0 | Free server, Nitro optional |
| GitHub (public repo) | $0 | Free |
| Sentry (error tracking) | $0–26/mo | Free up to 5K errors/mo |
| **Tooling Total** | **$0–46/mo** | |

---

## Revenue Projections vs. Costs

| Month | Revenue (MRR) | Total Costs | Net |
|-------|--------------|-------------|-----|
| April (launch) | $500 | $300 | +$200 |
| May | $1,500 | $350 | +$1,150 |
| June | $3,250 | $450 | +$2,800 |
| September | $8,000 | $700 | +$7,300 |
| December | $18,000 | $1,200 | +$16,800 |

**Path to ramen profitability:** $2,000 MRR covers all costs + $150/mo founder stipend. Target: **May 2026**.

---

## Annual Budget Summary (2026)

| Category | Annual Budget |
|----------|--------------|
| Infrastructure | $360 |
| LLM (internal) | $168 |
| Payment processing (~5% MRR) | $1,800 (at $30K ARR) |
| Marketing | $1,500 |
| Tooling | $300 |
| Legal (one-time CLA setup) | $500 |
| **Total 2026** | **~$4,628** |

**2026 Revenue target (conservative):** $30,000 ARR by December
**2026 Net (conservative):** $25,372

---

## Budget Triggers (Scale Events)

| Trigger | Action | Cost Impact |
|---------|--------|------------|
| 100+ paying customers | Upgrade Fly.io to dedicated VM | +$29/mo |
| 500+ paying customers | Hire community manager (part-time) | +$1,500/mo |
| Enterprise customer (>$499) | Add Sentry Team plan | +$26/mo |
| >10K emails/mo | Upgrade Resend to Starter | +$20/mo |
| SOC2 inquiry | Engage compliance consultant | +$5,000 one-time |
