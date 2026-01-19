---
description: Run 1000% automated revenue operations from IDE with zero manual work
---

# 🤖 Revenue Autopilot Workflow

> **Goal**: Type one command, everything runs automatically.

## Quick Commands (turbo-all)

// turbo-all

### 1. Check System Status

```bash
python3 scripts/revenue_autopilot.py status
```

### 2. Run Daily Automation

```bash
python3 scripts/revenue_autopilot.py daily
```

- Syncs Gumroad products
- Checks Payment Hub status
- Generates revenue report

### 3. Run Weekly Automation

```bash
python3 scripts/revenue_autopilot.py weekly
```

- Ghost CTO 7-day report
- Batch publish new products
- Venture portfolio P&L

### 4. Batch Publish Products

```bash
python3 scripts/revenue_autopilot.py publish
```

### 5. Generate All Reports

```bash
python3 scripts/revenue_autopilot.py report
```

## First-Time Setup

If credentials not configured:

```bash
python3 scripts/revenue_autopilot.py setup
```

## Cron Schedule (Optional)

Add to crontab for full automation:

```cron
# Daily at 6 AM
0 6 * * * cd /Users/macbookprom1/mekong-cli && python3 scripts/revenue_autopilot.py daily

# Weekly on Monday at 9 AM
0 9 * * 1 cd /Users/macbookprom1/mekong-cli && python3 scripts/revenue_autopilot.py weekly
```
