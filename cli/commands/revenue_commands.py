"""
Revenue Commands for MEKONG-CLI.

Contains revenue management and autopilot commands.
"""

import typer
from rich.console import Console

console = Console()

revenue_app = typer.Typer(help="Quan ly Doanh thu & Autopilot")


@revenue_app.command(name="autopilot")
def revenue_autopilot():
    """Chay Revenue Autopilot (Content, Outreach, Metrics)."""
    from cli.commands.revenue import run_autopilot

    run_autopilot()


@revenue_app.command(name="report")
def revenue_report():
    """Xem bao cao doanh thu moi nhat."""
    from cli.commands.revenue import show_report

    show_report()
