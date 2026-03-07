"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
Refactored: 2026-03-05 — Modular architecture
ROIaaS Phase 1: Startup License Validation (TypeScript source of truth)
ROIaaS Phase 2: Remote Validation, Usage Metering, Key Generation
"""

import typer
from rich.console import Console
import sys

# Core imports

# RaaS License Gate - Phase 1: Startup Validation (TypeScript source of truth)
# RaaS License Gate - Phase 2: Command-level validation

# ROIaaS Phase Completion & Graceful Shutdown
from src.raas.phase_completion_detector import get_detector
from src.core.graceful_shutdown import (
    get_shutdown_handler,
    register_shutdown_cleanup,
    shutdown_on_all_phases_operational,
)

# Command modules
from src.cli.binh_phap_commands import app as binh_phap_app
from src.cli.commands_registry import register_all_commands
from src.commands.license_commands import app as license_app
from src.commands.license_renewal import app as renewal_app
from src.commands.debug_rate_limits import app as debug_rate_limits_app
from src.commands.compliance import app as compliance_app
from src.cli.billing_commands import app as billing_app
from src.cli.roi_commands import app as roi_app
from src.commands.telemetry_commands import app as telemetry_app
from src.commands.dashboard_commands import app as dashboard_app

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
from src.commands.license_admin import app as license_admin_app
from src.commands.tier_admin import app as tier_admin_app

console = Console()

# Main app
app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

# Free commands that don't require license validation
FREE_COMMANDS = {
    "init", "version", "list", "search", "status", "config",
    "doctor", "help", "dash", "license", "clean", "test",
    "license-admin", "analytics", "tier-admin", "debug-rate-limits", "sync-raas",
    "compliance", "billing", "roi", "dashboard",
}


def _get_invoked_command(ctx: typer.Context) -> str:
    """Get the command being invoked."""
    if ctx.invoked_subcommand:
        return ctx.invoked_subcommand
    return ""


def _validate_startup_license(ctx: typer.Context) -> None:
    """
    Validate license at CLI startup.

    Free commands skip validation.
    Premium commands require valid license.
    """
    command = _get_invoked_command(ctx)

    # Free commands don't need validation
    if command in FREE_COMMANDS or ctx.invoked_subcommand is None:
        return

    # Check for --help flag
    if "--help" in sys.argv or "-h" in sys.argv:
        return

    # Validate license for premium commands
    from src.lib.raas_gate_validator import RaasGateValidator
    validator = RaasGateValidator()
    is_valid, error = validator.validate()

    if not is_valid:
        # Get actual command name for error message
        from src.lib.raas_gate_utils import get_upgrade_message
        error_message = get_upgrade_message(command)
        console.print(f"[bold red]License Error:[/bold red] {error_message}")
        console.print(
            "\n[yellow]Generate a license key:[/yellow]"
        )
        console.print("  [cyan]mekong license generate --tier pro[/cyan]")
        console.print(
            "\n[yellow]Or set environment variable:[/yellow]"
        )
        console.print("  [cyan]export RAAS_LICENSE_KEY=your_key[/cyan]\n")
        raise SystemExit(1)


def _check_telemetry_consent(ctx: typer.Context) -> None:
    """
    Check telemetry consent at CLI startup.

    Shows consent prompt on first run if not set.
    """
    # Skip for telemetry commands themselves
    command = _get_invoked_command(ctx)
    if command == "telemetry":
        return

    from src.core.telemetry_consent import ConsentManager
    manager = ConsentManager()

    # Check if consent is set
    if not manager.load_consent():
        # Show prompt on first run (non-premium commands only)
        if command in FREE_COMMANDS or ctx.invoked_subcommand is None:
            manager.prompt_consent()


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
    app.add_typer(license_admin_app, name="license-admin", help="License Admin Dashboard")
    app.add_typer(tier_admin_app, name="tier-admin", help="Tier rate limit configuration")
    app.add_typer(debug_rate_limits_app, name="debug-rate-limits", help="Debug rate limit issues")
    app.add_typer(renewal_app, name="renewal", help="License renewal flow")
    app.add_typer(compliance_app, name="compliance", help="Compliance reporting & audit export")
    app.add_typer(billing_app, name="billing", help="💰 Billing operations: usage, reconciliation, events")
    app.add_typer(roi_app, name="roi", help="🎯 ROI Unified Command - auth, usage, billing, dashboard")
    app.add_typer(telemetry_app, name="telemetry", help="📊 Telemetry consent management")
    app.add_typer(dashboard_app, name="dashboard", help="📊 Analytics Dashboard")


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
def health(
    port: int = typer.Option(9192, "--port", "-p", help="Health endpoint port"),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host to bind"),
    no_browser: bool = typer.Option(False, "--no-browser", "-n", help="Don't open browser"),
) -> None:
    """🏥 Start health endpoint server (manual mode)."""
    import time
    from src.core.health_endpoint import (
        get_health_url,
        start_health_server,
        register_component_check,
    )
    from src.core.crash_detector import get_crash_detector

    # Register default component checks
    def check_license() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            from src.lib.raas_gate_validator import RaasGateValidator
            validator = RaasGateValidator()
            is_valid, _ = validator.validate()
            return ComponentStatus(
                status="healthy" if is_valid else "degraded",
                message="License valid" if is_valid else "License invalid/expired",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_usage() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            # Check if usage tracking is available
            return ComponentStatus(status="healthy", message="Usage tracking ready")
        except Exception as e:
            return ComponentStatus(status="degraded", message=str(e))

    def check_crash_detector() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            detector = get_crash_detector()
            freq = detector.get_frequency()
            if freq.crashes_per_hour > 10:
                return ComponentStatus(
                    status="degraded",
                    message=f"High crash rate: {freq.crashes_per_hour:.1f}/hour",
                )
            return ComponentStatus(
                status="healthy",
                message=f"{freq.crashes_last_hour} crashes in last hour",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_telegram() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            # Check Telegram bot config
            import os
            if os.getenv("TELEGRAM_BOT_TOKEN"):
                return ComponentStatus(status="healthy", message="Telegram configured")
            return ComponentStatus(status="degraded", message="Telegram not configured")
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    def check_proxy() -> dict:
        from src.core.health_endpoint import ComponentStatus
        try:
            import os
            proxy_url = os.getenv("ANTHROPIC_BASE_URL", "http://localhost:9191")
            return ComponentStatus(
                status="healthy",
                message=f"Proxy at {proxy_url}",
            )
        except Exception as e:
            return ComponentStatus(status="unhealthy", message=str(e))

    register_component_check("license", check_license)
    register_component_check("usage", check_usage)
    register_component_check("crash_detector", check_crash_detector)
    register_component_check("telegram", check_telegram)
    register_component_check("proxy", check_proxy)

    console.print(f"[bold cyan]🏥 Health Endpoint[/bold cyan]")
    console.print(f"[dim]Starting server at {get_health_url(host, port)}[/dim]")
    console.print(f"[dim]Dashboard: {get_health_url(host, port).replace('/health', '/docs')}[/dim]")
    console.print()
    console.print("[dim]Press Ctrl+C to stop[/dim]\n")

    server = start_health_server(host=host, port=port)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        from src.core.health_endpoint import stop_health_server
        stop_health_server()
        console.print("\n[yellow]Health endpoint stopped[/yellow]")


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


@app.command()
async def check_phases() -> None:
    """🔍 Check ROIaaS phase completion status."""
    detector = get_detector()

    console.print("[bold cyan]🔍 Checking ROIaaS Phase Completion...[/bold cyan]\n")

    all_operational = await detector.check_all_phases()

    if all_operational:
        console.print("\n[bold green]✓ All phases operational![/bold green]")
        console.print("[dim]Triggering graceful shutdown sequence...[/dim]\n")

        handler = get_shutdown_handler()
        await handler.initiate_shutdown(
            reason="all_phases_operational",
            details={
                "phases_status": {
                    phase_id: info.status.value
                    for phase_id, info in detector.get_all_phases_status().items()
                },
            },
        )
        sys.exit(0)
    else:
        console.print("\n[yellow]⚠ Some phases are not yet operational[/yellow]")
        console.print("[dim]Continue development to complete all phases[/dim]\n")


@app.command()
def analytics(
    port: int = typer.Option(8080, "--port", "-p", help="Server port"),
    no_browser: bool = typer.Option(False, "--no-browser", "-n", help="Don't open browser"),
) -> None:
    """📊 Launch analytics dashboard (RaaS usage tracking)."""
    from src.api.dashboard.app import run_dashboard

    console.print(f"[bold cyan]🐉 Mekong Analytics Dashboard[/bold cyan]")
    console.print(f"[dim]Starting server at http://localhost:{port}[/dim]")
    console.print(f"[dim]API docs: http://localhost:{port}/api/docs[/dim]")
    console.print()

    run_dashboard(port=port, open_browser=not no_browser)


@app.callback(invoke_without_command=True)
def main(
    ctx: typer.Context,
    version_flag: bool = typer.Option(False, "--version", "-v", help="Show version"),
) -> None:
    """Mekong CLI - Autonomous AI Agent Framework"""
    # Validate license at startup
    _validate_startup_license(ctx)

    if version_flag:
        version()
    elif ctx.invoked_subcommand is None:
        console.print("""
[bold cyan]🐉 Mekong CLI[/bold cyan] - RaaS Agency Operating System

[dim]Quick Start:[/dim]
  [bold]mekong cook[/bold] "[your goal]"    Plan → Execute → Verify
  [bold]mekong plan[/bold] "[your goal]"    Plan only (dry run)
  [bold]mekong analytics[/bold]             Analytics dashboard
  [bold]mekong dash[/bold]                  Action menu (Washing Machine)

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
