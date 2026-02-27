"""CLI commands for Tom Hum AGI daemon management."""
import json
import pathlib
import subprocess

import typer
from rich.console import Console

from src.agents.agi_bridge import AGIBridge

app = typer.Typer(help="Tom Hum AGI daemon management")
console = Console()


@app.command()
def start() -> None:
    """Start the Tom Hum AGI daemon."""
    bridge = AGIBridge()
    if bridge.is_running():
        console.print("[yellow]Daemon already running[/yellow]")
        return
    console.print("[dim]Starting Tom Hum daemon...[/dim]")
    ok = bridge.start()
    if ok:
        console.print("[green]Daemon started successfully[/green]")
    else:
        console.print("[red]Failed to start daemon (task-watcher.js not found or node error)[/red]")
        raise typer.Exit(code=1)


@app.command()
def stop() -> None:
    """Stop the Tom Hum AGI daemon."""
    bridge = AGIBridge()
    if bridge.stop():
        console.print("[green]Daemon stopped[/green]")
    else:
        console.print("[yellow]No daemon process to stop[/yellow]")


@app.command()
def status() -> None:
    """Show AGI health, score, and mission stats."""
    bridge = AGIBridge()
    data = bridge.status()
    if "error" in data:
        console.print(f"[red]{data['error']}[/red]")
        raise typer.Exit(code=1)
    console.print_json(json.dumps(data, indent=2))


@app.command()
def metrics() -> None:
    """Show detailed AGI metrics."""
    bridge = AGIBridge()
    data = bridge.metrics()
    if "error" in data:
        console.print(f"[red]{data['error']}[/red]")
        raise typer.Exit(code=1)
    console.print_json(json.dumps(data, indent=2))


@app.command()
def mission(
    content: str = typer.Argument(..., help="Mission content or path to .txt file"),
) -> None:
    """Dispatch a mission to the daemon via tasks/ directory."""
    bridge = AGIBridge()
    p = pathlib.Path(content)
    if p.exists() and p.is_file():
        text = p.read_text(encoding="utf-8")
    else:
        text = content
    filepath = bridge.dispatch(text)
    console.print(f"[green]Mission dispatched:[/green] {filepath}")


@app.command()
def logs(
    lines: int = typer.Option(50, help="Number of log lines to show"),
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow log output"),
) -> None:
    """View Tom Hum daemon logs."""
    bridge = AGIBridge()
    if follow:
        log_path = pathlib.Path.home() / "tom_hum_cto.log"
        if not log_path.exists():
            console.print("[red]Log file not found: ~/tom_hum_cto.log[/red]")
            raise typer.Exit(code=1)
        subprocess.run(["tail", "-f", str(log_path)])
    else:
        output = bridge.logs(lines=lines)
        console.print(output)
