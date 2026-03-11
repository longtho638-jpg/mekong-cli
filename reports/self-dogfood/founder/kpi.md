# KPI Dashboard — Mekong CLI

**Updated:** March 2026 | **Review:** Weekly Mondays

---

## North Star Metric

**Commands executed per week** — measures real product usage, not vanity metrics.
Target Q2: 500 commands/week across all users.

---

## Revenue KPIs

| KPI | Current | Q2 Target | Track Via |
|-----|---------|-----------|-----------|
| MRR | $0 | $10,000 | Polar.sh dashboard |
| ARR | $0 | $120,000 | MRR × 12 |
| New MRR | $0/mo | $3,500/mo | Polar.sh new subscriptions |
| Churned MRR | — | < $500/mo | Polar.sh cancellations |
| Net MRR Growth | — | > 30%/mo | (New − Churned) / Prior MRR |
| ARPU | — | $78 | MRR / paying users |
| Credit purchases (one-time) | $0 | $500/mo | Polar.sh one-time orders |

---

## Acquisition KPIs

| KPI | Current | Q2 Target | Track Via |
|-----|---------|-----------|-----------|
| GitHub Stars | ~0 | 100 | GitHub Insights |
| GitHub Forks | ~0 | 10 | GitHub Insights |
| PyPI downloads/mo | 0 | 500 | pypistats.org |
| Unique CLI installs | 0 | 200 | Telemetry opt-in |
| Free trial signups | 0 | 500 | Auth logs |
| Trial → paid conversion | — | 25% | Polar.sh funnel |

---

## Engagement KPIs

| KPI | Current | Q2 Target | Track Via |
|-----|---------|-----------|-----------|
| DAU (Daily Active Users) | 0 | 20 | Telemetry |
| WAU (Weekly Active Users) | 0 | 50 | Telemetry |
| Commands/user/day | — | 5 | Telemetry |
| Most-used commands | — | Track top 10 | Telemetry |
| Session length (avg) | — | > 10 min | Telemetry |
| MCU consumed/user/mo | — | 40 | Credit ledger |

---

## Community KPIs

| KPI | Current | Q2 Target | Track Via |
|-----|---------|-----------|-----------|
| GitHub Issues opened | 0 | 20 | GitHub |
| PRs merged (external) | 0 | 5 | GitHub |
| Discord members | 0 | 50 | Discord |
| Dev.to article views | 0 | 5,000 | Dev.to analytics |
| Twitter impressions/mo | 0 | 10,000 | Twitter analytics |

---

## Infrastructure KPIs

| KPI | Current | Q2 Target | Alert Threshold |
|-----|---------|-----------|----------------|
| API p95 latency | ~450ms | < 200ms | > 500ms |
| Uptime | Not measured | 99.5% | < 99% |
| Build time | ~45s | < 30s | > 60s |
| Deploy frequency | Manual | 2×/week | — |
| Credit ledger errors | 0 | 0 | Any |

---

## Weekly Reporting Template

```
Week of [DATE]
─────────────
MRR:        $X (+$Y WoW)
Stars:      X (+Y WoW)
WAU:        X
Commands:   X total, X/user avg
Top cmd:    mekong [X]
Top issue:  [summary]
Shipped:    [what we deployed]
Next week:  [focus]
```

---

## Instrumentation Roadmap

- [ ] Add opt-in telemetry to CLI (command name, duration, success/fail)
- [ ] Polar.sh webhook → internal metrics DB
- [ ] Weekly automated email report to founder
- [ ] Grafana dashboard on Fly.io
