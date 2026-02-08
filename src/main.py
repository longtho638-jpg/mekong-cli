"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
"""

import json
import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.table import Table
from pathlib import Path
import sys
import os

# Add project root to sys.path to allow running as script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.parser import RecipeParser
from src.core.executor import RecipeExecutor
from src.core.registry import RecipeRegistry
from src.core.orchestrator import RecipeOrchestrator, OrchestrationStatus
from src.core.planner import PlanningContext, TaskComplexity
from src.core.llm_client import get_client
from src.agents import LeadHunter, ContentWriter, RecipeCrawler
from rich.prompt import Prompt

# Import BMAD CLI (using dash naming convention)
import importlib.util

spec = importlib.util.spec_from_file_location(
    "bmad_commands", Path(__file__).parent / "cli" / "bmad-commands.py"
)
bmad_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bmad_module)
bmad_app = bmad_module.app

app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

# Register BMAD commands
app.add_typer(bmad_app, name="bmad", help="BMAD workflow management")

# Swarm sub-commands
swarm_app = typer.Typer(help="Swarm: multi-node orchestration")
app.add_typer(swarm_app, name="swarm")

# Schedule sub-commands
schedule_app = typer.Typer(help="Schedule: autonomous recurring missions")
app.add_typer(schedule_app, name="schedule")

# Memory sub-commands
memory_app = typer.Typer(help="Memory: execution history & learning")
app.add_typer(memory_app, name="memory")

console = Console()


@app.command()
def init():
    """Initialize Mekong CLI in current directory"""
    console.print(
        Panel(
            Text("🎯 Mekong CLI initialized!", style="bold green"),
            title="Genesis Complete",
            border_style="green",
        )
    )
    console.print("[dim]Created: .mekong/ directory[/dim]")
    console.print("[dim]Created: recipes/ directory[/dim]")
    console.print("\n✨ Run [bold cyan]mekong run <recipe>[/bold cyan] to start")


@app.command()
def list():
    """List available recipes"""
    registry = RecipeRegistry()
    recipes = registry.scan()

    if not recipes:
        console.print("[yellow]No recipes found in recipes/ directory.[/yellow]")
        return

    table = Table(title=f"Available Recipes ({len(recipes)} found)")
    table.add_column("Name", style="cyan")
    table.add_column("Description")
    table.add_column("File", style="dim")
    table.add_column("Tags", style="blue")

    for recipe in recipes:
        table.add_row(
            recipe.name, recipe.description, str(recipe.path.name), ", ".join(recipe.tags)
        )

    console.print(table)


@app.command()
def search(query: str):
    """Search for recipes"""
    registry = RecipeRegistry()
    results = registry.search(query)

    if not results:
        console.print(f"[yellow]No recipes found matching '{query}'[/yellow]")
        return

    table = Table(title=f"Search Results: '{query}'")
    table.add_column("Name", style="cyan")
    table.add_column("Description")
    table.add_column("Tags", style="blue")

    for recipe in results:
        table.add_row(recipe.name, recipe.description, ", ".join(recipe.tags))

    console.print(table)


@app.command()
def run(recipe: str = typer.Argument(..., help="Recipe file path (.md) or name")):
    """Run a recipe workflow"""
    # Try to find recipe via registry first if it doesn't look like a file path
    if not recipe.endswith(".md") and not Path(recipe).exists():
        registry = RecipeRegistry()
        found = registry.get_recipe(recipe)
        if found:
            # We need to pass the path to parser/executor, but get_recipe returns parsed object
            # Let's adjust logic to use the found path
            # Re-implementing get_recipe logic slightly here or modifying get_recipe to return path?
            # get_recipe returns Recipe object. Executor takes Recipe object.
            # So we can just pass the parsed recipe to executor.

            try:
                executor = RecipeExecutor(found)
                success = executor.run()
                if not success:
                    raise typer.Exit(code=1)
                return
            except Exception as e:
                console.print(f"[bold red]❌ Execution Error:[/bold red] {str(e)}")
                raise typer.Exit(code=1)

    # Fallback to file path logic
    recipe_path = Path(recipe)

    if not recipe_path.exists():
        console.print(f"[bold red]❌ Error:[/bold red] Recipe file not found: {recipe}")
        raise typer.Exit(code=1)

    try:
        # Parse
        parser = RecipeParser()
        parsed_recipe = parser.parse(recipe_path)

        # Execute
        executor = RecipeExecutor(parsed_recipe)
        success = executor.run()

        if not success:
            raise typer.Exit(code=1)

    except Exception as e:
        console.print(f"[bold red]❌ Execution Error:[/bold red] {str(e)}")
        # raise e # Uncomment for debugging
        raise typer.Exit(code=1)


@app.command()
def ui():
    """Open interactive terminal UI"""
    console.print(
        Panel(
            Text("🎨 Mekong Terminal UI", style="bold cyan"),
            title="Interactive Mode",
            border_style="cyan",
        )
    )

    # Available modules
    modules = {
        "1": {
            "name": "LeadHunter",
            "class": LeadHunter,
            "desc": "Find CEO emails from domains",
        },
        "2": {
            "name": "ContentWriter",
            "class": ContentWriter,
            "desc": "Generate SEO articles",
        },
        "3": {
            "name": "RecipeCrawler",
            "class": RecipeCrawler,
            "desc": "Discover community recipes",
        },
    }

    # Display menu
    table = Table(title="Select Module")
    table.add_column("ID", style="cyan", justify="right")
    table.add_column("Module", style="bold")
    table.add_column("Description", style="dim")

    for pid, info in modules.items():
        table.add_row(pid, info["name"], info["desc"])

    console.print(table)

    # Interactive loop
    choice = Prompt.ask("Enter module ID", choices=list(modules.keys()))
    selected = modules[choice]

    console.print(f"\n[bold green]Selected: {selected['name']}[/bold green]")

    # Instantiate agent
    agent_class = selected["class"]
    agent = agent_class()

    # Get input
    if choice == "1":
        user_input = Prompt.ask("Enter domain to hunt (e.g., techcorp.com)")
    elif choice == "2":
        user_input = Prompt.ask("Enter topic/keyword (e.g., AI Marketing)")
    elif choice == "3":
        user_input = Prompt.ask("Enter search query or 'all'")
    else:
        user_input = Prompt.ask("Enter input data")

    # Run execution
    with console.status(f"[bold green]Running {selected['name']}...[/bold green]"):
        try:
            results = agent.run(user_input)

            # Show results
            console.print("\n[bold]Execution Results:[/bold]")
            for res in results:
                status_symbol = "✅" if res.success else "❌"
                status_color = "green" if res.success else "red"

                console.print(
                    f"[{status_color}]{status_symbol} Task: {res.task_id}[/{status_color}]"
                )

                if res.output:
                    console.print(
                        Panel(str(res.output), title="Output", border_style="dim")
                    )
                if res.error:
                    console.print(f"[bold red]Error:[/bold red] {res.error}")

        except Exception as e:
            console.print(f"[bold red]Critical Error:[/bold red] {str(e)}")

    console.print("\n[dim]Press Enter to exit...[/dim]")
    input()


@app.command()
def cook(
    goal: str = typer.Argument(
        ..., help="High-level goal to plan, execute, and verify"
    ),
    strict: bool = typer.Option(True, help="Strict verification mode"),
    no_rollback: bool = typer.Option(False, help="Disable rollback on failure"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show step-by-step output"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Plan only, no execution"),
    json_output: bool = typer.Option(False, "--json", "-j", help="Machine-readable JSON output"),
):
    """🎯 Cook: Plan → Execute → Verify workflow (Binh Pháp engine)"""
    llm_client = get_client()

    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=strict,
        enable_rollback=not no_rollback,
    )

    if dry_run:
        # Plan only — show steps without executing
        from src.core.planner import RecipePlanner
        planner = RecipePlanner(
            llm_client=llm_client if llm_client.is_available else None
        )
        recipe = planner.plan(goal)

        console.print(
            Panel(
                f"[bold]{recipe.name}[/bold]\n{recipe.description}",
                title="📋 Dry Run — Plan Only",
                border_style="yellow",
            )
        )

        plan_table = Table(title="Steps (not executed)")
        plan_table.add_column("#", style="bold cyan", justify="right")
        plan_table.add_column("Task", style="bold")
        plan_table.add_column("Description", style="dim")

        for step in recipe.steps:
            plan_table.add_row(str(step.order), step.title, step.description[:80])

        console.print(plan_table)
        console.print("\n[yellow]Dry run complete — no steps executed.[/yellow]")
        return

    if verbose:
        console.print(
            Panel(
                f"[bold]Goal:[/bold] {goal}\n"
                f"[bold]Strict:[/bold] {strict}\n"
                f"[bold]Rollback:[/bold] {not no_rollback}",
                title="⚙️ Cook Configuration",
                border_style="dim",
            )
        )

    result = orchestrator.run_from_goal(goal)

    # JSON output mode — print machine-readable result and exit
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
                str(sr.step.order),
                sr.step.title,
                status,
                sr.verification.summary,
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


@app.command(name="plan")
def plan_cmd(
    goal: str = typer.Argument(..., help="Goal to decompose into tasks"),
    complexity: str = typer.Option(
        "moderate", help="Task complexity: simple/moderate/complex"
    ),
):
    """📋 Plan: Decompose a goal into executable steps (plan only, no execution)"""
    from src.core.planner import RecipePlanner

    complexity_map = {
        "simple": TaskComplexity.SIMPLE,
        "moderate": TaskComplexity.MODERATE,
        "complex": TaskComplexity.COMPLEX,
    }

    context = PlanningContext(
        goal=goal,
        complexity=complexity_map.get(complexity, TaskComplexity.MODERATE),
    )

    llm = get_client()
    planner = RecipePlanner(llm_client=llm if llm.is_available else None)
    recipe = planner.plan(goal, context)

    # Display plan
    console.print(
        Panel(
            f"[bold]{recipe.name}[/bold]\n{recipe.description}",
            title="📋 Generated Plan",
            border_style="cyan",
        )
    )

    plan_table = Table(title="Steps")
    plan_table.add_column("#", style="bold cyan", justify="right")
    plan_table.add_column("Task", style="bold")
    plan_table.add_column("Description", style="dim")

    for step in recipe.steps:
        plan_table.add_row(str(step.order), step.title, step.description[:80])

    console.print(plan_table)

    # Validate
    issues = planner.validate_plan(recipe)
    if issues:
        console.print("\n[yellow]⚠️  Issues:[/yellow]")
        for issue in issues:
            console.print(f"  • {issue}")
    else:
        console.print("\n[green]✓ Plan valid[/green]")

    console.print(
        f'\n[dim]Run [bold cyan]mekong cook "{goal}"[/bold cyan] to execute this plan[/dim]'
    )


@app.command(name="ask")
def ask_cmd(
    question: str = typer.Argument(..., help="Question about the codebase or task"),
):
    """Ask a question - plan-only shortcut (alias for plan)"""
    from src.core.planner import RecipePlanner

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

    plan_table = Table(title="Steps")
    plan_table.add_column("#", style="bold cyan", justify="right")
    plan_table.add_column("Task", style="bold")
    plan_table.add_column("Description", style="dim")

    for step in recipe.steps:
        agent_hint = f" [{step.agent}]" if step.agent else ""
        plan_table.add_row(
            str(step.order), step.title + agent_hint, step.description[:80]
        )

    console.print(plan_table)


@app.command(name="debug")
def debug_cmd(
    issue: str = typer.Argument(..., help="Bug or issue description to debug"),
    dry_run: bool = typer.Option(True, "--dry-run/--execute", help="Plan only or execute"),
):
    """Debug an issue - generates a fix plan (defaults to dry-run)"""
    goal = f"debug {issue}" if not issue.lower().startswith("debug") else issue

    if dry_run:
        from src.core.planner import RecipePlanner

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

        plan_table = Table(title="Debug Steps")
        plan_table.add_column("#", style="bold cyan", justify="right")
        plan_table.add_column("Task", style="bold")
        plan_table.add_column("Description", style="dim")

        for step in recipe.steps:
            agent_hint = f" [{step.agent}]" if step.agent else ""
            plan_table.add_row(
                str(step.order), step.title + agent_hint, step.description[:80]
            )

        console.print(plan_table)
        console.print(
            f'\n[dim]Run [bold cyan]mekong debug "{issue}" --execute[/bold cyan] to run[/dim]'
        )
    else:
        # Delegate to cook logic
        llm_client = get_client()
        orchestrator = RecipeOrchestrator(
            llm_client=llm_client if llm_client.is_available else None,
            strict_verification=True,
            enable_rollback=True,
        )
        result = orchestrator.run_from_goal(goal)

        if result.status == OrchestrationStatus.SUCCESS:
            console.print("\n[bold green]🎉 Issue resolved![/bold green]")
        else:
            console.print("\n[bold red]❌ Debug failed[/bold red]")
            if result.errors:
                for e in result.errors:
                    console.print(f"  • {e}")
            raise typer.Exit(code=1)


@app.command()
def gateway(
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
    host: str = typer.Option("127.0.0.1", "--host", "-H", help="Server bind address"),
):
    """🌐 Gateway: Start the OpenClaw Hybrid Commander HTTP server"""
    import uvicorn

    api_token = os.environ.get("MEKONG_API_TOKEN")
    if not api_token:
        console.print(
            Panel(
                "[bold red]MEKONG_API_TOKEN not set![/bold red]\n\n"
                "Set it before starting the gateway:\n"
                "  [cyan]export MEKONG_API_TOKEN='your-secret-token'[/cyan]",
                title="⚠️ Security Warning",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)

    console.print(
        Panel(
            f"[bold]Host:[/bold] {host}\n"
            f"[bold]Port:[/bold] {port}\n"
            f"[bold]Token:[/bold] {'*' * len(api_token[:4])}...{api_token[-4:]}\n"
            f"[bold]Health:[/bold] http://{host}:{port}/health\n"
            f"[bold]Endpoint:[/bold] POST http://{host}:{port}/cmd",
            title="🌐 Mekong Gateway — OpenClaw Hybrid Commander",
            border_style="cyan",
        )
    )

    uvicorn.run("src.core.gateway:app", host=host, port=port, log_level="info")


@app.command()
def dash():
    """🟢 Dash: One-button action menu (The Washing Machine)"""
    from src.core.gateway import PRESET_ACTIONS

    console.print(
        Panel(
            "[bold]Press a button, get things done.[/bold]\n"
            "[dim]Select an action below — no coding needed.[/dim]",
            title="🟢 Mekong Dashboard — The Washing Machine",
            border_style="green",
        )
    )

    # Display preset actions as a numbered menu
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

    # Get user choice
    choices = [str(i) for i in range(1, len(PRESET_ACTIONS) + 1)]
    choice = Prompt.ask(
        "Pick a number (or 'q' to quit)",
        choices=choices + ["q"],
        default="q",
    )

    if choice == "q":
        console.print("[dim]Bye![/dim]")
        return

    selected = PRESET_ACTIONS[int(choice) - 1]
    console.print(
        f"\n[bold green]Running:[/bold green] {selected['icon']}  {selected['label']}"
    )

    # Execute via orchestrator
    llm_client = get_client()
    orchestrator = RecipeOrchestrator(
        llm_client=llm_client if llm_client.is_available else None,
        strict_verification=True,
        enable_rollback=True,
    )

    result = orchestrator.run_from_goal(selected["goal"])

    # Human-friendly summary
    from src.core.gateway import build_human_summary

    summary = build_human_summary(result)
    status_style = "green" if result.status == OrchestrationStatus.SUCCESS else "red"

    console.print(
        Panel(
            f"[bold]{summary.en}[/bold]\n[dim]{summary.vi}[/dim]",
            title=f"[{status_style}]Result[/{status_style}]",
            border_style=status_style,
        )
    )


@swarm_app.command(name="add")
def swarm_add(
    name: str = typer.Argument(..., help="Node name"),
    host_port: str = typer.Argument(..., help="host:port of remote gateway"),
    token: str = typer.Argument(..., help="API token for the remote node"),
):
    """Register a remote Mekong gateway node."""
    from src.core.swarm import SwarmRegistry

    parts = host_port.rsplit(":", 1)
    host = parts[0]
    port = int(parts[1]) if len(parts) > 1 else 8000

    registry = SwarmRegistry()
    node = registry.register_node(name=name, host=host, port=port, token=token)

    console.print(
        Panel(
            f"[bold]ID:[/bold] {node.id}\n"
            f"[bold]Name:[/bold] {node.name}\n"
            f"[bold]Host:[/bold] {node.host}:{node.port}",
            title="Node Registered",
            border_style="green",
        )
    )


@swarm_app.command(name="list")
def swarm_list():
    """List all swarm nodes with health status."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    nodes = registry.list_nodes()

    if not nodes:
        console.print("[yellow]No swarm nodes registered.[/yellow]")
        console.print("[dim]Use: mekong swarm add <name> <host:port> <token>[/dim]")
        return

    registry.check_all_health(timeout=2.0)

    table = Table(title=f"Swarm Nodes ({len(nodes)})")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="bold")
    table.add_column("Host", style="dim")
    table.add_column("Status")

    for node in nodes:
        status_style = {
            "healthy": "green", "unhealthy": "yellow", "unreachable": "red",
        }.get(node.status, "dim")
        table.add_row(
            node.id, node.name, f"{node.host}:{node.port}",
            f"[{status_style}]{node.status}[/{status_style}]",
        )

    console.print(table)


@swarm_app.command(name="dispatch")
def swarm_dispatch(
    node_id: str = typer.Argument(..., help="Node ID to dispatch to"),
    goal: str = typer.Argument(..., help="Goal to execute on remote node"),
):
    """Send a goal to a remote swarm node."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    node = registry.get_node(node_id)
    if not node:
        console.print(f"[bold red]Node {node_id} not found.[/bold red]")
        raise typer.Exit(code=1)

    console.print(f"[dim]Dispatching to {node.name} ({node.host}:{node.port})...[/dim]")
    result = registry.dispatch_goal(node_id, goal)

    if "error" in result:
        console.print(f"[bold red]Error:[/bold red] {result['error']}")
        raise typer.Exit(code=1)

    status = result.get("status", "unknown")
    status_style = "green" if status == "success" else "red"
    console.print(
        Panel(
            f"[bold]Status:[/bold] [{status_style}]{status}[/{status_style}]\n"
            f"[bold]Goal:[/bold] {result.get('goal', goal)}\n"
            f"[bold]Steps:[/bold] {result.get('completed_steps', 0)}/{result.get('total_steps', 0)}",
            title=f"Dispatch Result — {node.name}",
            border_style=status_style,
        )
    )


@swarm_app.command(name="remove")
def swarm_remove(
    node_id: str = typer.Argument(..., help="Node ID to remove"),
):
    """Remove a node from the swarm."""
    from src.core.swarm import SwarmRegistry

    registry = SwarmRegistry()
    if registry.remove_node(node_id):
        console.print(f"[green]Node {node_id} removed.[/green]")
    else:
        console.print(f"[bold red]Node {node_id} not found.[/bold red]")
        raise typer.Exit(code=1)


@schedule_app.command(name="list")
def schedule_list():
    """List all scheduled jobs."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    jobs = scheduler.list_jobs()

    if not jobs:
        console.print("[yellow]No scheduled jobs.[/yellow]")
        console.print("[dim]Use: mekong schedule add <name> <goal> [--type interval|daily][/dim]")
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
    interval: int = typer.Option(300, "--interval", "-i", help="Interval in seconds (for interval type)"),
    daily_time: str = typer.Option("09:00", "--time", help="Time HH:MM (for daily type)"),
):
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
):
    """Remove a scheduled job."""
    from src.core.scheduler import Scheduler

    scheduler = Scheduler()
    if scheduler.remove_job(job_id):
        console.print(f"[green]Job {job_id} removed.[/green]")
    else:
        console.print(f"[bold red]Job {job_id} not found.[/bold red]")
        raise typer.Exit(code=1)


# -- Memory CLI commands --

@memory_app.command(name="list")
def memory_list(
    limit: int = typer.Option(20, "--limit", "-l", help="Number of entries"),
):
    """List recent execution memory entries."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    entries = store.recent(limit)

    if not entries:
        console.print("[yellow]No memory entries yet.[/yellow]")
        return

    table = Table(title=f"Memory ({len(entries)} entries)")
    table.add_column("Goal", style="cyan")
    table.add_column("Status")
    table.add_column("Duration", style="dim")
    table.add_column("Recipe", style="dim")

    for e in reversed(entries):
        status_style = "green" if e.status == "success" else "red"
        table.add_row(
            e.goal[:40],
            f"[{status_style}]{e.status}[/{status_style}]",
            f"{e.duration_ms:.0f}ms",
            e.recipe_used or "-",
        )

    console.print(table)


@memory_app.command(name="stats")
def memory_stats_cmd():
    """Show memory statistics."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    s = store.stats()

    console.print(
        Panel(
            f"[bold]Total Executions:[/bold] {s['total']}\n"
            f"[bold]Success Rate:[/bold] {s['success_rate']:.1f}%\n"
            f"[bold]Recent Failures:[/bold] {s['recent_failures']}\n"
            f"[bold]Top Goals:[/bold] {', '.join(s['top_goals']) or 'none'}",
            title="🧠 Memory Statistics",
            border_style="cyan",
        )
    )


@memory_app.command(name="clear")
def memory_clear_cmd():
    """Clear all execution memory."""
    from src.core.memory import MemoryStore

    store = MemoryStore()
    store.clear()
    console.print("[green]Memory cleared.[/green]")


@app.command()
def version():
    """Show version info"""
    console.print(
        Panel(
            "[bold green]Mekong CLI[/bold green] v0.8.0\n"
            "[dim]RaaS Agency Operating System[/dim]\n"
            "[dim]Engine: Plan-Execute-Verify (Binh Pháp)[/dim]\n"
            "[dim]DNA: ClaudeKit v2.9.1+[/dim]",
            title="Version",
            border_style="blue",
        )
    )


@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """Mekong CLI: RaaS Agency Operating System"""
    if ctx.invoked_subcommand is None:
        console.print(
            Panel(
                Text("Mekong CLI: RaaS Agency Operating System", style="bold green"),
                title="🚀 Genesis",
                border_style="green",
            )
        )
        console.print(
            "\n[dim]Use[/dim] [bold cyan]mekong --help[/bold cyan] [dim]to see available commands[/dim]"
        )


if __name__ == "__main__":
    app()
