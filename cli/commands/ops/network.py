"""
🌐 Network Operations Module
=============================

Network diagnostics, optimization, and bypass solutions.

Commands:
- network-optimize: Optimize WARP/Tailscale connectivity
- network-turbo: Activate Viettel SGN Turbo Mode
- network-scan: Scan WARP endpoints for lowest latency
- network-bypass: Show ISP bypass toolkit
"""

import time
from typing import Any, Dict

import typer
from rich.console import Console
from rich.table import Table

from cli.utils.subprocess_safe import run_safe_silent

console = Console()


def network_optimize_cmd(
    status_only: bool = typer.Option(False, "--status", help="Only show status without optimizing"),
    daemon: bool = typer.Option(False, "--daemon", help="Run in continuous daemon mode")
):
    """🌐 Optimize network connectivity (WARP/Tailscale)."""
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


def network_turbo_cmd():
    """🚀 Activate Viettel/SGN Turbo Mode optimization."""
    from core.ops.network import NetworkOptimizer

    optimizer = NetworkOptimizer()
    console.print("[bold magenta]🚀 Activating VIETTEL TURBO MODE...[/bold magenta]")

    if optimizer.turbo_mode():
        console.print("[green]✅ Turbo Mode Activated Successfully![/green]")
    else:
        console.print("[red]❌ Turbo Mode Failed. Try 'network-bypass' for alternatives.[/red]")


def network_scan_cmd():
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


def network_bypass_cmd():
    """🛡️ Show ISP Bypass Solutions (Manual)."""
    console.print("\n[bold]🏯 VIETTEL BYPASS TOOLKIT - Binh Pháp[/bold]")
    console.print("=" * 60)
    console.print("""
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
