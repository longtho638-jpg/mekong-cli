import subprocess
from pathlib import Path
import typer
from rich.console import Console
from rich.prompt import Prompt

from core.constants import NICHE_DESCRIPTIONS, NICHES, VIBES, MCP_PACKAGES
from core.utils import update_file_placeholders
from antigravity.core.mcp_manager import MCPManager, MCPServerConfig

console = Console()

def setup_vibe(
    niche: str = typer.Option(None, help="Target Niche (or select interactively)"),
    location: str = typer.Option(..., prompt="Location (e.g., Can Tho)"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="Brand Tone")
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

    replacements = {
        "project_name": cwd.name,
        "niche": niche,
        "location": location,
        "tone": tone
    }

    # Update config files
    if update_file_placeholders(config_path, replacements):
        console.print("   ✅ Updated agent.config.yaml")

    if update_file_placeholders(gemini_md_path, replacements):
        console.print("   ✅ Infused local vibe into GEMINI.md")

    console.print("\n[bold green]✨ Vibe Setup Complete![/bold green]")


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


def setup_mcp():
    """
    Setup MCP (Model Context Protocol) servers for the project.
    """
    console.print("\n[bold blue]🔌 Setting up MCP Servers...[/bold blue]")

    cwd = Path.cwd()
    mcp_config = cwd / ".claude" / "mcp.json"

    # Ensure .claude directory exists
    mcp_config.parent.mkdir(exist_ok=True)

    console.print("   📦 Installing MCP server packages...")

    try:
        # Install all packages in one go
        cmd = ["npm", "install", "-g"] + MCP_PACKAGES
        subprocess.run(cmd, check=True, capture_output=True)
        console.print("   ✅ MCP packages installed")

        # Verify configuration or create default if missing
        if not mcp_config.exists():
             console.print("   ⚠️ Config not found, creating default...")
             manager = MCPManager(mcp_config)
             # Add default servers if needed or leave empty
             manager._save_config()

        console.print(f"\n   📋 Configured MCP Servers at {mcp_config}")

        console.print("\n[bold green]✅ MCP Setup Complete![/bold green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]Failed to install MCP packages:[/red] {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(code=1)

def install_mcp(
    url_or_name: str = typer.Argument(..., help="GitHub URL or known alias (e.g. 'supabase')"),
):
    """
    Install a new MCP server.
    """
    console.print(f"\n[bold blue]🔌 Installing MCP Server: {url_or_name}[/bold blue]")

    manager = MCPManager()

    if "supabase" in url_or_name.lower():
        # Interactive Supabase setup
        console.print("\n   [cyan]Supabase Configuration[/cyan]")
        project_ref = Prompt.ask("   Enter Project Ref (e.g. pabcdefghijklm)")
        api_key = Prompt.ask("   Enter Supabase Service Key (secret)", password=True)

        manager.install_supabase(project_ref, api_key)

    elif url_or_name.startswith("http"):
        manager.install_from_url(url_or_name)

    else:
        # Assume it's an npm package name
        console.print(f"   📦 Installing npm package: {url_or_name}")
        server_config = MCPServerConfig(
            command="npx",
            args=["-y", url_or_name]
        )
        manager.add_server(url_or_name.split("/")[-1], server_config)
        console.print(f"✅ Installed {url_or_name}")

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
