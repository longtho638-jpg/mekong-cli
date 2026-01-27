---
description: description: Run infrastructure health check across all systems
---

# Claudekit Command: /commander

> Imported from claudekit-engineer

# /commander - Agentic Tổng Tư Lệnh

> **Unified Infrastructure Monitor** for Vercel, Supabase, GitHub CI, Jules, and Antigravity Proxy

## Quick Status

// turbo

```bash
# Use MCP tool: commander/get_dashboard
mekong status
```

## Watch Mode (Real-time)

// turbo

```bash
# Use MCP tool: commander/get_dashboard
mekong status --watch
```

## Test Individual Systems

// turbo

```bash
# Use MCP tool: commander/check_system
# Test Vercel only
mekong status --system vercel

# Test GitHub CI only
mekong status --system github

# Test Supabase only
mekong status --system supabase

# Test Jules only
mekong status --system jules
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
