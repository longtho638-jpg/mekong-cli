from pathlib import Path

import typer
from rich.console import Console
from rich.prompt import Prompt

from core.constants import NICHE_DESCRIPTIONS, NICHES, VIBES
from core.shared.utils import update_file_placeholders

console = Console()


def setup_vibe(
    niche: str = typer.Option(None, help="Target Niche (or select interactively)"),
    location: str = typer.Option(..., prompt="Location (e.g., Can Tho)"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="Brand Tone"),
):
    """
    Customize the Agent's soul (.gemini/GEMINI.md) for a specific niche.
    """
    console.print("\n[bold blue]🎨 Setup Vibe:[/bold blue]")

    # Interactive niche selection if not provided
    if not niche:
        console.print("\n[cyan]Available Niches (Pro tier required for all):[/cyan]")
        for description in NICHE_DESCRIPTIONS:
            console.print(f"  {description}")

        choice = Prompt.ask("\nSelect niche", choices=list(NICHES.keys()))
        niche = NICHES[choice]

    console.print(f"\nTuning for [cyan]{niche}[/cyan] in [cyan]{location}[/cyan]...")

    cwd = Path.cwd()
    config_path = cwd / "agent.config.yaml"
    gemini_md_path = cwd / ".gemini/GEMINI.md"

    if not config_path.exists() or not gemini_md_path.exists():
        console.print("[bold red]Error:[/bold red] Not a valid Mekong project root.")
        raise typer.Exit(code=1)

    replacements = {"project_name": cwd.name, "niche": niche, "location": location, "tone": tone}

    # Update config files
    if update_file_placeholders(config_path, replacements):
        console.print("   ✅ Updated agent.config.yaml")

    if update_file_placeholders(gemini_md_path, replacements):
        console.print("   ✅ Infused local vibe into GEMINI.md")

    console.print("\n[bold green]✨ Vibe Setup Complete![/bold green]")


def vibes_cmd():
    """
    Show available Vibe Tuning options.
    """
    console.print("\n[bold blue]🎤 Vibe Tuning - AI Voice Localization[/bold blue]\n")

    console.print("   [cyan]Available Vibes:[/cyan]\n")
    for vibe_id, name, tone, words in VIBES:
        console.print(f"   • [bold]{name}[/bold] ({vibe_id})")
        console.print(f"     Tone: {tone}")
        console.print(f"     Words: {words}")
        console.print()

    console.print("   [dim]Set vibe: mekong setup-vibe --location 'Can Tho'[/dim]")
