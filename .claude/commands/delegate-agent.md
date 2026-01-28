---
description: 🤝 DELEGATE-AGENT - Delegate to specific agent role
---

# /delegate-agent - Role-Based Delegation

> **"Giao việc đúng người"** - Delegate to the right role

## Usage

```bash
/delegate-agent [role] "[task]"
```

## Roles

| Role | Agent | Use Case |
|------|-------|----------|
| `cto` | `system-architect` | Technical strategy |
| `cmo` | `marketing-hub` | Marketing campaigns |
| `cfo` | `revenue-engine` | Financial planning |
| `coo` | `adminops` | Operations |
| `legal` | `legal-hub` | Contracts, compliance |

## Execution Protocol

1. **Resolve**: Role → Agent mapping.
2. **Spawn**: Agent with task.
3. **Report**: Agent output.

## Examples

```bash
# Delegate to CTO
/delegate-agent cto "Review architecture for scalability"

# Delegate to CMO
/delegate-agent cmo "Create Q1 content calendar"

# Delegate to CFO
/delegate-agent cfo "Forecast 2026 revenue"
```

## Win-Win-Win
- **Owner**: Clear role separation.
- **Agency**: Specialized expertise.
- **Client**: Best agent for job.
