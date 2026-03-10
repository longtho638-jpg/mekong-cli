"""
Binh Pháp CLI Commands — ROIaaS Phase 2
"""

import typer
from rich.console import Console
from src.binh_phap.immortal_loop import main as run_immortal_loop
from src.lib.raas_gate import require_license

console = Console()
app = typer.Typer(help="Binh Pháp Strategy: Infinite loops & Standards")


@app.command()
def immortal() -> None:
    """
    The Immortal Loop: Infinite Supervisor for RaaS & OSS Standards.
    Runs continuously, audits, calculates score, and delegates fixes.
    """
    # Check license for premium command
    require_license("binh-phap")
    run_immortal_loop()


@app.command()
def monitor() -> None:
    """
    Alias for immortal.
    """
    run_immortal_loop()
