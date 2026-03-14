"""
Platform orchestration commands — mekong up/down/ps/logs.
Wraps PM2 for process management.
"""

import typer
import subprocess
import os
import json
from pathlib import Path
from rich.console import Console
from rich.table import Table

app = typer.Typer(help="Platform: start/stop/monitor all services")
console = Console()

ECOSYSTEM = Path(__file__).parent.parent.parent / "mekong" / "daemon" / "ecosystem.config.js"
MEKONG_ROOT = Path(__file__).parent.parent.parent


def _run_pm2(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    env = {**os.environ, "MEKONG_ROOT": str(MEKONG_ROOT)}
    return subprocess.run(["pm2"] + args, capture_output=True, text=True, env=env, check=False)


@app.command("up")
def platform_up(
    profile: str = typer.Option("standard", help="minimal | standard | full"),
    only: str = typer.Option(None, help="Start specific app only"),
) -> None:
    """Start all platform services via PM2."""
    # Ensure log directory exists
    (MEKONG_ROOT / ".mekong" / "logs").mkdir(parents=True, exist_ok=True)

    env = {**os.environ, "MEKONG_ROOT": str(MEKONG_ROOT), "MEKONG_PROFILE": profile}

    if only:
        result = subprocess.run(
            ["pm2", "start", str(ECOSYSTEM), "--only", only],
            env=env, capture_output=True, text=True,
        )
    else:
        result = subprocess.run(
            ["pm2", "start", str(ECOSYSTEM)],
            env=env, capture_output=True, text=True,
        )

    if result.returncode == 0:
        console.print(f"[bold green]✅ Platform started (profile: {profile})[/bold green]")
        platform_ps()
    else:
        console.print(f"[bold red]❌ Failed to start platform[/bold red]")
        console.print(result.stderr)
        console.print("\n[dim]Is PM2 installed? Run: npm install -g pm2[/dim]")


@app.command("down")
def platform_down(
    only: str = typer.Option(None, help="Stop specific app only"),
) -> None:
    """Stop all platform services."""
    if only:
        _run_pm2(["stop", only])
        console.print(f"[yellow]⏹ Stopped {only}[/yellow]")
    else:
        _run_pm2(["stop", "all"])
        console.print("[yellow]⏹ All services stopped[/yellow]")


@app.command("ps")
def platform_ps() -> None:
    """Show status of all platform services."""
    result = _run_pm2(["jlist"])
    if result.returncode != 0 or not result.stdout.strip():
        console.print("[dim]No services running. Run: mekong up[/dim]")
        return

    try:
        processes = json.loads(result.stdout)
    except json.JSONDecodeError:
        console.print("[dim]PM2 returned invalid JSON[/dim]")
        return

    table = Table(title="🏯 Mekong Platform Services")
    table.add_column("Name", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("CPU", justify="right")
    table.add_column("MEM", justify="right")
    table.add_column("Uptime", justify="right")
    table.add_column("Restarts", justify="right")

    for p in processes:
        name = p.get("name", "?")
        status = p.get("pm2_env", {}).get("status", "unknown")
        cpu = f"{p.get('monit', {}).get('cpu', 0)}%"
        mem_bytes = p.get("monit", {}).get("memory", 0)
        mem = f"{mem_bytes / 1024 / 1024:.0f}M"
        uptime_ms = p.get("pm2_env", {}).get("pm_uptime", 0)
        restarts = p.get("pm2_env", {}).get("restart_time", 0)

        status_style = "green" if status == "online" else "red" if status == "errored" else "yellow"
        table.add_row(name, f"[{status_style}]{status}[/{status_style}]", cpu, mem, str(uptime_ms), str(restarts))

    console.print(table)


@app.command("logs")
def platform_logs(
    name: str = typer.Argument("all", help="Service name or 'all'"),
    lines: int = typer.Option(50, help="Number of lines"),
) -> None:
    """Show logs for a service."""
    if name == "all":
        subprocess.run(["pm2", "logs", "--lines", str(lines)])
    else:
        subprocess.run(["pm2", "logs", name, "--lines", str(lines)])


@app.command("restart")
def platform_restart(
    name: str = typer.Argument("all", help="Service name or 'all'"),
) -> None:
    """Restart service(s)."""
    _run_pm2(["restart", name])
    console.print(f"[green]🔄 Restarted: {name}[/green]")
