---
description: 🏭 FACTORY - Sequential task execution mode
---

# /factory - Factory Line Mode

> **"Một việc một lúc"** - One task at a time

## Usage

```bash
/factory [action] [options]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `run` | Execute task queue | `/factory run --tasks "task1,task2,task3"` |
| `add` | Add task to queue | `/factory add "Build feature X"` |
| `status` | Show queue status | `/factory status` |
| `clear` | Clear queue | `/factory clear` |

## Execution Protocol

1. **Agent**: Delegates to `factory-line`.
2. **Queue**: Load tasks from queue file.
3. **Execute**: Run tasks sequentially.
4. **Report**: Progress after each task.

## Examples

```bash
# Run sequential tasks
/factory run --tasks "typecheck,test,build"

# Add task to queue
/factory add "Deploy to staging"

# Check status
/factory status
```

## Win-Win-Win
- **Owner**: No race conditions.
- **Agency**: Predictable execution.
- **Client**: Reliable task completion.
