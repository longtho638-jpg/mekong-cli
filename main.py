#!/usr/bin/env python3
"""
MEKONG-CLI: Local Agency Automation Tool

Deploy Your Agency in 15 Minutes.
Powered by Hybrid Agentic Architecture 2026.

Commands:
    mekong init <name>        - Initialize new project
    mekong setup-vibe         - Configure AI voice/tone
    mekong mcp-setup          - Setup MCP servers
    mekong generate-secrets   - Create .env file
    mekong deploy             - Deploy to Cloud Run
    mekong activate           - Activate license
    mekong status             - Show license status
"""

import sys
import typer
from rich.console import Console
from core.constants import APP_NAME

# --- App Initialization ---

app = typer.Typer(
    help=f"{APP_NAME}: Deploy Your Agency in 15 Minutes",
    no_args_is_help=True,
    add_completion=False
)
console = Console()

# --- Command Wrappers (Lazy Loading) ---

@app.command(name="init")
def init_cmd(name: str):
    """Initialize new project."""
    from cli.project import init
    init(name)

@app.command(name="deploy")
def deploy_cmd():
    """Deploy to Cloud Run."""
    from cli.project import deploy_cmd
    deploy_cmd()

@app.command(name="setup-vibe")
def setup_vibe_cmd(
    niche: str = typer.Option(None, help="Target Niche (or select interactively)"),
    location: str = typer.Option(..., prompt="Location (e.g., Can Tho)"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="Brand Tone")
):
    """Configure AI voice/tone."""
    from cli.config import setup_vibe
    setup_vibe(niche, location, tone)

@app.command(name="generate-secrets")
def generate_secrets_cmd():
    """Create .env file."""
    from cli.config import generate_secrets
    generate_secrets()

@app.command(name="mcp-setup")
def mcp_setup_cmd():
    """Setup MCP servers."""
    from cli.config import setup_mcp
    setup_mcp()

@app.command(name="vibes")
def vibes_cmd_wrapper():
    """List available vibes."""
    from cli.config import vibes_cmd
    vibes_cmd()

@app.command(name="run-scout")
def run_scout_cmd(feature: str):
    """Run scout agent."""
    from cli.agents import run_scout_cmd
    run_scout_cmd(feature)

@app.command(name="agents")
def agents_cmd_wrapper():
    """List agents."""
    from cli.agents import agents_cmd
    agents_cmd()

@app.command(name="activate")
def activate_cmd(key: str):
    """Activate license."""
    from cli.billing import activate_cmd
    activate_cmd(key)

@app.command(name="status")
def status_cmd():
    """Show license status."""
    from cli.billing import status_cmd
    status_cmd()

@app.command(name="costs")
def costs_cmd():
    """Show estimated costs."""
    from cli.billing import costs_cmd
    costs_cmd()

if __name__ == "__main__":
    app()
