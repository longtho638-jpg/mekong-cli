import typer
import sys
import time
import subprocess
from pathlib import Path
from rich.console import Console
from rich.table import Table

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
        
        console.print(f"\n📍 IP: {report['ip_info']}")
        console.print(f"📍 Colo: {report['colo']}")
        console.print(f"⏱️ Ping (1.1.1.1): {report['latency']}ms")
        console.print(f"⏱️ Google: {report['google_latency']:.0f}ms")
        
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

@ops_app.command("network-turbo")
def network_turbo():
    """🚀 Run Viettel/SGN Turbo Mode optimization."""
    from core.ops.network import NetworkOptimizer
    optimizer = NetworkOptimizer()
    console.print("[bold magenta]🚀 Activatiing VIETTEL TURBO MODE...[/bold magenta]")
    if optimizer.turbo_mode():
        console.print("[green]✅ Turbo Mode Activated Successfully![/green]")
    else:
        console.print("[red]❌ Turbo Mode Failed. Try 'network-bypass' for alternatives.[/red]")

@ops_app.command("network-scan")
def network_scan():
    """🔍 Scan WARP endpoints for lowest latency."""
    from core.ops.network import NetworkOptimizer
    optimizer = NetworkOptimizer()
    
    console.print("[cyan]🔍 Scanning endpoints...[/cyan]")
    results = optimizer.scan_endpoints()
    
    table = Table(title="📊 Top Endpoints")
    table.add_column("Endpoint", style="bold")
    table.add_column("Latency (UDP)", justify="right")
    
    for ip, port, lat in results[:10]:
        color = "green" if lat < 50 else "yellow"
        table.add_row(f"{ip}:{port}", f"[{color}]{lat:.1f}ms[/{color}]")
        
    console.print(table)

@ops_app.command("network-bypass")
def network_bypass():
    """🛡️ Show ISP Bypass Solutions (Manual)."""
    console.print("\n[bold]🏯 VIETTEL BYPASS TOOLKIT - Binh Pháp[/bold]")
    console.print("=" * 60)
    console.print(""")

1. 🥇 [bold]OUTLINE VPN[/bold] (Best for Viettel)
   → Self-host on DigitalOcean Singapore ($5/mo)
   → Protocol: Shadowsocks (hard to detect/block)
   → Install: [cyan]brew install --cask outline-client[/cyan]

2. 🥈 [bold]TAILSCALE + MULLVAD[/bold]
   → Enable Mullvad integration in Tailscale Admin
   → Choose exit node: Singapore or Tokyo
   → No self-hosting needed

3. 🥉 [bold]VPS + WIREGUARD[/bold]
   → Buy VPS Singapore (Vultr/DO/Linode ~$5/mo)
   → Install WireGuard 1-click script
   → Direct tunnel, fast

4. 💡 [bold]QUICK FIXES[/bold] (no VPS needed):
   → Run: [green]main.py ops network-turbo[/green]
   → Google DNS: 8.8.8.8, 8.8.4.4
   → Cloudflare DNS: 1.1.1.1, 1.0.0.1
""")

@ops_app.command("health")
def health_check():
    """🩺 Run System Health Check."""
    console.print("\n[bold]🩺 SYSTEM HEALTH CHECK[/bold]")
    console.print("=" * 40)

    all_ok = True

    # 1. Git
    result = subprocess.run(["git", "status"], capture_output=True)
    is_git_ok = result.returncode == 0
    console.print(f"  {'[green]✅[/green]' if is_git_ok else '[red]❌[/red]'} Git Repository")
    all_ok &= is_git_ok

    # 2. Python
    result = subprocess.run(["python3", "--version"], capture_output=True)
    is_python_ok = result.returncode == 0
    console.print(f"  {'[green]✅[/green]' if is_python_ok else '[red]❌[/red]'} Python 3 Environment")
    all_ok &= is_python_ok

    # 3. Core Modules
    modules = ["core", "cli", "backend"]
    for mod in modules:
        is_mod_ok = Path(mod).exists() and Path(f"{mod}/__init__.py").exists() if mod != "backend" else Path(mod).exists()
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
