---
description: Run infrastructure health check across all systems
---

# /commander - Agentic Tổng Tư Lệnh

> **Unified Infrastructure Monitor** for Vercel, Supabase, GitHub CI, Jules, and Antigravity Proxy

## Quick Status

// turbo

```bash
python3 scripts/vibeos/commander_engine.py --status
```

## Watch Mode (Real-time)

// turbo

```bash
python3 scripts/vibeos/commander_engine.py --watch --interval 30
```

## Test Individual Systems

// turbo

```bash
# Test Vercel only
python3 scripts/vibeos/commander_engine.py --test-vercel

# Test GitHub CI only
python3 scripts/vibeos/commander_engine.py --test-github

# Test Supabase only
python3 scripts/vibeos/commander_engine.py --test-supabase

# Test Jules only
python3 scripts/vibeos/commander_engine.py --test-jules
```

## Status Icons

| Icon | Meaning |
| ---- | ------- |
| ✅   | Healthy |
| ⚠️   | Warning |
| ❌   | Error   |
| ❓   | Unknown |

## Anomaly Detection

Commander automatically detects anomalies and suggests recovery actions:

- **Vercel Error** → `vercel --prod` (redeploy)
- **GitHub CI Red** → `gh run view <id> --log-failed`
- **Proxy Down** → `antigravity-claude-proxy start`

## 🏯 Binh Pháp Wisdom

> "知彼知己，百戰不殆" - Know your infra, know your bugs, never fail.
