---
description: description: Install/manage background Commander monitoring daemon
---

# Claudekit Command: /daemon

> Imported from claudekit-engineer

# /daemon - Background Monitoring

> **LaunchAgent for continuous infrastructure monitoring**

## Install Daemon

```bash
# Copy to LaunchAgents
cp scripts/launchagents/com.agencyos.commander.plist ~/Library/LaunchAgents/

# Load daemon
launchctl load ~/Library/LaunchAgents/com.agencyos.commander.plist
```

## Check Status

// turbo

```bash
launchctl list | grep agencyos
```

## View Logs

// turbo

```bash
tail -f /tmp/commander.log
```

## Unload Daemon

```bash
launchctl unload ~/Library/LaunchAgents/com.agencyos.commander.plist
```

## What It Does

- Runs `/commander --status` every 5 minutes
- Logs to `/tmp/commander.log`
- Starts automatically on login

## 🏯 Binh Pháp

> "Nhất nhất viên canh" - 24/7 vigilant defense.
