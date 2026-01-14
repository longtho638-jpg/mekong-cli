---
description: Set up recurring retainer relationships with tiered pricing
agent: money-maker
---

# /retainer Command

Establish recurring revenue relationships with clients using the Binh Pháp tier system.

## Usage

```bash
/retainer [client-name] [monthly-amount] [tier]
```

## Examples

```bash
/retainer "ABC Corp" 2000 WARRIOR
/retainer "XYZ Startup" 5000 GENERAL --equity 3%
/retainer "DEF Inc" 0 TUONG_QUAN --equity 20% --deferred 50000
```

## Tier Structure

| Tier | Monthly | Equity | Success Fee | Commitment |
|------|---------|--------|-------------|------------|
| **WARRIOR** (Pre-Seed) | $2,000 | 5-8% | 2% of funding | 6 months |
| **GENERAL** (Series A) | $5,000 | +3-5% | 1.5% of funding | 12 months |
| **TƯỚNG QUÂN** (Studio) | $0 deferred | 15-30% | Shared exit | Until exit |

## Workflow

1. **Qualify** client tier based on stage
2. **Negotiate** terms within tier bounds
3. **Validate** WIN-WIN-WIN alignment
4. **Create** retainer agreement
5. **Set up** recurring billing (Polar)
6. **Schedule** monthly check-ins

## Options

| Flag | Description |
|------|-------------|
| `--equity [%]` | Equity stake (tier-dependent range) |
| `--success-fee [%]` | Success fee on funding |
| `--deferred [amount]` | Deferred compensation (TƯỚNG QUÂN) |
| `--months [N]` | Commitment period |
| `--services [list]` | Included services |

## Services by Tier

### WARRIOR ($2,000/mo)
- Weekly strategy call (30 min)
- Monthly metrics review
- Async Slack support
- Network introductions (2/mo)

### GENERAL ($5,000/mo)
- Weekly strategy call (60 min)
- Bi-weekly metrics deep-dive
- Priority Slack support
- Network introductions (5/mo)
- Board meeting prep
- Investor materials review

### TƯỚNG QUÂN ($0 deferred → Shared exit)
- Daily availability
- Co-founder level involvement
- All GENERAL services
- Hands-on execution support
- Equity protection advocacy

## WIN-WIN-WIN Validation

Before activating ANY retainer:

```
┌───────────────────────────────────────────────┐
│  👑 ANH WIN: Recurring revenue + equity       │
│  🏢 AGENCY WIN: Stable cash flow + upside     │
│  🚀 CLIENT WIN: Strategic partner             │
└───────────────────────────────────────────────┘
```

## Output Format

```
╔════════════════════════════════════════╗
║  🔄 RETAINER ACTIVATED                 ║
╠════════════════════════════════════════╣
║  Client: [Client Name]                 ║
║  Tier: WARRIOR / GENERAL / TƯỚNG QUÂN ║
║  Monthly: $X,XXX                       ║
║  Equity: X%                            ║
║  Success Fee: X%                       ║
║  Commitment: X months                  ║
╠════════════════════════════════════════╣
║  First Billing: [Date]                 ║
║  First Check-in: [Date]                ║
║  WIN-WIN-WIN: ✅ VALIDATED             ║
╚════════════════════════════════════════╝
```

---

🔄 *"Dòng tiền đều đặn, an tâm làm việc"*
