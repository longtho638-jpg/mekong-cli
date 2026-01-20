"""
Development Commands for MEKONG-CLI.

Contains cook/test/ship commands for development workflow.
"""

import typer

from rich.console import Console

console = Console()

dev_app = typer.Typer(help="Quy trinh phat trien (Cook-Test-Ship)")


def cook_cmd(feature: str):
    """Build: Kich hoat Agent de xay dung tinh nang."""
    from cli.developer import cook

    cook(feature)


def test_cmd():
    """Test: Chay bo kiem thu tu dong."""
    from cli.developer import test

    test()


def ship_cmd():
    """Ship: Trien khai san pham len Production."""
    from cli.developer import ship

    ship()


def register_dev_commands(app: typer.Typer) -> None:
    """Register development commands to the main app.

    Args:
        app: The main Typer app to register commands to.
    """

    @app.command(name="cook")
    def _cook_cmd(feature: str = typer.Argument(..., help="Tinh nang can xay dung")):
        """Build: Kich hoat Agent de xay dung tinh nang."""
        cook_cmd(feature)

    @app.command(name="test")
    def _test_cmd():
        """Test: Chay bo kiem thu tu dong."""
        test_cmd()

    @app.command(name="ship")
    def _ship_cmd():
        """Ship: Trien khai san pham len Production."""
        ship_cmd()
