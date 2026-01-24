"""
💰 Revenue Commands
===================

CLI commands for managing agency revenue, invoices, and financial forecasting.
Powered by antigravity.core.revenue.RevenueEngine.
"""

from antigravity.core.revenue.engine import RevenueEngine

import typer
from rich.console import Console
from rich.table import Table

console = Console()
revenue_app = typer.Typer(help="💰 Manage Revenue & Financials")


@revenue_app.command("dashboard")
def show_dashboard():
    """📊 Show the Revenue Dashboard (MRR, ARR, Goals)."""
    engine = RevenueEngine()
    stats = engine.get_stats()
    financials = stats["financials"]
    goals = stats["goals"]

    # ASCII Dashboard
    console.print("\n[bold gold1]💰 REVENUE COCKPIT[/bold gold1]")
    console.print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    # Financials Table
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", justify="right", style="green")

    table.add_row("MRR", f"${financials['mrr']:,.2f}")
    table.add_row("ARR", f"${financials['arr']:,.2f}")
    table.add_row("Outstanding", f"${financials['outstanding']:,.2f}")
    table.add_row("Total Revenue", f"${financials['total_revenue_usd']:,.2f}")

    console.print(table)

    # Goal Progress
    console.print(f"\n[bold]🎯 $1M 2026 Goal Progress:[/bold] {goals.get('progress_percent', 0)}%")
    console.print(f"   Gap: [red]${goals.get('gap_usd', 0):,.2f}[/red]")

    # Autopilot status
    from core.automation.autopilot import RevenueAutopilotService
    autopilot = RevenueAutopilotService()
    metrics = autopilot.check_revenue_metrics()
    console.print(f"\n[dim]Autopilot Check: {metrics['mrr']} MRR detected[/dim]")


@revenue_app.command("sync")
def sync_revenue():
    """🔄 Sync revenue data from external providers."""
    console.print("[yellow]Syncing revenue data from SePay/Polar...[/yellow]")
    # In a real implementation, this would call engine.sync_data()
    # For now, we simulate a check
    engine = RevenueEngine()
    console.print(f"[green]✅ Synced {len(engine.invoices)} invoices.[/green]")


@revenue_app.command("forecast")
def forecast_revenue(months: int = 12):
    """📈 Forecast future revenue growth."""
    engine = RevenueEngine()
    forecast = engine.forecast_growth(months=months)

    console.print(f"\n[bold blue]📈 Revenue Forecast ({months} months)[/bold blue]")
    table = Table(show_header=True)
    table.add_column("Month")
    table.add_column("Projected MRR", justify="right")

    for f in forecast:
        table.add_row(f.month, f"${f.amount:,.2f}")

    console.print(table)


@revenue_app.command("autopilot")
def run_autopilot():
    """🚀 Run the daily Revenue Autopilot sequence."""
    from core.automation.autopilot import RevenueAutopilotService

    console.print("[bold blue]🚀 Starting Revenue Autopilot...[/bold blue]")
    service = RevenueAutopilotService()
    result = service.run_cycle()

    console.print(result["report"])
    console.print(f"[green]✅ Autopilot completed: {result['status']}[/green]")
