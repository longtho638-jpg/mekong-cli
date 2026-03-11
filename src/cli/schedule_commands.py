"""
Schedule sub-commands: list, add, remove
Autonomous recurring mission scheduling.
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

schedule_app = typer.Typer(help="Schedule: autonomous recurring missions")


@schedule_app.command(name="list")
def schedule_list() -> None:
    """List all scheduled jobs."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    jobs = scheduler.list_jobs()

    if not jobs:
        console.print("[yellow]No scheduled jobs.[/yellow]")
        console.print(
            "[dim]Use: mekong schedule add <name> <goal> [--type interval|daily][/dim]"
        )
        return

    table = Table(title=f"Scheduled Jobs ({len(jobs)})")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Type")
    table.add_column("Goal", style="dim")
    table.add_column("Runs", justify="right")

    for job in jobs:
        type_label = f"{job.job_type}"
        if job.job_type == "interval":
            type_label += f" ({job.interval_seconds}s)"
        else:
            type_label += f" ({job.daily_time})"
        table.add_row(job.id, job.name, type_label, job.goal[:40], str(job.run_count))

    console.print(table)


@schedule_app.command(name="add")
def schedule_add(
    name: str = typer.Argument(..., help="Job name"),
    goal: str = typer.Argument(..., help="Goal to execute"),
    job_type: str = typer.Option("interval", "--type", "-t", help="Job type: interval or daily"),
    interval: int = typer.Option(300, "--interval", "-i", help="Interval in seconds"),
    daily_time: str = typer.Option("09:00", "--time", help="Time HH:MM (for daily type)"),
) -> None:
    """Add a new scheduled job."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    job = scheduler.add_job(
        name=name,
        goal=goal,
        job_type=job_type,
        interval_seconds=interval,
        daily_time=daily_time,
    )

    console.print(
        Panel(
            f"[bold]ID:[/bold] {job.id}\n"
            f"[bold]Name:[/bold] {job.name}\n"
            f"[bold]Type:[/bold] {job.job_type}\n"
            f"[bold]Goal:[/bold] {job.goal}",
            title="Job Scheduled",
            border_style="green",
        )
    )


@schedule_app.command(name="remove")
def schedule_remove(
    job_id: str = typer.Argument(..., help="Job ID to remove"),
) -> None:
    """Remove a scheduled job."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    if scheduler.remove_job(job_id):
        console.print(f"[green]Job {job_id} removed.[/green]")
    else:
        console.print(f"[bold red]Job {job_id} not found.[/bold red]")
        raise typer.Exit(code=1)
