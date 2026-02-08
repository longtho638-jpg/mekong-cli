"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
"""

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
        console.print("[yellow]No recipes found.[/yellow]")
        return

    table = Table(title="Available Recipes")
    table.add_column("Name", style="cyan")
    table.add_column("Description")
    table.add_column("Author", style="dim")
    table.add_column("Tags", style="blue")

    for recipe in recipes:
        table.add_row(
            recipe.name, recipe.description, recipe.author, ", ".join(recipe.tags)
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


@app.command()
def version():
    """Show version info"""
    console.print(
        Panel(
            "[bold green]Mekong CLI[/bold green] v0.2.0\n"
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
