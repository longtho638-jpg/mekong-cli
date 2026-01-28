---
description: 🚨 INCIDENT - Incident response and management (Binh Pháp: Cửu Địa)
argument-hint: [incident description]
---

# /incident - Incident Responder

> **"Vào đất chết thì sẽ sống"** - Throw your soldiers into positions whence there is no escape, and they will prefer death to flight (Survival in crisis).

## Usage

```bash
/incident [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `report` | Log a new incident | `/incident report "API Down"` |
| `status` | Check system status | `/incident status` |
| `resolve` | Guide resolution process | `/incident resolve "INC-123"` |
| `--severity` | Set severity level | `/incident report "Leak" --severity 1` |

## Execution Protocol

1. **Agent**: Delegates to `incident-responder`.
2. **Process**:
   - Triage severity.
   - Alert notification.
   - Diagnostics and mitigation guidance.
   - Post-mortem generation.
3. **Output**: Incident Log, Status Updates, RCA.

## Examples

```bash
# Report a critical outage
/incident report "Payment Gateway 500 Errors" --severity 1

# Generate post-mortem
/incident resolve "INC-001"
```

## Binh Pháp Mapping
- **Chapter 11**: Cửu Địa (The Nine Situations) - Managing desperate ground.

## Constitution Reference
- **Self-Healing Protocol**: Recovery patterns.

## Win-Win-Win
- **Owner**: Minimal downtime.
- **Agency**: Professional handling.
- **Client**: Trust restoration.
