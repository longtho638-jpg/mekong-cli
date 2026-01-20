---
description: Display current Kanban tasks
---

# 📋 Kanban Board

Displays the current list of tasks from Vibe Kanban.

## Usage

```bash
/kanban board [filter]
```

## Implementation

```python
import asyncio
from antigravity.vibe_kanban import VibeBoardClient
from rich.console import Console
from rich.table import Table

async def run(filter_status=None):
    client = VibeBoardClient()
    tasks = await client.list_tasks(filter_status)
    
    console = Console()
    table = Table(title=f"Vibe Kanban Board ({filter_status or 'All'})")
    
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Agent", style="magenta")
    table.add_column("Status", style="green")
    table.add_column("Priority", style="red")
    
    if not tasks:
        console.print("[yellow]No tasks found or connection failed (showing mock data?)[/yellow]")
        # Mock data for display if empty
        table.add_row("MOCK-1", "Setup Vibe", "fullstack-dev", "done", "P1")
        table.add_row("MOCK-2", "Analyze Market", "strategist", "in_progress", "P2")
    else:
        for t in tasks:
            table.add_row(t.id, t.title, t.agent_assigned, t.status, t.priority)
            
    console.print(table)

if __name__ == "__main__":
    import sys
    filter_arg = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(run(filter_arg))
```
