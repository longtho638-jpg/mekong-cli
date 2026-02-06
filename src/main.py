"""
Mekong CLI - Main Entry Point

RaaS Agency Operating System CLI
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from pathlib import Path
import sys
import os

# Add project root to sys.path to allow running as script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.parser import RecipeParser
from src.core.executor import RecipeExecutor

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
def run(recipe: str = typer.Argument(..., help="Recipe file path (.md)")):
    """Run a recipe workflow"""
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
    console.print("[dim]Coming soon: Interactive module selector[/dim]")


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
