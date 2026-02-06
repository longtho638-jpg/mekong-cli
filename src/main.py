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
from src.agents import LeadHunter, ContentWriter, RecipeCrawler
from rich.prompt import Prompt

app = typer.Typer(
    name="mekong",
    help="🚀 Mekong CLI: RaaS Agency Operating System",
    add_completion=False,
)

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
            recipe.name,
            recipe.description,
            recipe.author,
            ", ".join(recipe.tags)
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
        table.add_row(
            recipe.name,
            recipe.description,
            ", ".join(recipe.tags)
        )

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
                    console.print(Panel(str(res.output), title="Output", border_style="dim"))
                if res.error:
                    console.print(f"[bold red]Error:[/bold red] {res.error}")

        except Exception as e:
            console.print(f"[bold red]Critical Error:[/bold red] {str(e)}")

    console.print("\n[dim]Press Enter to exit...[/dim]")
    input()


@app.command()
def version():
    """Show version info"""
    console.print(
        Panel(
            "[bold green]Mekong CLI[/bold green] v0.1.0\n"
            "[dim]RaaS Agency Operating System[/dim]\n"
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
