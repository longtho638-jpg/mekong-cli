---
name: saas-plg
description: Product-led growth, subscription billing, usage metering, feature flags, PLG CRM, onboarding. Use for SaaS products, self-serve growth, activation optimization, expansion revenue.
license: MIT
version: 1.0.0
---

# SaaS & Product-Led Growth Skill

Build and optimize SaaS products with PLG motions, subscription billing, usage-based pricing, and self-serve conversion funnels.

## When to Use

- Product analytics and user behavior tracking
- Feature flags and A/B experimentation
- User onboarding and activation flows
- Subscription and usage-based billing
- PLG CRM and product-qualified lead scoring
- Self-serve analytics and embedded BI
- In-app messaging and engagement
- Freemium-to-paid conversion optimization
- Net revenue retention and expansion
- Community-led growth programs

## Tool Selection

| Need | Choose |
|------|--------|
| Product analytics | PostHog (free tier, open-source), Amplitude (enterprise), Mixpanel |
| Feature flags | Statsig (saves $200K+/yr vs LaunchDarkly), PostHog (bundled) |
| Experimentation | Statsig, Eppo (warehouse-native), Optimizely |
| User onboarding | Appcues (mobile-native), Userflow (dev-friendly), Chameleon |
| In-app messaging | Customer.io (behavior automation), Intercom (chat-centric) |
| Subscription billing | Stripe Billing, Chargebee (RevOps), Paddle (MoR) |
| Usage-based billing | Metronome (OpenAI uses it), Orb, Amberflo, GetLago (OSS) |
| PLG CRM | Pocus (Revenue Data Platform), Correlated, Calixa |
| Embedded BI | Explo (headless), Metabase (OSS), Reveal (enterprise) |
| Community | Discord, Slack (B2B), Orbit (analytics) |

## PLG Funnel Architecture

```
Awareness → Signup → Activation → Engagement → Monetization → Expansion
    ↓          ↓         ↓            ↓            ↓             ↓
  Content    Free     First        Habit        Paywall       Upsell
  SEO/Ads   Tier     Value        Loops        Trigger       Seats/Usage
             ↓         ↓            ↓            ↓             ↓
          PostHog   Onboard     Feature      Billing       PLG CRM
          Signup    (Appcues)   Flags        (Stripe)      (Pocus)
          Track     Checklist   (Statsig)    Convert       Expansion
```

## Feature Flag + Experimentation Pattern

```python
# Statsig SDK (saves $200K+/yr vs LaunchDarkly for 1K-dev org)
from statsig import statsig, StatsigUser

statsig.initialize("server-secret-key")

user = StatsigUser(user_id="user_123", custom={
    "plan": "free",
    "signup_date": "2026-01-15",
    "company_size": 50
})

# Feature gate (boolean flag)
if statsig.check_gate(user, "new_dashboard_v2"):
    show_new_dashboard()

# Dynamic config (remote config)
config = statsig.get_config(user, "pricing_page")
show_price = config.get("monthly_price", 29)

# A/B experiment with metrics
experiment = statsig.get_experiment(user, "onboarding_flow")
variant = experiment.get("variant", "control")
# → "control" | "guided_tour" | "video_walkthrough"
# Statsig auto-tracks conversion + retention per variant
```

## Usage-Based Billing Pattern (Metronome)

```python
# Metronome — used by OpenAI, Anthropic for metered billing
import requests

headers = {"Authorization": f"Bearer {METRONOME_API_KEY}"}

# Ingest usage events
requests.post("https://api.metronome.com/v1/ingest", headers=headers, json=[
    {
        "transaction_id": "txn_abc123",
        "customer_id": "cust_456",
        "event_type": "api_call",
        "timestamp": "2026-03-01T12:00:00Z",
        "properties": {
            "model": "gpt-4",
            "tokens_input": 1500,
            "tokens_output": 500
        }
    }
])

# Query customer usage
usage = requests.get(
    "https://api.metronome.com/v1/customers/cust_456/usage",
    headers=headers,
    params={"start": "2026-03-01", "end": "2026-03-31"}
)
# Returns: billable usage, invoice preview, credit balance
```

## PLG Metrics Dashboard

| Metric | Formula | Benchmark |
|--------|---------|-----------|
| Activation Rate | Users completing key action / Signups | Good: 20-40%, Excellent: 50%+ |
| Time-to-Value | Median time from signup to aha moment | Leaders: < 7 days |
| PQL Conversion | PQLs converting to paid / Total PQLs | 25-30% typical, 35-40% top |
| Free-to-Paid | Paid users / Free signups | 2-5% freemium, 10-25% trial |
| Net Dollar Retention | (Start MRR + Expansion - Churn) / Start MRR | Healthy: > 100%, Top: 115-120%+ |
| Expansion MRR | Additional MRR from existing customers | > 30% of new MRR |
| Logo Churn | Customers lost / Start of period customers | < 5% monthly |
| Revenue Churn | MRR lost / Start MRR | < 3% monthly |
| CAC Payback | CAC / Monthly gross margin per customer | < 12 months |
| LTV:CAC | Customer LTV / Customer Acquisition Cost | > 3:1 |

## Pricing Model Decision Matrix

| Model | Best For | Example | Tool |
|-------|----------|---------|------|
| Flat-rate | Simple products | $29/mo | Stripe |
| Per-seat | Collaboration tools | $10/user/mo | Chargebee |
| Usage-based | API/infra products | $0.01/API call | Metronome, Orb |
| Hybrid | Enterprise SaaS | $99/mo + $0.001/event | Metronome + Stripe |
| Freemium | PLG motion | Free tier + paid upgrade | Any billing tool |
| Reverse trial | High-value features | 14-day full access → free | Stripe + feature flags |
| Credits | AI/compute products | Buy 1000 credits at $10 | Custom + Stripe |

## PLG Tech Stack by Stage

```
EARLY ($500-1K/mo):
  PostHog (free) + Stripe Billing + Userflow trial

GROWTH ($1-3K/mo):
  PostHog ($300) + Statsig ($500) + Appcues ($400) + Chargebee ($1K)

SCALE ($3-8K/mo):
  + Pocus ($1.5K) + Orb ($1K) + Intercom ($500) + BI tool

SAVE 40-60%:
  Replace Amplitude→PostHog, LaunchDarkly→Statsig, use OSS (Metabase, GetLago)
```

## Onboarding Checklist Pattern

```
1. Welcome screen (personalization survey: role, use case, team size)
2. Key integration setup (connect data source / invite teammate)
3. First value action (create first [project/dashboard/workflow])
4. Aha moment trigger (see results / get insight)
5. Habit loop (daily/weekly notification with value)
6. Upgrade prompt (usage limit / premium feature gate)

Track: % completing each step, drop-off points, time between steps
Tool: Appcues/Userflow checklist + PostHog funnel analysis
```

## References

- PostHog: https://posthog.com/docs
- Statsig: https://docs.statsig.com
- Metronome: https://docs.metronome.com
- Stripe Billing: https://stripe.com/docs/billing
- Pocus: https://pocus.com/docs
- Appcues: https://docs.appcues.com
- Chargebee: https://apidocs.chargebee.com
- Orb: https://docs.withorb.com
