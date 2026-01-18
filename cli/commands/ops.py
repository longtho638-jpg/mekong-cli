import typer
import sys
import time
from pathlib import Path
from rich.console import Console

console = Console()
ops_app = typer.Typer(help="👁️ Operations & Monitoring")

@ops_app.command("watch")
def start_watch():
    """Start the Empire Watcher."""
    from core.monitoring.watcher import EmpireWatcher
    watcher = EmpireWatcher()
    watcher.watch()

@ops_app.command("notify")
def test_notify(message: str):
    """Send a test notification."""
    from core.infrastructure.notifications import NotificationService
    notifier = NotificationService()
    notifier.send("Manual Alert", message, "info")

@ops_app.command("wow")
def check_wow():
    """Run WOW Factor Analysis."""
    from core.monitoring.wow import run_wow_check
    run_wow_check()

@ops_app.command("quota")
def monitor_quota(
    watch: bool = typer.Option(False, "--watch", "-w", help="Live monitoring mode"),
    fmt: str = typer.Option("full", "--format", "-f", help="Output format: full, compact, json")
):
    """Monitor AI model quotas."""
    # Try to import QuotaEngine
    try:
        from antigravity.core.quota_engine import QuotaEngine
    except ImportError:
        try:
            sys.path.insert(0, str(Path(__file__).parents[3]))
            from packages.antigravity.core.quota_engine import QuotaEngine
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
                engine.get_local_quota() # Refresh
        except KeyboardInterrupt:
            console.print("\n[dim]Stopped.[/dim]")
    else:
        console.print(engine.format_cli_output(fmt))
        status = engine.get_current_status()
        if status.get("alerts", {}).get("criticals"):
            console.print("\n[bold red]⚠️  CRITICAL QUOTA ALERTS:[/bold red]")
            for model in status["alerts"]["criticals"]:
                console.print(f"   🔴 {model}")

@ops_app.command("secrets")
def generate_secrets():
    """Interactive secret generation (.env)."""
    from cli.commands.setup import generate_secrets as gen
    gen()

@ops_app.command("network-optimize")
def network_optimize(
    status_only: bool = typer.Option(False, "--status", help="Only show status without optimizing"),
    daemon: bool = typer.Option(False, "--daemon", help="Run in continuous daemon mode")
):
    """Optimize network connectivity (WARP/Tailscale)."""
    from core.ops.network import NetworkOptimizer
    
    optimizer = NetworkOptimizer()
    
    if status_only:
        report = optimizer.get_status_report()
        console.print("\n[bold]🌐 Network Status[/bold]")
        console.print("=" * 40)
        
        warp = report["warp"]
        console.print(f"WARP: {'[green]✅ Connected[/green]' if warp['connected'] else '[red]❌ Disconnected[/red]'}")
        
        ts = report["tailscale"]
        console.print(f"Tailscale: {'[green]✅ Online[/green]' if ts.get('online') else '[red]❌ Offline[/red]'}")
        console.print(f"Exit Node: {'[green]✅ Active[/green]' if ts.get('exit_node_active') else '[yellow]❌ Disabled[/yellow]'}")
        
        console.print(f"\n📍 Colo: {report['colo']}")
        console.print(f"⏱️ Ping: {report['latency']}ms")
        
        quality_color = {"EXCELLENT": "green", "GOOD": "blue", "POOR": "red"}
        q_color = quality_color.get(report['quality'], "white")
        console.print(f"✅ Quality: [{q_color}]{report['quality']}[/{q_color}]")
        return

    if daemon:
        console.print("[bold cyan]🚀 Starting Network Optimizer Daemon...[/bold cyan]")
        try:
            while True:
                optimizer.optimize()
                time.sleep(60)
        except KeyboardInterrupt:
            console.print("\n[dim]Stopped.[/dim]")
    else:
        optimizer.optimize()