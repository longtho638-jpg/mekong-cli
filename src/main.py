"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
Refactored: 2026-03-11 — Modular architecture (src/cli/ submodules)
ROIaaS Phase 1: Startup License Validation (TypeScript source of truth)
ROIaaS Phase 2: Remote Validation, Usage Metering, Key Generation
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from src.cli.commands_registry import register_all_commands
from src.cli.command_registry_legacy import register_legacy_commands
from src.cli.core_commands import register_core_commands
from src.cli.start_command import register_start_command
from src.cli.trace_command import register_trace_command
from src.cli.recipe_commands import register_recipe_commands
from src.cli.cook_command import register_cook_command
from src.cli.workflow_commands import register_workflow_commands
from src.cli.swarm_commands import swarm_app
from src.cli.schedule_commands import schedule_app
from src.cli.memory_commands import memory_app
from src.cli.autonomous_commands import register_agi_commands
from src.cli.studio_commands import register_studio_commands
from src.cli.pev_commands import pev_app
from src.cli.setup_wizard import app as setup_app

app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

# Register command groups
register_all_commands(app)
register_legacy_commands(app)
register_core_commands(app)
register_start_command(app)
register_trace_command(app)
register_recipe_commands(app)
register_cook_command(app)
register_workflow_commands(app)
register_agi_commands(app)
register_studio_commands(app)

# Register sub-typers
app.add_typer(swarm_app, name="swarm")
app.add_typer(schedule_app, name="schedule")
app.add_typer(memory_app, name="memory")
app.add_typer(pev_app, name="pev")
app.add_typer(setup_app, name="setup")

console = Console()


@app.callback(invoke_without_command=True)
def main(ctx: typer.Context) -> None:
    """Mekong CLI: RaaS Agency Operating System"""
    if ctx.invoked_subcommand is None:
        console.print(
            Panel(
                Text("Mekong CLI: RaaS Agency Operating System", style="bold green"),
                title="🚀 Genesis",
                border_style="green",
            )
        )
        console.print(
            "\n[dim]Use[/dim] [bold cyan]mekong --help[/bold cyan] [dim]to see available commands[/dim]"
        )


def run_cli() -> None:
    """Entry point for CLI execution."""
    app()


if __name__ == "__main__":
    run_cli()
