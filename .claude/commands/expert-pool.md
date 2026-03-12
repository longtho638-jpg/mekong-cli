---
description: "View and manage expert pool — list, filter, stats. 1 command, ~3 min."
argument-hint: [--specialty=devops --active --setup]
allowed-tools: Read, Write, Bash, Task
---

# /expert:pool — Expert Pool Management

## Goal

View the expert pool with filtering and management capabilities.

## Steps

1. Load expert pool from .mekong/studio/experts/pool.json
2. If --setup: initialize empty pool structure
3. If --specialty: filter by specialty
4. If --active: show only experts with active engagements
5. Calculate pool statistics (total, available, avg rating)
6. Output pool table

## Output Format

CLI table.

```
🧠 Expert Pool ({count} experts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# │ Name          │ Specialties     │ Status    │ Rating
1 │ {name}        │ {specialties}   │ {status}  │ {rating}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available: {n} │ Engaged: {n} │ Avg Rating: {n}
```

## Goal context

<goal>$ARGUMENTS</goal>
