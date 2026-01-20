---
description: Auto-recover failed systems with one command
---

# /recover - Auto-Recovery Engine

> **Automatically fix common infrastructure issues**

## Quick Recovery

// turbo

```bash
python3 scripts/vibeos/auto_recovery.py --auto
```

## Proxy Only

// turbo

```bash
python3 scripts/vibeos/auto_recovery.py --proxy
```

## Daemon Mode (5-min intervals)

```bash
python3 scripts/vibeos/auto_recovery.py --daemon
```

## What It Does

| System        | Auto-Recovery   |
| ------------- | --------------- |
| **Proxy**     | ✅ Auto-restart |
| **GitHub CI** | ℹ️ Suggestions  |
| **Vercel**    | ℹ️ Suggestions  |
| **Supabase**  | ℹ️ Suggestions  |

## Example Output

```
🏯 AUTO-RECOVERY ENGINE v5.0
==================================================

⚠️ Found 1 anomalie(s) - attempting recovery...

🔧 Executing recovery for proxy: Run: antigravity-claude-proxy start
   ✅ Proxy started

--------------------------------------------------
Recovery complete
```

## 🏯 Binh Pháp

> "Tiên phát chế nhân" - Strike first, recover fast.
