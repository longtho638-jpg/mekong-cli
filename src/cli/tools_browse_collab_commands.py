"""
AGI v2 sub-command groups: tools, browse, collab
Tool registry, browser automation, multi-agent collaboration.
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

tools_app = typer.Typer(help="Tools: dynamic tool registry & discovery")
browse_app = typer.Typer(help="Browse: web automation & page analysis")
collab_app = typer.Typer(help="Collab: multi-agent collaboration & debate")


# ---------------------------------------------------------------------------
# Tools commands
# ---------------------------------------------------------------------------

@tools_app.command(name="list")
def tools_list(
    tool_type: str = typer.Option("", "--type", "-t", help="Filter by type: builtin|cli|api|mcp|custom"),
) -> None:
    """List all registered tools."""
    from src.core.tool_registry import ToolRegistry, ToolType

    reg = ToolRegistry()
    type_filter = None
    if tool_type:
        try:
            type_filter = ToolType(tool_type)
        except ValueError:
            pass

    tools = reg.list_tools(type_filter)
    if not tools:
        console.print("[yellow]No tools registered.[/yellow]")
        return

    table = Table(title=f"Tools ({len(tools)})")
    table.add_column("Name", style="cyan")
    table.add_column("Type", style="dim")
    table.add_column("Description")
    table.add_column("Reliability")
    table.add_column("Uses", justify="right")

    for t in tools:
        rel_style = {"high": "green", "medium": "yellow", "low": "red"}.get(t.reliability, "dim")
        uses = t.success_count + t.failure_count
        table.add_row(
            t.name, t.tool_type.value, t.description[:50],
            f"[{rel_style}]{t.reliability}[/{rel_style}]", str(uses),
        )
    console.print(table)


@tools_app.command(name="discover")
def tools_discover(
    command: str = typer.Argument(..., help="CLI command to discover tools from (e.g. git, docker)"),
) -> None:
    """Auto-discover tools from a CLI's --help output."""
    from src.core.tool_registry import ToolRegistry

    discovered = ToolRegistry().discover_from_cli(command)
    if not discovered:
        console.print(f"[yellow]No tools discovered from '{command}'[/yellow]")
        return

    console.print(f"[green]Discovered {len(discovered)} tools from '{command}':[/green]")
    for t in discovered:
        console.print(f"  • [cyan]{t.name}[/cyan] — {t.description[:60]}")


@tools_app.command(name="run")
def tools_run(
    name: str = typer.Argument(..., help="Tool name to execute"),
    args: str = typer.Argument("", help="Arguments to pass"),
) -> None:
    """Execute a registered tool."""
    from src.core.tool_registry import ToolRegistry

    result = ToolRegistry().execute(name, {"args": args} if args else {})
    status_style = "green" if result["success"] else "red"
    console.print(
        Panel(
            f"[bold]Tool:[/bold] {name}\n"
            f"[bold]Status:[/bold] [{status_style}]{'SUCCESS' if result['success'] else 'FAILED'}[/{status_style}]\n"
            f"[bold]Duration:[/bold] {result['duration_ms']:.0f}ms\n\n"
            f"{result['output'][:500]}",
            title="Tool Execution",
            border_style=status_style,
        )
    )


@tools_app.command(name="stats")
def tools_stats() -> None:
    """Show tool registry statistics."""
    from src.core.tool_registry import ToolRegistry

    stats = ToolRegistry().get_stats()
    console.print(
        Panel(
            f"[bold]Total Tools:[/bold] {stats['total_tools']}\n"
            f"[bold]Types:[/bold] {stats['type_counts']}\n"
            f"[bold]Total Executions:[/bold] {stats['total_executions']}\n"
            f"[bold]Success Rate:[/bold] {stats['overall_success_rate']:.0%}",
            title="🔧 Tool Registry Stats",
            border_style="cyan",
        )
    )


# ---------------------------------------------------------------------------
# Browse commands
# ---------------------------------------------------------------------------

@browse_app.command(name="check")
def browse_check(url: str = typer.Argument(..., help="URL to check status")) -> None:
    """Check HTTP status of a URL."""
    from src.core.browser_agent import BrowserAgent

    result = BrowserAgent().check_status(url)
    status_style = "green" if result.success else "red"
    console.print(
        f"[{status_style}]HTTP {result.status_code}[/{status_style}] — {url}"
        f"  ({result.duration_ms:.0f}ms)"
    )


@browse_app.command(name="analyze")
def browse_analyze(url: str = typer.Argument(..., help="URL to analyze")) -> None:
    """Full page analysis: title, links, meta tags."""
    from src.core.browser_agent import BrowserAgent

    info = BrowserAgent().analyze_page(url)
    console.print(
        Panel(
            f"[bold]URL:[/bold] {info.url}\n"
            f"[bold]Title:[/bold] {info.title}\n"
            f"[bold]Status:[/bold] {info.status_code}\n"
            f"[bold]Links:[/bold] {len(info.links)}\n"
            f"[bold]Load Time:[/bold] {info.load_time_ms:.0f}ms\n\n"
            f"[bold]Content Preview:[/bold]\n{info.text_content[:300]}",
            title="🌐 Page Analysis",
            border_style="cyan",
        )
    )
    if info.meta_tags:
        console.print("\n[bold]Meta Tags:[/bold]")
        for k, v in list(info.meta_tags.items())[:5]:
            console.print(f"  [dim]{k}:[/dim] {v[:80]}")


@browse_app.command(name="links")
def browse_links(url: str = typer.Argument(..., help="URL to extract links from")) -> None:
    """Extract all links from a page."""
    from src.core.browser_agent import BrowserAgent

    result = BrowserAgent().get_links(url)
    if not result.links:
        console.print("[yellow]No links found.[/yellow]")
        return

    console.print(f"[bold]Found {len(result.links)} links:[/bold]")
    for link in result.links[:20]:
        console.print(f"  • {link}")
    if len(result.links) > 20:
        console.print(f"  [dim]... and {len(result.links) - 20} more[/dim]")


# ---------------------------------------------------------------------------
# Collab commands
# ---------------------------------------------------------------------------

@collab_app.command(name="agents")
def collab_agents() -> None:
    """List registered collaboration agents."""
    from src.core.collaboration import CollaborationProtocol

    proto = CollaborationProtocol()
    stats = proto.get_stats()

    if stats["total_agents"] == 0:
        console.print("[yellow]No agents registered.[/yellow]")
        console.print("[dim]Agents are auto-registered during autonomous cycles.[/dim]")
        return

    table = Table(title=f"Collaboration Agents ({stats['active_agents']} active)")
    table.add_column("Agent", style="cyan")
    table.add_column("Role", style="bold")
    for name, role in stats.get("agent_roles", {}).items():
        table.add_row(name, role)
    console.print(table)


@collab_app.command(name="stats")
def collab_stats() -> None:
    """Show collaboration statistics."""
    from src.core.collaboration import CollaborationProtocol

    stats = CollaborationProtocol().get_stats()
    console.print(
        Panel(
            f"[bold]Agents:[/bold] {stats['active_agents']}/{stats['total_agents']}\n"
            f"[bold]Messages:[/bold] {stats['total_messages']}\n"
            f"[bold]Reviews:[/bold] {stats['total_reviews']}\n"
            f"[bold]Debates:[/bold] {stats['active_debates']}\n"
            f"[bold]Review Approval Rate:[/bold] {stats['review_approval_rate']:.0%}",
            title="🤝 Collaboration Stats",
            border_style="cyan",
        )
    )


@collab_app.command(name="debate")
def collab_debate(
    topic: str = typer.Argument(..., help="Topic for multi-agent debate"),
) -> None:
    """🤝 Start a multi-agent debate on a topic."""
    from src.core.collaboration import CollaborationProtocol

    console.print(f"[bold cyan]Starting debate:[/bold cyan] {topic}\n")
    try:
        result = CollaborationProtocol().start_debate(topic)
        console.print(
            Panel(
                result[:500] if isinstance(result, str) else str(result)[:500],
                title="🤝 Debate Result",
                border_style="cyan",
            )
        )
    except Exception as e:
        console.print(f"[red]Debate failed: {e}[/red]")


@collab_app.command(name="review")
def collab_review(
    task_id: str = typer.Argument(..., help="Task ID to review"),
    passed: bool = typer.Option(True, "--pass/--fail", help="Review passed or failed"),
    feedback: str = typer.Option("Looks good", "--feedback", "-f", help="Review feedback"),
) -> None:
    """🤝 Submit a code review for a task."""
    from src.core.collaboration import CollaborationProtocol

    try:
        CollaborationProtocol().submit_review(
            reviewer="cli_user",
            target=task_id,
            approved=passed,
            feedback=[feedback],
        )
        status = "[green]PASSED[/green]" if passed else "[red]FAILED[/red]"
        console.print(f"Review submitted: {status} — {feedback}")
    except Exception as e:
        console.print(f"[red]Review failed: {e}[/red]")
