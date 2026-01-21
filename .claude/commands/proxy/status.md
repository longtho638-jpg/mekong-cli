---
description: Check Antigravity Proxy health and metrics
---

# /proxy/status - Proxy Health Check

> **Real-time Monitoring** of proxy health, accounts, and rate limits

## Quick Status

// turbo

```bash
curl -s http://localhost:8080/health | jq '{status, accounts: .accounts | length, uptime: .uptime}'
```

## Full Health Report

// turbo

```bash
curl -s http://localhost:8080/health | jq
```

## Account Health Scores

// turbo

```bash
curl -s http://localhost:8080/health | jq '.accounts[] | {label, health_score, tokens_available}'
```

## Integration with Commander

The Commander Engine includes proxy status:

// turbo

```bash
# Use MCP tool: commander/get_dashboard
mekong status | grep -A2 "PROXY"
```

## Troubleshooting

| Issue                 | Solution                         |
| --------------------- | -------------------------------- |
| Proxy not responding  | `antigravity-claude-proxy start` |
| All accounts cooldown | Wait 60s or add more accounts    |
| Health score low      | Check API key validity           |

## 🏯 Binh Pháp

> "知彼知己，百戰不殆" - Know your proxy, know your limits.
