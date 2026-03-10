"""
Memory Commands - Execution history & learning commands
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

app = typer.Typer(help="Memory: execution history & learning")
console = Console()


@app.command(name="list")
def memory_list(
    limit: int = typer.Option(20, "--limit", "-l", help="Number of entries to show"),
) -> None:
    """List recent memory entries."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    memories = store.get_recent(limit=limit)

    if not memories:
        console.print("[yellow]No memories yet. Run some missions first.[/yellow]")
        return

    table = Table(title=f"Recent Memories ({len(memories)} entries)")
    table.add_column("ID", style="cyan", justify="right")
    table.add_column("Goal", style="bold")
    table.add_column("Status", style="dim")
    table.add_column("Timestamp", style="dim")

    for mem in memories:
        status = "[green]success[/green]" if mem.get("success") else "[red]failed[/red]"
        table.add_row(
            str(mem.get("id", "?")),
            mem.get("goal", "Unknown")[:50],
            status,
            mem.get("timestamp", "Unknown")[:19],
        )

    console.print(table)


@app.command(name="stats")
def memory_stats() -> None:
    """Show memory statistics."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    stats = store.get_statistics()

    console.print(
        Panel(
            f"[bold]Total Missions:[/bold] {stats.get('total', 0)}\n"
            f"[bold]Successful:[/bold] {stats.get('successful', 0)}\n"
            f"[bold]Failed:[/bold] {stats.get('failed', 0)}\n"
            f"[bold]Success Rate:[/bold] {stats.get('success_rate', 0):.1%}\n"
            f"[bold]Avg Steps:[/bold] {stats.get('avg_steps', 0):.1f}\n"
            f"[bold]Storage:[/bold] {stats.get('storage_size', 'Unknown')}",
            title="🧠 Memory Statistics",
            border_style="cyan",
        )
    )


@app.command(name="clear")
def memory_clear() -> None:
    """Clear all memories."""
    from rich.prompt import Confirm

    if Confirm.ask("[red]Are you sure you want to clear all memories?[/red]"):
        from src.core.memory import MemoryStore
        store = MemoryStore()
        store.clear()
        console.print("[green]Memory cleared.[/green]")
    else:
        console.print("[dim]Cancelled.[/dim]")
