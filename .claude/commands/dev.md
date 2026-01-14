---
description: 🛠️ Dev Hub - cook, test, ship in one place
argument-hint: [cook|test|ship|status]
---

## Mission

Unified development command hub. No arguments = show status.

## Auto-Mode

```
/dev
```

Shows current dev status:
- Active plan
- Last test result
- Git status

## Subcommands

```
/dev cook      → Build feature (auto-detect from plan)
/dev test      → Run test suite
/dev ship      → Commit and deploy
/dev status    → Show dev dashboard
```

## Workflow

```bash
# turbo
PYTHONPATH=. python3 -c "
import subprocess
from pathlib import Path

print('╔═══════════════════════════════════════════════════════════╗')
print('║  🛠️  DEV HUB                                               ║')
print('╠═══════════════════════════════════════════════════════════╣')
print('║                                                           ║')
print('║  Commands:                                                ║')
print('║  /dev cook     → Build feature                           ║')
print('║  /dev test     → Run tests                               ║')
print('║  /dev ship     → Deploy                                  ║')
print('║  /dev status   → Dashboard                               ║')
print('║                                                           ║')
print('╠═══════════════════════════════════════════════════════════╣')

# Check for active plan
plan = Path('plans/task_plan.md')
if plan.exists():
    print('║  📋 Active Plan: plans/task_plan.md                      ║')
else:
    print('║  📋 No active plan                                       ║')

print('╚═══════════════════════════════════════════════════════════╝')
"
```

---

🛠️ **One hub. Full dev cycle.**
