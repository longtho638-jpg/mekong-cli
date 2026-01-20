"""
MEKONG-CLI: The Unified Agency OS Command Center
=================================================
Entry point module for the CLI application.
"""

import sys

import typer
from rich.console import Console

from core.constants import APP_NAME

# Initialize Console
console = Console()

# --- CLI Initialization ---
app = typer.Typer(
    help=f"{APP_NAME}: The One-Person Unicorn Operating System",
    no_args_is_help=True,
    add_completion=False,
    rich_markup_mode="rich",
)

# Import and register command sub-apps
from cli.commands.dev_commands import register_dev_commands
from cli.commands.mcp_commands import mcp_app
from cli.commands.revenue_commands import revenue_app
from cli.commands.strategy_commands import strategy_app
from cli.commands.utility_commands import register_utility_commands

# Add sub-typers
app.add_typer(strategy_app, name="strategy")
app.add_typer(mcp_app, name="mcp")
app.add_typer(revenue_app, name="revenue")

# Register inline commands
register_dev_commands(app)
register_utility_commands(app)

# Import and add domain sub-apps
from cli.commands.bridge import bridge_app
from cli.commands.content import content_app
from cli.commands.finance import finance_app
from cli.commands.ops import ops_app
from cli.commands.outreach import outreach_app
from cli.commands.sales import sales_app
from cli.commands.setup import setup_app

app.add_typer(outreach_app, name="outreach")
app.add_typer(content_app, name="content")
app.add_typer(finance_app, name="finance")
app.add_typer(sales_app, name="sales")
app.add_typer(ops_app, name="ops")
app.add_typer(setup_app, name="setup")
app.add_typer(bridge_app, name="bridge")


def print_banner():
    """Prints the application banner."""
    banner = """
[bold primary]===========================================================

   MEKONG-CLI & AGENCY OS

   The One-Person Unicorn Operating System
   "Khong danh ma thang" - Win Without Fighting

===========================================================[/bold primary]
    """
    console.print(banner)


def main():
    """Entry point for the CLI."""
    if len(sys.argv) == 1:
        print_banner()
    try:
        app()
    except Exception as e:
        console.print(f"\n[bold red]Loi thuc thi:[/bold red] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
