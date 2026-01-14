---
description: 🏯 Master Command - Complete AgencyOS Status
argument-hint: [:compact|:full|:score]
---

## Mission

Complete platform status in ONE unified dashboard.
Shows ALL layers: Agentic, Retention, Revenue, Infrastructure.

## What It Shows

| Layer | Metrics |
|-------|---------|
| 🤖 **Agentic** | Agents, Chains, Crews, Skills |
| 🏰 **Retention** | Moats, Switching Cost, Loyalty |
| 💰 **Revenue** | ARR, $1M Progress, Growth |
| 🏗️ **Infrastructure** | 10 Layers, Health Score |

## Subcommands

| Command | Description |
|---------|-------------|
| `/master` | Full dashboard |
| `/master:compact` | One-line summary |
| `/master:score` | Just the score |

## Quick Examples

```bash
/master                # Full dashboard
/master:compact        # Quick status
/master:score          # Platform score
```

## Dashboard Output

```
╔══════════════════════════════════════════════════════════╗
║               🏯 AGENCYOS MASTER DASHBOARD               ║
╠══════════════════════════════════════════════════════════╣
║ 🤖 AGENTIC LAYER                                         ║
║    Agents: 26 | Chains: 34 | Crews: 6                    ║
╟──────────────────────────────────────────────────────────╢
║ 🏰 RETENTION LAYER                                       ║
║    Moat Strength: 43% | Switching: $15,850               ║
╟──────────────────────────────────────────────────────────╢
║ 💰 REVENUE LAYER                                         ║
║    ARR: $100,000 (10% → $1M)                             ║
╟──────────────────────────────────────────────────────────╢
║ 🏗️ INFRASTRUCTURE LAYER                                 ║
║    10 Layers | 90% Health                                ║
╠══════════════════════════════════════════════════════════╣
║ 🏆 PLATFORM SCORE: 64%                                   ║
╚══════════════════════════════════════════════════════════╝
```

## Python Integration

```python
# turbo
from antigravity.core.master_dashboard import MasterDashboard

dashboard = MasterDashboard()
dashboard.print_full()

# Get score
print(f"Platform: {dashboard.get_platform_score()}%")
```

## Platform Score Formula

```
Score = (
    Agentic Integration × 30% +
    Moat Strength × 25% +
    Infra Health × 25% +
    $1M Progress × 20%
)
```

---

🏯 **ONE dashboard. ALL systems. Complete visibility.**
