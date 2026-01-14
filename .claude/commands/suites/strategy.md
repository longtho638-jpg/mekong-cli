---
description: 🏯 Strategy Suite - Binh Pháp planning commands
argument-hint: [:analyze|:plan|:win3]
---

## Mission

Unified strategy command hub with Binh Pháp methodology.

## Subcommands

| Command | Description | Core Module |
|---------|-------------|-------------|
| `/strategy:analyze` | Binh Pháp strategic analysis | `binh_phap/` |
| `/strategy:plan` | Create implementation plan | `planner` agent |
| `/strategy:win3` | WIN-WIN-WIN alignment check | `money_maker.py` |

## Quick Examples

```bash
/strategy              # Show WIN-WIN-WIN status
/strategy:analyze      # Binh Pháp analysis
/strategy:analyze SaaS # Analyze SaaS idea
/strategy:plan auth    # Create auth plan
/strategy:win3         # Check alignment
```

## WIN-WIN-WIN Alignment

| Stakeholder | Must WIN |
|-------------|----------|
| 👑 ANH | Equity + Cash flow |
| 🏢 AGENCY | Moat + Process |
| 🚀 CLIENT | 10x Value |

## Python Integration

```python
# turbo
from antigravity.core.money_maker import MoneyMaker

mm = MoneyMaker()
quote = mm.generate_quote("Client", [1,3,5], mm.ServiceTier.WARRIOR)
win3 = mm.validate_win3(quote)
print(f"Alignment: {win3.alignment_score}/100")
```

---

🏯 **"Không đánh mà thắng"**
