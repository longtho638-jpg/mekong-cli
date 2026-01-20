---
description: Start Antigravity Claude Proxy server
---

# /proxy/start - Start Antigravity Proxy

> **Universal Model Access** - Route Claude Code to Antigravity Cloud

## Quick Start

// turbo

```bash
# Start proxy (background)
antigravity-claude-proxy start

# Or run direct
npx antigravity-claude-proxy
```

## Verify Running

// turbo

```bash
curl -s http://localhost:8080/health | jq
```

## Environment Setup

If not set, add to shell:

```bash
export ANTHROPIC_BASE_URL="http://localhost:8080"
export ANTHROPIC_AUTH_TOKEN="test"
```

## Available Models

| Type       | Model                        | Use Case      |
| ---------- | ---------------------------- | ------------- |
| **Claude** | `claude-opus-4-5-thinking`   | Deep thinking |
|            | `claude-sonnet-4-5-thinking` | Fast thinking |
| **Gemini** | `gemini-3-pro-high`          | High quality  |
|            | `gemini-3-flash`             | Fast          |

## Web Console

Open http://localhost:8080 for:

- Account management
- Health score tracking
- Token bucket status

## 🏯 Binh Pháp

> "Binh mã vị động, lương thảo tiên hành" - Proxy before action.
