---
description: Approve pending content, decisions, or deployments
---

# /approve Command

Approve items queued by agents during the "Overlord Shift".

## Usage

```bash
/approve              # List pending items
/approve all          # Approve all pending
/approve tweet        # Approve pending tweets
/approve support      # Approve support replies
/approve deploy       # Approve deployments
```

## Workflow

1. Agents queue items throughout the day
2. User runs `/daily` to see pending list
3. User runs `/approve [type]` to action

## Safety

- Tweets: Preview shown before posting
- Support: Email draft shown for review
- Deploy: Diff shown before push

## No-Disturbance Mode

If outside "Overlord Shift" (09:00-11:00), the command will warn:

```
⚠️ Current time: 17:30 (Family Time)
Items queued for tomorrow's shift.
Run /override to force approve.
```
