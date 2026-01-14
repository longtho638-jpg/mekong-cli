---
description: Track equity positions and calculate portfolio value
agent: client-value
---

# /equity Command

Manage equity positions in startup clients and track portfolio value.

## Usage

```bash
/equity [startup-name] [percentage] [--options]
```

## Examples

```bash
/equity "TechStartup" 5 --valuation 2000000
/equity "FoodApp" 8 --paper-value
/equity "HealthCo" 15 --update-valuation 10000000
/equity --portfolio
```

## Workflow

1. **Record** equity stake with valuation
2. **Calculate** paper value
3. **Track** dilution events
4. **Monitor** milestone progress
5. **Project** exit scenarios

## Options

| Flag | Description |
|------|-------------|
| `--valuation [amount]` | Current company valuation |
| `--paper-value` | Calculate current paper value |
| `--update-valuation [amount]` | Update with new valuation |
| `--dilution [%]` | Record dilution event |
| `--exit [amount]` | Calculate exit proceeds |
| `--portfolio` | Show full portfolio summary |

## Portfolio Tracking

Track key metrics for each position:

| Metric | Description |
|--------|-------------|
| Initial % | Original equity stake |
| Current % | Post-dilution stake |
| Entry Valuation | Valuation at deal |
| Current Valuation | Latest valuation |
| Paper Value | Current % × Current Valuation |
| Multiple | Current / Entry value |

## Exit Scenarios

Model different exit outcomes:

| Exit Multiple | Your Proceed = Equity × Exit Value |
|---------------|-------------------------------------|
| 1x (flat) | $X |
| 3x (good) | $3X |
| 10x (great) | $10X |
| 50x (unicorn) | $50X |

## Anti-Dilution Tracking

Monitor dilution across funding rounds:

| Round | $ Raised | Post-Money | Your % Before | Your % After |
|-------|----------|------------|---------------|--------------|
| Seed | $X | $X | X% | X% |
| Series A | $X | $X | X% | X% |

## Output Format

### Single Position

```
╔════════════════════════════════════════╗
║  📊 EQUITY POSITION                    ║
╠════════════════════════════════════════╣
║  Startup: [Name]                       ║
║  Your Stake: X%                        ║
║  Valuation: $X,XXX,XXX                 ║
║  Paper Value: $XXX,XXX                 ║
║  Multiple: Xx                          ║
╠════════════════════════════════════════╣
║  Last Updated: [Date]                  ║
║  Next Milestone: [Description]         ║
╚════════════════════════════════════════╝
```

### Portfolio Summary

```
╔════════════════════════════════════════════════════════╗
║  💼 EQUITY PORTFOLIO SUMMARY                           ║
╠════════════════════════════════════════════════════════╣
║  Startup        Stake    Valuation    Paper Value      ║
║  ─────────────────────────────────────────────────────║
║  TechStartup    5%       $2M          $100K            ║
║  FoodApp        8%       $5M          $400K            ║
║  HealthCo       15%      $10M         $1.5M            ║
╠════════════════════════════════════════════════════════╣
║  Total Positions: 3                                    ║
║  Total Paper Value: $2,000,000                         ║
║  Weighted Multiple: 4.2x                               ║
╚════════════════════════════════════════════════════════╝
```

## Python Integration

```bash
# Add equity position
python -c "
from antigravity.vc.metrics import VCMetrics
equity = {
    'startup': '$STARTUP',
    'percentage': $PERCENTAGE,
    'valuation': $VALUATION
}
paper_value = equity['percentage'] / 100 * equity['valuation']
print(f'Paper Value: ${paper_value:,.0f}')
"
```

---

📈 *"Đầu tư khôn ngoan, gặt hái tương lai"*
