"""
ROI Analytics CLI Commands — ROIaaS Phase 5

Commands for calculating and displaying ROI metrics:
- Time saved per command vs manual coding
- Cost per agent call
- Total ROI multiplier
- JSON export for frontend dashboard

Usage:
    mekong analytics show
    mekong analytics show --days 30
    mekong analytics show --json
"""

import typer
import os
from rich.console import Console
from typing import Optional

console = Console()

app = typer.Typer(
    name="analytics",
    help="ROI Analytics Dashboard",
    rich_markup_mode="rich",
)


@app.command(name="show")
def analytics_show(
    days: int = typer.Option(30, "--days", "-d", help="Number of days to analyze"),
    json_output: bool = typer.Option(False, "--json", "-j", help="Export as JSON"),
    license_key: Optional[str] = typer.Option(
        None, "--license", "-l",
        help="License key (defaults to RAAS_LICENSE_KEY env var)"
    ),
) -> None:
    """
    Show ROI analytics dashboard with time savings and cost analysis.

    Calculates:
    - Time saved per command vs manual coding
    - Cost per agent call
    - Total ROI multiplier
    - Labor cost avoided

    Examples:
        mekong analytics show
        mekong analytics show --days 30
        mekong analytics show --json
        mekong analytics show -d 7 -l mk_your_key
    """
    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print(
            "[bold red]No license key found[/bold red]\n"
            "Set RAAS_LICENSE_KEY environment variable or use --license flag."
        )
        raise typer.Exit(code=1)

    try:
        from src.metering.usage_tracker import get_tracker
        from src.analytics.roi_dashboard import ROIDashboard

        tracker = get_tracker()
        dashboard = ROIDashboard(current_license, tracker=tracker)

        if json_output:
            console.print(dashboard.export_json(days))
        else:
            console.print(dashboard.generate_ascii_report(days))

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        console.print("[dim]Note: Analytics requires usage tracking data.[/dim]")
        raise typer.Exit(code=1)


@app.command(name="export")
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
    Export ROI analytics to JSON file for frontend dashboard.
    """
    from pathlib import Path

    current_license = license_key or os.getenv("RAAS_LICENSE_KEY")
    if not current_license:
        console.print("[bold red]No license key[/bold red]")
        raise typer.Exit(code=1)

    try:
        from src.metering.usage_tracker import get_tracker
        from src.analytics.roi_dashboard import ROIDashboard

        tracker = get_tracker()
        dashboard = ROIDashboard(current_license, tracker=tracker)
        json_str = dashboard.export_json(days)

        output_path = Path(output).expanduser()
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            f.write(json_str)

        console.print(
            f"[bold green]Exported ROI Analytics[/bold green]\n"
            f"Path: [cyan]{output_path}[/cyan]\n"
            f"Size: {output_path.stat().st_size / 1024:.1f} KB\n"
            f"Period: {days} days"
        )

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)
