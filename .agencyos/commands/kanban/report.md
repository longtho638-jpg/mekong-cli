---
description: Generate execution report
---

# 📊 Kanban Report

Generates a markdown report of current tasks and agent workload.

## Usage

```bash
/kanban report
```

## Implementation

```python
import asyncio
from antigravity.vibe_kanban import VibeBoardClient, AgentOrchestrator
from rich.console import Console
from rich.table import Table

async def run():
    client = VibeBoardClient()
    orchestrator = AgentOrchestrator(client)
    
    tasks = await client.list_tasks()
    workload = await orchestrator.get_agent_workload()
    
    console = Console()
    
    # Workload Table
    table = Table(title="🤖 Agent Workload")
    table.add_column("Agent", style="cyan")
    table.add_column("Role", style="white")
    table.add_column("Active Tasks", style="magenta")
    
    for agent, count in workload.items():
        role = orchestrator.AGENTS.get(agent, "Unknown")
        table.add_row(agent, role, str(count))
        
    console.print(table)
    console.print("\n")
    
    # Task Summary
    done_count = len([t for t in tasks if t.status == "done"])
    todo_count = len([t for t in tasks if t.status == "todo"])
    
    console.print(f"✅ Completed: {done_count}")
    console.print(f"📝 To Do: {todo_count}")

if __name__ == "__main__":
    asyncio.run(run())
```

```