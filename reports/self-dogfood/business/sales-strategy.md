# Sales Strategy — RaaS Credits
*Mekong CLI v5.0 | March 2026*

## Sales Motion

Mekong is **product-led growth (PLG)** at its core. Traditional outbound sales is not appropriate at this stage. The funnel is:

```
GitHub discovery → README → QUICKSTART → mekong company/init
  → 7-day trial → hit MCU limit → upgrade prompt → Polar.sh checkout
```

**Goal:** Remove every friction point between discovery and first paid transaction.

---

## Funnel Stages

### Stage 1: Awareness
- GitHub stars, HN posts, Reddit threads, blog SEO
- Metric: weekly new unique visitors to GitHub/landing page
- Target: 500 unique visitors/week by June

### Stage 2: Activation
- User runs `pip install mekong-cli && mekong company/init`
- Completes first mission successfully
- Metric: % of installs that run first mission (target: 40%)

### Stage 3: Engagement
- User runs 10+ missions within 7 days (power users)
- Metric: D7 retention of activated users (target: 35%)

### Stage 4: Conversion
- User hits MCU limit or wants more
- Upgrade prompt in CLI: `mekong upgrade`
- Metric: trial → paid conversion (target: 12–18%)

### Stage 5: Expansion
- Starter → Pro upgrade when team grows
- Pro → Enterprise when usage consistently hits 1K/mo
- Metric: net revenue retention (target: >110%)

---

## PLG Conversion Tactics

### In-CLI Upsell Triggers
```
# When balance hits 20% remaining:
"You have 40 MCU left this month. Upgrade to Pro for 1,000 MCU → mekong upgrade"

# After completing complex mission:
"Nice work! This mission cost 5 MCU. Running 200+ missions/month? Pro saves $0.10/MCU → mekong upgrade"

# On HTTP 402 (zero balance):
"Out of credits. Top up instantly → https://mekong.sh/billing"
```

### Activation Email Sequence (via Resend/Postmark)
| Day | Email | CTA |
|-----|-------|-----|
| 0 | Welcome + QUICKSTART | Run first mission |
| 1 | "What can Mekong do?" — 5 hero workflows | Try `mekong cook` |
| 3 | Case study: agency saves 10hrs/week | Book demo (Enterprise) |
| 7 | Trial ending — here's your usage summary | Upgrade |
| 14 | Win-back: "What stopped you?" | Feedback form |

---

## Sales Channels

### Channel 1: Self-Serve (Primary — 80% of revenue)
- All Starter + most Pro sales happen without human involvement
- Polar.sh handles checkout, webhooks credit accounts automatically
- Support via GitHub Issues + Discord

### Channel 2: Community-Assisted (15%)
- Discord office hours — async sales via demo
- Respond to "how do I…" questions with working examples
- Every answered question is a conversion opportunity

### Channel 3: Direct Outreach — Enterprise Only (5%)
- Identify companies using Mekong via GitHub analytics
- LinkedIn DM to founders/CTOs of target agencies
- Simple pitch: "We noticed your team starred Mekong — happy to help set up Enterprise?"
- No cold calls. No SDR team. Founder-led only.

---

## Objection Handling

| Objection | Response |
|-----------|----------|
| "I can self-host for free" | True. Self-host is great. We sell credits for those who want managed + support. |
| "I don't know which LLM to use" | We support all via OpenRouter. Start with any, switch anytime. |
| "Is this secure? My code is sensitive" | BYOK — your API key, your LLM calls. We never see your prompts. |
| "What if you shut down?" | MIT license. Fork it. The code is yours. We're not going anywhere. |
| "Zapier already does this" | Zapier has no AI reasoning. Show them `mekong cook` vs a Zap. |

---

## Metrics Dashboard (Weekly Tracking)

| Metric | Current | Target (June) |
|--------|---------|---------------|
| GitHub stars | ~500 (est.) | 2,000 |
| Trial signups/week | — | 50 |
| Activated (ran mission) | — | 40% of trials |
| Paid customers | — | 65 |
| MRR | $0 (pre-launch) | $3,250 |
| Avg MCU used/active user | — | 120 (Starter) / 600 (Pro) |

---

## Q2 Sales Milestones

- **April 15:** Polar.sh products live, checkout flow working end-to-end
- **April 22:** 10 paying customers
- **May 15:** 30 paying customers, first Pro upgrade from Starter
- **June 1:** First Enterprise deal ($499/mo)
- **June 30:** $3K+ MRR, 65+ paying customers
