"""
MCP Commands for MEKONG-CLI.

Contains Model Context Protocol management commands.
"""

import typer

from rich.console import Console

console = Console()

mcp_app = typer.Typer(help="Quan ly Model Context Protocol (MCP)")


@mcp_app.command(name="setup")
def mcp_setup():
    """Thiet lap ket noi MCP ban dau."""
    from cli.commands.mcp import setup_mcp

    setup_mcp()


@mcp_app.command(name="install")
def mcp_install(package: str = typer.Argument(..., help="Ten package hoac URL GitHub")):
    """Cai dat them MCP Server moi."""
    from cli.commands.mcp import install_mcp

    install_mcp(package)
