"""
Cook command: Plan -> Execute -> Verify (PEV) workflow.
Primary Mekong CLI execution entry point with AGI v2 integration.
"""

import json

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from src.core.llm_client import get_client
from src.core.orchestrator import RecipeOrchestrator, OrchestrationStatus

console = Console()


def register_cook_command(app: typer.Typer) -> None:
    """Register the cook command onto the typer app."""

    @app.command()
    def cook(
        goal: str = typer.Argument(..., help="High-level goal to plan, execute, and verify"),
        strict: bool = typer.Option(True, help="Strict verification mode"),
        no_rollback: bool = typer.Option(False, help="Disable rollback on failure"),
        verbose: bool = typer.Option(False, "--verbose", "-v", help="Show step-by-step output"),
        dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Plan only, no execution"),
        json_output: bool = typer.Option(False, "--json", "-j", help="Machine-readable JSON output"),
        agi_dash: bool = typer.Option(False, "--agi-dash", help="Show AGI dashboard after execution"),
    ) -> None:
        """Cook: Plan -> Execute -> Verify workflow (Binh Phap engine + AGI v2)"""
        from src.cli.agi_dashboard import show_agi_dashboard

        llm_client = get_client()

        if dry_run:
            from src.core.planner import RecipePlanner
            planner = RecipePlanner(llm_client=llm_client if llm_client.is_available else None)
            recipe = planner.plan(goal)
            console.print(Panel(
                f"[bold]{recipe.name}[/bold]\n{recipe.description}",
                title="📋 Dry Run — Plan Only",
                border_style="yellow",
            ))
            plan_table = Table(title="Steps (not executed)")
            plan_table.add_column("#", style="bold cyan", justify="right")
            plan_table.add_column("Task", style="bold")
            plan_table.add_column("Description", style="dim")
            for step in recipe.steps:
                plan_table.add_row(str(step.order), step.title, step.description[:80])
            console.print(plan_table)
            console.print("\n[yellow]Dry run complete — no steps executed.[/yellow]")
            return

        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
            strict_verification=strict,
            enable_rollback=not no_rollback,
        )

        if verbose:
            console.print(Panel(
                f"[bold]Goal:[/bold] {goal}\n"
                f"[bold]Strict:[/bold] {strict}\n"
                f"[bold]Rollback:[/bold] {not no_rollback}",
                title="⚙️ Cook Configuration",
                border_style="dim",
            ))

        result = orchestrator.run_from_goal(goal)

        if json_output:
            output = {
                "status": result.status.value,
                "goal": goal,
                "total_steps": result.total_steps,
                "completed_steps": result.completed_steps,
                "failed_steps": result.failed_steps,
                "success_rate": result.success_rate,
                "errors": result.errors,
                "warnings": result.warnings,
                "steps": [
                    {
                        "order": sr.step.order,
                        "title": sr.step.title,
                        "passed": sr.verification.passed,
                        "exit_code": sr.execution.exit_code,
                        "summary": sr.verification.summary,
                    }
                    for sr in result.step_results
                ],
            }
            console.print(json.dumps(output, indent=2))
            if result.status != OrchestrationStatus.SUCCESS:
                raise typer.Exit(code=1)
            return

        if verbose and result.step_results:
            detail_table = Table(title="Step Details")
            detail_table.add_column("#", style="bold cyan", justify="right")
            detail_table.add_column("Step", style="bold")
            detail_table.add_column("Status")
            detail_table.add_column("Checks", style="dim")
            for sr in result.step_results:
                status = "[green]PASS[/green]" if sr.verification.passed else "[red]FAIL[/red]"
                detail_table.add_row(
                    str(sr.step.order), sr.step.title, status, sr.verification.summary
                )
            console.print(detail_table)

        if result.status == OrchestrationStatus.SUCCESS:
            console.print("\n[bold green]🎉 Mission accomplished![/bold green]")
        elif result.status == OrchestrationStatus.PARTIAL:
            console.print("\n[bold yellow]⚠️  Partial completion[/bold yellow]")
            if result.errors:
                console.print(Panel(
                    "\n".join(f"• {e}" for e in result.errors),
                    title="[red]Errors[/red]",
                    border_style="red",
                ))
            raise typer.Exit(code=1)
        else:
            console.print("\n[bold red]❌ Mission failed[/bold red]")
            if result.errors:
                console.print(Panel(
                    "\n".join(f"• {e}" for e in result.errors),
                    title="[red]Errors[/red]",
                    border_style="red",
                ))
            raise typer.Exit(code=1)

        if agi_dash or verbose:
            show_agi_dashboard(goal, result)
