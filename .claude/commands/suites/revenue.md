---
description: 💰 Revenue Suite - All money operations in one place
argument-hint: [:quote|:invoice|:proposal|:stats]
---

## Mission

Unified revenue command hub with colon syntax.

## Subcommands

| Command | Description | Core Module |
|---------|-------------|-------------|
| `/revenue:quote` | Generate client quote | `money_maker.py` |
| `/revenue:invoice` | Create invoice | `revenue_engine.py` |
| `/revenue:proposal` | Generate proposal | `proposal_generator.py` |
| `/revenue:stats` | Revenue dashboard | `revenue_engine.py` |

## Quick Examples

```bash
/revenue              # Show menu
/revenue:quote        # Generate quote (wizard)
/revenue:quote ABC    # Generate quote for ABC Corp
/revenue:invoice      # Create invoice
/revenue:stats        # Show MRR/ARR dashboard
```

## Python Integration

```python
# turbo
from antigravity.core.money_maker import MoneyMaker
from antigravity.core.revenue_engine import RevenueEngine
from antigravity.core.proposal_generator import ProposalGenerator

mm = MoneyMaker()
engine = RevenueEngine()

# Generate quote
quote = mm.generate_quote("Client", [1, 3, 5], mm.ServiceTier.WARRIOR)
print(mm.format_quote(quote))

# Show stats
stats = engine.get_stats()
print(f"MRR: ${stats['mrr']:,.0f}")
```

---

💰 **One suite. All revenue operations.**
