"""
ROI Billing Subcommand — Billing status & webhook verification

Part of mekong roi unified command (Phase 6).
Re-exports from billing_commands.py for unified CLI.
"""

import typer
import asyncio
from rich.console import Console
from rich.table import Table
from typing import Optional
from datetime import datetime

console = Console()
app = typer.Typer(name="billing", help="💰 Billing status & operations")


@app.command("status")
def billing_status(
    license_key: str = typer.Option(..., "--key", "-k", help="License key"),
) -> None:
    """
    📊 Get billing status for a license.

    Examples:
        mekong roi billing status -k lk_abc123
    """
    console.print("[bold cyan]📊 Billing Status[/bold cyan]\n")
    console.print(f"License: [cyan]{license_key[:12] if len(license_key) > 12 else license_key}...[/cyan]\n")

    try:
        from src.db.repository import get_repository
        from src.billing.engine import get_engine

        repo = get_repository()
        license_info = asyncio.run(repo.get_license_by_key(license_key))

        if not license_info:
            console.print("[red]Error:[/red] License not found\n")
            raise typer.Exit(1)

        # Get current period usage
        engine = get_engine()
        result = asyncio.run(engine.calculate_period_charges(
            license_key=license_key,
            period_start=datetime.now().replace(day=1),
            period_end=datetime.now(),
        ))

        table = Table(show_header=True, header_style="bold green")
        table.add_column("Metric", style="dim")
        table.add_column("Value", justify="right")

        table.add_row("Tier", str(license_info.get("tier", "unknown")))
        table.add_row("Status", str(license_info.get("status", "unknown")))
        table.add_row("Period Start", result.period_start.date().isoformat())
        table.add_row("Current Charge", f"${result.total:.2f}")
        table.add_row("Line Items", str(len(result.line_items)))

        console.print(table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("reconcile")
def trigger_reconciliation(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="Specific license to reconcile"),
    audit_date: Optional[str] = typer.Option(None, "--date", "-d", help="Audit date (YYYY-MM-DD)"),
    all_licenses: bool = typer.Option(False, "--all", help="Reconcile all licenses"),
) -> None:
    """
    🔍 Trigger reconciliation audit for variance detection.

    Examples:
        mekong roi billing reconcile --all
        mekong roi billing reconcile -k lk_abc123 --date 2026-03-06
    """
    from src.billing.reconciliation import get_reconciliation_service
    from datetime import date, timedelta

    console.print("[bold cyan]🔍 Running Reconciliation Audit[/bold cyan]\n")

    # Parse date
    if audit_date:
        try:
            audit_dt = date.fromisoformat(audit_date)
        except ValueError:
            console.print("[red]Error:[/red] Invalid date format. Use YYYY-MM-DD")
            raise typer.Exit(1)
    else:
        audit_dt = date.today() - timedelta(days=1)

    console.print(f"Audit Date: [cyan]{audit_dt}[/cyan]")
    console.print(f"License: [cyan]{license_key or 'all'}[/cyan]\n")

    try:
        service = get_reconciliation_service()
        results = asyncio.run(service.run_daily_reconciliation(audit_date=audit_dt))

        # Print results
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("License Key", style="dim")
        table.add_column("Status", justify="center")
        table.add_column("Expected", justify="right")
        table.add_column("Actual", justify="right")
        table.add_column("Variance", justify="right")
        table.add_column("Variance %", justify="right")

        matched = variance = investigating = 0

        for result in results:
            if license_key and result.license_key != license_key:
                continue

            if result.status == "matched":
                matched += 1
                status_style = "green"
            elif result.status == "variance":
                variance += 1
                status_style = "yellow"
            else:
                investigating += 1
                status_style = "red"

            table.add_row(
                result.license_key[:12] + "..." if len(result.license_key) > 12 else result.license_key,
                f"[{status_style}]{result.status}[/{status_style}]",
                f"${result.expected_amount:.2f}",
                f"${result.actual_amount:.2f}",
                f"${result.variance:.2f}",
                f"{result.variance_percent:.2f}%",
            )

        console.print(table)

        # Summary
        console.print("\n[bold]Summary:[/bold]")
        console.print(f"  Matched: [green]{matched}[/green]")
        console.print(f"  Variance: [yellow]{variance}[/yellow]")
        console.print(f"  Investigating: [red]{investigating}[/red]")

        if variance > 0 or investigating > 0:
            console.print("\n[yellow]⚠ Variances detected — review reconciliation_audits table[/yellow]")

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("webhook")
def verify_webhook(
    event_id: Optional[str] = typer.Argument(None, help="Webhook event ID to verify"),
) -> None:
    """
    🪝 Verify webhook state from Polar.sh.

    Examples:
        mekong roi billing webhook
        mekong roi billing webhook evt_abc123
    """
    console.print("[bold cyan]🪝 Webhook Verification[/bold cyan]\n")

    if event_id:
        console.print(f"Event ID: [cyan]{event_id}[/cyan]\n")
        # In production, would fetch and verify specific event
        console.print("[yellow]Note:[/yellow] Webhook verification requires API server.\n")
    else:
        console.print("Recent webhook events:\n")
        # Show last 10 webhook events from DB
        try:
            from src.db.repository import get_repository
            repo = get_repository()
            events = asyncio.run(repo.get_recent_webhook_events(limit=10))

            if not events:
                console.print("[yellow]No recent webhook events found.[/yellow]\n")
                return

            table = Table(show_header=True, header_style="bold cyan")
            table.add_column("Event ID", style="dim")
            table.add_column("Type", justify="center")
            table.add_column("Status", justify="center")
            table.add_column("Timestamp")

            for event in events:
                table.add_row(
                    event.get('id', 'unknown')[:12] + "...",
                    event.get('event_type', 'unknown'),
                    "✅" if event.get('status') == 'success' else "⚠️",
                    event.get('created_at', 'unknown'),
                )

            console.print(table)

        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")
            raise typer.Exit(1)


@app.command("events")
def list_events(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="Filter by license"),
    limit: int = typer.Option(20, "--limit", "-l", help="Number of events to show"),
) -> None:
    """
    📋 List recent billing events.

    Examples:
        mekong roi billing events
        mekong roi billing events -k lk_abc123 -l 50
    """
    console.print("[bold cyan]📋 Recent Billing Events[/bold cyan]\n")

    try:
        from src.db.repository import get_repository
        repo = get_repository()

        events = asyncio.run(repo.get_billing_events(
            license_key=license_key,
            limit=limit,
        ))

        if not events:
            console.print("[yellow]No billing events found.[/yellow]\n")
            return

        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Event Type", style="dim")
        table.add_column("License", justify="center")
        table.add_column("Amount", justify="right")
        table.add_column("Timestamp")

        for event in events:
            table.add_row(
                event.get('event_type', 'unknown'),
                (event.get('license_key', 'unknown')[:12] + "...") if event.get('license_key') else "N/A",
                f"${event.get('amount', 0):.2f}",
                event.get('created_at', 'unknown'),
            )

        console.print(table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)
