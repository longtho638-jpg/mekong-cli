"""
Autonomous Commands - AGI loop control commands
"""

import typer
from rich.console import Console
from rich.panel import Panel

app = typer.Typer(help="Autonomous: AGI loop control")
console = Console()


@app.command(name="status")
def autonomous_status() -> None:
    """Show Consciousness Score and subsystem health."""
    from src.core.autonomous import AutonomousEngine

    engine = AutonomousEngine()
    report = engine.get_consciousness()

    console.print(
        Panel(
            f"[bold]Consciousness Score:[/bold] {report.score}/100\n\n"
            f"[bold]Memory:[/bold]     {report.memory_health:.0%}\n"
            f"[bold]NLU:[/bold]        {report.nlu_health:.0%}\n"
            f"[bold]Router:[/bold]     {report.router_health:.0%}\n"
            f"[bold]Executor:[/bold]   {report.executor_health:.0%}\n"
            f"[bold]Learner:[/bold]    {report.learner_health:.0%}\n"
            f"[bold]Evolution:[/bold]  {report.evolution_health:.0%}\n"
            f"[bold]Governance:[/bold] {report.governance_health:.0%}",
            title="🧠 AGI Consciousness",
            border_style="magenta",
        )
    )


@app.command(name="run")
def autonomous_run(
    goal: str = typer.Argument(..., help="Goal to process autonomously"),
) -> None:
    """Run a single autonomous cycle for a goal."""
    from src.core.autonomous import AutonomousEngine

    engine = AutonomousEngine()

    if engine.is_halted():
        console.print(
            "[bold red]System is HALTED. Use 'mekong autonomous resume' first.[/bold red]"
        )
        raise typer.Exit(code=1)

    result = engine.process_goal(goal)

    status_style = "green" if result.result_status == "success" else "red"
    console.print(
        Panel(
            f"[bold]Goal:[/bold] {result.goal}\n"
            f"[bold]Status:[/bold] [{status_style}]{result.result_status}[/{status_style}]\n"
            f"[bold]Executed:[/bold] {result.executed}\n"
            f"[bold]Recipe Generated:[/bold] {result.recipe_generated}\n"
            f"[bold]Patterns Detected:[/bold] {result.patterns_detected}",
            title="🤖 Autonomous Cycle Result",
            border_style=status_style,
        )
    )

    if result.governance_decision:
        console.print(
            f"[dim]Governance: {result.governance_decision.action_class.value} "
            f"— {result.governance_decision.reason}[/dim]"
        )

    if result.result_status in ("blocked", "rejected"):
        raise typer.Exit(code=1)


@app.command(name="resume")
def autonomous_resume() -> None:
    """Resume autonomous operations after halt."""
    from src.core.governance import Governance

    gov = Governance()
    gov.resume()
    console.print(
        "[bold green]RESUMED[/bold green] — Autonomous operations re-enabled."
    )
