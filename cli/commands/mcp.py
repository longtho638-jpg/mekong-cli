import subprocess
from antigravity.core.mcp_manager import MCPManager, MCPServerConfig
from pathlib import Path

import typer
from rich.console import Console
from rich.prompt import Prompt

from core.constants import MCP_PACKAGES

console = Console()


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
        server_config = MCPServerConfig(command="npx", args=["-y", url_or_name])
        manager.add_server(url_or_name.split("/")[-1], server_config)
        console.print(f"✅ Installed {url_or_name}")
