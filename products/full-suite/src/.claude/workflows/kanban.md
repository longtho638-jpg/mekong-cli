# Kanban Workflow - Unified

**Version:** 2.0 (Consolidated)
**Last Updated:** 2026-01-19
**Status:** Active

> **Binh Pháp:** "Tri bỉ tri kỷ" - Know tasks, know priorities

---

## 🎯 Overview

This workflow defines how to manage Kanban boards in AgencyOS, including both CLI operations and agent interaction protocols.

---

## 📊 CLI Operations

### Trigger Commands

```bash
agencyos kanban                    # View board
agencyos kanban add "Task title"   # Add task
agencyos kanban move TASK-123 done # Move task
agencyos kanban delete TASK-123    # Remove task
```

### Board Display

```
┌─────────────┬─────────────┬─────────────┐
│   TODO      │ IN PROGRESS │    DONE     │
├─────────────┼─────────────┼─────────────┤
│ [ ] Task 1  │ [/] Task 3  │ [x] Task 5  │
│ [ ] Task 2  │             │ [x] Task 6  │
└─────────────┴─────────────┴─────────────┘
```

### Supported Actions

| Command  | Action          | Example                              |
| -------- | --------------- | ------------------------------------ |
| `add`    | Create new task | `kanban add "Fix login bug"`         |
| `move`   | Move to column  | `kanban move TASK-123 in_progress`   |
| `done`   | Mark complete   | `kanban done TASK-123`               |
| `delete` | Remove task     | `kanban delete TASK-123`             |
| `list`   | Filter tasks    | `kanban list --status todo`          |

### Storage & Sync

Auto-saves changes to:
- `.mekong/kanban.json` (local storage)
- External vibe-kanban (if configured)
- Syncs with `task.md` artifacts
- Links to GitHub issues (optional)

---

## 🤖 Agent Interaction Protocol

### The Golden Rule (Đạo)

**Agents must never hold state in memory.**
All tasks, progress, and blockers must be reflected on the Kanban board immediately.

### Standard Operating Procedure (SOP)

#### A. Picking a Task

1. **List**: Call `kanban.py list {"status": "todo"}`
2. **Filter**: Find tasks assigned to `self.agent_name` or `unassigned`
3. **Claim**: Call `kanban.py update {"id": "TASK-XXX", "status": "in_progress", "agent": "self.agent_name"}`

#### B. Executing

1. Perform the work (Code, Write, Research)
2. **Log**: Append notes to the task if blocked or partially complete
3. **Update**: Reflect progress on the board continuously

#### C. Completion

1. **Review**: If the task requires approval, move to `review`
2. **Done**: Call `kanban.py update {"id": "TASK-XXX", "status": "done"}`

### Tool Definition (for System Prompt)

```json
{
  "name": "manage_kanban",
  "description": "Interact with the project Kanban board to track tasks.",
  "parameters": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["create", "update", "list"]
      },
      "params": {
        "type": "object",
        "description": "Parameters for the action (title, id, status, etc.)"
      }
    },
    "required": ["action", "params"]
  }
}
```

### Agent Workflow Example

```python
# Agent picks a task
tasks = kanban.list({"status": "todo", "agent": None})
task = tasks[0]

# Claim the task
kanban.update({
    "id": task["id"],
    "status": "in_progress",
    "agent": "fullstack-developer"
})

# Do the work
implement_feature()

# Mark complete
kanban.update({
    "id": task["id"],
    "status": "done",
    "notes": "Implemented feature X with tests"
})
```

---

## 🔄 Task States

- `todo` - Not yet started
- `in_progress` - Currently being worked on
- `review` - Awaiting approval
- `blocked` - Waiting on external dependency
- `done` - Completed

---

## 📁 Integration Points

### With Task Artifacts

Kanban tasks can reference `task.md` files in the codebase:
```json
{
  "id": "TASK-123",
  "title": "Implement login",
  "artifact": "plans/260119-login-feature/task.md"
}
```

### With GitHub Issues

Optional GitHub issue linking:
```json
{
  "id": "TASK-123",
  "github_issue": "https://github.com/org/repo/issues/456"
}
```

### With Vibe Kanban

Export to external vibe-kanban board:
```bash
agencyos kanban export --to vibe-kanban
```

---

## 🛠️ Configuration

### `.mekong/kanban.json` Schema

```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Task title",
      "status": "todo",
      "agent": null,
      "created_at": "2026-01-19T10:00:00Z",
      "updated_at": "2026-01-19T10:00:00Z",
      "notes": "",
      "priority": "P1",
      "tags": ["feature", "backend"]
    }
  ]
}
```

### External Board Sync

Configure in `.mekong/config.json`:
```json
{
  "kanban": {
    "sync_enabled": true,
    "external_board": "vibe-kanban",
    "sync_interval": 300
  }
}
```

---

## ✅ Best Practices

1. **Single Source of Truth**: Always update the Kanban board, never rely on memory
2. **Atomic Updates**: Update task status immediately after state changes
3. **Clear Titles**: Use descriptive task titles (e.g., "Fix login timeout bug" not "Fix bug")
4. **Proper Assignment**: Claim tasks before working to avoid conflicts
5. **Notes for Blockers**: If blocked, document the blocker in task notes
6. **Regular Cleanup**: Archive or delete completed tasks periodically

---

## 🔍 Troubleshooting

### Task Not Updating
```bash
# Check kanban.json exists
ls -la .mekong/kanban.json

# Verify JSON is valid
cat .mekong/kanban.json | jq .

# Check file permissions
chmod 644 .mekong/kanban.json
```

### Sync Issues
```bash
# Force sync with external board
agencyos kanban sync --force

# Check sync configuration
cat .mekong/config.json | jq .kanban
```

### Agent Conflicts
```bash
# List tasks in progress
agencyos kanban list --status in_progress

# Reassign stuck task
agencyos kanban update TASK-123 --agent null
```

---

## 📚 Related Documentation

- [Primary Workflow](primary-workflow.md)
- [Agent Coordination](../rules/orchestration-protocol.md)
- [Task Management](../commands/tasks/)

---

_Generated by Binh Pháp Framework | AgencyOS v3.0_
_Consolidated from kanban-workflow.md + kanban-agent-flow.md_
