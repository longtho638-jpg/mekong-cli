"""
Recipe commands: init, list, search, run, ui
"""

from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table
from rich.text import Text

from src.agents.content_writer import ContentWriter
from src.agents.lead_hunter import LeadHunter
from src.agents.recipe_crawler import RecipeCrawler
from src.core.executor import RecipeExecutor
from src.core.parser import RecipeParser
from src.core.registry import RecipeRegistry

console = Console()


def register_recipe_commands(app: typer.Typer) -> None:
    """Register recipe management commands onto the typer app."""

    @app.command()
    def init() -> None:
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

    @app.command(name="list")
    def list_cmd() -> None:
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
                recipe.name,
                recipe.description,
                str(recipe.path.name),
                ", ".join(recipe.tags),
            )

        console.print(table)

    @app.command()
    def search(query: str) -> None:
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
    def run(
        recipe: str = typer.Argument(..., help="Recipe file path (.md) or name"),
    ) -> None:
        """Run a recipe workflow"""
        if not recipe.endswith(".md") and not Path(recipe).exists():
            registry = RecipeRegistry()
            found = registry.get_recipe(recipe)
            if found:
                try:
                    executor = RecipeExecutor(found)
                    success = executor.run()
                    if not success:
                        raise typer.Exit(code=1)
                    return
                except Exception as e:
                    console.print(f"[bold red]❌ Execution Error:[/bold red] {str(e)}")
                    raise typer.Exit(code=1)

        recipe_path = Path(recipe)
        if not recipe_path.exists():
            console.print(f"[bold red]❌ Error:[/bold red] Recipe file not found: {recipe}")
            raise typer.Exit(code=1)

        try:
            parser = RecipeParser()
            parsed_recipe = parser.parse(recipe_path)
            executor = RecipeExecutor(parsed_recipe)
            success = executor.run()
            if not success:
                raise typer.Exit(code=1)
        except Exception as e:
            console.print(f"[bold red]❌ Execution Error:[/bold red] {str(e)}")
            # raise e  # Uncomment for debugging
            raise typer.Exit(code=1)

    @app.command()
    def ui() -> None:
        """Open interactive terminal UI"""
        console.print(
            Panel(
                Text("🎨 Mekong Terminal UI", style="bold cyan"),
                title="Interactive Mode",
                border_style="cyan",
            )
        )

        modules = {
            "1": {"name": "LeadHunter", "class": LeadHunter, "desc": "Find CEO emails from domains"},
            "2": {"name": "ContentWriter", "class": ContentWriter, "desc": "Generate SEO articles"},
            "3": {"name": "RecipeCrawler", "class": RecipeCrawler, "desc": "Discover community recipes"},
        }

        table = Table(title="Select Module")
        table.add_column("ID", style="cyan", justify="right")
        table.add_column("Module", style="bold")
        table.add_column("Description", style="dim")

        for pid, info in modules.items():
            table.add_row(pid, info["name"], info["desc"])

        console.print(table)

        choice = Prompt.ask("Enter module ID", choices=list(modules.keys()))
        selected = modules[choice]
        console.print(f"\n[bold green]Selected: {selected['name']}[/bold green]")

        agent_class = selected["class"]
        agent = agent_class()

        if choice == "1":
            user_input = Prompt.ask("Enter domain to hunt (e.g., techcorp.com)")
        elif choice == "2":
            user_input = Prompt.ask("Enter topic/keyword (e.g., AI Marketing)")
        elif choice == "3":
            user_input = Prompt.ask("Enter search query or 'all'")
        else:
            user_input = Prompt.ask("Enter input data")

        with console.status(f"[bold green]Running {selected['name']}...[/bold green]"):
            try:
                results = agent.run(user_input)
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
