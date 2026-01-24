#!/usr/bin/env python3
"""
💰 CC Revenue CLI - Revenue Management Command Line Interface
=============================================================

CLI commands for revenue tracking, affiliate management, forecasting, and exports.

Commands:
1. cc revenue summary - Daily/weekly/monthly revenue
2. cc revenue affiliates - Affiliate commission report
3. cc revenue forecast - AI revenue prediction
4. cc revenue export - Export to CSV

Usage:
    python scripts/cc_revenue.py summary [--period daily|weekly|monthly]
    python scripts/cc_revenue.py affiliates [--status paid|pending|all]
    python scripts/cc_revenue.py forecast [--months 6]
    python scripts/cc_revenue.py export [--output revenue.csv] [--period monthly]
"""

import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import typer
from rich.console import Console
from rich.table import Table
from typing_extensions import Annotated

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.revenue.engine import RevenueEngine
from antigravity.core.revenue.forecasting import RevenueForecasting

app = typer.Typer(
    name="cc-revenue",
    help="💰 Revenue management CLI for financial tracking and forecasting",
    add_completion=False
)
console = Console()


@app.command()
def summary(
    period: Annotated[
        str,
        typer.Option(
            "--period", "-p",
            help="Time period for revenue summary"
        )
    ] = "monthly"
):
    """
    📊 Display revenue summary by time period.

    Shows revenue metrics aggregated by daily, weekly, or monthly periods.

    Example:
        cc revenue summary --period weekly
    """
    if period not in ["daily", "weekly", "monthly"]:
        console.print("[red]Error: Period must be daily, weekly, or monthly[/red]")
        raise typer.Exit(1)

    console.print(f"\n[bold cyan]💰 Revenue Summary ({period.title()})[/bold cyan]\n")

    # Fetch data from API endpoint
    try:
        import httpx
        response = httpx.get(f"http://localhost:8000/api/revenue/by-period?period={period}")

        if response.status_code != 200:
            console.print(f"[red]API Error: {response.status_code}[/red]")
            raise typer.Exit(1)

        data = response.json()

        # Create table
        table = Table(show_header=True, header_style="bold magenta")

        if period == "daily":
            table.add_column("Date", style="cyan")
            for item in data:
                table.add_row(
                    item["date"],
                    f"${item['revenue']:,.2f}"
                )
        elif period == "weekly":
            table.add_column("Week", style="cyan")
            for item in data:
                table.add_row(
                    item["week"],
                    f"${item['revenue']:,.2f}"
                )
        else:  # monthly
            table.add_column("Month", style="cyan")
            for item in data:
                table.add_row(
                    item["month"],
                    f"${item['revenue']:,.2f}"
                )

        table.add_column("Revenue", style="green", justify="right")

        # Display summary stats
        total = sum(item.get('revenue', 0) for item in data)
        avg = total / len(data) if data else 0

        console.print(table)
        console.print(f"\n[bold]Total:[/bold] ${total:,.2f}")
        console.print(f"[bold]Average:[/bold] ${avg:,.2f}\n")

    except ImportError:
        console.print("[yellow]Warning: httpx not installed, using mock data[/yellow]")
        _display_mock_summary(period)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        console.print("[yellow]Falling back to mock data[/yellow]")
        _display_mock_summary(period)


def _display_mock_summary(period: str):
    """Display mock revenue summary data."""
    table = Table(show_header=True, header_style="bold magenta")

    if period == "daily":
        table.add_column("Date", style="cyan")
        table.add_column("Revenue", style="green", justify="right")
        data = [
            ("2026-01-20", 1200.00),
            ("2026-01-21", 980.00),
            ("2026-01-22", 1500.00),
            ("2026-01-23", 1100.00),
            ("2026-01-24", 1350.00),
        ]
        for date, revenue in data:
            table.add_row(date, f"${revenue:,.2f}")
    elif period == "weekly":
        table.add_column("Week", style="cyan")
        table.add_column("Revenue", style="green", justify="right")
        data = [
            ("2026-W01", 7800.00),
            ("2026-W02", 8200.00),
            ("2026-W03", 7500.00),
            ("2026-W04", 9100.00),
        ]
        for week, revenue in data:
            table.add_row(week, f"${revenue:,.2f}")
    else:  # monthly
        table.add_column("Month", style="cyan")
        table.add_column("Revenue", style="green", justify="right")
        data = [
            ("2025-09", 28000.00),
            ("2025-10", 31500.00),
            ("2025-11", 29800.00),
            ("2025-12", 35700.00),
        ]
        for month, revenue in data:
            table.add_row(month, f"${revenue:,.2f}")

    total = sum(rev for _, rev in data)
    avg = total / len(data) if data else 0

    console.print(table)
    console.print(f"\n[bold]Total:[/bold] ${total:,.2f}")
    console.print(f"[bold]Average:[/bold] ${avg:,.2f}\n")


@app.command()
def affiliates(
    status: Annotated[
        str,
        typer.Option(
            "--status", "-s",
            help="Filter by payment status"
        )
    ] = "all"
):
    """
    🤝 Display affiliate commission report.

    Shows affiliate partners, their sales, commissions, and payment status.

    Example:
        cc revenue affiliates --status pending
    """
    if status not in ["paid", "pending", "all"]:
        console.print("[red]Error: Status must be paid, pending, or all[/red]")
        raise typer.Exit(1)

    console.print(f"\n[bold cyan]🤝 Affiliate Commission Report[/bold cyan]")
    if status != "all":
        console.print(f"[dim]Filtered by: {status.upper()}[/dim]\n")
    else:
        console.print()

    try:
        import httpx
        response = httpx.get("http://localhost:8000/api/revenue/affiliates")

        if response.status_code != 200:
            console.print(f"[red]API Error: {response.status_code}[/red]")
            raise typer.Exit(1)

        data = response.json()

        # Filter by status
        if status != "all":
            data = [item for item in data if item["status"] == status]

        _display_affiliate_table(data)

    except ImportError:
        console.print("[yellow]Warning: httpx not installed, using mock data[/yellow]")
        _display_mock_affiliates(status)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        console.print("[yellow]Falling back to mock data[/yellow]")
        _display_mock_affiliates(status)


def _display_affiliate_table(data: List[dict]):
    """Display affiliate data in a table."""
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Affiliate", style="cyan")
    table.add_column("Total Sales", style="green", justify="right")
    table.add_column("Commission", style="yellow", justify="right")
    table.add_column("Status", style="white")

    total_sales = 0
    total_commission = 0

    for item in data:
        status_color = "green" if item["status"] == "paid" else "yellow"
        table.add_row(
            item["affiliate_name"],
            f"${item['total_sales']:,.2f}",
            f"${item['commission']:,.2f}",
            f"[{status_color}]{item['status'].upper()}[/{status_color}]"
        )
        total_sales += item["total_sales"]
        total_commission += item["commission"]

    console.print(table)
    console.print(f"\n[bold]Total Sales:[/bold] ${total_sales:,.2f}")
    console.print(f"[bold]Total Commission:[/bold] ${total_commission:,.2f}\n")


def _display_mock_affiliates(status: str):
    """Display mock affiliate data."""
    data = [
        {
            "affiliate_name": "TechPartner A",
            "total_sales": 12000.00,
            "commission": 1800.00,
            "status": "paid"
        },
        {
            "affiliate_name": "MarketingPro B",
            "total_sales": 8500.00,
            "commission": 1275.00,
            "status": "pending"
        },
        {
            "affiliate_name": "SalesExpert C",
            "total_sales": 15200.00,
            "commission": 2280.00,
            "status": "paid"
        }
    ]

    # Filter by status
    if status != "all":
        data = [item for item in data if item["status"] == status]

    _display_affiliate_table(data)


@app.command()
def forecast(
    months: Annotated[
        int,
        typer.Option(
            "--months", "-m",
            help="Number of months to forecast"
        )
    ] = 6
):
    """
    🔮 AI-powered revenue forecast.

    Projects future revenue based on current MRR and growth patterns.

    Example:
        cc revenue forecast --months 12
    """
    if months < 1 or months > 24:
        console.print("[red]Error: Months must be between 1 and 24[/red]")
        raise typer.Exit(1)

    console.print(f"\n[bold cyan]🔮 Revenue Forecast ({months} months)[/bold cyan]\n")

    # Initialize revenue engine
    engine = RevenueEngine()
    forecaster = RevenueForecasting()

    # Get current MRR
    current_mrr = engine.get_mrr()

    if current_mrr == 0:
        console.print("[yellow]Warning: No MRR data available, using baseline[/yellow]")
        current_mrr = 8500.00  # Default baseline

    console.print(f"[dim]Current MRR: ${current_mrr:,.2f}[/dim]\n")

    # Generate forecast
    forecasts = forecaster.forecast_growth(current_mrr, months)

    # Display forecast table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Month", style="cyan")
    table.add_column("Projected MRR", style="green", justify="right")
    table.add_column("Projected ARR", style="yellow", justify="right")
    table.add_column("Growth", style="blue", justify="right")

    prev_mrr = current_mrr
    for forecast_item in forecasts:
        projected_mrr = forecast_item.projected
        projected_arr = projected_mrr * 12
        growth = ((projected_mrr - prev_mrr) / prev_mrr * 100) if prev_mrr > 0 else 0

        table.add_row(
            forecast_item.month,
            f"${projected_mrr:,.2f}",
            f"${projected_arr:,.2f}",
            f"+{growth:.1f}%"
        )
        prev_mrr = projected_mrr

    console.print(table)

    # Summary stats
    final_mrr = forecasts[-1].projected if forecasts else 0
    final_arr = final_mrr * 12
    total_growth = ((final_mrr - current_mrr) / current_mrr * 100) if current_mrr > 0 else 0

    console.print(f"\n[bold]Final Projected MRR:[/bold] ${final_mrr:,.2f}")
    console.print(f"[bold]Final Projected ARR:[/bold] ${final_arr:,.2f}")
    console.print(f"[bold]Total Growth:[/bold] +{total_growth:.1f}%\n")


@app.command()
def export(
    output: Annotated[
        Optional[str],
        typer.Option(
            "--output", "-o",
            help="Output file path"
        )
    ] = None,
    period: Annotated[
        str,
        typer.Option(
            "--period", "-p",
            help="Time period for export"
        )
    ] = "monthly"
):
    """
    📤 Export revenue data to CSV.

    Exports revenue data by period to a CSV file for further analysis.

    Example:
        cc revenue export --output revenue.csv --period weekly
    """
    if period not in ["daily", "weekly", "monthly"]:
        console.print("[red]Error: Period must be daily, weekly, or monthly[/red]")
        raise typer.Exit(1)

    # Generate default filename if not provided
    if output is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output = f"revenue_export_{period}_{timestamp}.csv"

    console.print(f"\n[bold cyan]📤 Exporting Revenue Data[/bold cyan]")
    console.print(f"[dim]Period: {period.title()}[/dim]")
    console.print(f"[dim]Output: {output}[/dim]\n")

    try:
        import httpx
        response = httpx.get(f"http://localhost:8000/api/revenue/by-period?period={period}")

        if response.status_code != 200:
            console.print(f"[red]API Error: {response.status_code}[/red]")
            raise typer.Exit(1)

        data = response.json()
        _write_csv(output, data, period)

    except ImportError:
        console.print("[yellow]Warning: httpx not installed, using mock data[/yellow]")
        _export_mock_data(output, period)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        console.print("[yellow]Falling back to mock data[/yellow]")
        _export_mock_data(output, period)


def _write_csv(filepath: str, data: List[dict], period: str):
    """Write revenue data to CSV file."""
    if not data:
        console.print("[yellow]No data to export[/yellow]")
        return

    # Determine headers based on period
    if period == "daily":
        fieldnames = ["date", "revenue"]
    elif period == "weekly":
        fieldnames = ["week", "revenue"]
    else:  # monthly
        fieldnames = ["month", "revenue"]

    try:
        with open(filepath, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)

        console.print(f"[green]✓ Successfully exported {len(data)} records to {filepath}[/green]\n")

    except Exception as e:
        console.print(f"[red]Error writing CSV: {e}[/red]")
        raise typer.Exit(1)


def _export_mock_data(filepath: str, period: str):
    """Export mock revenue data to CSV."""
    if period == "daily":
        data = [
            {"date": "2026-01-20", "revenue": 1200.00},
            {"date": "2026-01-21", "revenue": 980.00},
            {"date": "2026-01-22", "revenue": 1500.00},
            {"date": "2026-01-23", "revenue": 1100.00},
            {"date": "2026-01-24", "revenue": 1350.00},
        ]
    elif period == "weekly":
        data = [
            {"week": "2026-W01", "revenue": 7800.00},
            {"week": "2026-W02", "revenue": 8200.00},
            {"week": "2026-W03", "revenue": 7500.00},
            {"week": "2026-W04", "revenue": 9100.00},
        ]
    else:  # monthly
        data = [
            {"month": "2025-09", "revenue": 28000.00},
            {"month": "2025-10", "revenue": 31500.00},
            {"month": "2025-11", "revenue": 29800.00},
            {"month": "2025-12", "revenue": 35700.00},
        ]

    _write_csv(filepath, data, period)


if __name__ == "__main__":
    app()
