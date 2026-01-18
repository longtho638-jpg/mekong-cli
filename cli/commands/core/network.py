import typer
import subprocess
from rich.console import Console

console = Console()
network_app = typer.Typer(help="🌐 Network Optimization (Vietnam ISP Bypass)")

@network_app.command("status")
def show_status():
    """Show current network status."""
    try:
        subprocess.run(
            ["python3", "scripts/network_optimizer.py", "--status"],
            check=False
        )
    except Exception as e:
        console.print(f"[red]Error checking status: {e}[/red]")

@network_app.command("optimize")
def optimize():
    """Run network optimization."""
    console.print("🔄 Running network optimization...")
    try:
        subprocess.run(
            ["python3", "scripts/network_optimizer.py"],
            check=False
        )
    except Exception as e:
        console.print(f"[red]Error optimizing: {e}[/red]")

@network_app.command("warp")
def connect_warp():
    """Connect to WARP (Free, Recommended)."""
    console.print("🔄 Connecting WARP...")
    # Disable Tailscale exit node first
    subprocess.run(["tailscale", "set", "--exit-node="], capture_output=True)
    result = subprocess.run(["warp-cli", "connect"], capture_output=False)
    if result.returncode == 0:
        console.print("[green]✅ WARP connected![/green]")

@network_app.command("mullvad")
def connect_mullvad(region: str = typer.Argument("sg", help="Region: sg, hk, jp")):
    """Connect to Mullvad via Tailscale."""
    nodes = {
        "sg": "sg-sin-wg-001.mullvad.ts.net",
        "hk": "hk-hkg-wg-201.mullvad.ts.net",
        "jp": "jp-tyo-wg-001.mullvad.ts.net",
    }
    node = nodes.get(region, nodes["sg"])

    console.print(f"🔄 Connecting Mullvad ({region.upper()})...")
    # Disconnect WARP first
    subprocess.run(["warp-cli", "disconnect"], capture_output=True)

    result = subprocess.run(
        [
            "tailscale",
            "up",
            "--accept-routes",
            f"--exit-node={node}",
            "--exit-node-allow-lan-access",
        ],
        capture_output=False,
    )
    if result.returncode == 0:
        console.print(f"[green]✅ Mullvad {region.upper()} connected![/green]")

@network_app.command("off")
def disconnect_all():
    """Disconnect all VPN connections."""
    console.print("🔄 Disconnecting all...")
    subprocess.run(["warp-cli", "disconnect"], capture_output=True)
    subprocess.run(["tailscale", "set", "--exit-node="], capture_output=True)
    console.print("[green]✅ All VPN connections disabled[/green]")
