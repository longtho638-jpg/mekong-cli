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

import typer
from rich.console import Console
from core.constants import APP_NAME

# Import command functions from modules
from cli.project import init, deploy_cmd
from cli.config import setup_vibe, generate_secrets, setup_mcp, vibes_cmd
from cli.agents import run_scout_cmd, agents_cmd
from cli.billing import activate_cmd, status_cmd, costs_cmd

# --- App Initialization ---

app = typer.Typer(help=f"{APP_NAME}: Deploy Your Agency in 15 Minutes")
console = Console()

# --- Register Commands ---

app.command(name="init")(init)
app.command(name="deploy")(deploy_cmd)

app.command(name="setup-vibe")(setup_vibe)
app.command(name="generate-secrets")(generate_secrets)
app.command(name="mcp-setup")(setup_mcp)
app.command(name="vibes")(vibes_cmd)

app.command(name="run-scout")(run_scout_cmd)
app.command(name="agents")(agents_cmd)

app.command(name="activate")(activate_cmd)
app.command(name="status")(status_cmd)
app.command(name="costs")(costs_cmd)

if __name__ == "__main__":
    app()
