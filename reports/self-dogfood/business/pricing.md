# Pricing Optimization Analysis — RaaS $49/$149/$499
*Mekong CLI v5.0 | March 2026*

## Current Pricing Structure

| Tier | Price | Credits | $/MCU | Audience |
|------|-------|---------|-------|----------|
| Starter | $49/mo | 200 MCU | $0.245 | Solo devs, experimenters |
| Pro | $149/mo | 1,000 MCU | $0.149 | Small teams, agencies |
| Enterprise | $499/mo | Unlimited | ~$0.05–0.10 | Large orgs |

---

## Competitive Benchmarks

| Product | Price | What you get | Notes |
|---------|-------|--------------|-------|
| GitHub Copilot | $19/mo | Code suggestions only | No business ops |
| Cursor Pro | $20/mo | IDE AI only | No CLI, no agents |
| Zapier | $79–$799/mo | Automations (limited) | No AI reasoning |
| n8n Cloud | $20–$50/mo | Workflow builder | Self-host alternative exists |
| Relevance AI | $199–$599/mo | AI agents | Enterprise-focused |
| **Mekong Pro** | **$149/mo** | 289 AI workflows + agents | Unique positioning |

**Verdict:** Mekong is priced below Relevance AI and Zapier Enterprise for equivalent or superior capability. There is headroom to raise prices at product maturity.

---

## Price Sensitivity Analysis

### Starter ($49)
- **Sweet spot:** $29–$59 for indie devs
- $49 is slightly high for pure experimenters with no team
- **Recommendation:** Keep at $49 but add a **7-day free trial** (no card required)
- Consider: $29/mo "Hobbyist" tier at 75 MCU to reduce top-of-funnel friction

### Pro ($149)
- **Sweet spot:** $99–$199 for teams
- $149 is strong positioning — below Relevance AI, above Zapier core
- **Issue:** 1,000 MCU may not be enough for active dev teams doing daily deploys
- **Recommendation:** Keep price, increase MCU to **1,500** or add rollover credits

### Enterprise ($499)
- **Sweet spot:** $399–$999 for unlimited tiers in this space
- $499 is underpriced for "unlimited" — Relevance AI charges $599+ for less
- **Recommendation:** Raise to $799 at v1.0 GA, add SLA + dedicated support

---

## Proposed Tier Revision (Q3 2026)

| Tier | Current | Proposed | Delta |
|------|---------|----------|-------|
| Free | None | 25 MCU/mo free | New |
| Starter | $49/200 MCU | $49/250 MCU | +50 MCU |
| Pro | $149/1,000 MCU | $149/1,500 MCU + rollover | +500 + rollover |
| Enterprise | $499/unlimited | $799/unlimited + SLA | +$300 |
| Teams add-on | None | $10/seat (5+ seats) | New |

**Expected revenue impact:** +15–25% ARPU from teams add-on, Enterprise raise captures higher willingness-to-pay from B2B buyers.

---

## Annual Plan Strategy

| Tier | Monthly | Annual (20% disc) | Savings |
|------|---------|-------------------|---------|
| Starter | $49 | $470/yr ($39/mo) | $118 |
| Pro | $149 | $1,430/yr ($119/mo) | $358 |
| Enterprise | $499 | $4,790/yr ($399/mo) | $1,198 |

**Why annual matters:**
- Reduces churn: annual customers churn 4x less than monthly
- Improves cash flow for infra/LLM cost management
- Target: 30% of new subs opt into annual by Q4

---

## Freemium vs. Free Trial Analysis

| Model | Pros | Cons | Verdict |
|-------|------|------|---------|
| Free tier (25 MCU/mo) | Top-of-funnel, OSS community | Abuse, LLM cost | Consider for v1.0 GA |
| 7-day free trial | Reduces signup friction | Requires card capture | **Implement now** |
| Open source self-host | Community + brand | No revenue from self-hosters | Already in place |

**Recommendation:** 7-day free trial with card (200 MCU) → converts ~15% to paid based on dev tool benchmarks.

---

## Pricing Page Copy Principles

1. Lead with **outcomes**, not features: "Ship in 10 minutes, not 10 hours"
2. Anchor on **cost of alternatives**: "Zapier + n8n + Notion = $300+/mo"
3. Highlight **unlimited LLM** (user brings their key) as cost transparency win
4. Show **monthly savings calculator** on pricing page
