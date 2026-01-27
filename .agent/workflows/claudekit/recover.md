---
description: description: Auto-recover failed systems with one command
---

# Claudekit Command: /recover

> Imported from claudekit-engineer

# /recover - Auto-Recovery Command

> **MCP Integration**: Routes to `recovery_server`

## Usage

```bash
/recover [target]
```

## Targets

- `proxy`: Restart Antigravity Proxy
- `db`: Reset database connections
- `ci`: Retry failed CI jobs

## MCP Tools

- `recovery_server.auto_recover`
- `recovery_server.diagnose_system`

## Automation

Can be run in daemon mode to automatically heal self-healing infrastructure.

> 🔧 **"Tiên phát chế nhân"** - Strike first, recover fast.
