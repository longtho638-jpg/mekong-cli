# Weekly Metrics Dashboard — Mekong CLI

**Purpose:** Track what matters, ignore vanity | **Cadence:** Every Monday AM

---

## Metrics Stack

| Layer | Tool | Cost | Setup Status |
|-------|------|------|-------------|
| Revenue | Polar.sh dashboard | Free | Ready |
| GitHub | GitHub Insights | Free | Ready |
| PyPI downloads | pypistats.org | Free | After publish |
| CLI telemetry | Custom opt-in | Free (Supabase) | Build Q2 |
| Web analytics | Cloudflare Analytics | Free | After docs site |
| Error tracking | Sentry free tier | Free | Build Q2 |

---

## Weekly Dashboard (Manual Until Telemetry Live)

```
MEKONG CLI — WEEK OF [DATE]
═══════════════════════════════════════

REVENUE
  MRR:          $______  (Δ $______ WoW)
  New subs:     ______
  Churned:      ______
  Credits sold: $______

ACQUISITION
  GitHub stars: ______  (Δ ______)
  GitHub forks: ______  (Δ ______)
  PyPI DLs/wk:  ______
  New signups:  ______

ENGAGEMENT
  WAU:          ______
  Commands/wk:  ______
  Top command:  mekong ______

COMMUNITY
  Issues opened: ______
  PRs opened:    ______
  Discord:       ______

SHIPPING
  Commits:      ______
  Deploys:      ______
  Bugs fixed:   ______

THIS WEEK'S WIN:   ______________________________
THIS WEEK'S BLOCK: ______________________________
NEXT WEEK FOCUS:   ______________________________
```

---

## What to Track and Why

| Metric | Why It Matters | Action Threshold |
|--------|---------------|-----------------|
| MRR | Revenue health | If flat 3 weeks → change acquisition |
| WAU | Real engagement | If WAU < MAU/4 → retention problem |
| Commands/user | Product depth | If < 3/session → onboarding problem |
| Churn rate | Business sustainability | If > 8%/mo → pricing or value problem |
| Stars/week | Distribution signal | If < 2/week → content not working |
| PyPI downloads | Top-of-funnel | If flat → SEO/content gap |

---

## Metrics NOT to Track (Vanity)

- Total cumulative downloads (prefer weekly delta)
- Twitter followers (prefer engagement rate)
- Page views without conversion context
- "AI mentions" without sentiment

---

## Instrumentation Roadmap

### Phase 1 (Now — manual)
- Check Polar.sh weekly
- Check GitHub Insights weekly
- Log to this template in Notion

### Phase 2 (After first 10 users)
- Add opt-in telemetry to CLI (`mekong config --telemetry on`)
- Track: command name, duration_ms, success bool, error_type
- Store in Supabase free tier
- Auto-generate weekly report via `mekong /weekly-brief`

### Phase 3 (After $1K MRR)
- Grafana dashboard on Fly.io
- Slack/Discord bot posts weekly summary
- Cohort analysis: week-1 retention by acquisition source

---

## Cohort Retention Target

| Week | Target Retention |
|------|-----------------|
| W1 | 80% |
| W2 | 60% |
| W4 | 40% |
| W8 | 30% |
| W12 | 25% |

Industry benchmark for dev tools: W4 retention of 30%+ is healthy.
