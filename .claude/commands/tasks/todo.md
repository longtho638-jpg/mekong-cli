---
description: Manage project TODO items
---

// turbo

# /todo - Task Manager

Quick TODO management without leaving Claude.

## Usage

```
/todo                    # List all
/todo add [task]        # Add new
/todo done [id]         # Mark complete
/todo priority [id]     # Set priority
```

## Claude Prompt Template

```
TODO management workflow:

Storage: .claude/todo.json

Commands:
- list: Show all TODOs sorted by priority/due date
- add: Create new TODO with optional due date
- done: Mark TODO as complete
- priority: Set priority (high/medium/low)

TODO format:
{
  "id": "uuid",
  "task": "description",
  "priority": "high|medium|low",
  "due": "2024-01-20",
  "done": false,
  "created": "timestamp"
}

Display with emojis:
🔴 High priority
🟡 Medium priority
🟢 Low priority
✅ Completed
```

## Example Output

```
📋 TODOs (5 active)

🔴 #1 Fix login bug (due: today)
🔴 #2 Client meeting prep
🟡 #3 Update documentation
🟡 #4 Review PR #42
🟢 #5 Refactor utils

✅ Completed: 3 this week

/todo add "New task" to add
/todo done 1 to complete
```
