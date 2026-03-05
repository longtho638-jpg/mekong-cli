"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
Refactored: 2026-03-05 — Modular architecture
ROIaaS Phase 2: Remote Validation, Usage Metering, Key Generation
"""

import typer
from rich.console import Console

# Core imports
from src.core.llm_client import get_client

# RaaS License Gate
from src.lib.raas_gate import get_license_gate, require_license

# Command modules
from src.cli.binh_phap_commands import app as binh_phap_app
from src.cli.commands_registry import register_all_commands
from src.commands.core_commands import app as core_app
from src.commands.swarm_commands import app as swarm_app
from src.commands.schedule_commands import app as schedule_app
from src.commands.memory_commands import app as memory_app
from src.commands.telegram_commands import app as telegram_app
from src.commands.autonomous_commands import app as autonomous_app
from src.commands.license_commands import app as license_app

# Legacy command imports (not yet refactored)
from src.commands.agi import app as agi_app
from src.commands.status import app as status_app
from src.commands.config import app as config_app
from src.commands.doctor import app as doctor_app
from src.commands.clean import app as clean_app
from src.commands.test import app as test_app
from src.commands.build import app as build_app
from src.commands.deploy import app as deploy_app
from src.commands.lint import app as lint_app
from src.commands.docs import app as docs_app
from src.commands.monitor import app as monitor_app
from src.commands.security import app as security_app
from src.commands.ci import app as ci_app
from src.commands.env import app as env_app
from src.commands.test_advanced import app as test_advanced_app

console = Console()

# Main app
app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

# Initialize license gate on startup
_license_gate = get_license_gate()


def _register_legacy_commands() -> None:
    """Register legacy command modules."""
    app.add_typer(binh_phap_app, name="binh-phap", help="Binh Pháp Strategy")
    app.add_typer(agi_app, name="agi", help="Tom Hum AGI daemon")
    app.add_typer(status_app, name="status", help="System health")
    app.add_typer(config_app, name="config", help="Environment config")
    app.add_typer(doctor_app, name="doctor", help="Diagnostics")
    app.add_typer(clean_app, name="clean", help="Clean artifacts")
    app.add_typer(test_app, name="test", help="Run tests")
    app.add_typer(build_app, name="build", help="Build project")
    app.add_typer(deploy_app, name="deploy", help="Deploy")
    app.add_typer(lint_app, name="lint", help="Linting")
    app.add_typer(docs_app, name="docs", help="Documentation")
    app.add_typer(monitor_app, name="monitor", help="Monitoring")
    app.add_typer(security_app, name="security", help="Security")
    app.add_typer(ci_app, name="ci", help="CI/CD")
    app.add_typer(env_app, name="env", help="Environment")
    app.add_typer(test_advanced_app, name="test-advanced", help="Advanced testing")
    app.add_typer(license_app, name="license", help="License management")


# Register all commands
register_all_commands(app)
_register_legacy_commands()


# ============= Core Commands =============

@app.command()
def init() -> None:
    """🌱 Initialize Mekong CLI configuration."""
    from src.core.config import ConfigManager

    config = ConfigManager()
    config.initialize()
    console.print("[green]✓ Mekong CLI initialized![/green]")
    console.print("[dim]Config: ~/.mekong/config.ini[/dim]")


@app.command()
def version() -> None:
    """Show version information."""
    from importlib.metadata import version, PackageNotFoundError
    try:
        ver = version("mekong-cli")
    except PackageNotFoundError:
        ver = "0.2.0-dev"

    console.print(f"[bold cyan]Mekong CLI[/bold cyan] v{ver}")
    console.print("[dim]RaaS Agency Operating System[/dim]")


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version_flag: bool = typer.Option(False, "--version", "-v", help="Show version"),
) -> None:
    """Mekong CLI - Autonomous AI Agent Framework"""
    if version_flag:
        version()
    elif ctx.invoked_subcommand is None:
        console.print("""
[bold cyan]🐉 Mekong CLI[/bold cyan] - RaaS Agency Operating System

[dim]Quick Start:[/dim]
  [bold]mekong cook[/bold] "[your goal]"    Plan → Execute → Verify
  [bold]mekong plan[/bold] "[your goal]"    Plan only (dry run)
  [bold]mekong dash[/bold]                  Interactive dashboard

[dim]Help:[/dim]
  [bold]mekong --help[/bold]                Show all commands
  [bold]mekong <command> --help[/bold]      Show command help
        """)


# ============= Legacy Entry Points =============
# For backwards compatibility - will be removed in v1.0

def run_cli() -> None:
    """Entry point for CLI execution."""
    app()


if __name__ == "__main__":
    run_cli()
