import typer
import sys
import time
from pathlib import Path
from rich.console import Console
from core.monitoring.watcher import EmpireWatcher
from core.infrastructure.notifications import NotificationService

# Try to import QuotaEngine
try:
    from antigravity.core.quota_engine import QuotaEngine
except ImportError:
    # Fallback if package structure is different
    try:
        sys.path.insert(0, str(Path(__file__).parents[3]))
        from packages.antigravity.core.quota_engine import QuotaEngine
    except ImportError:
        QuotaEngine = None

console = Console()
ops_app = typer.Typer(help="👁️ Operations & Monitoring")

@ops_app.command("watch")
def start_watch():
    """Start the Empire Watcher."""
    watcher = EmpireWatcher()
    watcher.watch()

@ops_app.command("notify")
def test_notify(message: str):
    """Send a test notification."""
    notifier = NotificationService()
    notifier.send("Manual Alert", message, "info")

@ops_app.command("quota")
def monitor_quota(
    watch: bool = typer.Option(False, "--watch", "-w", help="Live monitoring mode"),
    fmt: str = typer.Option("full", "--format", "-f", help="Output format: full, compact, json")
):
    """Monitor AI model quotas."""
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
                engine.get_local_quota() # Refresh
        except KeyboardInterrupt:
            console.print("\n[dim]Stopped.[/dim]")
    else:
        console.print(engine.format_cli_output(fmt))
        status = engine.get_current_status()
        if status.get("alerts", {{}}).get("criticals"):
            console.print("\n[bold red]⚠️  CRITICAL QUOTA ALERTS:[/bold red]")
            for model in status["alerts"]["criticals"]:
                console.print(f"   🔴 {{model}}")