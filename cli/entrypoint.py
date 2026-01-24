"""
MEKONG-CLI: The Unified Agency OS Command Center
=================================================
Entry point module for the CLI application.
Optimized for startup performance with lazy loading.
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

# --- Lazy Command Registration ---
# We define wrapper functions that import the actual command modules only when invoked.

def register_commands():
    """Registers all CLI commands with lazy imports where possible."""

    # Core Domain Commands
    from cli.commands.revenue import revenue_app
    app.add_typer(revenue_app, name="revenue")

    from cli.commands.deploy import deploy_app
    app.add_typer(deploy_app, name="deploy")

    from cli.commands.test import test_app
    app.add_typer(test_app, name="test")

    from cli.commands.plan import plan_app
    app.add_typer(plan_app, name="plan")

    # Legacy/Migration Commands (to be refactored)
    from cli.commands.mcp_commands import mcp_app
    app.add_typer(mcp_app, name="mcp")

    from cli.commands.strategy_commands import strategy_app
    app.add_typer(strategy_app, name="strategy")

    # Utility & Dev Commands
    from cli.commands.dev_commands import register_dev_commands
    register_dev_commands(app)

    from cli.commands.utility_commands import register_utility_commands
    register_utility_commands(app)

    # Domain Sub-apps
    from cli.commands.bridge import bridge_app
    app.add_typer(bridge_app, name="bridge")

    from cli.commands.content import content_app
    app.add_typer(content_app, name="content")

    from cli.commands.finance import finance_app
    app.add_typer(finance_app, name="finance")

    from cli.commands.sales import sales_app
    app.add_typer(sales_app, name="sales")

    from cli.commands.ops import ops_app
    app.add_typer(ops_app, name="ops")

    from cli.commands.setup import setup_app
    app.add_typer(setup_app, name="setup")

    from cli.commands.outreach import outreach_app
    app.add_typer(outreach_app, name="outreach")


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
        register_commands()
        app()
    except Exception as e:
        console.print(f"\n[bold red]Loi thuc thi:[/bold red] {e}")
        # In verbose mode or debug, we might want stack trace
        # console.print_exception()
        sys.exit(1)


if __name__ == "__main__":
    main()
