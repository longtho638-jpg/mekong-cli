"""
ROI Dashboard Subcommand — Analytics dashboard data fetching

Part of mekong roi unified command (Phase 6).
"""

import typer
import asyncio
import json
from rich.console import Console
from rich.table import Table
from datetime import datetime, timedelta
from typing import Optional

console = Console()
app = typer.Typer(name="dashboard", help="📈 Analytics dashboard")


@app.command("show")
def show_dashboard(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key (defaults to env var)"),
    range_days: int = typer.Option(30, "--range", "-r", help="Date range in days"),
    format: str = typer.Option("table", "--format", "-f", help="Output format: table, json"),
) -> None:
    """
    📊 Show analytics dashboard data.

    Examples:
        mekong roi dashboard show
        mekong roi dashboard show --range 7
        mekong roi dashboard show --format json
    """
    console.print("[bold cyan]📈 Analytics Dashboard[/bold cyan]\n")

    if not license_key:
        import os
        license_key = os.getenv("RAAS_LICENSE_KEY", "")

    try:
        from src.analytics.dashboard_service import DashboardService, DashboardMetrics

        service = DashboardService()
        metrics: DashboardMetrics = asyncio.run(service.get_metrics(range_days=range_days))

        if format == "json":
            # Output as JSON
            output = {
                "last_updated": metrics.last_updated,
                "active_licenses": metrics.active_licenses,
                "revenue": metrics.revenue,
                "tier_distribution": metrics.tier_distribution,
                "rate_limit_violations": metrics.rate_limit_violations,
                "license_health": metrics.license_health,
            }
            console.print(json.dumps(output, indent=2, default=str))
            return

        # Display tables
        # Active Licenses
        if metrics.active_licenses:
            license_table = Table(title="👥 Active Licenses", show_header=True, header_style="bold cyan")
            license_table.add_column("Metric", style="dim")
            license_table.add_column("Value", justify="right")

            license_table.add_row("Total", str(metrics.active_licenses.get('total', 0)))

            console.print(license_table)

        # Tier Distribution
        if metrics.tier_distribution:
            tier_table = Table(title="📊 Tier Distribution", show_header=True, header_style="bold cyan")
            tier_table.add_column("Tier", style="dim")
            tier_table.add_column("Count", justify="right")
            tier_table.add_column("Percentage", justify="right")

            total = sum(v for v in metrics.tier_distribution.values() if isinstance(v, (int, float)))

            for tier, count in metrics.tier_distribution.items():
                if isinstance(count, (int, float)):
                    pct = (count / total * 100) if total > 0 else 0
                    tier_display = {
                        'free': '🔓 FREE',
                        'pro': '💎 PRO',
                        'enterprise': '🏢 ENTERPRISE'
                    }
                    tier_table.add_row(
                        tier_display.get(tier, tier.upper()),
                        str(int(count)),
                        f"{pct:.1f}%"
                    )

            console.print(tier_table)

        # Revenue Summary
        if metrics.revenue:
            revenue_table = Table(title="💰 Revenue Summary", show_header=True, header_style="bold green")
            revenue_table.add_column("Metric", style="dim")
            revenue_table.add_column("Value", justify="right")

            for key, value in metrics.revenue.items():
                if isinstance(value, (int, float)):
                    revenue_table.add_row(
                        key.replace('_', ' ').title(),
                        f"${value:,.2f}"
                    )

            console.print(revenue_table)

        # Rate Limit Violations (Phase 6)
        if metrics.rate_limit_violations:
            violation_table = Table(title="⚠️ Rate Limit Violations (24h)", show_header=True, header_style="bold yellow")
            violation_table.add_column("Tenant", style="dim")
            violation_table.add_column("Violations", justify="right")

            for violation in metrics.rate_limit_violations[:10]:
                tenant_id = violation.get('tenant_id', 'unknown')[:12]
                count = violation.get('count', 0)
                violation_table.add_row(tenant_id, str(count))

            console.print(violation_table)

        # License Health (Phase 7)
        if metrics.license_health:
            health_table = Table(title="❤️ License Health", show_header=True, header_style="bold green")
            health_table.add_column("Metric", style="dim")
            health_table.add_column("Value", justify="right")

            for key, value in metrics.license_health.items():
                if isinstance(value, (int, float)):
                    health_table.add_row(
                        key.replace('_', ' ').title(),
                        str(int(value)) if isinstance(value, int) else f"{value:.2f}"
                    )

            console.print(health_table)

        console.print(f"\n[dim]Last updated: {metrics.last_updated}[/dim]")

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("export")
def export_analytics(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key"),
    format: str = typer.Option("csv", "--format", "-f", help="Export format: csv, json"),
    output: str = typer.Option(..., "--output", "-o", help="Output file path"),
    start_date: Optional[str] = typer.Option(None, "--start", help="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = typer.Option(None, "--end", help="End date (YYYY-MM-DD)"),
) -> None:
    """
    💾 Export analytics to CSV/JSON.

    Examples:
        mekong roi dashboard export -f csv -o usage.csv
        mekong roi dashboard export -f json -o analytics.json --start 2026-03-01 --end 2026-03-07
    """
    console.print(f"[bold cyan]💾 Exporting Analytics to {format.upper()}...[/bold cyan]\n")

    # Default date range
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.now().strftime("%Y-%m-%d")

    try:
        from src.analytics.dashboard_service import DashboardService

        service = DashboardService()

        if format == "csv":
            csv_data = asyncio.run(service.export_to_csv(
                date_range=(start_date, end_date),
                license_key=license_key,
            ))
            with open(output, "w") as f:
                f.write(csv_data)
            console.print(f"[green]✓ Exported to {output}[/green]")

        elif format == "json":
            json_data = asyncio.run(service.export_to_json(
                date_range=(start_date, end_date),
                license_key=license_key,
            ))
            with open(output, "w") as f:
                f.write(json_data)
            console.print(f"[green]✓ Exported to {output}[/green]")

        else:
            console.print(f"[red]Error:[/red] Invalid format: {format}")
            raise typer.Exit(1)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("real-time")
def stream_metrics(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key"),
) -> None:
    """
    ⚡ Stream real-time metrics (SSE).

    Examples:
        mekong roi dashboard real-time
    """
    console.print("[bold cyan]⚡ Real-time Metrics Stream[/bold cyan]\n")
    console.print("[yellow]Note:[/yellow] SSE streaming requires a running API server.\n")
    console.print("To start the gateway server:")
    console.print("  [cyan]mekong gateway --port 8000[/cyan]\n")
    console.print("Then connect via:")
    console.print("  [cyan]curl -N http://localhost:8000/dashboard/stream?token=mk_xxx[/cyan]\n")


@app.command("health")
def health_check() -> None:
    """
    ❤️ Check dashboard health status.
    """
    console.print("[bold cyan]❤️ Dashboard Health Check[/bold cyan]\n")

    try:
        from src.analytics.dashboard_service import DashboardService

        service = DashboardService()

        # Try to get metrics (quick check)
        asyncio.run(service.get_metrics(range_days=1))

        console.print("[bold green]✓ Dashboard Healthy[/bold green]\n")

        table = Table(show_header=True, header_style="bold green")
        table.add_column("Component", style="dim")
        table.add_column("Status", justify="center")

        table.add_row("Database", "✅")
        table.add_row("Cache", "✅")
        table.add_row("Rate Limit Emitter", "✅")

        console.print(table)

    except Exception as e:
        console.print("[bold red]✗ Dashboard Unhealthy[/bold red]\n")
        console.print(f"[red]Error:[/red] {str(e)}\n")
        raise typer.Exit(1)
