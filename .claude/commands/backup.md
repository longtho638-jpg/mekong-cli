---
description: 🛡️ BACKUP - System data protection and disaster recovery
---

# /backup - Backup Operations Command

> **"Phòng bệnh hơn chữa bệnh"** - Prevention over Cure

## Usage

```bash
/backup [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Trigger immediate backup | `/backup run --type full` |
| `list` | List available backups | `/backup list --limit 5` |
| `verify` | Verify backup integrity | `/backup verify --latest` |
| `restore` | Restore from checkpoint (DANGER) | `/backup restore --id 20260128-1200` |

## Execution Protocol

1.  **Agent**: Delegates to `backup-specialist`.
2.  **Tool**: Uses `scripts/backup/daily-backup.sh`.
3.  **Safety**: Require explicit confirmation for `restore`.

## Examples

```bash
# Manual trigger before deployment
/backup run --tag pre-deploy-v2

# List recent backups
/backup list
```

## Win-Win-Win
- **Owner**: Data asset security.
- **Agency**: Operational reliability.
- **Client**: Trust and continuity.
