# beads Workflow Integration with ClaudeKit

## Overview

beads complements (not replaces) ClaudeKit's existing workflow:
- **TodoWrite** → ephemeral session tasks
- **Markdown plans** → human-readable documentation
- **beads** → persistent multi-session tracking

## When to Activate beads Skill

Activate this skill when the task involves:
1. Multi-session epics (feature implementation spanning days)
2. Complex dependency chains (blocked work, subtasks)
3. Cross-agent coordination (multiple agents working on related issues)
4. Work discovery during implementation

## Workflow Patterns

### Pattern 1: Epic-Driven Development

For large features:

```bash
# 1. Create epic
bd create "User Authentication System" -t epic -p 1 --json

# 2. Break into subtasks
bd create "Design login UI" -t task -p 1
bd create "Implement auth API" -t task -p 1
bd create "Add session management" -t task -p 1

# 3. Set dependencies
bd dep add bd-ui bd-epic --type parent-child
bd dep add bd-api bd-epic --type parent-child
bd dep add bd-session bd-api --type blocks  # Session needs API first
```

### Pattern 2: Discovered Work

When finding issues during implementation:

```bash
# Working on bd-a1b2, find a bug
bd create "Edge case in password validation" -t bug -p 0 --json
bd dep add bd-new bd-a1b2 --type discovered-from

# Continue with original work
bd update bd-a1b2 --status in_progress
```

### Pattern 3: Session Handoff

For resuming work across sessions:

```bash
# Session start
bd ready --json | jq '.[] | {id, title, priority}'

# Pick up where left off
bd show bd-a1b2 --json
bd update bd-a1b2 --status in_progress

# Session end
bd close bd-a1b2 --reason "Completed X, Y remains" --json
bd sync
```

## Integration with ClaudeKit Agents

### Planner Agent
Can create beads epics instead of/alongside markdown plans:
```bash
# After creating plan, create tracking epic
bd create "Feature: $FEATURE_NAME" -t epic -p $PRIORITY --json
```

### Debugger Agent
File discovered bugs:
```bash
bd create "Bug: $BUG_DESCRIPTION" -t bug -p 0 -l discovered,debug --json
```

### Tester Agent
Track test failures:
```bash
bd create "Test: $TEST_NAME failing" -t bug -p 1 -l testing --json
```

## Session Lifecycle

### Session Start Hook (Optional)

Add to SessionStart hook to show beads status:

```javascript
// Check if beads initialized
const beadsExists = fs.existsSync('.beads/beads.db');
if (beadsExists) {
  console.log('📊 beads: Run `bd ready` for pending work');
}
```

### Session End Reminder

Before ending session:
1. Close completed issues
2. Update in-progress issues with notes
3. File discovered work
4. Run `bd sync`

## Coexistence with TodoWrite

| TodoWrite | beads |
|-----------|-------|
| Use for current session tasks | Use for cross-session tracking |
| Ephemeral, lost on session end | Persistent, git-backed |
| Simple list, no dependencies | Full dependency graph |
| Built-in, always available | Requires bd binary |

**Rule of thumb:** If you'll need to continue tomorrow, use beads.

## Coexistence with Markdown Plans

Plans and beads serve different purposes:

| Markdown Plans | beads |
|----------------|-------|
| Human-readable documentation | Machine-readable tracking |
| Static, manually updated | Dynamic, agent-maintained |
| Design and context | Execution tracking |
| Kept in plans/ directory | Stored in .beads/ |

**Best practice:** Create plan first, then create beads epic to track execution.

## Common Patterns

### /plan + beads
1. `/plan` creates markdown plan
2. Create beads epic from plan
3. Track execution in beads
4. Close issues as phases complete

### /cook + beads
1. `/cook` starts implementation
2. File discovered work in beads
3. Close main issue when done

### /fix + beads
1. Create bug in beads
2. `/fix` implements solution
3. Close bug with resolution note

## Labels for ClaudeKit

Suggested labels:
- `planning` - From planner agent
- `discovered` - Found during work
- `testing` - Test-related
- `review` - Needs review
- `blocked` - Waiting on external
- `frontend` / `backend` / `infra`

## Example: Full Feature Workflow

```bash
# 1. Initialize beads (once per project)
bd init

# 2. Create epic for feature
bd create "Add dark mode support" -t epic -p 1 -l frontend,ui --json
# Returns: bd-a1b2

# 3. Create subtasks
bd create "Design dark theme colors" -t task -p 1
bd create "Add theme toggle component" -t task -p 1
bd create "Persist theme preference" -t task -p 2

# 4. Set dependencies
bd dep add bd-toggle bd-colors --type blocks
bd dep add bd-persist bd-toggle --type blocks

# 5. Work session 1
bd ready  # Shows: bd-colors (no blockers)
bd update bd-colors --status in_progress
# ... work ...
bd close bd-colors --reason "Created color palette"

# 6. Work session 2
bd ready  # Shows: bd-toggle (now unblocked)
bd update bd-toggle --status in_progress
# Discover bug
bd create "Theme flash on page load" -t bug -p 1
bd dep add bd-bug bd-toggle --type discovered-from
# ... work ...
bd close bd-toggle --reason "Toggle working"

# 7. Sync before ending
bd sync
```
