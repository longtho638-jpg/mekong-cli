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

def _lazy_load_revenue():
    """Lazy loader for revenue commands."""
    from cli.commands.revenue import revenue_app
    return revenue_app


def _lazy_load_deploy():
    """Lazy loader for deploy commands."""
    from cli.commands.deploy import deploy_app
    return deploy_app


def _lazy_load_test():
    """Lazy loader for test commands."""
    from cli.commands.test import test_app
    return test_app


def _lazy_load_plan():
    """Lazy loader for plan commands."""
    from cli.commands.plan import plan_app
    return plan_app


def _lazy_load_mcp():
    """Lazy loader for mcp commands."""
    from cli.commands.mcp_commands import mcp_app
    return mcp_app


def _lazy_load_strategy():
    """Lazy loader for strategy commands."""
    from cli.commands.strategy_commands import strategy_app
    return strategy_app


def _lazy_load_bridge():
    """Lazy loader for bridge commands."""
    from cli.commands.bridge import bridge_app
    return bridge_app


def _lazy_load_content():
    """Lazy loader for content commands."""
    from cli.commands.content import content_app
    return content_app


def _lazy_load_finance():
    """Lazy loader for finance commands."""
    from cli.commands.finance import finance_app
    return finance_app


def _lazy_load_sales():
    """Lazy loader for sales commands."""
    from cli.commands.sales import sales_app
    return sales_app


def _lazy_load_ops():
    """Lazy loader for ops commands."""
    from cli.commands.ops import ops_app
    return ops_app


def _lazy_load_setup():
    """Lazy loader for setup commands."""
    from cli.commands.setup import setup_app
    return setup_app


def _lazy_load_outreach():
    """Lazy loader for outreach commands."""
    from cli.commands.outreach import outreach_app
    return outreach_app


def register_commands():
    """Registers all CLI commands with true lazy loading.

    Commands are only imported when actually invoked, not at registration time.
    This dramatically speeds up --help and other non-command operations.
    """
    # Register lazy-loaded typer apps
    app.add_typer(_lazy_load_revenue, name="revenue", lazy=True)
    app.add_typer(_lazy_load_deploy, name="deploy", lazy=True)
    app.add_typer(_lazy_load_test, name="test", lazy=True)
    app.add_typer(_lazy_load_plan, name="plan", lazy=True)
    app.add_typer(_lazy_load_mcp, name="mcp", lazy=True)
    app.add_typer(_lazy_load_strategy, name="strategy", lazy=True)
    app.add_typer(_lazy_load_bridge, name="bridge", lazy=True)
    app.add_typer(_lazy_load_content, name="content", lazy=True)
    app.add_typer(_lazy_load_finance, name="finance", lazy=True)
    app.add_typer(_lazy_load_sales, name="sales", lazy=True)
    app.add_typer(_lazy_load_ops, name="ops", lazy=True)
    app.add_typer(_lazy_load_setup, name="setup", lazy=True)
    app.add_typer(_lazy_load_outreach, name="outreach", lazy=True)

    # Utility & Dev Commands - these are lightweight, keep eager loading
    from cli.commands.dev_commands import register_dev_commands
    from cli.commands.utility_commands import register_utility_commands

    register_dev_commands(app)
    register_utility_commands(app)


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
