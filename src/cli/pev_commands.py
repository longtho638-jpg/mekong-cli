"""PEV (Plan-Execute-Verify) CLI commands.

Exposes pipeline management, progress tracking, and execution
history through the mekong CLI.
"""

import json

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

pev_app = typer.Typer(help="PEV: Pipeline orchestration, status, and history")


@pev_app.command(name="run")
def pev_run(
    goals: list[str] = typer.Argument(..., help="Goals to execute as pipeline stages"),
    stop_on_failure: bool = typer.Option(True, help="Stop pipeline on first failure"),
    strict: bool = typer.Option(True, help="Strict verification mode"),
    no_rollback: bool = typer.Option(False, help="Disable rollback on failure"),
    json_output: bool = typer.Option(False, "--json", "-j", help="JSON output"),
) -> None:
    """Run a multi-stage PEV pipeline from goals."""
    from src.core.llm_client import get_client
    from src.core.orchestrator import RecipeOrchestrator
    from src.core.pipeline_manager import PipelineManager

    llm_client = get_client()
    manager = PipelineManager(stop_on_failure=stop_on_failure)

    pipeline_id = manager.create_pipeline(goals)
    console.print(
        Panel(
            f"[bold]Pipeline:[/bold] {pipeline_id}\n"
            f"[bold]Stages:[/bold] {len(goals)}\n"
            f"[bold]Stop on failure:[/bold] {stop_on_failure}",
            title="Pipeline Created",
            border_style="cyan",
        )
    )

    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=strict,
        enable_rollback=not no_rollback,
    )

    def executor_fn(goal: str):
        result = orchestrator.run_from_goal(goal)
        if result.status.value == "failed":
            raise RuntimeError(f"Goal failed: {'; '.join(result.errors[:3])}")
        return result

    pipeline_result = manager.execute_pipeline(pipeline_id, executor_fn)

    if json_output:
        console.print(json.dumps(manager.aggregate_results(pipeline_id), indent=2))
        if pipeline_result.status.value != "completed":
            raise typer.Exit(code=1)
        return

    _display_pipeline_result(pipeline_result)

    if pipeline_result.status.value not in ("completed",):
        raise typer.Exit(code=1)


@pev_app.command(name="status")
def pev_status(
    pipeline_id: str = typer.Argument(
        None, help="Pipeline ID (omit to list all)"
    ),
    json_output: bool = typer.Option(False, "--json", "-j", help="JSON output"),
) -> None:
    """Show status of pipelines (from persisted history)."""
    from src.core.execution_history import ExecutionHistory

    history = ExecutionHistory()
    workflow_ids = history.workflow_ids()

    if not workflow_ids:
        console.print("[dim]No execution history found.[/dim]")
        return

    if pipeline_id:
        # Show specific workflow
        events = history.load(pipeline_id)
        if not events:
            console.print(f"[red]Workflow not found: {pipeline_id}[/red]")
            raise typer.Exit(code=1)

        if json_output:
            from dataclasses import asdict
            console.print(json.dumps(
                [asdict(e) for e in events], indent=2, default=str
            ))
            return

        _display_workflow_events(pipeline_id, events)
        return

    # List all workflows
    if json_output:
        console.print(json.dumps({"workflows": workflow_ids}))
        return

    table = Table(title="Tracked Workflows")
    table.add_column("Workflow ID", style="cyan")
    table.add_column("Events", justify="right")
    table.add_column("Status")

    for wf_id in workflow_ids:
        events = history.load(wf_id)
        status = _infer_status(events)
        table.add_row(wf_id, str(len(events)), status)

    console.print(table)


@pev_app.command(name="history")
def pev_history(
    workflow_id: str = typer.Argument(..., help="Workflow ID to inspect"),
    limit: int = typer.Option(0, "--limit", "-l", help="Max events to show (0=all)"),
    json_output: bool = typer.Option(False, "--json", "-j", help="JSON output"),
) -> None:
    """Show detailed execution history for a workflow."""
    from dataclasses import asdict

    from src.core.execution_history import ExecutionHistory

    history = ExecutionHistory()
    events = history.load(workflow_id)

    if not events:
        console.print(f"[red]No history for workflow: {workflow_id}[/red]")
        raise typer.Exit(code=1)

    if limit > 0:
        events = events[:limit]

    if json_output:
        console.print(json.dumps(
            [asdict(e) for e in events], indent=2, default=str
        ))
        return

    _display_workflow_events(workflow_id, events)


def _display_pipeline_result(result) -> None:
    """Render pipeline result as Rich table."""
    status_colors = {
        "completed": "green",
        "partial": "yellow",
        "failed": "red",
        "cancelled": "magenta",
        "pending": "dim",
        "running": "cyan",
    }
    color = status_colors.get(result.status.value, "white")

    table = Table(title="Pipeline Results")
    table.add_column("#", style="bold cyan", justify="right")
    table.add_column("Goal", max_width=50)
    table.add_column("Status")
    table.add_column("Duration", justify="right")

    for stage in result.stages:
        s_color = status_colors.get(stage.status, "white")
        dur = f"{stage.duration_ms:.0f}ms" if stage.duration_ms > 0 else "-"
        table.add_row(
            str(stage.order),
            stage.goal[:50],
            f"[{s_color}]{stage.status}[/{s_color}]",
            dur,
        )

    console.print(table)
    console.print(
        f"\n[{color}]Pipeline {result.pipeline_id}: "
        f"{result.status.value.upper()}[/{color}] "
        f"({result.completed_stages}/{result.total_stages} completed, "
        f"{result.total_duration_ms:.0f}ms)"
    )

    if result.errors:
        console.print(Panel(
            "\n".join(f"- {e}" for e in result.errors),
            title="[red]Errors[/red]",
            border_style="red",
        ))


def _display_workflow_events(workflow_id: str, events) -> None:
    """Render workflow events as Rich table."""
    table = Table(title=f"Workflow: {workflow_id}")
    table.add_column("#", style="dim", justify="right")
    table.add_column("Event", style="bold")
    table.add_column("Step", justify="right")
    table.add_column("Data", max_width=40, style="dim")

    for i, event in enumerate(events, 1):
        step = str(event.step_order) if event.step_order is not None else "-"
        data_str = json.dumps(event.data, default=str)[:40] if event.data else ""
        table.add_row(str(i), event.kind.value, step, data_str)

    console.print(table)


def _infer_status(events) -> str:
    """Infer workflow status from events."""
    from src.core.execution_history import EventKind

    kinds = {e.kind for e in events}
    if EventKind.WORKFLOW_COMPLETED in kinds:
        return "[green]completed[/green]"
    if EventKind.WORKFLOW_FAILED in kinds:
        return "[red]failed[/red]"
    if EventKind.ROLLBACK_COMPLETED in kinds:
        return "[magenta]rolled_back[/magenta]"
    if EventKind.WORKFLOW_STARTED in kinds:
        return "[yellow]in_progress[/yellow]"
    return "[dim]unknown[/dim]"


__all__ = ["pev_app"]
