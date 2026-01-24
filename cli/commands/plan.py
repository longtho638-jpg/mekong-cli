"""
📜 Plan & Orchestration Commands
================================

CLI commands for planning and orchestrating AI agents.
Powered by antigravity.core.vibe_orchestrator.VIBEOrchestrator.
"""

import typer
from rich.console import Console

from antigravity.core.vibe_orchestrator import VIBEOrchestrator

console = Console()
plan_app = typer.Typer(help="📜 Planning & Orchestration")


@plan_app.command("create")
def create_plan(
    goal: str = typer.Argument(..., help="High-level goal description"),
    blueprint: str = typer.Option("feature", help="Blueprint type (feature, research, bugfix)"),
):
    """📜 Create and execute a new plan."""
    console.print(f"[bold blue]📜 Planning goal:[/bold blue] {goal}")

    orchestrator = VIBEOrchestrator()
    result = orchestrator.run_blueprint(blueprint, goal)

    if result.success:
        console.print("[green]✅ Plan executed successfully![/green]")
        console.print(f"⏱️ Duration: {result.total_time:.2f}s")
    else:
        console.print("[red]❌ Plan failed:[/red]")
        for err in result.errors:
            console.print(f"  - {err}")


@plan_app.command("stats")
def show_stats():
    """📊 Show Orchestrator stats."""
    orchestrator = VIBEOrchestrator()
    stats = orchestrator._collect_stats()

    console.print("\n[bold]💂 VIBE Orchestrator Status[/bold]")
    console.print(f"Active Blueprints: {len(stats['orchestration']['active_blueprints'])}")
    console.print(f"Completed Tasks: {stats['orchestration']['total_completed']}")
    console.print(f"Agents Online: {stats['agents']['handlers_online']}")
