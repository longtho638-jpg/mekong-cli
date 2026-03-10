"""
Core CLI Commands - Main application commands

Extracted from main.py for better maintainability.
ROIaaS Phase 1: RaaS License Gate integrated
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from typing import Any

from src.core.llm_client import get_client
from src.core.planner import RecipePlanner, PlanningContext, TaskComplexity
from src.core.orchestrator import RecipeOrchestrator, OrchestrationStatus
from src.cli.helpers import (
    create_config_panel,
    create_step_table,
    format_step_row,
    format_agent_step_row,
    print_success,
    print_error,
    print_warning,
    print_json_output,
    build_execution_result_table,
)
from src.cli.validators import (
    require_api_token,
)
from src.lib.raas_gate import require_license


console = Console()
app = typer.Typer()


@app.command()
def cook(
    goal: str = typer.Argument(..., help="High-level goal to plan, execute, and verify"),
    strict: bool = typer.Option(True, help="Strict verification mode"),
    no_rollback: bool = typer.Option(False, "--no-rollback", help="Disable rollback on failure"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show step-by-step output"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Plan only, no execution"),
    json_output: bool = typer.Option(False, "--json", "-j", help="Machine-readable JSON output"),
) -> None:
    """Cook: Plan -> Execute -> Verify workflow (Binh Phap engine)"""
    # Check license for premium command
    require_license("cook")

    llm_client = get_client()

    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=strict,
        enable_rollback=not no_rollback,
    )

    if dry_run:
        _run_dry_run(goal, llm_client)
        return

    if verbose:
        config = {
            "Goal": goal,
            "Strict": str(strict),
            "Rollback": str(not no_rollback),
        }
        console.print(create_config_panel("⚙️ Cook Configuration", config, border_style="dim"))

    result = orchestrator.run_from_goal(goal)

    if json_output:
        _print_json_output(result, goal)
        if result.status != OrchestrationStatus.SUCCESS:
            raise typer.Exit(code=1)
        return

    if verbose and result.step_results:
        console.print(build_execution_result_table(result.step_results))

    _print_final_result(result)


def _run_dry_run(goal: str, llm_client: Any) -> None:
    """Run dry-run mode: plan only without execution."""
    planner = RecipePlanner(llm_client=llm_client if llm_client.is_available else None)
    recipe = planner.plan(goal)

    console.print(
        Panel(
            f"[bold]{recipe.name}[/bold]\n{recipe.description}",
            title="📋 Dry Run — Plan Only",
            border_style="yellow",
        )
    )

    plan_table = create_step_table("Steps (not executed)")
    for step in recipe.steps:
        plan_table.add_row(*format_step_row(step.order, step.title, step.description))

    console.print(plan_table)
    console.print("\n[yellow]Dry run complete — no steps executed.[/yellow]")


def _print_json_output(result: Any, goal: str) -> None:
    """Print JSON output for machine consumption."""
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
    print_json_output(output)


def _print_final_result(result: Any) -> None:
    """Print final result summary."""
    if result.status == OrchestrationStatus.SUCCESS:
        print_success("🎉 Mission accomplished!", title="Success")
    elif result.status == OrchestrationStatus.PARTIAL:
        console.print("\n[bold yellow]⚠️  Partial completion[/bold yellow]")
        if result.errors:
            print_error("Errors occurred", errors=result.errors)
        raise typer.Exit(code=1)
    else:
        print_error("❌ Mission failed", errors=result.errors)
        raise typer.Exit(code=1)


@app.command(name="plan")
def plan_cmd(
    goal: str = typer.Argument(..., help="Goal to decompose into tasks"),
    complexity: str = typer.Option(
        "moderate", help="Task complexity: simple/moderate/complex"
    ),
) -> None:
    """📋 Plan: Decompose a goal into executable steps (plan only, no execution)"""
    from src.cli.validators import validate_complexity

    # Check license for complex plans (premium feature)
    if complexity.lower() == "complex":
        require_license("plan")

    complexity_map = {
        "simple": TaskComplexity.SIMPLE,
        "moderate": TaskComplexity.MODERATE,
        "complex": TaskComplexity.COMPLEX,
    }

    validated_complexity = validate_complexity(complexity)

    context = PlanningContext(
        goal=goal,
        complexity=complexity_map.get(validated_complexity, TaskComplexity.MODERATE),
    )

    llm = get_client()
    planner = RecipePlanner(llm_client=llm if llm.is_available else None)
    recipe = planner.plan(goal, context)

    console.print(
        Panel(
            f"[bold]{recipe.name}[/bold]\n{recipe.description}",
            title="📋 Generated Plan",
            border_style="cyan",
        )
    )

    plan_table = create_step_table()
    for step in recipe.steps:
        plan_table.add_row(*format_step_row(step.order, step.title, step.description))
    console.print(plan_table)

    issues = planner.validate_plan(recipe)
    if issues:
        print_warning("Issues found", items=issues)
    else:
        print_success("Plan validated", title="✓ Plan valid")

    console.print(
        f'\n[dim]Run [bold cyan]mekong cook "{goal}"[/bold cyan] to execute this plan[/dim]'
    )


@app.command(name="ask")
def ask_cmd(
    question: str = typer.Argument(..., help="Question about the codebase or task"),
) -> None:
    """Ask a question - plan-only shortcut (alias for plan)"""
    llm = get_client()
    planner = RecipePlanner(llm_client=llm if llm.is_available else None)

    context = PlanningContext(goal=question, complexity=TaskComplexity.SIMPLE)
    recipe = planner.plan(question, context)

    console.print(
        Panel(
            f"[bold]{recipe.name}[/bold]\n{recipe.description}",
            title="💡 Answer",
            border_style="cyan",
        )
    )

    plan_table = create_step_table()
    for step in recipe.steps:
        plan_table.add_row(*format_agent_step_row(
            step.order, step.title, step.agent, step.description
        ))
    console.print(plan_table)


@app.command(name="debug")
def debug_cmd(
    issue: str = typer.Argument(..., help="Bug or issue description to debug"),
    dry_run: bool = typer.Option(True, "--dry-run/--execute", help="Plan only or execute"),
) -> None:
    """Debug an issue - generates a fix plan (defaults to dry-run)"""
    goal = f"debug {issue}" if not issue.lower().startswith("debug") else issue

    if dry_run:
        llm = get_client()
        planner = RecipePlanner(llm_client=llm if llm.is_available else None)
        recipe = planner.plan(goal)

        console.print(
            Panel(
                f"[bold]{recipe.name}[/bold]\n{recipe.description}",
                title="🐛 Debug Plan",
                border_style="yellow",
            )
        )

        plan_table = create_step_table("Debug Steps")
        for step in recipe.steps:
            plan_table.add_row(*format_agent_step_row(
                step.order, step.title, step.agent, step.description
            ))
        console.print(plan_table)
        console.print(
            f'\n[dim]Run [bold cyan]mekong debug "{issue}" --execute[/bold cyan] to run[/dim]'
        )
    else:
        llm_client = get_client()
        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
            strict_verification=True,
            enable_rollback=True,
        )
        result = orchestrator.run_from_goal(goal)

        if result.status == OrchestrationStatus.SUCCESS:
            print_success("Issue resolved!", title="🎉")
        else:
            print_error("Debug failed", errors=result.errors)
            raise typer.Exit(code=1)


@app.command()
def gateway(
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
    host: str = typer.Option("127.0.0.1", "--host", "-H", help="Server bind address"),
) -> None:
    """🌐 Gateway: Start the OpenClaw Hybrid Commander HTTP server"""
    # Check license for premium command
    require_license("gateway")

    import uvicorn

    api_token = require_api_token()

    config = {
        "Host": host,
        "Port": str(port),
        "Token": f"{'*' * len(api_token[:4])}...{api_token[-4:]}",
        "Health": f"http://{host}:{port}/health",
        "Endpoint": f"POST http://{host}:{port}/cmd",
    }

    console.print(create_config_panel(
        "🌐 Mekong Gateway — OpenClaw Hybrid Commander",
        config,
        border_style="cyan"
    ))

    uvicorn.run("src.core.gateway:app", host=host, port=port, log_level="info")


@app.command()
def dash() -> None:
    """🟢 Dash: One-button action menu (The Washing Machine)"""
    from src.core.gateway import PRESET_ACTIONS, build_human_summary
    from rich.prompt import Prompt

    console.print(
        Panel(
            "[bold]Press a button, get things done.[/bold]\n"
            "[dim]Select an action below — no coding needed.[/dim]",
            title="🟢 Mekong Dashboard — The Washing Machine",
            border_style="green",
        )
    )

    table = Table(title="One-Button Actions", show_lines=True)
    table.add_column("#", style="bold cyan", justify="right", width=3)
    table.add_column("Action", style="bold", min_width=20)
    table.add_column("What it does", style="dim")

    for i, preset in enumerate(PRESET_ACTIONS, 1):
        table.add_row(
            str(i),
            f"{preset['icon']}  {preset['label']}",
            preset["goal"],
        )

    console.print(table)
    console.print()

    choices = [str(i) for i in range(1, len(PRESET_ACTIONS) + 1)]
    choice = Prompt.ask("Pick a number (or 'q' to quit)", choices=choices + ["q"], default="q")

    if choice == "q":
        console.print("[dim]Bye![/dim]")
        return

    selected = PRESET_ACTIONS[int(choice) - 1]
    console.print(f"\n[bold green]Running:[/bold green] {selected['icon']}  {selected['label']}")

    llm_client = get_client()
    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=True,
        enable_rollback=True,
    )

    result = orchestrator.run_from_goal(selected["goal"])
    summary = build_human_summary(result)
    status_style = "green" if result.status == OrchestrationStatus.SUCCESS else "red"

    console.print(
        Panel(
            f"[bold]{summary.en}[/bold]\n[dim]{summary.vi}[/dim]",
            title=f"[{status_style}]Result[/{status_style}]",
            border_style=status_style,
        )
    )
