---
description: 💰 Revenue Hub - all money commands in one place
argument-hint: [quote|invoice|stats|proposal]
---

## Mission

Unified revenue command hub. No arguments = show menu.

## Auto-Mode

```
/revenue
```

Shows menu:
- quote - Generate client quote
- invoice - Create invoice
- proposal - Generate proposal
- stats - Revenue dashboard

## Subcommands

```
/revenue quote      → Same as /quote
/revenue invoice    → Create invoice
/revenue proposal   → Generate proposal
/revenue stats      → Show MRR/ARR dashboard
```

## Workflow

```bash
# turbo
PYTHONPATH=. python3 -c "
from antigravity.core.revenue_engine import RevenueEngine
from antigravity.core.money_maker import MoneyMaker

engine = RevenueEngine()
mm = MoneyMaker()

print('╔═══════════════════════════════════════════════════════════╗')
print('║  💰 REVENUE HUB                                           ║')
print('╠═══════════════════════════════════════════════════════════╣')
print('║                                                           ║')
print('║  Commands:                                                ║')
print('║  /revenue quote     → Generate quote                     ║')
print('║  /revenue invoice   → Create invoice                     ║')
print('║  /revenue proposal  → Generate proposal                  ║')
print('║  /revenue stats     → Dashboard                          ║')
print('║                                                           ║')
print('╠═══════════════════════════════════════════════════════════╣')

# Show quick stats
stats = engine.get_stats()
goal = engine.get_goal_dashboard()
print(f'║  MRR: \${stats[\"mrr\"]:>10,.0f}                                   ║')
print(f'║  ARR: \${stats[\"arr\"]:>10,.0f}                                   ║')
print(f'║  \$1M Goal: {goal[\"progress_percent\"]:>5.1f}%                                   ║')
print('╚═══════════════════════════════════════════════════════════╝')
"
```

---

💰 **One hub. All revenue operations.**
