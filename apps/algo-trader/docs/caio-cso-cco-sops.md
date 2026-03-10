# CAIO + CSO + CCO SOPs — Standard Operating Procedures

> Three C-Suite roles in one doc for efficiency.

---

## PART 1: CAIO — Chief AI Officer

> AI strategy, model selection, self-learning optimization, signal quality.

### SOP-AI01: AI Strategy

| Component | Current | Owner |
|-----------|---------|-------|
| Signal consensus | 4 strategies, weighted voting | CAIO |
| Self-learning | Win→+0.05, Loss→-0.05 weight | CAIO |
| Autonomy control | 4-tier (OBSERVE→AUTONOMOUS) | CAIO |
| Model routing | Antigravity Proxy, gemini-3-flash | CAIO |

### SOP-AI02: Signal Quality Audit

```
Monthly check:
□ Signal accuracy per strategy (target >60%)
□ Consensus threshold still optimal? (default 0.6)
□ Min votes appropriate? (default 2)
□ Weight evolution trending correctly?
□ False positive rate acceptable?
□ Alpha decay detection working?
```

### SOP-AI03: Self-Learning Review

```
Verify self-learning loop:
1. Win → strategy weight +0.05 (capped at 0.5)
2. Loss → strategy weight -0.05 (floor at 0.05)
3. Normalize: sum weights = 1.0
4. 3 losses → auto-downgrade autonomy
5. 5 wins → auto-restore previous level
```

### SOP-AI04: CAIO Checklist (Monthly)

```
□ Signal accuracy per strategy
□ Self-learning weight trends
□ Autonomy escalation/downgrade frequency
□ Model performance (latency, quality)
□ New strategy research pipeline
□ AI cost optimization (token usage)
```

---

## PART 2: CSO — Chief Security Officer

> API key security, exchange security, stealth detection risk, infrastructure hardening.

### SOP-S01: Security Posture

| Layer | Check | Frequency |
|-------|-------|-----------|
| API Keys | Rotated recently? Read-only where possible? | Monthly |
| Exchange | 2FA active? Withdrawal whitelist on? | Monthly |
| Codebase | No secrets in code? No `console.log` leaks? | Weekly |
| Infrastructure | Proxy secured? No open ports? | Monthly |
| Stealth | ToS risk acknowledged? Detection risk assessed? | Weekly |

### SOP-S02: Security Scan

```bash
# Secrets in code
grep -r "API_KEY\|SECRET\|PASSWORD\|PRIVATE_KEY" src/ --include="*.ts" | wc -l  # must = 0

# Dependency vulnerabilities
pnpm audit --audit-level=high

# Console leaks
grep -r "console\." src/ --include="*.ts" | wc -l  # target = 0
```

### SOP-S03: Stealth Risk Assessment

| Risk | Mitigation | Module |
|------|-----------|--------|
| Exchange detects bot | Poisson timing + log-normal sizing | phantom-stealth-math.ts |
| API fingerprint | Session rotation + UA masking | stealth-cli-fingerprint-masking.ts |
| Order pattern detected | TWAP/VWAP/Iceberg randomization | stealth-execution-algorithms.ts |
| Rate limit hit | OTR tracker <15% + adaptive rate | phantom-order-cloaking-engine.ts |
| Account ban | Multi-exchange, separate accounts | exchange-router-with-fallback.ts |

### SOP-S04: CSO Checklist (Weekly)

```
□ Security scan (SOP-S02)
□ API key inventory current?
□ Exchange security settings verified?
□ Stealth risk assessment (SOP-S03)
□ Incident review (any security events?)
□ pnpm audit clean?
```

---

## PART 3: CCO — Chief Commercial Officer (Giám Đốc Kinh Doanh)

> Revenue strategy, pricing, sales pipeline, partnerships, B2B opportunities.

### SOP-B01: Revenue Model

```
Tier 0: FREE (Open Source)     → Community growth, GitHub stars
Tier 1: PRO ($29/mo)           → AGI mode, stealth, alerts
Tier 2: TEAM ($99/mo)          → Multi-user, marketplace, API
Tier 3: ENTERPRISE (Custom)    → On-prem, SLA, white-label
```

### SOP-B02: Sales Pipeline

| Stage | Action | Owner |
|-------|--------|-------|
| Lead | GitHub stars, Discord joins, content | CMO |
| Qualify | DM outreach, demo request | CCO |
| Demo | Live backtest demo, show results | CCO |
| Trial | 14-day PRO trial | Auto |
| Close | Convert to paid (Polar.sh) | CCO |
| Expand | Upsell TEAM/ENTERPRISE | CCO |

### SOP-B03: B2B Opportunities

| Segment | Offer | Price Range |
|---------|-------|-------------|
| Solo traders | PRO subscription | $29/mo |
| Trading groups | TEAM license | $99/mo |
| Hedge funds | White-label | $1K-5K/mo |
| Exchanges | Strategy marketplace | Revenue share |
| Prop trading firms | Custom deployment | $5K-20K/mo |

### SOP-B04: CCO Checklist (Weekly)

```
□ MRR tracking (Polar.sh dashboard)
□ Trial → Paid conversion rate
□ New leads in pipeline
□ Demo scheduled/completed
□ Upsell opportunities identified
□ Partnership pipeline status
□ Competitor pricing check
```

---

*SOPs v1.0 — 2026-03-03*
