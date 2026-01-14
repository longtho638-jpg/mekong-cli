---
description: 🛠️ Dev Suite - Build, test, ship in one place
argument-hint: [:cook|:test|:ship|:debug|:fix]
---

## Mission

Unified development command hub with colon syntax.

## Subcommands

| Command | Description | Agent |
|---------|-------------|-------|
| `/dev:cook` | Build feature | `fullstack-developer` |
| `/dev:test` | Run test suite | `tester` |
| `/dev:ship` | Deploy to production | `git-manager` |
| `/dev:debug` | Debug issues | `debugger` |
| `/dev:fix` | Quick fix | `debugger` |

## Quick Examples

```bash
/dev                  # Show menu
/dev:cook             # Build (auto-detect from plan)
/dev:cook auth        # Build auth feature
/dev:test             # Run tests
/dev:ship             # Deploy
```

## Workflow

```
/dev:cook → /dev:test → /dev:ship
```

## Python Integration

```python
# turbo
from antigravity.core.vibe_workflow import VIBEWorkflow

workflow = VIBEWorkflow()
plan = workflow.detect_plan()
tasks = workflow.analyze_plan()
workflow.print_status()
```

---

🛠️ **One suite. Full dev cycle.**
