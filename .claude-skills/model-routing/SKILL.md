---
name: Model Routing & Quota Optimization
description: Auto-select optimal model based on task complexity and quota state. Escalates to Opus 4.5 for critical tasks while preserving quota budget.
triggers: [architecture, security, critical, complex, debugging, multi-file]
---

# 🧠 Model Routing & Quota Optimization Skill

> **Binh Pháp:** "Tận dụng tối đa, không thừa không thiếu"

## Purpose

Automatically select the optimal model for each task based on:

1. **Task Complexity** - Keywords like `security`, `architecture`, `critical`
2. **Quota State** - 5-hour cycle limits, daily budget
3. **Retry Count** - Escalate on failures

## Model Selection Rules

| Condition                     | Model                 | Notes              |
| ----------------------------- | --------------------- | ------------------ |
| `security`, `payment`, `auth` | `claude-opus-4.5`     | Critical security  |
| `architecture`, `design`      | `claude-opus-4.5`     | Strategic planning |
| Retry >= 5                    | `claude-opus-4.5`     | Escalation         |
| `debugging`, `refactoring`    | `gemini-3-pro-high`   | Complex tasks      |
| Retry >= 3                    | `gemini-3-pro-high`   | Mid escalation     |
| `lint`, `format`, `simple`    | `gemini-3-flash-lite` | Fast tasks         |
| Default                       | `gemini-3-flash`      | Standard           |

## Quota Budget (per 5h cycle)

```
Antigravity Opus: 15 calls/cycle
├── Strategic planning: 5
├── Architecture decisions: 5
└── Security audits: 5

CC CLI Opus (via delegation): 30 calls/cycle
├── Complex debugging: 10
├── Multi-file refactoring: 10
└── Critical bug fixes: 10
```

## Usage

### In Task Description

Add complexity hints to trigger optimal model:

```bash
# Triggers Opus
claude "Critical: Fix security vulnerability in payment webhook"
claude "Architecture: Design new authentication flow"

# Triggers Pro
claude "Debug: Investigate test failures in CRM module"

# Triggers Flash-lite
claude "Simple: Fix lint warnings"
```

### CLI Flag Override

```bash
# Force specific model
claude --model gemini-3-pro-high "Task description"
claude --model claude-opus-4.5 "Critical task"
```

## Integration with Antigravity Proxy

The Antigravity Proxy routes requests through multiple accounts:

- **Ultra accounts**: Full Opus access
- **Pro accounts**: Limited Opus, unlimited Pro/Flash

Proxy automatically load-balances across accounts using `StickyStrategy`.

## Monitoring Quota

Check current quota state:

```bash
# Via Proxy dashboard
open http://localhost:8080

# Via API
curl http://localhost:8080/account-limits?format=table
```

## Files

- `scripts/model_router.py` - Python router logic
- `~/.gemini/quota_tracker.json` - Quota state file
- `scripts/auto-retry.sh` - Auto-retry daemon
