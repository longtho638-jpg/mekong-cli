"""
Daemon CLI commands — status, metrics, queue monitoring.

Commands:
- mekong daemon:status — Show worker statuses
- mekong daemon:metrics — Show performance metrics
- mekong daemon:queue — Show dispatch queue
- mekong daemon:alerts — Show recent Jidoka alerts
"""

from __future__ import annotations

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from src.daemon.mission_control import (
    get_worker_status,
    get_metrics,
    get_dispatch_queue,
    get_recent_alerts,
    get_status_summary,
)

app = typer.Typer(help="Daemon: monitor and manage daemon army")
console = Console()


@app.command("status")
def daemon_status() -> None:
    """Show status of all daemon workers."""
    workers = get_worker_status()

    if not workers:
        console.print("[yellow]⚠ No daemon workers found. Is PM2 running?[/yellow]")
        console.print("[dim]Run: mekong platform up[/dim]")
        return

    table = Table(title="🎯 Daemon Army Status")
    table.add_column("Name", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("CPU", justify="right")
    table.add_column("Memory", justify="right")
    table.add_column("Uptime", justify="right")
    table.add_column("Restarts", justify="right")
    table.add_column("PID", justify="right")

    for w in workers:
        status_style = (
            "green"
            if w.status == "online"
            else "red"
            if w.status == "errored"
            else "yellow"
        )
        uptime_sec = w.uptime_ms // 1000
        uptime_str = f"{uptime_sec // 3600}h {(uptime_sec % 3600) // 60}m"

        table.add_row(
            w.name,
            f"[{status_style}]{w.status}[/{status_style}]",
            f"{w.cpu:.1f}%",
            f"{w.memory_mb:.0f}MB",
            uptime_str,
            str(w.restarts),
            str(w.pid) if w.pid else "-",
        )

    console.print(table)

    # Summary
    online = sum(1 for w in workers if w.status == "online")
    if online == len(workers):
        console.print(Panel(f"[green]✅ All {len(workers)} workers online[/green]"))
    else:
        console.print(
            Panel(
                f"[yellow]⚠ {len(workers) - online} of {len(workers)} workers offline[/yellow]"
            )
        )


@app.command("metrics")
def daemon_metrics() -> None:
    """Show performance metrics for the daemon army."""
    metrics = get_metrics()

    table = Table(title="📊 Daemon Army Metrics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="bold")

    table.add_row("Total Workers", str(metrics.total_workers))
    table.add_row("Online Workers", f"[green]{metrics.online_workers}[/green]")
    table.add_row("Throughput", f"{metrics.throughput_per_minute:.2f} tasks/min")
    table.add_row(
        "Success Rate",
        f"[green]{metrics.success_rate:.1f}%[/green]"
        if metrics.success_rate >= 95
        else f"[yellow]{metrics.success_rate:.1f}%[/yellow]"
        if metrics.success_rate >= 80
        else f"[red]{metrics.success_rate:.1f}%[/red]",
    )
    table.add_row("Queue Depth", str(metrics.queue_depth))
    table.add_row("Avg Response Time", f"{metrics.avg_response_time_ms:.0f}ms")
    table.add_row("Last Updated", metrics.last_updated)

    console.print(table)

    # Health indicator
    if metrics.online_workers == metrics.total_workers and metrics.success_rate >= 95:
        console.print(Panel("[green]🟢 System Healthy[/green]"))
    elif metrics.online_workers < metrics.total_workers or metrics.success_rate < 80:
        console.print(Panel("[red]🔴 System Degraded - Check workers[/red]"))
    else:
        console.print(Panel("[yellow]🟡 System Warning - Monitor closely[/yellow]"))


@app.command("queue")
def daemon_queue(limit: int = typer.Option(20, help="Max items to show")) -> None:
    """Show dispatch queue."""
    queue = get_dispatch_queue()

    if not queue:
        console.print("[dim]📭 Dispatch queue is empty[/dim]")
        return

    table = Table(title="📋 Dispatch Queue")
    table.add_column("Priority", style="bold")
    table.add_column("Task ID", style="cyan")
    table.add_column("Description")
    table.add_column("Status", style="bold")
    table.add_column("Assigned To")
    table.add_column("Created")

    priority_colors = {
        "CRITICAL": "[red]🔴 CRITICAL[/red]",
        "HIGH": "[orange]🟠 HIGH[/orange]",
        "MEDIUM": "[yellow]🟡 MEDIUM[/yellow]",
        "LOW": "[green]🟢 LOW[/green]",
    }

    for i, item in enumerate(queue[:limit]):
        priority_display = priority_colors.get(item.priority, item.priority)
        status_display = (
            f"[green]{item.status}[/green]"
            if item.status == "completed"
            else f"[blue]{item.status}[/blue]"
        )

        table.add_row(
            priority_display,
            item.task_id[:8] + "..." if len(item.task_id) > 8 else item.task_id,
            item.description[:50] + "..." if len(item.description) > 50 else item.description,
            status_display,
            item.assigned_to or "[dim]unassigned[/dim]",
            item.created_at[:16] if item.created_at else "[dim]unknown[/dim]",
        )

    console.print(table)

    if len(queue) > limit:
        console.print(f"[dim]... and {len(queue) - limit} more items[/dim]")


@app.command("alerts")
def daemon_alerts(limit: int = typer.Option(10, help="Max alerts to show")) -> None:
    """Show recent Jidoka alerts."""
    alerts = get_recent_alerts(limit)

    if not alerts:
        console.print(Panel("[green]✅ No recent Jidoka alerts[/green]", title="🚨 Alerts"))
        return

    console.print(Panel(f"[red]🚨 Recent Jidoka Alerts ({len(alerts)})[/red]", title="Alerts"))

    for alert in alerts:
        # Parse alert format: "🚨 STOP-THE-LINE P0: ..."
        if "STOP-THE-LINE" in alert:
            console.print(f"[red bold]🚨[/red bold] [red]{alert}[/red]")
        elif "error" in alert.lower() or "failed" in alert.lower():
            console.print(f"[orange]⚠ {alert}[/orange]")
        else:
            console.print(f"[yellow]⚡ {alert}[/yellow]")


@app.command("summary")
def daemon_summary() -> None:
    """Show complete daemon summary (status + metrics + queue)."""
    summary = get_status_summary()

    console.print(Panel(f"🎯 Daemon Army Summary - {summary['timestamp'][:19]}", style="bold cyan"))

    # Workers section
    console.print("\n[bold cyan]📊 Workers:[/bold cyan]")
    workers_table = Table(show_header=False, box=None)
    workers_table.add_column("Key")
    workers_table.add_column("Value")

    m = summary["metrics"]
    workers_table.add_row("Total", str(m["total_workers"]))
    workers_table.add_row("Online", f"[green]{m['online_workers']}[/green]")
    workers_table.add_row("Throughput", f"{m['throughput_per_minute']:.2f} tasks/min")
    workers_table.add_row("Success Rate", f"{m['success_rate']:.1f}%")

    console.print(workers_table)

    # Queue section
    console.print(f"\n[bold cyan]📋 Queue Depth:[/bold cyan] {m['queue_depth']}")

    # Recent alerts
    if summary["recent_alerts"]:
        console.print(f"\n[bold red]🚨 Recent Alerts ({len(summary['recent_alerts'])}):[/bold red]")
        for alert in summary["recent_alerts"][-3:]:
            console.print(f"  [dim]• {alert}[/dim]")
    else:
        console.print("\n[bold green]✅ No recent alerts[/bold green]")
