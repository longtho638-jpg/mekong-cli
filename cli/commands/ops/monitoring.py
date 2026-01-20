"""
📊 Monitoring Operations Module
================================

System health, quota tracking, and WOW factor analysis.

Commands:
- watch: Start Empire Watcher
- quota: Monitor AI model quotas
- health: Run system health check
- wow: Run WOW Factor Analysis
"""

import sys
import time
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from cli.utils.subprocess_safe import run_safe, SubprocessError

console = Console()


def watch_cmd():
    """👁️ Start the Empire Watcher."""
    from core.monitoring.watcher import EmpireWatcher

    watcher = EmpireWatcher()
    watcher.watch()


def monitor_quota_cmd(
    watch: bool = typer.Option(False, "--watch", "-w", help="Live monitoring mode"),
    fmt: str = typer.Option("full", "--format", "-f", help="Output format: full, compact, json")
):
    """📊 Monitor AI model quotas."""
    # Try to import QuotaEngine
    try:
        from antigravity.core.quota import QuotaEngine
    except ImportError:
        try:
            sys.path.insert(0, str(Path(__file__).parents[3]))
            from packages.antigravity.core.quota import QuotaEngine
        except ImportError:
            QuotaEngine = None

    if not QuotaEngine:
        console.print("[red]❌ QuotaEngine not found.[/red]")
        return

    engine = QuotaEngine()

    if watch:
        console.print("\n[bold cyan]📊 LIVE QUOTA MONITORING[/bold cyan]")
        console.print("[dim]Press Ctrl+C to exit[/dim]\n")
        try:
            while True:
                console.clear()
                console.print("[bold cyan]📊 LIVE QUOTA MONITORING[/bold cyan]")
                console.print(engine.format_cli_output(fmt))
                time.sleep(30)
                engine.get_local_quota()  # Refresh
        except KeyboardInterrupt:
            console.print("\n[dim]Stopped.[/dim]")
    else:
        console.print(engine.format_cli_output(fmt))
        status = engine.get_current_status()
        if status.get("alerts", {}).get("criticals"):
            console.print("\n[bold red]⚠️  CRITICAL QUOTA ALERTS:[/bold red]")
            for model in status["alerts"]["criticals"]:
                console.print(f"   🔴 {model}")


def health_check_cmd():
    """🩺 Run System Health Check."""
    console.print("\n[bold]🩺 SYSTEM HEALTH CHECK[/bold]")
    console.print("=" * 40)

    all_ok = True

    # 1. Git
    try:
        run_safe(["git", "status"], timeout=5)
        is_git_ok = True
    except SubprocessError:
        is_git_ok = False

    console.print(f"  {'[green]✅[/green]' if is_git_ok else '[red]❌[/red]'} Git Repository")
    all_ok &= is_git_ok

    # 2. Python
    try:
        run_safe(["python3", "--version"], timeout=5)
        is_python_ok = True
    except SubprocessError:
        is_python_ok = False

    console.print(f"  {'[green]✅[/green]' if is_python_ok else '[red]❌[/red]'} Python 3 Environment")
    all_ok &= is_python_ok

    # 3. Core Modules
    modules = ["core", "cli", "backend"]
    for mod in modules:
        is_mod_ok = Path(mod).exists() and (
            Path(f"{mod}/__init__.py").exists() if mod != "backend" else True
        )
        console.print(f"  {'[green]✅[/green]' if is_mod_ok else '[red]❌[/red]'} Module: {mod}")
        all_ok &= is_mod_ok

    # 4. Products
    products = list(Path("products").glob("*.zip"))
    is_prod_ok = len(products) > 0
    console.print(f"  {'[green]✅[/green]' if is_prod_ok else '[yellow]⚠️[/yellow]'} Products ({len(products)} found)")
    # Not failing health check if products missing, just warning

    console.print("=" * 40)
    if all_ok:
        console.print("[bold green]✅ ALL SYSTEMS OPERATIONAL[/bold green]\n")
    else:
        console.print("[bold yellow]⚠️  SOME ISSUES DETECTED[/bold yellow]\n")

    if not all_ok:
        raise typer.Exit(code=1)


def wow_check_cmd():
    """✨ Run WOW Factor Analysis."""
    from core.monitoring.wow import run_wow_check

    run_wow_check()
