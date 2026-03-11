# Credit Tier Pricing Analysis — Simple / Standard / Complex

**Date:** March 2026 | **Purpose:** Validate MCU pricing tiers align with actual LLM cost

---

## Current Pricing Model

All tiers use a flat MCU bundle (credits/mo). MCU deducted per mission based on complexity.

| Tier | Bundle | Price | Price/MCU |
|------|--------|-------|-----------|
| Starter | 200 MCU | $49 | $0.245 |
| Pro | 1,000 MCU | $149 | $0.149 |
| Enterprise | Unlimited | $499 | variable |

---

## Mission Complexity Tiers

### Tier 1: Simple (1 MCU)

**What qualifies:** Read-only or single-output tasks
- `mekong plan "describe a feature"` — LLM generates plan, no execution
- `mekong review file.py` — static analysis + LLM commentary
- `mekong brainstorm "startup ideas"` — text generation only
- `mekong ask "how does X work"` — Q&A

**Avg token cost:** ~1,100 tokens total → **$0.008 LLM cost**
**Revenue at Starter:** $0.245
**Margin:** 96.7%

**Volume estimate:** 40% of all missions (plan-heavy users)

---

### Tier 2: Standard (3 MCU)

**What qualifies:** Execute + verify cycle with file I/O
- `mekong cook "add authentication"` — code generated + tests run + verified
- `mekong fix "resolve this bug"` — diagnosis + patch + verify
- `mekong code "implement X"` — multi-file code generation
- `mekong test` — test suite generation + execution check

**Avg token cost:** ~3,700 tokens total (includes PEV loop) → **$0.033 LLM cost**
**Revenue at Starter:** $0.735 (3 × $0.245)
**Margin:** 95.5%

**Volume estimate:** 45% of all missions

---

### Tier 3: Complex (5 MCU)

**What qualifies:** Multi-agent, external API calls, infrastructure changes
- `mekong deploy` — CI/CD configuration + cloud provisioning + smoke test
- `mekong founder/vc/cap-table` — multi-step financial modeling + doc generation
- `mekong security/audit` — full codebase scan + report + patch recommendations
- `mekong annual "business plan"` — multi-section document with research

**Avg token cost:** ~8,000 tokens total → **$0.074 LLM cost**
**Revenue at Starter:** $1.225 (5 × $0.245)
**Margin:** 94.0%

**Volume estimate:** 15% of all missions

---

## Weighted Average Economics

At Starter tier ($49/mo, 200 MCU):

| Mix | MCU Weight | LLM Cost | Revenue |
|-----|-----------|----------|---------|
| 40% simple (80 MCU) | 80 | $0.64 | $19.60 |
| 45% standard (90 MCU × 3) = 90 missions using 270 MCU... | — | — | — |

Correction: 200 MCU total, distributed as:
- Simple tasks: 80 MCU × 1 = 80 missions → LLM cost $0.64
- Standard tasks: 90 MCU ÷ 3 = 30 missions → LLM cost $0.99
- Complex tasks: 30 MCU ÷ 5 = 6 missions → LLM cost $0.44

**Total LLM cost/mo (avg Starter):** $2.07
**Revenue:** $49
**LLM Gross Margin:** 95.8%

---

## Pricing Sensitivity Analysis

### Is Starter Priced Correctly?

| Scenario | Starter users | LLM cost | Feasibility |
|----------|--------------|----------|-------------|
| Normal user (80 MCU/mo avg) | Most | $0.83 | Excellent |
| Power user (200 MCU/mo) | ~20% | $2.07 | Fine |
| Abuse user (1,000 MCU attempts) | Rate-limited | N/A | Protected |

Starter is priced conservatively. Even 100% utilization at $2.07 LLM cost = 95.8% margin.

**Recommendation:** Starter pricing is correct. No change needed.

### Pro Tier ($149/1,000 MCU)

At $0.149/MCU, this is 39% cheaper per MCU than Starter.
- Appeals to agencies and power developers running 100+ missions/month
- LLM cost at full 1,000 MCU: ~$10.35
- Revenue: $149 → Margin: 93.1%

**Risk:** Pro users who automate entire dev workflows could exceed 1,000 MCU.
**Recommendation:** Add soft warning at 80% usage, hard stop at 100%, upgrade prompt.

### Enterprise Tier ($499/unlimited)

Unlimited is dangerous without rate limiting. Analysis:

| Usage Level | LLM Cost | Revenue | Outcome |
|-------------|----------|---------|---------|
| Light (5K MCU/mo) | $51.75 | $499 | 89.6% margin |
| Normal (10K MCU/mo) | $103.50 | $499 | 79.3% margin |
| Heavy (20K MCU/mo) | $207 | $499 | 58.5% margin |
| Abusive (50K MCU/mo) | $517 | $499 | **LOSS** |

**Recommendation:** Enterprise must have 15K MCU/mo fair-use cap. Overage: $0.05/MCU (still 3x cheaper than Starter per MCU). Enforce in `credit_rate_limiter.py`.

---

## Proposed Pricing Evolution (Q3 2026)

Current model is simple and good for launch. At 100+ customers, add:

| Addition | Rationale |
|----------|-----------|
| Overage pricing ($0.05–0.10/MCU) | Captures heavy users without hurting normal users |
| Annual discount (2 months free) | Improves cash flow, reduces churn |
| Team seats (Pro × 5 at $599) | Unlocks agency use case |
| Credit rollover (max 3mo) | Reduces "use it or lose it" churn trigger |

---

## Conclusion

Current pricing is healthy. All tiers generate 70–96% gross margins under normal usage. Enterprise requires fair-use enforcement (already implemented). No repricing needed for launch — review after first 50 customers with real usage data.
