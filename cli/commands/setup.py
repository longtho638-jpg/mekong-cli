from pathlib import Path
import typer
from rich.console import Console
from rich.prompt import Prompt

console = Console()

def generate_secrets():
    """
    Interactive secret generation (.env).
    """
    console.print("\n[bold blue]🔐 Secret Generator[/bold blue]")

    secrets = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "GOOGLE_API_KEY",
        "OPENROUTER_API_KEY",
        "ELEVENLABS_API_KEY"
    ]

    env_content = []
    for secret in secrets:
        value = Prompt.ask(f"Enter {secret}", password=True)
        env_content.append(f"{secret}={value}")

    try:
        Path(".env").write_text("\n".join(env_content) + "\n", encoding="utf-8")
        console.print("\n[bold green]✅ .env file created locally (DO NOT COMMIT)[/bold green]")
    except Exception as e:
        console.print(f"[red]Error writing .env file:[/red] {e}")
