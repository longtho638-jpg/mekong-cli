"""
Swarm sub-commands: add, list, dispatch, remove
Distributed multi-node execution via remote Mekong gateway nodes.
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

swarm_app = typer.Typer(help="Swarm: distributed multi-node execution")


@swarm_app.command(name="add")
def swarm_add(
    name: str = typer.Argument(..., help="Node name"),
    host_port: str = typer.Argument(..., help="host:port of remote gateway"),
    token: str = typer.Argument(..., help="API token for the remote node"),
) -> None:
    """Register a remote Mekong gateway node."""
    from src.core.swarm import SwarmRegistry

    parts = host_port.rsplit(":", 1)
    host = parts[0]
    port = int(parts[1]) if len(parts) > 1 else 8000

    registry = SwarmRegistry()
    node = registry.register_node(name=name, host=host, port=port, token=token)

    console.print(
        Panel(
            f"[bold]ID:[/bold] {node.id}\n"
            f"[bold]Name:[/bold] {node.name}\n"
            f"[bold]Host:[/bold] {node.host}:{node.port}",
            title="Node Registered",
            border_style="green",
        )
    )


@swarm_app.command(name="list")
def swarm_list() -> None:
    """List all swarm nodes with health status."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    nodes = registry.list_nodes()

    if not nodes:
        console.print("[yellow]No swarm nodes registered.[/yellow]")
        console.print("[dim]Use: mekong swarm add <name> <host:port> <token>[/dim]")
        return

    registry.check_all_health(timeout=2.0)

    table = Table(title=f"Swarm Nodes ({len(nodes)})")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Host", style="dim")
    table.add_column("Status")

    for node in nodes:
        status_style = {
            "healthy": "green",
            "unhealthy": "yellow",
            "unreachable": "red",
        }.get(node.status, "dim")
        table.add_row(
            node.id,
            node.name,
            f"{node.host}:{node.port}",
            f"[{status_style}]{node.status}[/{status_style}]",
        )

    console.print(table)


@swarm_app.command(name="dispatch")
def swarm_dispatch(
    node_id: str = typer.Argument(..., help="Node ID to dispatch to"),
    goal: str = typer.Argument(..., help="Goal to execute on remote node"),
) -> None:
    """Send a goal to a remote swarm node."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    node = registry.get_node(node_id)
    if not node:
        console.print(f"[bold red]Node {node_id} not found.[/bold red]")
        raise typer.Exit(code=1)

    console.print(f"[dim]Dispatching to {node.name} ({node.host}:{node.port})...[/dim]")
    result = registry.dispatch_goal(node_id, goal)

    if "error" in result:
        console.print(f"[bold red]Error:[/bold red] {result['error']}")
        raise typer.Exit(code=1)

    status = result.get("status", "unknown")
    status_style = "green" if status == "success" else "red"
    console.print(
        Panel(
            f"[bold]Status:[/bold] [{status_style}]{status}[/{status_style}]\n"
            f"[bold]Goal:[/bold] {result.get('goal', goal)}\n"
            f"[bold]Steps:[/bold] {result.get('completed_steps', 0)}/{result.get('total_steps', 0)}",
            title=f"Dispatch Result — {node.name}",
            border_style=status_style,
        )
    )


@swarm_app.command(name="remove")
def swarm_remove(
    node_id: str = typer.Argument(..., help="Node ID to remove"),
) -> None:
    """Remove a node from the swarm."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    if registry.remove_node(node_id):
        console.print(f"[green]Node {node_id} removed.[/green]")
    else:
        console.print(f"[bold red]Node {node_id} not found.[/bold red]")
        raise typer.Exit(code=1)
