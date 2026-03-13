"""
ROI Analytics CLI Commands — ROIaaS Phase 5

Commands for calculating and displaying ROI metrics:
- Time saved per command vs manual coding
- Cost per agent call
- Total ROI multiplier
- JSON export for frontend dashboard

Usage:
    mekong analytics:show
    mekong analytics:show --days 30
    mekong analytics:show --json
"""

import typer
import os
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from datetime import datetime
from typing import Optional

console = Console()

app = typer.Typer(
    name="analytics:show",
    help="📊 ROI Analytics Dashboard",
    rich_markup_mode="rich",
)


# Time estimates (minutes) for manual vs CLI
TIME_ESTIMATES = {
    # Commands
    'cook': {'manual': 120, 'cli': 5},      # 2h → 5min = 24x faster
    'plan': {'manual': 60, 'cli': 2},        # 1h → 2min = 30x faster
    'fix': {'manual': 90, 'cli': 10},        # 1.5h → 10min = 9x faster
    'code': {'manual': 180, 'cli': 15},      # 3h → 15min = 12x faster
    'test': {'manual': 60, 'cli': 5},        # 1h → 5min = 12x faster
    'review': {'manual': 45, 'cli': 3},      # 45min → 3min = 15x faster
    'deploy': {'manual': 30, 'cli': 2},      # 30min → 2min = 15x faster
    'debug': {'manual': 120, 'cli': 15},     # 2h → 15min = 8x faster
    # Agents
    'planner': {'manual': 90, 'cli': 3},     # 1.5h → 3min = 30x faster
    'researcher': {'manual': 180, 'cli': 5}, # 3h → 5min = 36x faster
    'fullstack-developer': {'manual': 240, 'cli': 10},
    'tester': {'manual': 60, 'cli': 3},
    'code-reviewer': {'manual': 90, 'cli': 5},
    'debugger': {'manual': 120, 'cli': 10},
    'docs-manager': {'manual': 60, 'cli': 3},
    'project-manager': {'manual': 45, 'cli': 2},
}

# Cost per agent call (USD) — based on LLM API costs
AGENT_COSTS = {
    'planner': 0.05,
    'researcher': 0.08,
    'fullstack-developer': 0.15,
    'tester': 0.04,
    'code-reviewer': 0.06,
    'debugger': 0.10,
    'docs-manager': 0.04,
    'project-manager': 0.03,
    'scout': 0.02,
    'explorer': 0.03,
}

# Developer hourly rate (for time savings calculation)
DEVELOPER_HOURLY_RATE = 75  # USD/hour


@app.command(name="analytics:show")
def analytics_show(
    days: int = typer.Option(30, "--days", "-d", help="Number of days to analyze"),
    json_output: bool = typer.Option(False, "--json", "-j", help="Export as JSON"),
    license_key: Optional[str] = typer.Option(
        None, "--license", "-l",
        help="License key (defaults to RAAS_LICENSE_KEY env var)"
    ),
) -> None:
    """
    📊 Show ROI analytics dashboard with time savings and cost analysis.

    Calculates:
    - Time saved per command vs manual coding
    - Cost per agent call
    - Total ROI multiplier
    - Labor cost avoided

    Examples:
        mekong analytics:show
        mekong analytics:show --days 30
        mekong analytics:show --json
        mekong analytics:show -d 7 -l mk_your_key
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
        # Get usage data from meter
        from src.raas.credit_metering_middleware import CreditMeter

        meter = CreditMeter()
        summary = meter.get_usage_summary(current_license, period="daily")
        events = meter.list_events(current_license, limit=1000)

        # Calculate ROI metrics
        total_minutes_saved = 0
        time_saved_by_command = {}
        time_saved_by_agent = {}
        total_agent_cost = 0

        # Process events
        for event in events:
            task_type = event.task_type
            credits = event.credits_used

            # Time savings calculation
            estimate = TIME_ESTIMATES.get(task_type, {'manual': 60, 'cli': 5})
            saved = (estimate['manual'] - estimate['cli']) * credits
            total_minutes_saved += saved

            # Categorize by command vs agent
            if task_type in ['cook', 'plan', 'fix', 'code', 'test', 'review', 'deploy', 'debug']:
                time_saved_by_command[task_type] = time_saved_by_command.get(task_type, 0) + saved
            else:
                time_saved_by_agent[task_type] = time_saved_by_agent.get(task_type, 0) + saved
                # Agent LLM cost
                agent_cost = AGENT_COSTS.get(task_type, 0.05)
                total_agent_cost += agent_cost * credits

        total_hours_saved = total_minutes_saved / 60
        labor_cost_saved = total_hours_saved * DEVELOPER_HOURLY_RATE

        # ROI calculation
        investment_cost = total_agent_cost
        total_cost_avoided = labor_cost_saved
        roi_multiplier = investment_cost / investment_cost if investment_cost > 0 else 0

        if json_output:
            # Export JSON
            output = {
                "licenseKeyHash": current_license[:8] + "..." + current_license[-4:],
                "generatedAt": datetime.utcnow().isoformat() + "Z",
                "period": {
                    "days": days,
                    "startDate": (datetime.utcnow().timestamp() - days * 86400),
                    "endDate": datetime.utcnow().timestamp(),
                },
                "summary": {
                    "totalMinutesSaved": round(total_minutes_saved),
                    "totalHoursSaved": round(total_hours_saved, 1),
                    "laborCostSaved": round(labor_cost_saved),
                    "investmentCost": round(investment_cost, 2),
                    "totalCostAvoided": round(total_cost_avoided),
                    "roiMultiplier": round(roi_multiplier, 1),
                },
                "timeSavedByCommand": time_saved_by_command,
                "timeSavedByAgent": time_saved_by_agent,
                "usage": {
                    "totalEvents": summary.event_count,
                    "totalCredits": summary.total_credits_used,
                    "breakdown": summary.breakdown,
                },
            }
            console.print(json.dumps(output, indent=2))
        else:
            # ASCII dashboard
            console.print(Panel(
                f"[bold cyan]ROI Dashboard — ROIaaS Phase 5[/bold cyan]\n\n"
                f"License: {current_license[:8]}...{current_license[-4:]} | "
                f"Period: {days} days | "
                f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC",
                border_style="cyan",
            ))

            # Usage Summary
            usage_table = Table(show_header=True, header_style="bold cyan")
            usage_table.add_column("Metric", style="cyan")
            usage_table.add_column("Value", style="green", justify="right")

            usage_table.add_row("Total Events", str(summary.event_count))
            usage_table.add_row("Total Credits Used", str(summary.total_credits_used))
            usage_table.add_row("Unique Task Types", str(len(summary.breakdown)))

            console.print("\n[bold]📊 USAGE SUMMARY[/bold]")
            console.print(usage_table)

            # Time Savings
            time_table = Table(show_header=True, header_style="bold green")
            time_table.add_column("Category", style="green")
            time_table.add_column("Minutes Saved", style="cyan", justify="right")
            time_table.add_column("Hours Saved", style="yellow", justify="right")

            cmd_minutes = sum(time_saved_by_command.values())
            agent_minutes = sum(time_saved_by_agent.values())

            time_table.add_row("Commands", f"{cmd_minutes:.0f}", f"{cmd_minutes/60:.1f}")
            time_table.add_row("Agents", f"{agent_minutes:.0f}", f"{agent_minutes/60:.1f}")
            time_table.add_row(
                "[bold]TOTAL[/bold]",
                f"[bold]{total_minutes_saved:.0f}[/bold]",
                f"[bold]{total_hours_saved:.1f}[/bold]",
            )

            console.print("\n[bold]⏱️ TIME SAVINGS[/bold]")
            console.print(time_table)

            # ROI Metrics
            roi_table = Table(show_header=True, header_style="bold yellow")
            roi_table.add_column("Metric", style="yellow")
            roi_table.add_column("Value (USD)", style="green", justify="right")

            roi_table.add_row("Investment (LLM API)", f"${investment_cost:.2f}")
            roi_table.add_row("Labor Cost Avoided", f"${labor_cost_saved:.2f}")
            roi_table.add_row("Total Cost Avoided", f"${total_cost_avoided:.2f}")
            roi_table.add_row(
                "[bold]ROI Multiplier[/bold]",
                f"[bold green]{roi_multiplier:.1f}x[/bold green]"
            )

            console.print("\n[bold]💰 ROI METRICS[/bold]")
            console.print(roi_table)

            # Task Type Breakdown
            if summary.breakdown:
                breakdown_table = Table(show_header=True, header_style="bold cyan")
                breakdown_table.add_column("Task Type", style="cyan")
                breakdown_table.add_column("Credits", style="green", justify="right")
                breakdown_table.add_column("Est. Time Saved", style="yellow", justify="right")

                for task_type, credits in sorted(summary.breakdown.items(), key=lambda x: x[1], reverse=True)[:10]:
                    estimate = TIME_ESTIMATES.get(task_type, {'manual': 60, 'cli': 5})
                    time_saved = (estimate['manual'] - estimate['cli']) * credits
                    breakdown_table.add_row(
                        task_type,
                        str(credits),
                        f"{time_saved:.0f} min",
                    )

                console.print("\n[bold]📈 TOP TASK TYPES[/bold]")
                console.print(breakdown_table)

            # Footer panel
            console.print(Panel(
                f"[bold]Summary:[/bold] Saved [green]{total_hours_saved:.1f} hours[/green] "
                f"= [green]${labor_cost_saved:.2f}[/green] labor cost avoided\n"
                f"ROI: [bold green]{roi_multiplier:.1f}x[/bold green] return on investment",
                border_style="green",
            ))

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        console.print("[dim]Note: Analytics requires RaaS billing data.[/dim]")
        import traceback
        console.print(traceback.format_exc())
        raise typer.Exit(code=1)


@app.command(name="analytics:export")
def analytics_export(
    output: str = typer.Option(
        "~/.mekong/raas/roi-export.json",
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
    📤 Export ROI analytics to JSON file for frontend dashboard.

    Exports complete ROI metrics including:
    - Time savings breakdown
    - Cost analysis
    - Daily trends
    - Usage statistics
    """
    from pathlib import Path

    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print("[bold red]✗ No license key[/bold red]")
        raise typer.Exit(code=1)

    try:
        # Get data
        from src.raas.credit_metering_middleware import CreditMeter

        meter = CreditMeter()
        summary = meter.get_usage_summary(current_license, period="daily")
        events = meter.list_events(current_license, limit=1000)

        # Calculate metrics (same as analytics:show)
        total_minutes_saved = 0
        time_saved_by_command = {}
        time_saved_by_agent = {}
        total_agent_cost = 0

        for event in events:
            task_type = event.task_type
            credits = event.credits_used

            estimate = TIME_ESTIMATES.get(task_type, {'manual': 60, 'cli': 5})
            saved = (estimate['manual'] - estimate['cli']) * credits
            total_minutes_saved += saved

            if task_type in ['cook', 'plan', 'fix', 'code', 'test', 'review', 'deploy', 'debug']:
                time_saved_by_command[task_type] = time_saved_by_command.get(task_type, 0) + saved
            else:
                time_saved_by_agent[task_type] = time_saved_by_agent.get(task_type, 0) + saved
                agent_cost = AGENT_COSTS.get(task_type, 0.05)
                total_agent_cost += agent_cost * credits

        total_hours_saved = total_minutes_saved / 60
        labor_cost_saved = total_hours_saved * DEVELOPER_HOURLY_RATE
        investment_cost = total_agent_cost
        roi_multiplier = labor_cost_saved / investment_cost if investment_cost > 0 else 0

        # Build export data
        export_data = {
            "licenseKeyHash": current_license[:8] + "..." + current_license[-4:],
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "period": {
                "days": days,
            },
            "roiMetrics": {
                "totalMinutesSaved": round(total_minutes_saved),
                "totalHoursSaved": round(total_hours_saved, 1),
                "laborCostSaved": round(labor_cost_saved, 2),
                "investmentCost": round(investment_cost, 2),
                "totalCostAvoided": round(labor_cost_saved, 2),
                "roiMultiplier": round(roi_multiplier, 1),
                "avgCostPerEvent": round(investment_cost / summary.event_count, 4) if summary.event_count > 0 else 0,
            },
            "timeSavedByCommand": time_saved_by_command,
            "timeSavedByAgent": time_saved_by_agent,
            "usage": {
                "totalEvents": summary.event_count,
                "totalCredits": summary.total_credits_used,
                "breakdown": summary.breakdown,
            },
            "events": [
                {
                    "id": e.id,
                    "taskType": e.task_type,
                    "creditsUsed": e.credits_used,
                    "timestamp": e.timestamp,
                }
                for e in events[:100]  # Limit to 100 for file size
            ],
        }

        # Write file
        output_path = Path(output).expanduser()
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

        console.print(Panel(
            f"[bold green]✓ Exported ROI Analytics[/bold green]\n\n"
            f"Path: [cyan]{output_path}[/cyan]\n"
            f"Size: {output_path.stat().st_size / 1024:.1f} KB\n"
            f"Period: {days} days | Events: {len(events)}",
            title="ROI Export Complete",
            border_style="green",
        ))

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)
