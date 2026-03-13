"""
Core CLI Commands and Startup Hooks

Contains: init, version, main callback, and startup helpers.
Registered via register_core_commands(app).
"""

import typer
from rich.console import Console

from src.middleware.auth_middleware import get_middleware
from src.cli.update_checker import check_for_updates_async
from src.cli.usage_auto_instrument import emit_usage_event

console = Console()

FREE_COMMANDS: set = set()  # Phase 6: Delegated to CommandAuthorizer


def _get_invoked_command(ctx: typer.Context) -> str:
    """Get the command being invoked."""
    if ctx.invoked_subcommand:
        return ctx.invoked_subcommand
    return ""


def _validate_startup_license(ctx: typer.Context) -> None:
    """Phase 6: Validate license at CLI startup using Auth Middleware."""
    _get_invoked_command(ctx)
    middleware = get_middleware()
    middleware.pre_command_check(ctx)


def _check_telemetry_consent(ctx: typer.Context) -> None:
    """Check telemetry consent at CLI startup."""
    command = _get_invoked_command(ctx)
    if command == "telemetry":
        return

    from src.core.telemetry_consent import ConsentManager
    manager = ConsentManager()

    if not manager.load_consent():
        if command in FREE_COMMANDS or ctx.invoked_subcommand is None:
            manager.prompt_consent()


def register_core_commands(app: typer.Typer) -> None:
    """Register init, version, and main callback on the given app."""

    @app.command()
    def init() -> None:
        """Initialize Mekong CLI configuration."""
        from src.core.config import ConfigManager

        config = ConfigManager()
        config.initialize()
        console.print("[green]Mekong CLI initialized![/green]")
        console.print("[dim]Config: ~/.mekong/config.ini[/dim]")

    @app.command()
    def version() -> None:
        """Show version information."""
        from importlib.metadata import version as pkg_version, PackageNotFoundError
        try:
            ver = pkg_version("mekong-cli")
        except PackageNotFoundError:
            ver = "0.2.0-dev"

        console.print(f"[bold cyan]Mekong CLI[/bold cyan] v{ver}")
        console.print("[dim]RaaS Agency Operating System[/dim]")

    @app.callback(invoke_without_command=True)
    def main(
        ctx: typer.Context,
        version_flag: bool = typer.Option(False, "--version", "-v", help="Show version"),
        raas_debug: bool = typer.Option(
            False,
            "--raas-debug",
            help="Dump full RaaS interaction trace (headers, payload, status)",
        ),
    ) -> None:
        """Mekong CLI - Autonomous AI Agent Framework"""
        import os

        if raas_debug:
            os.environ["RAAS_DEBUG"] = "true"

        _validate_startup_license(ctx)

        if not os.getenv("MEKONG_NO_UPDATE_CHECK"):
            try:
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.create_task(check_for_updates_async())
            except Exception:
                pass  # Fail silently — update check is non-critical

        command = _get_invoked_command(ctx)
        if command and command not in ("version", "help"):
            try:
                emit_usage_event(command)
            except Exception:
                pass  # Fail silently — usage tracking is non-blocking

        if version_flag:
            version()
        elif ctx.invoked_subcommand is None:
            console.print("""
[bold cyan]Mekong CLI[/bold cyan] - RaaS Agency Operating System

[dim]Quick Start:[/dim]
  [bold]mekong cook[/bold] "[your goal]"    Plan -> Execute -> Verify
  [bold]mekong plan[/bold] "[your goal]"    Plan only (dry run)
  [bold]mekong analytics[/bold]             Analytics dashboard
  [bold]mekong dash[/bold]                  Action menu (Washing Machine)

[dim]Help:[/dim]
  [bold]mekong --help[/bold]                Show all commands
  [bold]mekong <command> --help[/bold]      Show command help
  [bold]mekong --raas-debug[/bold]          Dump RaaS interaction trace
            """)
