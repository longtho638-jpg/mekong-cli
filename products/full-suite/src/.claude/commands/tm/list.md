---
description: List all tasks from Task Master
---

# /tm/list - List All Tasks

> **Task Master AI** - View all tasks with status

## Usage

// turbo

```bash
# List all tasks
task-master list

# List by status
task-master list --status=in-progress
task-master list --status=done
task-master list --status=pending
```

## Output Format

```
ID  │ STATUS      │ TASK
────┼─────────────┼──────────────────────────
1   │ ✅ done     │ Setup project structure
2   │ ✅ done     │ Configure database
3   │ 🔄 progress │ Implement API endpoints
4   │ ⬜ pending  │ Add authentication
5   │ ⬜ pending  │ Write E2E tests
```
