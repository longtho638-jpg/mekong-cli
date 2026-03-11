# Partnership Strategy — Integrations, Affiliates, Resellers
*Mekong CLI v5.0 | March 2026*

## Partnership Tiers

| Tier | Type | Revenue Share | Effort | Examples |
|------|------|--------------|--------|---------|
| Integration | Technical | None (mutual benefit) | Low | OpenRouter, Polar.sh |
| Affiliate | Referral | 20% MRR for 6 months | Low | Bloggers, YouTubers |
| Reseller | White-label | 30% discount off list | Medium | Agencies |
| Strategic | Co-marketing | Rev share negotiated | High | Cloudflare, Fly.io |

---

## Priority Partnerships (Q2 2026)

### 1. OpenRouter — Integration + Co-Marketing
**Status:** Already integrated (LLM_BASE_URL support)
**Opportunity:**
- Get listed in OpenRouter's "built with" showcase
- Co-author blog: "How Mekong uses OpenRouter for universal LLM routing"
- OpenRouter has ~50K developer users — exact Mekong ICP
**Action:** Email support@openrouter.ai with partnership proposal
**Expected reach:** 5,000–10,000 impressions, 200–500 GitHub stars

### 2. Polar.sh — Payment Integration + Showcase
**Status:** Integrated (webhook bridge complete)
**Opportunity:**
- Featured in Polar's "open source businesses" showcase
- Polar has strong OSS founder community (our ICP-1)
- Mutual: we promote Polar, they promote Mekong
**Action:** Submit to Polar's partner form + post in their Discord
**Expected reach:** 1,000–3,000 OSS founders

### 3. Cloudflare — Sponsorship + Developer Spotlight
**Status:** Using Cloudflare Pages + Workers (free tier)
**Opportunity:**
- Apply for Cloudflare Workers Launchpad ($25K cloud credits + exposure)
- Developer spotlight on Cloudflare blog
- Cloudflare has ~4M developer accounts
**Action:** Apply at workers.cloudflare.com/built-with
**Expected reach:** 10,000+ developer impressions

### 4. Fly.io — OSS Sponsorship
**Status:** Deploy target in `fly.toml` exists
**Opportunity:**
- Fly.io has an open source sponsorship program ($300/mo credit + social amplification)
- They actively promote interesting OSS projects on Twitter
**Action:** Submit at fly.io/docs/about/open-source
**Expected reach:** 2,000–5,000 devs

### 5. Anthropic / Claude — Ecosystem Listing
**Status:** Mekong is built on top of Claude Code patterns
**Opportunity:**
- Apply to Anthropic's Claude Ecosystem directory
- "Built with Claude" badge + listing drives discovery
**Action:** Submit at anthropic.com/partners

---

## Affiliate Program Design

**Structure:**
- 20% of first 6 months of referred customer's subscription
- Cookie duration: 90 days
- Minimum payout: $20 (avoids micro-payouts)
- Paid via Polar.sh balance transfer

**Affiliate targets:**
| Type | Example | Reach | Est. Conversions |
|------|---------|-------|-----------------|
| Dev YouTubers | Theo (t3.gg), Fireship | 100K–1M | 5–20/video |
| Dev bloggers | Indie Hackers writers | 10K–50K | 2–8/post |
| Newsletter writers | TLDR Dev, Bytes.dev | 50K–500K | 10–30/issue |
| Discord community owners | various dev Discords | 1K–20K | 2–10/post |

**Affiliate link format:** `mekong.sh?ref={affiliate_code}`
**Tracking:** UTM parameters + Polar.sh referral tracking

---

## Reseller Program (Q3 2026)

Target: Dev agencies that want to white-label AI automation for clients.

**Value prop:** Agency pays Pro ($149) + $10/seat for client seats. Bills client $299–$499/mo. Margin: $150–$340/client/mo.

**Requirements to qualify:**
- 5+ clients
- Technical capability to configure `.env` for clients
- Agree to Mekong brand usage guidelines

**Benefits:**
- 30% discount off list price
- Priority support in dedicated Discord channel
- Co-marketing opportunities
- Early access to new features

---

## Integration Roadmap

| Integration | Value | Timeline |
|------------|-------|----------|
| Slack notifications | Mission completion alerts | Q2 |
| GitHub Actions native | `mekong review` in CI | Q2 |
| Linear/Jira sync | Sprint task sync | Q3 |
| Stripe/Polar.sh analytics | Revenue dashboard | Q3 |
| Supabase | Persistent memory for missions | Q3 |
| Zapier connector | Reach non-CLI users | Q4 |

---

## Partnership KPIs

| Metric | Q2 Target |
|--------|-----------|
| Integration partnerships signed | 3 (OpenRouter, Polar, Cloudflare) |
| Affiliate partners recruited | 10 |
| Attributed signups from partners | 100 |
| Attributed MRR from partners | $1,000 |
| Reseller pipeline started | 2 agencies in talks |
