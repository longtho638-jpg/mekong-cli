---
description: Manage Antigravity Proxy API accounts
---

# /proxy/accounts - Account Management

> **Multi-Account Load Balancing** for API quota optimization

## List Accounts

// turbo

```bash
curl -s http://localhost:8080/accounts | jq
```

## Add Account (via Web Console)

1. Open http://localhost:8080
2. Click "Add Account"
3. Enter API key and label

## Load Balancing Strategies

| Strategy      | Use Case                     |
| ------------- | ---------------------------- |
| `hybrid`      | Smart distribution (default) |
| `sticky`      | Cache-optimized              |
| `round-robin` | Even distribution            |

## Health Monitoring

// turbo

```bash
# Check health scores
curl -s http://localhost:8080/health | jq '.accounts'
```

## Token Bucket Status

Each account has:

- Max: 50 tokens
- Regen: 6/min
- Cooldown on rate limit

## CLI Management

```bash
# Via npx
npx antigravity-claude-proxy account add --key sk-xxx --label "Primary"
npx antigravity-claude-proxy account list
npx antigravity-claude-proxy account remove --label "Secondary"
```

## 🏯 Binh Pháp

> "Chia quân mà hợp thắng" - Divide accounts, unified victory.
