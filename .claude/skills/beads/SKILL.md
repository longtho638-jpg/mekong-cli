# beads - Persistent Issue Tracker for AI Agents

Integrate beads (`bd`) for persistent, dependency-driven task tracking across sessions.

## When to Use

### Automatic Activation

Beads activates automatically when:
- Project has `.beads/` directory (run `bd init` to create)
- Config `beads.enabled` is not `false` in `.ck.json`
- Session start sets `CK_BEADS_AVAILABLE=1`

When active, beads integrates with:
- `/cook` workflow for task routing decisions
- `/plan` commands for automatic epic creation
- Session lifecycle for sync reminders

### Manual Use

Invoke this skill directly for:
- Initial setup (`bd init`) in new projects
- Complex dependency queries and management
- Task state inspection and manual filing
- Bulk operations outside `/cook` workflow

## Quick Reference

```bash
# Initialize in project (once per project)
bd init

# Find ready work
bd ready --json | jq '.[0]'

# Create issue
bd create "Task title" -t task -p 1 --json

# Create discovered work linked to parent
bd create "Found bug" -t bug -p 0 --json
bd dep add bd-new bd-parent --type discovered-from

# Update status
bd update bd-a1b2 --status in_progress

# Complete work
bd close bd-a1b2 --reason "Implemented"

# Sync before session end
bd sync
```

## Dependency Types

| Type | Use Case | Affects Ready? |
|------|----------|----------------|
| `blocks` | X must complete before Y starts | Yes |
| `parent-child` | Epic → subtasks hierarchy | Yes |
| `related` | Soft link for reference | No |
| `discovered-from` | Found during work on parent | No |

## Configuration

In `.ck.json`:
```json
{
  "beads": {
    "enabled": "auto",       // auto | true | false
    "syncPlans": true,       // Create epic on plan creation
    "autoFileDiscovered": true,
    "autoSync": true,        // Auto-sync at session end (via Stop hook)
    "showHint": true,        // Show tip for non-beads projects with plans/
    "routing": {
      "beadsThreshold": 5,   // Steps for beads routing
      "multiFileAlways": true
    }
  }
}
```

## Hook Setup

Add Stop hook for automatic sync at session end:

```json
// .claude/settings.json
{
  "hooks": {
    "Stop": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "node .claude/hooks/session-end.cjs" }] }]
  }
}
```

## Permission Patterns (Optional Safety)

Add to `.claude/settings.json` for extra protection:

```json
{
  "permissions": {
    "deny": [
      "Bash(bd:init)"      // Prevent accidental re-init (destructive)
    ],
    "allow": [
      "Bash(bd:*)"         // Allow all other bd commands
    ]
  }
}
```

## Integration with ClaudeKit

### Automatic (via /cook)

When working on features via `/cook`:
1. Session start shows ready work from beads
2. Routing decides beads vs TodoWrite based on complexity
3. Discovered work filed automatically with dependencies
4. Session end prompts sync if `autoSync: true`

### Manual (via skill)

For complex scenarios outside `/cook`:
- Query dependencies: `bd dep tree bd-xxx`
- Bulk status update: `bd update --status in_progress bd-a1b2 bd-c3d4`
- Export for review: `bd export --format md --filter ready`

## Installation

Run install script:
```bash
python ~/.claude/skills/beads/scripts/install_beads.py
```

Or manually:
```bash
# npm (recommended)
npm install -g @beads/bd

# curl (macOS/Linux)
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# homebrew
brew tap steveyegge/beads && brew install bd
```

## beads vs TodoWrite

| Scenario | TodoWrite | beads |
|----------|-----------|-------|
| Single session task | ✅ | ❌ |
| Multi-session feature | ❌ | ✅ |
| Discovered work | ❌ | ✅ |
| Epic with subtasks | ❌ | ✅ |
| Blocked work detection | ❌ | ✅ |
| Cross-agent coordination | ❌ | ✅ |
| Persistence | Session only | Git-backed |

## References

- [beads-overview.md](references/beads-overview.md) - What beads is and how it works
- [beads-commands.md](references/beads-commands.md) - Complete command reference
- [beads-workflow.md](references/beads-workflow.md) - ClaudeKit integration patterns
- [workflow-steps.md](references/workflow-steps.md) - Step-by-step workflow integration

## Source

- Repository: https://github.com/steveyegge/beads
- Documentation: https://github.com/steveyegge/beads/tree/main/docs
