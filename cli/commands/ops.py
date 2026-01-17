import typer
from rich.console import Console
from core.monitoring.watcher import EmpireWatcher
from core.infrastructure.notifications import NotificationService

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
