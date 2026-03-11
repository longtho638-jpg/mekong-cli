# Unit Economics — RaaS Credit Cost vs LLM Cost per Mission

**Date:** March 2026 | **Model:** Credits (MCU) billed after successful delivery

---

## Credit Pricing Structure

| Tier | MCU/mo | Price | Price per MCU |
|------|--------|-------|---------------|
| Starter | 200 | $49 | $0.245 |
| Pro | 1,000 | $149 | $0.149 |
| Enterprise | Unlimited | $499 | ~$0.05 (est. avg 10K MCU) |

MCU = Mission Compute Unit. 1 MCU = 1 successfully delivered mission task.

---

## LLM Cost Per Mission

### Token Model (Claude Sonnet 4 — primary)

| Mission Type | Avg Input Tokens | Avg Output Tokens | Cost (input $3/1M, output $15/1M) |
|-------------|-----------------|-------------------|-----------------------------------|
| Simple (plan only) | 800 | 400 | $0.0084 |
| Standard (cook/fix) | 2,500 | 1,200 | $0.0255 |
| Complex (deploy/review) | 5,000 | 2,500 | $0.0525 |
| Founder command (annual/pitch) | 8,000 | 4,000 | $0.084 |

### PEV Loop Multiplier

Each mission runs Plan → Execute → Verify. Add 30% for verification calls:
- Simple: $0.0084 × 1.3 = **$0.011**
- Standard: $0.0255 × 1.3 = **$0.033**
- Complex: $0.0525 × 1.3 = **$0.068**
- Founder: $0.084 × 1.3 = **$0.109**

---

## Gross Margin Analysis

### Per MCU Margin

| Mission Type | Revenue/MCU (Starter) | LLM Cost/MCU | Gross Margin |
|-------------|----------------------|--------------|--------------|
| Simple (1 MCU) | $0.245 | $0.011 | **95.5%** |
| Standard (3 MCU) | $0.735 | $0.033 | **95.5%** |
| Complex (5 MCU) | $1.225 | $0.068 | **94.4%** |
| Founder (3 MCU) | $0.735 | $0.109 | **85.2%** |

### Infrastructure Cost Per Mission

| Resource | Monthly Cost | Missions/mo (est.) | Cost/Mission |
|----------|-------------|-------------------|--------------|
| Fly.io (backend) | $20 | 1,000 | $0.020 |
| Cloudflare Workers | $0 | — | $0.000 |
| SQLite/storage | $2 | 1,000 | $0.002 |
| **Total infra** | **$22** | | **$0.022** |

### All-In Unit Economics (Starter, Standard Mission)

```
Revenue:              $0.735  (3 MCU × $0.245)
LLM cost:            -$0.033  (4.5%)
Infra cost:          -$0.022  (3.0%)
Payment fees:        -$0.037  (5% Polar.sh)
────────────────────────────────
Gross profit:         $0.643
Gross margin:          87.5%
```

---

## Break-Even Analysis

### Per Customer Break-Even

| Tier | Monthly Revenue | LLM + Infra Cost | Net Margin | Break-Even Usage |
|------|----------------|-----------------|------------|-----------------|
| Starter (200 MCU) | $49 | $8.60 (176 standard MCU) | $40.40 (82%) | Any usage > 35 MCU/mo |
| Pro (1,000 MCU) | $149 | $43 (870 standard MCU) | $106 (71%) | Any usage > 175 MCU/mo |
| Enterprise (unlimited) | $499 | ~$150 (est. 4,500 MCU avg) | $349 (70%) | Requires rate limiting above 15K MCU |

**Key insight:** At Starter tier, customer pays for 200 MCU but average usage is ~80 MCU/mo (industry SaaS usage curve = 40% of capacity). Actual LLM cost on avg Starter: **$2.64/mo** against $49 revenue. Margin: **94.6%**.

---

## Cost Sensitivity

### LLM Cost Scenarios

| Scenario | LLM Cost Change | Impact on Starter Margin |
|----------|----------------|--------------------------|
| Claude Sonnet 4 price up 50% | +$1.32/mo | 91% → 89% margin |
| Switch to DeepSeek ($0.27/$1.10 per 1M) | -85% | 94.6% → 98%+ margin |
| Switch to local Ollama | -100% | 94.6% → 99%+ margin |

### Rate Abuse Protection

Enterprise unlimited requires rate limiting. Without cap:
- Adversarial user runs 50K MCU/mo = $2,700 LLM cost on $499 revenue.
- Mitigation: Fair-use policy 10K MCU/mo for Enterprise, overage at $0.05/MCU.
- `src/raas/credit_rate_limiter.py` — implemented.

---

## Competitive Unit Economics

| Product | Price | LLM Cost Est. | Gross Margin |
|---------|-------|---------------|--------------|
| Cursor Pro | $20/mo | ~$4 (heavy use) | ~80% |
| Devin | $500/mo | ~$50–100 (SWE tasks) | 80–90% |
| GitHub Copilot | $10/mo | ~$2 | ~80% |
| **Mekong Starter** | **$49/mo** | **~$2.64** | **~94%** |

Mekong's gross margin is best-in-class because:
1. Credits are pre-purchased (usage smoothing)
2. Most missions are lightweight (plan + generate, not hours of execution)
3. Multi-LLM fallback routes to cheapest capable model

---

## Conclusion

At current pricing, Mekong CLI has **87–95% gross margins** depending on tier and usage intensity. The RaaS model is structurally sound. Primary risk is Enterprise tier abuse — rate limiting is implemented. Recommended pricing review at 100 customers: consider tiered overage pricing at $0.10/MCU above plan limits.
