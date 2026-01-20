---
description: Manage Antigravity Proxy LaunchAgent daemon
---

# /proxy/daemon - Daemon Management

> **Keep Proxy ALWAYS ON** via macOS LaunchAgent

## Load Daemon (Start)

// turbo

```bash
launchctl load ~/Library/LaunchAgents/com.antigravity.proxy.plist
echo "✅ Proxy daemon loaded - will auto-start and auto-restart"
```

## Unload Daemon (Stop)

```bash
launchctl unload ~/Library/LaunchAgents/com.antigravity.proxy.plist
echo "⏹️ Proxy daemon unloaded"
```

## Check Status

// turbo

```bash
launchctl list | grep antigravity && echo "✅ Daemon running" || echo "❌ Daemon not loaded"
curl -s http://localhost:8080/health | head -1
```

## View Logs

// turbo

```bash
tail -20 ~/.mekong/logs/proxy.log
```

## Restart Daemon

```bash
launchctl unload ~/Library/LaunchAgents/com.antigravity.proxy.plist
launchctl load ~/Library/LaunchAgents/com.antigravity.proxy.plist
echo "🔄 Daemon restarted"
```

## How It Works

| Feature       | Description                 |
| ------------- | --------------------------- |
| **RunAtLoad** | Starts when you login       |
| **KeepAlive** | Auto-restarts if crashes    |
| **Logs**      | `~/.mekong/logs/proxy*.log` |

## 🏯 Binh Pháp

> "Tiên phát chế nhân" - Strike first, control always.
