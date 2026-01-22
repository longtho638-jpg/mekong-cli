# beads Command Reference

## Essential Commands

### Initialize Project
```bash
bd init                    # Standard setup
bd init --quiet            # Non-interactive (for agents)
bd init --stealth          # Isolated local-only mode
bd init --contributor      # OSS fork workflow
bd init --team             # Team branch workflow
```

### Create Issues
```bash
bd create "Title" [options]

# Options:
-d, --description TEXT     # Description
-p, --priority 0-4         # Priority (0=highest, default=2)
-t, --type TYPE            # bug|feature|task|epic|chore
-a, --assignee NAME        # Assign to user
-l, --labels a,b,c         # Comma-separated labels
--json                     # JSON output

# Examples:
bd create "Fix auth bug" -t bug -p 0 --json
bd create "Implement dashboard" -t feature -p 1 -l frontend,ui
bd create "Refactor database" -t chore -p 2 -d "Clean up queries"
```

### View Issues
```bash
bd list [options]          # List issues
bd show bd-a1b2            # Full details
bd ready                   # Ready work only
bd blocked                 # Blocked issues
bd stats                   # Statistics
bd info                    # Database info

# Filter options:
--status open|in_progress|closed
--priority 0-4
--assignee NAME
--label backend,auth       # AND filter
--label-any frontend,ui    # OR filter
--json                     # JSON output
```

### Update Issues
```bash
bd update bd-a1b2 --status in_progress
bd update bd-a1b2 --priority 1
bd update bd-a1b2 --assignee alice
```

### Close Issues
```bash
bd close bd-a1b2 --reason "Completed"
bd close bd-a1b2 bd-f14c bd-3e7a    # Multiple
```

### Reopen Issues
```bash
bd reopen bd-a1b2 --reason "Found regression"
```

### Dependencies
```bash
# Add dependency (bd-f14c depends on bd-a1b2)
bd dep add bd-f14c bd-a1b2 --type blocks

# Types: blocks, related, parent-child, discovered-from

# Remove dependency
bd dep remove bd-f14c bd-a1b2

# Show tree
bd dep tree bd-a1b2

# Detect cycles
bd dep cycles
```

### Labels
```bash
bd label add bd-a1b2 security
bd label remove bd-a1b2 urgent
bd label list bd-a1b2
bd label list-all          # All labels with counts
```

### Sync
```bash
bd sync                    # Force immediate sync
bd export                  # Manual export to JSONL
bd import                  # Manual import from JSONL
```

### Daemon Management
```bash
bd daemons list            # All running daemons
bd daemons health          # Check for issues
bd daemons stop PATH       # Stop specific daemon
bd daemons killall         # Stop all daemons
bd daemons logs PATH       # View logs
```

## Common Agent Workflows

### Start of Session
```bash
bd ready --json | jq '.[0]'    # Get next task
bd show bd-a1b2 --json         # Full context
```

### During Work
```bash
# Update status
bd update bd-a1b2 --status in_progress --json

# File discovered work
bd create "Found: edge case" -t bug -p 1 --json
bd dep add bd-new bd-a1b2 --type discovered-from
```

### End of Session
```bash
# Complete work
bd close bd-a1b2 --reason "Implemented feature X" --json

# Sync
bd sync
```

## JSON Output

All commands support `--json` for structured output:

```bash
bd ready --json
```

Returns:
```json
[
  {
    "id": "bd-a1b2",
    "title": "Fix auth bug",
    "status": "open",
    "priority": 0,
    "type": "bug",
    "labels": ["security", "urgent"],
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

## Priority Levels

| Level | Meaning | Usage |
|-------|---------|-------|
| 0 | Critical | Blockers, security issues |
| 1 | High | Important features |
| 2 | Normal | Standard work (default) |
| 3 | Low | Nice-to-have |
| 4 | Minimal | Backlog items |

## Issue Types

| Type | Description |
|------|-------------|
| `bug` | Defect or error |
| `feature` | New functionality |
| `task` | General work item (default) |
| `epic` | Large feature container |
| `chore` | Maintenance work |

## Status Values

| Status | Description |
|--------|-------------|
| `open` | Not started |
| `in_progress` | Currently working |
| `closed` | Completed |
