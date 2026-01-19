---
description: Create a new task on the Kanban board
argument-hint: <title> --agent <name> --priority <P1|P2|P3>
---

# ➕ Create Task

Adds a new task to the Vibe Kanban board.

## Usage

```bash
/kanban create-task "Task Title" --agent planner --priority P1
```

## Implementation

```python
import asyncio
import argparse
from antigravity.vibe_kanban import VibeBoardClient

async def run():
    parser = argparse.ArgumentParser(description="Create Kanban Task")
    parser.add_argument("title", help="Task title")
    parser.add_argument("--agent", default="unassigned", help="Assigned agent")
    parser.add_argument("--priority", default="P2", choices=["P1", "P2", "P3"], help="Priority")
    parser.add_argument("--desc", default="", help="Description")
    
    # Simulate args parsing from CLI input (in real CLI this is handled by framework)
    # Here we assume sys.argv is passed correctly
    import sys
    # Example: sys.argv = ['script', 'My Task', '--agent', 'planner']
    
    # For this script we will manually parse sys.argv to handle the 'create-task' command context if needed
    # but let's assume the runner passes arguments after the command name.
    
    try:
        args = parser.parse_args()
    except:
        # Fallback for demo if running directly without proper args
        print("Usage: /kanban create-task <title> --agent <agent> --priority <priority>")
        return

    client = VibeBoardClient()
    print(f"Creating task: {args.title}...")
    task = await client.create_task(args.title, args.desc, args.agent, args.priority)
    
    if task:
        print(f"✅ Task created: {task.id} | Assigned: {task.agent_assigned}")
    else:
        print("❌ Failed to create task.")

if __name__ == "__main__":
    asyncio.run(run())
```
