---
description: 🚀 Auto Command - Autonomous goal-based execution
argument-hint: [goal|:status|:pause|:resume]
---

## Mission

Set a goal and let agents work autonomously to achieve it.
Minimal human intervention - maximum AI power.

## Subcommands

| Command | Description |
|---------|-------------|
| `/auto "goal"` | Set goal and execute |
| `/auto:status` | Check progress |
| `/auto:pause` | Pause execution |
| `/auto:resume` | Resume execution |

## Quick Examples

```bash
/auto "Launch newsletter SaaS"    # Set goal, auto-execute
/auto "Generate $10K revenue"     # Revenue goal
/auto "Build auth feature"        # Feature goal
/auto:status                      # Check progress
```

## How It Works

```
1. Goal Analysis
   └── Break goal into tasks

2. Crew Selection
   └── Assign optimal crews/chains

3. Autonomous Execution
   └── Run tasks with minimal intervention

4. Memory & Learning
   └── Remember outcomes for improvement
```

## Python Integration

```python
# turbo
from antigravity.core.autonomous_mode import AutonomousOrchestrator

auto = AutonomousOrchestrator()
auto.set_goal("Launch SaaS product")
success = auto.execute()
print(f"Success: {success}")
```

## Goal Examples

| Goal | Crews Activated |
|------|-----------------|
| "Launch SaaS" | strategy → product_launch → content |
| "Generate revenue" | revenue_accelerator |
| "Fix login bug" | debug_squad |
| "Build feature X" | dev:cook → dev:test |

---

🚀 **Set a goal. Let AI do the rest.**
