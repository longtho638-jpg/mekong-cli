"""
Swarm Commands - Multi-node orchestration commands
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from typing import Optional

app = typer.Typer(help="Swarm: multi-node orchestration")
console = Console()


@app.command(name="add")
def swarm_add(
    name: str = typer.Argument(..., help="Node name"),
    host_port: str = typer.Argument(..., help="host:port of remote gateway"),
    token: str = typer.Argument(..., help="API token for the remote node"),
) -> None:
    """Register a remote Mekong gateway node."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    registry.add_node(name, host_port, token)

    console.print(
        Panel(
            f"[bold]Node:[/bold] {name}\n"
            f"[bold]Endpoint:[/bold] http://{host_port}\n"
            f"[bold]Status:[/bold] [green]Registered[/green]",
            title="🌐 Swarm Node Added",
            border_style="green",
        )
    )


@app.command(name="list")
def swarm_list() -> None:
    """List all registered swarm nodes."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    nodes = registry.list_nodes()

    if not nodes:
        console.print("[yellow]No nodes registered.[/yellow]")
        console.print("[dim]Use 'mekong swarm add <name> <host:port> <token>'[/dim]")
        return

    table = Table(title="Swarm Nodes")
    table.add_column("Name", style="bold cyan")
    table.add_column("Endpoint", style="bold")
    table.add_column("Status", style="dim")

    for node in nodes:
        status = "[green]active[/green]" if node.get("active") else "[red]inactive[/red]"
        table.add_row(node["name"], node["endpoint"], status)

    console.print(table)
    console.print(f"\n[dim]Total: {len(nodes)} nodes[/dim]")


@app.command(name="dispatch")
def swarm_dispatch(
    goal: str = typer.Argument(..., help="Goal to dispatch to swarm"),
    node: Optional[str] = typer.Option(None, "--node", "-n", help="Specific node (default: load balance)"),
) -> None:
    """Dispatch a goal to swarm nodes."""
    from src.core.swarm import SwarmDispatcher

    dispatcher = SwarmDispatcher()
    result = dispatcher.dispatch(goal, target_node=node)

    if result.success:
        console.print(
            Panel(
                f"[bold]Goal:[/bold] {goal}\n"
                f"[bold]Node:[/bold] {result.node}\n"
                f"[bold]Status:[/bold] [green]Dispatched[/green]",
                title="🌐 Swarm Dispatch",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                f"[bold red]Failed:[/bold red] {result.error}",
                title="Swarm Dispatch Error",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)


@app.command(name="remove")
def swarm_remove(name: str = typer.Argument(..., help="Node name to remove")) -> None:
    """Remove a node from the swarm."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    registry.remove_node(name)

    console.print(
        Panel(
            f"[bold]{name}[/bold] removed from swarm.",
            title="🌐 Node Removed",
            border_style="cyan",
        )
    )
