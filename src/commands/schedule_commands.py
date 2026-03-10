"""
Schedule Commands - Autonomous recurring missions
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from typing import Optional

app = typer.Typer(help="Schedule: autonomous recurring missions")
console = Console()


@app.command(name="list")
def schedule_list() -> None:
    """List all scheduled missions."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    schedules = scheduler.list_schedules()

    if not schedules:
        console.print("[yellow]No schedules configured.[/yellow]")
        console.print("[dim]Use 'mekong schedule add' to create one.[/dim]")
        return

    table = Table(title="Scheduled Missions")
    table.add_column("ID", style="cyan", justify="right")
    table.add_column("Goal", style="bold")
    table.add_column("Cron", style="dim")
    table.add_column("Status", style="dim")

    for schedule in schedules:
        status = "[green]active[/green]" if schedule.get("active") else "[yellow]paused[/yellow]"
        table.add_row(
            str(schedule.get("id", "?")),
            schedule.get("goal", "Unknown")[:40],
            schedule.get("cron", "Unknown"),
            status,
        )

    console.print(table)


@app.command(name="add")
def schedule_add(
    goal: str = typer.Argument(..., help="Goal to schedule"),
    cron: str = typer.Option("* * * * *", "--cron", "-c", help="Cron expression"),
    name: Optional[str] = typer.Option(None, "--name", "-n", help="Schedule name"),
) -> None:
    """Add a new scheduled mission."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    schedule_id = scheduler.add_schedule(goal, cron, name=name)

    console.print(
        Panel(
            f"[bold]Goal:[/bold] {goal}\n"
            f"[bold]Cron:[/bold] {cron}\n"
            f"[bold]ID:[/bold] {schedule_id}\n"
            f"[bold]Status:[/bold] [green]Scheduled[/green]",
            title="📅 Schedule Added",
            border_style="green",
        )
    )


@app.command(name="remove")
def schedule_remove(
    schedule_id: str = typer.Argument(..., help="Schedule ID to remove"),
) -> None:
    """Remove a scheduled mission."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    scheduler.remove_schedule(schedule_id)

    console.print(
        Panel(
            f"Schedule [bold]{schedule_id}[/bold] removed.",
            title="📅 Schedule Removed",
            border_style="cyan",
        )
    )
