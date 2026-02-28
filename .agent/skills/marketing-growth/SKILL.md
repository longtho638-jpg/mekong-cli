---
name: marketing-growth
description: Growth engineering, A/B testing, viral loops, referral systems, PLG onboarding, experimentation. Use for conversion optimization, feature flags, growth metrics, activation funnels.
license: MIT
version: 1.0.0
---

# Marketing Growth Skill

Engineer product-led growth with experimentation frameworks, viral mechanics, referral systems, and activation funnels.

## When to Use

- A/B testing and experimentation setup
- Feature flag management and progressive rollouts
- Viral loop and referral program design
- Product-Led Growth (PLG) onboarding optimization
- Activation funnel analysis and improvement
- Growth metric dashboards (North Star, AARRR)
- Usage-based upsell trigger automation
- PQL (Product-Qualified Lead) scoring and routing
- Pricing page optimization and paywall experiments

## Tool Selection

| Need | Choose |
|------|--------|
| A/B testing (open-source) | GrowthBook (warehouse-native, zero-latency) |
| A/B testing (managed) | Statsig (Autotune bandit), Eppo (CUPED) |
| Feature flags | LaunchDarkly, Unleash (open-source), Flagsmith |
| Referral programs | Tolt (Stripe-native SaaS), ReferralHero, Viral Loops |
| PLG onboarding | Userflow, Appcues (backend-triggered) |
| Product analytics | PostHog (all-in-one OSS), June.so (B2B PLG) |
| Session replay | PostHog, Hotjar, FullStory |
| Surveys | Formbricks (open-source), Sprig, Typeform |
| Reverse ETL | Hightouch, Census (warehouse → tools) |

## Growth Framework: AARRR Pirate Metrics

```
Acquisition → Activation → Retention → Revenue → Referral
    ↓              ↓            ↓           ↓          ↓
SEO/Ads       Onboarding    Usage freq   Conversion  Viral loop
Social        First value   DAU/MAU      Expansion   NPS → invite
Content       Aha moment    Cohort       Pricing     Incentive
```

## Experimentation Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Experiment Platform                   │
│  GrowthBook / Statsig / Eppo                         │
├─────────────────────────────────────────────────────┤
│  Feature Flags → User Targeting → Traffic Split      │
│       ↓                                              │
│  Variant Assignment (deterministic hashing)          │
│       ↓                                              │
│  Event Tracking (PostHog/Amplitude/Segment)          │
│       ↓                                              │
│  Statistical Engine                                  │
│  ├── Frequentist: fixed sample, p<0.05               │
│  ├── Bayesian: continuous monitoring, no peeking     │
│  └── CUPED: variance reduction, faster significance  │
│       ↓                                              │
│  Decision: Ship / Iterate / Kill                     │
└─────────────────────────────────────────────────────┘
```

## Viral Loop Pattern

```python
# Referral system with anti-abuse
def generate_referral(user_id: str) -> str:
    ref_code = f"ref_{user_id}_{int(time.time())}"
    url = f"https://app.com/signup?ref={ref_code}"
    return url

def track_referral(ref_code: str, new_user_id: str):
    referrer = parse_referrer(ref_code)
    # Anti-abuse checks
    if get_referral_count(referrer, period='month') >= 10:
        return  # Max 10 refs/user/month
    if same_email_domain(referrer, new_user_id):
        return  # Block self-referrals
    # Wait for activation (not just signup)
    schedule_activation_check(referrer, new_user_id, delay='48h')

def on_activation(referrer_id: str, referred_id: str):
    grant_credits(referrer_id, amount=10)   # Reward referrer
    grant_credits(referred_id, amount=5)    # Reward referred
    notify_referrer(referrer_id, "Your referral activated!")
```

## PLG Automation Patterns

```yaml
pql_detection:
  trigger: "PostHog event: power_feature_used × 3 in 24h"
  actions:
    - segment_track: { event: 'pql_triggered', score: 'hot' }
    - slack_notify: '#sales-pql channel'
    - hubspot_update: { lifecycle: 'PQL', score: 90 }

usage_upsell:
  trigger: "DB cron: user at 90% of free tier limit"
  actions:
    - day_0: "Userflow in-app upgrade banner"
    - day_3: "Resend email: usage report + upgrade CTA"
    - day_7: "If dismissed → SDR outreach"

activation_nudge:
  trigger: "24h after signup, no core action completed"
  actions:
    - day_1: "Appcues onboarding checklist"
    - day_2: "Resend personalized email with next step"
    - day_5: "If PQL score < 30 → low-touch email drip"
```

## Key Metrics

| Metric | Target | Formula |
|--------|--------|---------|
| Activation Rate | > 40% | Users completing core action / Signups |
| Time to Value | < 5 min | Signup → first "aha moment" |
| Viral Coefficient (K) | > 1.0 | Invites sent × conversion rate |
| Feature Adoption | > 60% | Users using feature / Total active users |
| Expansion Revenue | > 20% of MRR | Upgrades + add-ons / Total MRR |
| Experiment Velocity | > 2/week | Experiments shipped per week |
| Win Rate (experiments) | > 30% | Successful experiments / Total run |

## ICE Scoring for Experiment Backlog

```markdown
| Experiment | Impact (1-10) | Confidence (1-10) | Ease (1-10) | ICE Score |
|------------|---------------|-------------------|-------------|-----------|
| Simplify signup form | 8 | 7 | 9 | 504 |
| Add social proof to pricing | 6 | 5 | 8 | 240 |
| Gamify onboarding | 9 | 4 | 3 | 108 |
```
*ICE = Impact × Confidence × Ease. Prioritize highest score first.*

## Key Best Practices (2026)

**CUPED Variance Reduction:** Reach statistical significance with 40-60% less traffic
**Bayesian Over Frequentist:** Continuous monitoring without peeking problems — ship faster
**Velocity-First:** Optimize learning cycles/week, not individual test significance
**Warehouse-Native:** GrowthBook/Eppo run stats directly on your data warehouse — no data duplication
**Activation Over Acquisition:** Focus on converting signups to active users before scaling top-of-funnel

## References

- `references/experimentation-platform-setup.md` - GrowthBook, Statsig, feature flag patterns
- `references/viral-referral-system-design.md` - Viral loops, referral mechanics, anti-abuse
