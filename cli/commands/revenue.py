from rich.console import Console

from core.automation.autopilot import RevenueAutopilotService

console = Console()


def run_autopilot():
    """Run the daily revenue autopilot sequence."""
    console.print("[bold blue]🚀 Starting Revenue Autopilot...[/bold blue]")
    service = RevenueAutopilotService()
    result = service.run_cycle()

    console.print(result["report"])
    console.print(f"[green]✅ Autopilot completed: {result['status']}[/green]")


def show_report():
    """Show the latest revenue report."""
    service = RevenueAutopilotService()
    metrics = service.check_revenue_metrics()

    console.print("\n[bold]💰 Current Metrics:[/bold]")
    console.print(f"   MRR: ${metrics['mrr']:,.0f}")
    console.print(f"   ARR: ${metrics['arr']:,.0f}")
    console.print(f"   Progress: {metrics['progress']}%")
