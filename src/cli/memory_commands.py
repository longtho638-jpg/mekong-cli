"""
Memory sub-commands: list, stats, clear, search
Execution history & vector memory learning.
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

memory_app = typer.Typer(help="Memory: execution history & learning")


@memory_app.command(name="list")
def memory_list(
    limit: int = typer.Option(20, "--limit", "-l", help="Number of entries"),
) -> None:
    """List recent execution memory entries."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    entries = store.recent(limit)

    if not entries:
        console.print("[yellow]No memory entries yet.[/yellow]")
        return

    table = Table(title=f"Memory ({len(entries)} entries)")
    table.add_column("Goal", style="cyan")
    table.add_column("Status")
    table.add_column("Duration", style="dim")
    table.add_column("Recipe", style="dim")

    for e in reversed(entries):
        status_style = "green" if e.status == "success" else "red"
        table.add_row(
            e.goal[:40],
            f"[{status_style}]{e.status}[/{status_style}]",
            f"{e.duration_ms:.0f}ms",
            e.recipe_used or "-",
        )

    console.print(table)


@memory_app.command(name="stats")
def memory_stats_cmd() -> None:
    """Show memory statistics."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    s = store.stats()

    console.print(
        Panel(
            f"[bold]Total Executions:[/bold] {s['total']}\n"
            f"[bold]Success Rate:[/bold] {s['success_rate']:.1f}%\n"
            f"[bold]Recent Failures:[/bold] {s['recent_failures']}\n"
            f"[bold]Top Goals:[/bold] {', '.join(s['top_goals']) or 'none'}",
            title="🧠 Memory Statistics",
            border_style="cyan",
        )
    )


@memory_app.command(name="clear")
def memory_clear_cmd() -> None:
    """Clear all execution memory."""
    from src.core.memory import MemoryStore

    MemoryStore().clear()
    console.print("[green]Memory cleared.[/green]")


@memory_app.command(name="search")
def memory_search(
    query: str = typer.Argument(..., help="Search query for similar past goals"),
    limit: int = typer.Option(5, "--limit", "-l", help="Number of results"),
) -> None:
    """🧠 Search vector memory for similar past goals."""
    from src.core.vector_memory_store import VectorMemoryStore

    vmem = VectorMemoryStore()
    collections = vmem.list_collections()

    if "goal_history" not in collections:
        console.print("[yellow]No goal history yet. Run `mekong cook` first.[/yellow]")
        return

    vec = VectorMemoryStore.text_to_hash_vector(query)
    results = vmem.search("goal_history", vec, top_k=limit)

    if not results:
        console.print(f"[yellow]No similar goals found for '{query}'[/yellow]")
        return

    table = Table(title=f"Similar Goals (query: '{query}')")
    table.add_column("Goal", style="cyan")
    table.add_column("Status")
    table.add_column("Score", style="dim", justify="right")

    for r in results:
        payload = r.get("payload", {})
        status = payload.get("status", "?")
        status_style = "green" if status == "success" else "red"
        table.add_row(
            payload.get("goal", "?")[:50],
            f"[{status_style}]{status}[/{status_style}]",
            f"{r.get('score', 0):.0%}",
        )

    console.print(table)
