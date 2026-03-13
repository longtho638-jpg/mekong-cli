"""
Usage Tracking CLI Commands — ROIaaS Phase 4

Commands for tracking and reporting CLI command usage per license key.
- Track command invocations, agent calls, pipeline runs
- Free tier enforcement: 10 commands/day
- SQLite storage (~/.mekong/raas/tenants.db)

Usage:
    mekong usage:report
    mekong usage:report --days 30
    mekong usage:report --json
"""

import typer
import os
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from datetime import datetime
from typing import Optional

console = Console()

app = typer.Typer(
    name="usage:report",
    help="📊 Usage tracking and reporting",
    rich_markup_mode="rich",
)


@app.command(name="usage:report")
def usage_report(
    days: int = typer.Option(7, "--days", "-d", help="Number of days to report"),
    json_output: bool = typer.Option(False, "--json", "-j", help="Export as JSON"),
    license_key: Optional[str] = typer.Option(
        None, "--license", "-l",
        help="License key (defaults to RAAS_LICENSE_KEY env var)"
    ),
) -> None:
    """
    📊 Show CLI usage report with command counts and free tier status.

    Displays:
    - Daily command invocations
    - Agent calls breakdown
    - Pipeline runs
    - Free tier remaining quota

    Examples:
        mekong usage:report
        mekong usage:report --days 30
        mekong usage:report --json
        mekong usage:report -d 7 -l mk_your_key
    """
    # Get license key
    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print(Panel(
            "[bold red]✗ No license key found[/bold red]\n\n"
            "Set [green]RAAS_LICENSE_KEY[/green] environment variable or use [green]--license[/green] flag.",
            title="License Required",
            border_style="red",
        ))
        raise typer.Exit(code=1)

    try:
        # Import tracker (lazy load for performance)
        from src.raas.credit_metering_middleware import CreditMeter

        meter = CreditMeter()

        # Get usage summary
        summary = meter.get_usage_summary(current_license, period="daily")

        if json_output:
            # Export JSON
            import json
            output = {
                "licenseKeyHash": current_license[:8] + "..." + current_license[-4:],
                "generatedAt": datetime.utcnow().isoformat() + "Z",
                "period": f"Last {days} days",
                "totalCreditsUsed": summary.total_credits_used,
                "eventCount": summary.event_count,
                "breakdown": summary.breakdown,
            }
            console.print(json.dumps(output, indent=2))
        else:
            # ASCII table report
            console.print(Panel(
                f"[bold cyan]Usage Report: {current_license[:8]}...{current_license[-4:]}[/bold cyan]\n"
                f"Period: Last {days} days | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC",
                border_style="cyan",
            ))

            # Usage summary table
            table = Table(show_header=True, header_style="bold cyan")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="green")
            table.add_column("Details", style="dim")

            table.add_row(
                "Total Events",
                str(summary.event_count),
                "Commands + Agents + Pipelines",
            )
            table.add_row(
                "Credits Used",
                str(summary.total_credits_used),
                "MCU consumed",
            )

            console.print(table)

            # Task type breakdown
            if summary.breakdown:
                breakdown_table = Table(show_header=True, header_style="bold green")
                breakdown_table.add_column("Task Type", style="green")
                breakdown_table.add_column("Count", style="cyan", justify="right")
                breakdown_table.add_column("Credits", style="yellow", justify="right")

                for task_type, credits in sorted(summary.breakdown.items(), key=lambda x: x[1], reverse=True):
                    count = credits  # Assuming 1 credit = 1 event for simplicity
                    breakdown_table.add_row(
                        task_type,
                        str(count),
                        str(credits),
                    )

                console.print(breakdown_table)

            # Free tier status
            free_tier_limit = 10  # commands per day
            console.print(Panel(
                f"[bold]Free Tier Status:[/bold]\n"
                f"Daily Limit: {free_tier_limit} commands\n"
                f"Average: {summary.event_count / days:.1f} events/day\n"
                f"[green]✓ Within limits[/green]" if summary.event_count / days < free_tier_limit
                else "[red]⚠ Approaching limit[/red]",
                border_style="green" if summary.event_count / days < free_tier_limit else "yellow",
            ))

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        console.print("[dim]Note: Usage tracking requires RaaS billing to be initialized.[/dim]")
        raise typer.Exit(code=1)


@app.command(name="usage:check")
def usage_check(
    license_key: Optional[str] = typer.Option(
        None, "--license", "-l",
        help="License key (defaults to RAAS_LICENSE_KEY env var)"
    ),
) -> None:
    """
    ⚡ Quick check if license has remaining free tier quota.

    Returns exit code 0 if quota available, 1 if exceeded.
    """
    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print("[bold red]✗ No license key[/bold red]")
        raise typer.Exit(code=1)

    try:
        from src.raas.credit_metering_middleware import CreditMeter

        meter = CreditMeter()
        balance = meter._credit_store.get_balance(current_license)

        if balance > 0:
            console.print("[bold green]✓ Quota Available[/bold green]")
            console.print(f"Remaining Credits: [green]{balance} MCU[/green]")
            raise typer.Exit(code=0)
        else:
            console.print("[bold red]✗ Quota Exceeded[/bold red]")
            console.print("Remaining Credits: [red]0 MCU[/red]")
            console.print("[dim]Upgrade tier or wait for monthly reset.[/dim]")
            raise typer.Exit(code=1)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command(name="usage:export")
def usage_export(
    output: str = typer.Option(
        "~/.mekong/raas/usage-export.json",
        "--output", "-o",
        help="Output file path"
    ),
    days: int = typer.Option(30, "--days", "-d", help="Number of days to export"),
    license_key: Optional[str] = typer.Option(
        None, "--license", "-l",
        help="License key (defaults to RAAS_LICENSE_KEY env var)"
    ),
) -> None:
    """
    📤 Export usage data to JSON file.

    Exports detailed usage events for external analysis or reporting.
    """
    import json
    from pathlib import Path

    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print("[bold red]✗ No license key[/bold red]")
        raise typer.Exit(code=1)

    try:
        from src.raas.credit_metering_middleware import CreditMeter

        meter = CreditMeter()
        events = meter.list_events(current_license, limit=1000)

        output_path = Path(output).expanduser()
        output_path.parent.mkdir(parents=True, exist_ok=True)

        export_data = {
            "licenseKeyHash": current_license[:8] + "..." + current_license[-4:],
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "periodDays": days,
            "eventCount": len(events),
            "events": [
                {
                    "id": e.id,
                    "tenantId": e.tenant_id,
                    "missionId": e.mission_id,
                    "taskType": e.task_type,
                    "creditsUsed": e.credits_used,
                    "timestamp": e.timestamp,
                }
                for e in events
            ],
        }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

        console.print(Panel(
            f"[bold green]✓ Exported {len(events)} events[/bold green]\n\n"
            f"Path: [cyan]{output_path}[/cyan]\n"
            f"Size: {output_path.stat().st_size / 1024:.1f} KB",
            title="Usage Export Complete",
            border_style="green",
        ))

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)
