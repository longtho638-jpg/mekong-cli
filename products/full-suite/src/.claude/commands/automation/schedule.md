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
# Use MCP tool: workflow/execute_workflow via mekong CLI
echo "0 9 * * * mekong automation run daily-tasks" | crontab -
```

## 🏯 Binh Pháp

> "Thời gian là chiến lược" - Time is strategy.
