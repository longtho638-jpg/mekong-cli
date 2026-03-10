"""
Mekong Dashboard CLI Commands

Analytics dashboard visualization and export.
"""

import typer
from typing import Optional
from rich.console import Console
from rich.table import Table
from datetime import datetime, timedelta

console = Console()

app = typer.Typer(
    name="dashboard",
    help="📊 Analytics Dashboard",
    rich_markup_mode="rich",
)


@app.command("launch")
def launch_dashboard(
    port: int = typer.Option(8080, "--port", "-p", help="Server port"),
    no_browser: bool = typer.Option(
        False, "--no-browser", "-n", help="Don't open browser automatically"
    ),
    host: str = typer.Option(
        "127.0.0.1", "--host", "-h", help="Bind host (default: 127.0.0.1)"
    ),
) -> None:
    """
    🚀 Launch analytics dashboard server.

    Opens a web dashboard at http://localhost:<port> with real-time
    analytics for API usage, license health, and revenue tracking.

    Examples:
        mekong dashboard launch
        mekong dashboard launch --port 9000
        mekong dashboard launch --no-browser
        mekong dashboard launch -p 8888 -h 0.0.0.0
    """
    console.print(f"""
[bold cyan]📊 Mekong Analytics Dashboard[/bold cyan]

Starting server on [green]http://{host}:{port}[/green]

[dim]• API docs: http://{host}:{port}/api/docs[/dim]
[dim]• Dashboard: http://{host}:{port}[/dim]
[dim]• Press Ctrl+C to stop the server[/dim]
""")

    try:
        from src.api.dashboard.app import run_dashboard

        run_dashboard(port=port, open_browser=not no_browser, host=host)
    except KeyboardInterrupt:
        console.print("\n[yellow]Server stopped[/yellow]")
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)


@app.command("status")
def dashboard_status() -> None:
    """
    ❤️ Check dashboard health and data availability.

    Verifies database connection, cache status, and data freshness.
    """
    console.print("[bold cyan]📊 Dashboard Status[/bold cyan]\n")

    try:
        from src.analytics.dashboard_service import DashboardService

        service = DashboardService()
        import asyncio

        metrics = asyncio.run(service.get_metrics(range_days=1))

        console.print("[green]✓ Dashboard Healthy[/green]\n")

        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Component")
        table.add_column("Status")
        table.add_column("Details")

        table.add_row(
            "Database", "✅", "Connected"
        )
        table.add_row(
            "Cache", "✅", f"{len(service._cache)} entries"
        )
        table.add_row(
            "API Usage Data", "✅",
            f"{len(metrics.api_calls)} data points"
        )
        table.add_row(
            "License Data", "✅",
            f"{metrics.active_licenses.get('total', 0)} active"
        )

        # Rate limit metrics (Phase 6)
        table.add_row(
            "Rate Limit Events", "✅",
            f"{len(metrics.rate_limit_events)} events"
        )

        # License health (Phase 7)
        health = metrics.license_health
        if health:
            table.add_row(
                "License Health", "✅",
                f"{health.get('active_count', 0)} active, "
                f"{health.get('expiring_soon_count', 0)} expiring"
            )

        console.print(table)

    except Exception as e:
        console.print("[bold red]✗ Dashboard Unhealthy[/bold red]")
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)


@app.command("export")
def export_dashboard_data(
    format: str = typer.Option(
        "csv", "--format", "-f",
        help="Export format: csv or json"
    ),
    output: str = typer.Option(
        ..., "--output", "-o",
        help="Output file path"
    ),
    start_date: Optional[str] = typer.Option(
        None, "--start", "-s",
        help="Start date (YYYY-MM-DD)"
    ),
    end_date: Optional[str] = typer.Option(
        None, "--end", "-e",
        help="End date (YYYY-MM-DD)"
    ),
    license_key: Optional[str] = typer.Option(
        None, "--key", "-k",
        help="Filter by license key"
    ),
    days: int = typer.Option(
        30, "--days", "-d",
        help="Number of days (if start/end not specified)"
    ),
) -> None:
    """
    💾 Export analytics data to CSV or JSON.

    Export API usage, license data, and revenue metrics.

    Examples:
        mekong dashboard export -f csv -o usage.csv
        mekong dashboard export -f json -o analytics.json
        mekong dashboard export -f csv -o march.csv --start 2026-03-01
        mekong dashboard export -f json -o pro-data.json --key sk-pro-xxx
    """
    import asyncio

    # Validate format
    if format.lower() not in ("csv", "json"):
        console.print("[red]Error:[/red] Format must be 'csv' or 'json'")
        raise typer.Exit(1)

    # Calculate date range
    if start_date and end_date:
        start, end = start_date, end_date
    else:
        end = datetime.now().strftime("%Y-%m-%d")
        start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    console.print(
        f"[dim]Exporting data from {start} to {end}...[/dim]"
    )

    try:
        from src.analytics.dashboard_service import DashboardService

        service = DashboardService()
        date_range = (start, end)

        if format == "csv":
            data = asyncio.run(
                service.export_to_csv(date_range, license_key)
            )
        else:
            data = asyncio.run(
                service.export_to_json(date_range, license_key)
            )

        # Write to file
        with open(output, "w") as f:
            f.write(data)

        console.print(
            f"[green]✓ Exported to {output}[/green]"
        )

        # Show file size
        import os
        file_size = os.path.getsize(output)
        console.print(
            f"[dim]File size: {file_size:,} bytes[/dim]"
        )

    except Exception as e:
        console.print(f"[red]Export failed:[/red] {e}")
        raise typer.Exit(1)


@app.command("summary")
def dashboard_summary() -> None:
    """
    📋 Show quick analytics summary in terminal.

    Display key metrics without launching the web dashboard.
    """
    import asyncio

    console.print("[bold cyan]📊 Analytics Summary[/bold cyan]\n")

    try:
        from src.analytics.dashboard_service import DashboardService

        service = DashboardService()
        metrics = asyncio.run(service.get_metrics(range_days=30))

        # Summary cards
        total_calls = sum(d.get("calls", 0) for d in metrics.api_calls)
        active_licenses = metrics.active_licenses.get("total", 0)
        revenue = metrics.revenue.get("total_mrr", 0)
        avg_daily = total_calls // 30 if total_calls else 0

        console.print("[bold]Key Metrics (Last 30 Days)[/bold]\n")

        table = Table(show_header=False, box=None)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="bold")

        table.add_row("Total API Calls", f"{total_calls:,}")
        table.add_row("Active Licenses", f"{active_licenses:,}")
        table.add_row("Est. Monthly Revenue", f"${revenue:,.2f}")
        table.add_row("Avg Calls/Day", f"{avg_daily:,}")

        console.print(table)

        # Tier distribution
        if metrics.tier_distribution.get("by_tier"):
            console.print("\n[bold]Tier Distribution[/bold]\n")

            tier_table = Table(show_header=True, header_style="bold")
            tier_table.add_column("Tier")
            tier_table.add_column("Count")
            tier_table.add_column("Active")

            for tier, data in metrics.tier_distribution["by_tier"].items():
                if isinstance(data, dict):
                    tier_table.add_row(
                        tier.upper(),
                        str(data.get("count", 0)),
                        str(data.get("active", 0))
                    )

            console.print(tier_table)

        # License health
        if metrics.license_health:
            console.print("\n[bold]License Health[/bold]\n")

            health = metrics.license_health
            health_table = Table(show_header=False, box=None)
            health_table.add_column("Status")
            health_table.add_column("Count")

            health_table.add_row(
                "Active", f"[green]{health.get('active_count', 0)}[/green]"
            )
            health_table.add_row(
                "Expiring Soon",
                f"[orange]{health.get('expiring_soon_count', 0)}[/orange]"
            )
            health_table.add_row(
                "Suspended",
                f"[yellow]{health.get('suspended_count', 0)}[/yellow]"
            )
            health_table.add_row(
                "Revoked",
                f"[red]{health.get('revoked_count', 0)}[/red]"
            )

            console.print(health_table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1)


def run_dashboard(
    port: int = 8080,
    no_browser: bool = False,
    host: str = "127.0.0.1",
) -> None:
    """Helper function to run dashboard (for backwards compatibility)."""
    launch_dashboard(port=port, no_browser=no_browser, host=host)
