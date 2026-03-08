"""
Telemetry CLI Commands

Commands:
- mekong telemetry status
- mekong telemetry enable
- mekong telemetry disable

Reference: plans/260307-1602-telemetry-consent-opt-in/plan.md
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.core.telemetry_consent import get_consent_manager
from src.core.health_reporter import get_health_reporter, report_health

console = Console()
app = typer.Typer(name="telemetry", help="📊 Telemetry consent management")


@app.command("health")
def health_report():
    """📈 Show health metrics and report to gateway."""
    reporter = get_health_reporter()
    status = reporter.get_status()

    table = Table(title="📈 Health Metrics")
    table.add_column("Metric", style="dim")
    table.add_column("Value")

    status_icon = "✅" if status["status"] == "active" else "❌"
    table.add_row("Status", f"{status_icon} {status['status'].title()}")
    table.add_row("CLI Version", status.get("cli_version", "unknown"))
    table.add_row("OS", status.get("os", "unknown"))
    table.add_row("Python", status.get("python_version", "unknown"))
    table.add_row("Session ID", status.get("session_id", "N/A"))
    table.add_row("Commands Executed", str(status.get("commands_executed", 0)))
    table.add_row("Commands Succeeded", str(status.get("commands_succeeded", 0)))
    table.add_row("Commands Failed", str(status.get("commands_failed", 0)))

    success_rate = status.get("success_rate", 0) * 100
    table.add_row("Success Rate", f"{success_rate:.1f}%")
    table.add_row("Rate Limit Hits", str(status.get("rate_limit_hits", 0)))
    table.add_row("Last Report", status.get("last_report", "never"))

    console.print(table)

    # Try to report to gateway
    if status["status"] == "active":
        console.print("\n[dim]Reporting to gateway...[/dim]")
        if report_health():
            console.print("[green]✓ Health metrics reported successfully[/green]")
        else:
            console.print("[yellow]⚠ Could not reach gateway (metrics saved locally)[/yellow]")


@app.command("status")
def telemetry_status():
    """Show telemetry consent status."""
    manager = get_consent_manager()
    status = manager.get_status()

    if status["status"] == "not_set":
        console.print(Panel(
            "[yellow]📊 Telemetry consent not set[/yellow]\n\n"
            "Run [bold]mekong telemetry enable[/bold] to opt-in\n"
            "Run [bold]mekong telemetry disable[/bold] to opt-out",
            title="Telemetry Status",
        ))
        return

    table = Table(title="📊 Telemetry Status")
    table.add_column("Property", style="dim")
    table.add_column("Value")

    status_icon = "✅" if status["status"] == "enabled" else "❌"
    table.add_row("Status", f"{status_icon} {status['status'].title()}")

    if status.get("anonymous_id"):
        table.add_row("Anonymous ID", f"{status['anonymous_id'][:8]}...")

    if status.get("consent_timestamp"):
        table.add_row("Consent Given", status["consent_timestamp"][:10])

    table.add_row("Schema Version", status.get("version", "1.0"))

    console.print(table)


@app.command("enable")
def telemetry_enable():
    """Enable telemetry."""
    manager = get_consent_manager()
    preferences = manager.enable()
    console.print("[green]✓ Telemetry enabled[/green]")
    console.print(f"Anonymous ID: {preferences.anonymous_id[:8]}...")
    console.print("\n[dim]Thank you for helping improve Mekong CLI![/dim]")


@app.command("disable")
def telemetry_disable():
    """Disable telemetry."""
    manager = get_consent_manager()
    manager.disable()
    console.print("[yellow]✓ Telemetry disabled[/yellow]")
    console.print("No data will be collected.")


@app.command("reset")
def telemetry_reset():
    """Reset telemetry consent (show prompt again)."""
    from pathlib import Path

    consent_file = Path.home() / ".mekong" / "telemetry-consent.json"
    if consent_file.exists():
        consent_file.unlink()
        console.print("[green]✓ Telemetry consent reset[/green]")
        console.print("Run any command to see the consent prompt again.")
    else:
        console.print("[yellow]No consent file found[/yellow]")
