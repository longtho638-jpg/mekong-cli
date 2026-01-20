"""
Strategy Commands for MEKONG-CLI.

Contains strategy analysis and planning commands (Binh Phap).
"""

import typer
from rich.console import Console

console = Console()

strategy_app = typer.Typer(help="Chien luoc Binh Phap & Lap ke hoach")


@strategy_app.command(name="analyze")
def strategy_analyze(idea: str = typer.Argument(..., help="Y tuong can phan tich")):
    """Phan tich chien luoc du an theo Binh Phap."""
    from cli.strategy import analyze

    analyze(idea)


@strategy_app.command(name="plan")
def strategy_plan(task: str = typer.Argument(..., help="Nhiem vu can lap ke hoach")):
    """Tao Task Plan (ke hoach tac chien)."""
    from cli.strategy import plan

    plan(task)


@strategy_app.command(name="win3")
def strategy_win3():
    """Kiem tra can bang WIN-WIN-WIN."""
    from cli.strategy import win3

    win3()
