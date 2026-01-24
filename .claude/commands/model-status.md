---
description: Check current model routing status, quota, and recommended model for task
---

# Model Status Command

Shows current model routing status and quota.

## Usage

```bash
/model-status
```

## Execution

// turbo

```bash
python3 /Users/macbookprom1/mekong-cli/.claude-skills/model-routing/router.py --status
```

## Output

```
📊 Quota Status:
{
  "cycle_start": "2026-01-23T13:05:01",
  "opus": {
    "used": 0,
    "limit": 30,
    "remaining": 30
  },
  "pro": {
    "used": 0,
    "limit": 100
  },
  "flash": {
    "used": 0
  }
}
```

## Check Model for Specific Task

```bash
python3 /Users/macbookprom1/mekong-cli/.claude-skills/model-routing/router.py "Your task description"
```
