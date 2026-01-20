---
description: Schedule automated tasks
---

# /automation/schedule - Task Scheduler

> **Schedule recurring automation tasks**

## List Schedules

// turbo

```bash
crontab -l | grep mekong
```

## Add Schedule

```bash
# Daily at 9am
echo "0 9 * * * python3 ~/mekong-cli/scripts/vibeos/workflow_engine.py" | crontab -
```

## 🏯 Binh Pháp

> "Thời gian là chiến lược" - Time is strategy.
