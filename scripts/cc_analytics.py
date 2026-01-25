#!/usr/bin/env python3
"""
CC Analytics CLI - Production-ready analytics dashboard
Beautiful terminal UI with Rich library
"""

import sys
import csv
import time
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.live import Live
from rich.layout import Layout
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich import box
from rich.text import Text

console = Console()


class AnalyticsEngine:
    """Core analytics engine with mock data for demonstration"""

    def __init__(self):
        self.base_date = datetime.now()

    def get_key_metrics(self) -> Dict[str, Any]:
        """Get key business metrics"""
        return {
            "total_users": 12847,
            "active_users": 8392,
            "mrr": 45620.50,
            "arr": 547446.00,
            "churn_rate": 2.3,
            "ltv": 2850.75,
            "cac": 420.30,
            "growth_rate": 18.5,
        }

    def get_funnel_data(self) -> List[Dict[str, Any]]:
        """Get conversion funnel data"""
        return [
            {"stage": "Visitors", "count": 50000, "conversion": 100.0},
            {"stage": "Sign Ups", "count": 8500, "conversion": 17.0},
            {"stage": "Trial Users", "count": 6800, "conversion": 13.6},
            {"stage": "Paying Customers", "count": 3400, "conversion": 6.8},
            {"stage": "Annual Subscribers", "count": 1700, "conversion": 3.4},
        ]

    def get_cohort_data(self) -> List[Dict[str, Any]]:
        """Get cohort retention data"""
        cohorts = []
        for i in range(6):
            month = (self.base_date - timedelta(days=30 * i)).strftime("%Y-%m")
            retention = [100.0]
            for j in range(1, 6):
                retention.append(round(retention[j - 1] * random.uniform(0.85, 0.92), 1))

            cohorts.append(
                {
                    "cohort": month,
                    "users": random.randint(800, 1500),
                    "retention": retention[:6],
                }
            )
        return cohorts

    def get_realtime_metrics(self) -> Dict[str, Any]:
        """Get realtime metrics for streaming"""
        return {
            "active_sessions": random.randint(150, 350),
            "requests_per_sec": random.randint(45, 95),
            "avg_response_time": round(random.uniform(120, 280), 1),
            "error_rate": round(random.uniform(0.1, 0.8), 2),
            "revenue_today": round(random.uniform(1200, 2500), 2),
        }


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """CC Analytics - Beautiful terminal analytics dashboard"""
    pass


@cli.command()
@click.option("--format", type=click.Choice(["table", "json"]), default="table")
def dashboard(format: str):
    """Show key business metrics dashboard"""
    engine = AnalyticsEngine()
    metrics = engine.get_key_metrics()

    if format == "json":
        import json

        console.print_json(json.dumps(metrics, indent=2))
        return

    # Create beautiful dashboard
    title = Text("📊 CC Analytics Dashboard", style="bold magenta")
    console.print(Panel(title, box=box.DOUBLE))

    # Create metrics table
    table = Table(
        show_header=True, header_style="bold cyan", box=box.ROUNDED, show_lines=True
    )
    table.add_column("Metric", style="cyan", width=20)
    table.add_column("Value", style="green", justify="right", width=15)
    table.add_column("Status", style="yellow", width=10)

    # Add metrics with color-coded status
    table.add_row(
        "Total Users",
        f"{metrics['total_users']:,}",
        "✅ Growing",
    )
    table.add_row(
        "Active Users",
        f"{metrics['active_users']:,}",
        f"[green]{metrics['active_users']/metrics['total_users']*100:.1f}%[/green]",
    )
    table.add_row(
        "MRR",
        f"${metrics['mrr']:,.2f}",
        "📈 +18.5%",
    )
    table.add_row(
        "ARR",
        f"${metrics['arr']:,.2f}",
        "🚀 Strong",
    )
    table.add_row(
        "Churn Rate",
        f"{metrics['churn_rate']:.1f}%",
        "✅ Healthy" if metrics["churn_rate"] < 5 else "⚠️  High",
    )
    table.add_row(
        "LTV",
        f"${metrics['ltv']:,.2f}",
        "💰 Good",
    )
    table.add_row(
        "CAC",
        f"${metrics['cac']:,.2f}",
        "✅ Efficient" if metrics["ltv"] / metrics["cac"] > 3 else "⚠️  Review",
    )
    table.add_row(
        "LTV:CAC Ratio",
        f"{metrics['ltv']/metrics['cac']:.2f}",
        "🎯 Excellent" if metrics["ltv"] / metrics["cac"] > 3 else "⚠️  Low",
    )

    console.print(table)

    # Summary panel
    summary = f"""
[bold cyan]Growth Rate:[/bold cyan] [green]+{metrics['growth_rate']:.1f}%[/green] MoM
[bold cyan]Health Score:[/bold cyan] [green]85/100[/green] ✅
[bold cyan]Last Updated:[/bold cyan] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    console.print(Panel(summary.strip(), title="Summary", border_style="green"))


@cli.command()
@click.option("--format", type=click.Choice(["table", "json"]), default="table")
def funnel(format: str):
    """Conversion funnel analysis"""
    engine = AnalyticsEngine()
    funnel_data = engine.get_funnel_data()

    if format == "json":
        import json

        console.print_json(json.dumps(funnel_data, indent=2))
        return

    # Create funnel visualization
    title = Text("🔀 Conversion Funnel Analysis", style="bold magenta")
    console.print(Panel(title, box=box.DOUBLE))

    table = Table(
        show_header=True, header_style="bold cyan", box=box.ROUNDED, show_lines=True
    )
    table.add_column("Stage", style="cyan", width=25)
    table.add_column("Count", style="green", justify="right", width=12)
    table.add_column("Conversion %", style="yellow", justify="right", width=15)
    table.add_column("Drop-off", style="red", justify="right", width=15)
    table.add_column("Visual", style="blue", width=30)

    prev_count = None
    for stage in funnel_data:
        count = stage["count"]
        conversion = stage["conversion"]

        # Calculate drop-off
        drop_off = ""
        if prev_count:
            drop_rate = ((prev_count - count) / prev_count) * 100
            drop_off = f"-{drop_rate:.1f}%"

        # Visual bar
        bar_width = int(conversion / 100 * 25)
        visual = "█" * bar_width + "░" * (25 - bar_width)

        table.add_row(
            stage["stage"],
            f"{count:,}",
            f"{conversion:.1f}%",
            drop_off,
            visual,
        )
        prev_count = count

    console.print(table)

    # Insights
    insights = """
[bold cyan]Key Insights:[/bold cyan]
• [green]✓[/green] Signup conversion (17%) is above industry average
• [yellow]⚠[/yellow]  Trial-to-paid conversion (50%) could be improved
• [green]✓[/green] Annual upgrade rate (50%) is excellent
• [cyan]→[/cyan] Focus: Improve trial activation & onboarding
    """
    console.print(Panel(insights.strip(), title="Insights", border_style="blue"))


@cli.command()
@click.option("--months", default=6, help="Number of months to analyze")
@click.option("--format", type=click.Choice(["table", "json"]), default="table")
def cohort(months: int, format: str):
    """Cohort retention analysis"""
    engine = AnalyticsEngine()
    cohort_data = engine.get_cohort_data()[:months]

    if format == "json":
        import json

        console.print_json(json.dumps(cohort_data, indent=2))
        return

    # Create cohort table
    title = Text("📅 Cohort Retention Analysis", style="bold magenta")
    console.print(Panel(title, box=box.DOUBLE))

    table = Table(
        show_header=True, header_style="bold cyan", box=box.ROUNDED, show_lines=True
    )
    table.add_column("Cohort", style="cyan", width=12)
    table.add_column("Users", style="green", justify="right", width=8)

    # Add month columns
    for i in range(6):
        table.add_column(f"M{i}", style="yellow", justify="right", width=8)

    for cohort in cohort_data:
        row = [cohort["cohort"], f"{cohort['users']:,}"]

        for i, retention in enumerate(cohort["retention"]):
            # Color code based on retention rate
            if retention >= 80:
                color = "green"
            elif retention >= 60:
                color = "yellow"
            else:
                color = "red"
            row.append(f"[{color}]{retention:.1f}%[/{color}]")

        table.add_row(*row)

    console.print(table)

    # Calculate average retention
    avg_retention = {}
    for i in range(6):
        avg_retention[f"M{i}"] = sum(c["retention"][i] for c in cohort_data) / len(
            cohort_data
        )

    summary = f"""
[bold cyan]Average Retention:[/bold cyan]
Month 0: [green]{avg_retention['M0']:.1f}%[/green]
Month 1: [green]{avg_retention['M1']:.1f}%[/green]
Month 3: [yellow]{avg_retention['M3']:.1f}%[/yellow]
Month 6: [yellow]{avg_retention['M5']:.1f}%[/yellow]

[bold cyan]Health:[/bold cyan] [green]Good retention curve[/green] ✅
    """
    console.print(Panel(summary.strip(), title="Summary", border_style="green"))


@cli.command()
@click.option("--output", default="analytics_export.csv", help="Output CSV file")
@click.option("--type", "export_type", type=click.Choice(["metrics", "funnel", "cohort"]), default="metrics")
def export(output: str, export_type: str):
    """Export analytics data to CSV"""
    engine = AnalyticsEngine()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task(f"Exporting {export_type} data...", total=100)

        # Simulate export process
        output_path = Path(output)

        if export_type == "metrics":
            data = engine.get_key_metrics()
            with open(output_path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=data.keys())
                writer.writeheader()
                writer.writerow(data)

        elif export_type == "funnel":
            data = engine.get_funnel_data()
            with open(output_path, "w", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["stage", "count", "conversion"])
                writer.writeheader()
                writer.writerows(data)

        elif export_type == "cohort":
            data = engine.get_cohort_data()
            with open(output_path, "w", newline="") as f:
                fieldnames = ["cohort", "users"] + [f"M{i}" for i in range(6)]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for cohort in data:
                    row = {"cohort": cohort["cohort"], "users": cohort["users"]}
                    for i, retention in enumerate(cohort["retention"]):
                        row[f"M{i}"] = retention
                    writer.writerow(row)

        progress.update(task, completed=100)

    console.print(
        Panel(
            f"[green]✓[/green] Exported {export_type} data to [cyan]{output_path}[/cyan]",
            title="Export Complete",
            border_style="green",
        )
    )


@cli.command()
@click.option("--interval", default=2, help="Update interval in seconds")
@click.option("--duration", default=60, help="Duration in seconds (0 for infinite)")
def realtime(interval: int, duration: int):
    """Live metrics stream (Ctrl+C to stop)"""
    engine = AnalyticsEngine()

    def generate_table():
        """Generate realtime metrics table"""
        metrics = engine.get_realtime_metrics()

        table = Table(
            show_header=True,
            header_style="bold cyan",
            box=box.ROUNDED,
            title="⚡ Real-time Metrics",
            title_style="bold magenta",
        )
        table.add_column("Metric", style="cyan", width=20)
        table.add_column("Value", style="green", justify="right", width=15)
        table.add_column("Status", style="yellow", width=15)

        table.add_row(
            "Active Sessions",
            f"{metrics['active_sessions']}",
            "🟢 Online",
        )
        table.add_row(
            "Requests/sec",
            f"{metrics['requests_per_sec']}",
            "⚡ Fast",
        )
        table.add_row(
            "Avg Response (ms)",
            f"{metrics['avg_response_time']:.1f}",
            "✅ Good" if metrics["avg_response_time"] < 250 else "⚠️  Slow",
        )
        table.add_row(
            "Error Rate",
            f"{metrics['error_rate']:.2f}%",
            "✅ Healthy" if metrics["error_rate"] < 1 else "⚠️  High",
        )
        table.add_row(
            "Revenue Today",
            f"${metrics['revenue_today']:,.2f}",
            "💰 Growing",
        )

        timestamp = Text(
            f"Last updated: {datetime.now().strftime('%H:%M:%S')}",
            style="dim",
        )

        return Panel(
            table,
            title="[bold magenta]CC Analytics - Live Dashboard[/bold magenta]",
            subtitle=timestamp,
            border_style="cyan",
            box=box.DOUBLE,
        )

    try:
        start_time = time.time()
        with Live(generate_table(), refresh_per_second=1, console=console) as live:
            while True:
                time.sleep(interval)
                live.update(generate_table())

                if duration > 0 and (time.time() - start_time) >= duration:
                    break

    except KeyboardInterrupt:
        console.print("\n[yellow]Stopping realtime stream...[/yellow]")


if __name__ == "__main__":
    cli()
