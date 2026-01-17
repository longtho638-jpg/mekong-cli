---
description: Auto quota monitoring and wake-up automation
---

// turbo-all

## Workflow: Quota Auto Automation

### 1. Check current quota

```bash
python3 cli/main.py quota
```

### 2. Run auto wake-up if needed

```bash
python3 scripts/quota_peekaboo.py auto --threshold 30
```

### 3. View logs

```bash
tail -20 ~/.mekong/logs/quota-auto.log
```

### 4. Restart LaunchAgent (if needed)

```bash
launchctl unload ~/Library/LaunchAgents/com.mekong.quota-auto.plist
launchctl load ~/Library/LaunchAgents/com.mekong.quota-auto.plist
```

## Notes

- All commands in this workflow are auto-approved (// turbo-all)
- LaunchAgent runs every 10 minutes automatically
- Threshold: 30% (auto wake-up when quota drops below)
