"""Monitor command - Monitor system resources, performance, and application health"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn
import subprocess
import sys
from pathlib import Path
import time
import os
import json
from datetime import datetime

try:
    import psutil
except ImportError:
    psutil = None
    print("⚠️  psutil not found. Install with: pip install psutil")

app = typer.Typer()
console = Console()


@app.command()
def resources(
    interval: float = typer.Option(1.0, "--interval", "-i", help="Refresh interval in seconds"),
    count: int = typer.Option(10, "--count", "-c", help="Number of readings (0 for continuous)"),
    show_processes: bool = typer.Option(False, "--processes", "-p", help="Show top processes by CPU/Memory"),
):
    """Monitor system resources (CPU, Memory, Disk, Network)"""

    if psutil is None:
        console.print("[red]❌ psutil not installed. Install with: pip install psutil[/red]")
        return

    console.print(f"[bold]🖥️  Monitoring system resources (interval: {interval}s, count: {count})...[/bold]")

    readings = 0
    try:
        while count == 0 or readings < count:
            # Clear screen between updates
            if readings > 0:
                time.sleep(interval)

            # Get system metrics
            cpu_percent = psutil.cpu_percent(interval=None)
            memory = psutil.virtual_memory()
            disk_usage = psutil.disk_usage('/')
            network = psutil.net_io_counters()

            # Create metrics table
            table = Table(title=f"System Resources - {datetime.now().strftime('%H:%M:%S')}")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="magenta")
            table.add_column("Details", style="dim")

            table.add_row("CPU Usage", f"{cpu_percent}%", f"({psutil.cpu_count()} cores)")
            table.add_row("Memory Usage", f"{memory.percent}%", f"{memory.used // 1024 // 1024} MB / {memory.total // 1024 // 1024} MB")
            table.add_row("Disk Usage", f"{disk_usage.percent}%", f"{disk_usage.used // 1024 // 1024 // 1024} GB / {disk_usage.total // 1024 // 1024 // 1024} GB")
            table.add_row("Network (Bytes)", f"↑ {network.bytes_sent // 1024} KB", f"↓ {network.bytes_recv // 1024} KB")

            console.print(table)

            if show_processes:
                show_top_processes()

            readings += 1

    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️  Monitoring stopped by user[/yellow]")


def show_top_processes():
    """Show top processes by CPU and memory usage"""
    if psutil is None:
        console.print("[red]❌ psutil not installed. Install with: pip install psutil[/red]")
        return

    # Get all processes and sort by CPU usage
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
        try:
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Sort by CPU usage (descending)
    cpu_sorted = sorted(processes, key=lambda p: p['cpu_percent'] or 0, reverse=True)[:5]

    # Sort by memory usage (descending)
    mem_sorted = sorted(processes, key=lambda p: p['memory_percent'] or 0, reverse=True)[:5]

    # Show top CPU consumers
    cpu_table = Table(title="Top 5 CPU Consumers")
    cpu_table.add_column("PID", style="cyan", justify="right")
    cpu_table.add_column("Name", style="bold")
    cpu_table.add_column("CPU %", style="magenta")

    for proc in cpu_sorted:
        cpu_table.add_row(str(proc['pid']), proc['name'], f"{proc['cpu_percent'] or 0}%")

    # Show top memory consumers
    mem_table = Table(title="Top 5 Memory Consumers")
    mem_table.add_column("PID", style="cyan", justify="right")
    mem_table.add_column("Name", style="bold")
    mem_table.add_column("Mem %", style="magenta")

    for proc in mem_sorted:
        mem_table.add_row(str(proc['pid']), proc['name'], f"{proc['memory_percent'] or 0}%")

    console.print(cpu_table)
    console.print(mem_table)


@app.command()
def health(
    app_type: str = typer.Option("web", "--type", "-t", help="Application type: web, api, worker, custom"),
    port: int = typer.Option(8000, "--port", "-p", help="Port to check"),
    url: str = typer.Option("http://localhost", "--url", "-u", help="URL to check"),
    timeout: int = typer.Option(10, "--timeout", help="Timeout in seconds"),
):
    """Check application health and readiness"""

    console.print(f"[bold]🏥 Checking health of {app_type} application at {url}:{port}...[/bold]")

    health_checks = []

    # Perform health checks based on app type
    if app_type in ["web", "api"]:
        health_result = check_web_health(url, port, timeout)
        health_checks.append(("Web Server", health_result))

        # Check common API endpoints
        api_endpoints = ["/health", "/status", "/api/health", "/ping"]
        for endpoint in api_endpoints:
            result = check_endpoint(f"{url}:{port}{endpoint}", timeout)
            if result[1]:  # If check succeeded
                health_checks.append((f"API {endpoint}", result))

    # Check system resources if psutil is available
    if psutil is not None:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        resource_status = "✅ Healthy" if cpu_percent < 80 and memory.percent < 80 and disk.percent < 80 else "⚠️  Unhealthy"
        health_checks.append(("System Resources", (resource_status, f"CPU: {cpu_percent}%, Memory: {memory.percent}%, Disk: {disk.percent}%")))

        # Check for common processes
        processes_to_check = ["python", "node", "nginx", "redis", "postgres"]
        for proc_name in processes_to_check:
            proc_exists = any(proc_name in p.name().lower() for p in psutil.process_iter(['name']))
            proc_status = "✅ Running" if proc_exists else "❌ Not running"
            health_checks.append((f"{proc_name.capitalize()} Process", (proc_status, "Found" if proc_exists else "Not found")))
    else:
        health_checks.append(("System Resources", ("⚠️  Unavailable", "Install psutil for resource monitoring")))
        health_checks.append(("Process Check", ("⚠️  Unavailable", "Install psutil for process monitoring")))

    # Display health report
    table = Table(title="Health Check Results")
    table.add_column("Component", style="cyan")
    table.add_column("Status", style="magenta")
    table.add_column("Details", style="dim")

    all_healthy = True
    for name, (status, details) in health_checks:
        status_icon = "✅" if "Healthy" in status or "Running" in status else "❌" if "Not" in status else "⚠️"
        all_healthy = all_healthy and ("Healthy" in status or "Running" in status)

        table.add_row(name, f"{status_icon} {status}", details)

    console.print(table)

    if all_healthy:
        console.print("[green]✅ All systems healthy![/green]")
    else:
        console.print("[red]❌ Some systems are unhealthy[/red]")
        raise typer.Exit(code=1)


def check_web_health(base_url: str, port: int, timeout: int):
    """Check if web server is responding"""
    try:
        import urllib.request
        import urllib.error

        url = f"{base_url}:{port}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mekong CLI Monitor'})
        start_time = time.time()
        response = urllib.request.urlopen(req, timeout=timeout)
        response_time = time.time() - start_time

        if response.getcode() < 400:
            return (f"✅ Healthy", f"Response: {response.getcode()}, Time: {response_time:.2f}s")
        else:
            return (f"❌ Unhealthy", f"Response: {response.getcode()}")
    except Exception as e:
        return (f"❌ Unhealthy", f"Error: {str(e)}")


def check_endpoint(url: str, timeout: int):
    """Check a specific endpoint"""
    try:
        import urllib.request
        import urllib.error

        req = urllib.request.Request(url, headers={'User-Agent': 'Mekong CLI Monitor'})
        start_time = time.time()
        response = urllib.request.urlopen(req, timeout=timeout)
        response_time = time.time() - start_time

        if response.getcode() < 400:
            return (f"✅ Healthy", f"Response: {response.getcode()}, Time: {response_time:.2f}s")
        else:
            return (f"❌ Unhealthy", f"Response: {response.getcode()}")
    except Exception as e:
        return (f"❌ Unhealthy", f"Error: {str(e)}")


@app.command()
def logs(
    service: str = typer.Argument(..., help="Service to monitor: app, nginx, apache, docker, custom"),
    lines: int = typer.Option(50, "--lines", "-n", help="Number of lines to show"),
    follow: bool = typer.Option(False, "--follow", "-f", help="Follow log output"),
    filter_pattern: str = typer.Option(None, "--filter", "-F", help="Filter logs by pattern"),
):
    """Monitor application logs"""

    console.print(f"[bold]📝 Monitoring logs for {service} (last {lines} lines)...[/bold]")

    if service == "app":
        # Look for common log files
        log_locations = [
            "logs/app.log",
            "log/app.log",
            "/var/log/app.log",
            "app.log",
            "main.log"
        ]

        log_file = None
        for loc in log_locations:
            if Path(loc).exists():
                log_file = loc
                break

        if not log_file:
            console.print("[yellow]⚠️  App log file not found in common locations[/yellow]")
            console.print("[dim]Expected locations: logs/app.log, log/app.log, /var/log/app.log, app.log[/dim]")
            return

        tail_log(log_file, lines, follow, filter_pattern)

    elif service == "nginx":
        log_file = "/var/log/nginx/access.log" if Path("/var/log/nginx/access.log").exists() else "/var/log/nginx/error.log"
        if Path(log_file).exists():
            tail_log(log_file, lines, follow, filter_pattern)
        else:
            console.print(f"[red]❌ Nginx log file not found: {log_file}[/red]")

    elif service == "apache":
        log_file = "/var/log/apache2/access.log" if Path("/var/log/apache2/access.log").exists() else "/var/log/apache2/error.log"
        if Path(log_file).exists():
            tail_log(log_file, lines, follow, filter_pattern)
        else:
            console.print(f"[red]❌ Apache log file not found: {log_file}[/red]")

    elif service == "docker":
        if not is_command_available("docker"):
            console.print("[red]❌ Docker not found[/red]")
            return

        container_name = os.environ.get("DOCKER_CONTAINER_NAME", "current")
        cmd = ["docker", "logs", "--tail", str(lines)]
        if follow:
            cmd.append("-f")
        cmd.append(container_name)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            console.print(Panel(result.stdout, title=f"Docker Logs ({container_name})"))
        except subprocess.CalledProcessError as e:
            console.print(f"[red]❌ Error getting Docker logs: {e.stderr}[/red]")

    elif service == "custom":
        custom_log_path = os.environ.get("CUSTOM_LOG_PATH", "./custom.log")
        if Path(custom_log_path).exists():
            tail_log(custom_log_path, lines, follow, filter_pattern)
        else:
            console.print(f"[red]❌ Custom log file not found: {custom_log_path}[/red]")
            console.print("[dim]Set CUSTOM_LOG_PATH environment variable to specify log location[/dim]")
    else:
        console.print(f"[red]❌ Unknown service: {service}[/red]")
        console.print("[dim]Supported services: app, nginx, apache, docker, custom[/dim]")


def tail_log(log_file: str, lines: int, follow: bool, filter_pattern: str = None):
    """Display log file contents"""
    try:
        import subprocess
        cmd = ["tail", "-n", str(lines)]
        if follow:
            cmd.append("-f")
        cmd.append(log_file)

        if filter_pattern:
            # Combine tail with grep
            tail_process = subprocess.Popen(cmd[:-1], stdout=subprocess.PIPE, text=True)
            grep_cmd = ["grep", filter_pattern]
            if follow:
                grep_cmd.append("--line-buffered")

            result = subprocess.run(grep_cmd, stdin=tail_process.stdout, capture_output=True, text=True)
            output = result.stdout
        else:
            result = subprocess.run(cmd, capture_output=True, text=True)
            output = result.stdout

        if output:
            panel_title = f"Log: {log_file}"
            if filter_pattern:
                panel_title += f" (filtered: {filter_pattern})"
            if follow:
                panel_title += " - LIVE"

            console.print(Panel(output, title=panel_title))
        else:
            console.print(f"[dim]No recent log entries in {log_file}[/dim]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Error reading log: {e}[/red]")
    except FileNotFoundError:
        console.print("[red]❌ 'tail' command not found. Please install coreutils.[/red]")


def is_command_available(command: str) -> bool:
    """Check if a command is available in PATH"""
    import shutil
    return shutil.which(command) is not None


@app.command()
def performance(
    duration: int = typer.Option(30, "--duration", "-d", help="Duration to monitor in seconds"),
    output_file: str = typer.Option(None, "--output", "-o", help="Output file for metrics"),
):
    """Monitor application performance over time"""

    if psutil is None:
        console.print("[red]❌ psutil not installed. Install with: pip install psutil[/red]")
        return

    console.print(f"[bold]📈 Performance monitoring for {duration} seconds...[/bold]")

    metrics_history = []
    start_time = time.time()

    with Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
    ) as progress:
        task = progress.add_task("[cyan]Monitoring...", total=duration)

        while time.time() - start_time < duration:
            current_time = time.time() - start_time
            progress.update(task, completed=current_time)

            # Collect metrics
            cpu_percent = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            disk_io = psutil.disk_io_counters()
            network_io = psutil.net_io_counters()

            metrics = {
                "timestamp": time.time(),
                "elapsed": current_time,
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_used_mb": memory.used // 1024 // 1024,
                "disk_read_mb": disk_io.read_bytes // 1024 // 1024 if disk_io else 0,
                "disk_write_mb": disk_io.write_bytes // 1024 // 1024 if disk_io else 0,
                "network_sent_mb": network_io.bytes_sent // 1024 // 1024,
                "network_recv_mb": network_io.bytes_recv // 1024 // 1024,
            }

            metrics_history.append(metrics)
            time.sleep(1)  # Collect metrics every second

    # Calculate summary
    avg_cpu = sum(m["cpu_percent"] for m in metrics_history) / len(metrics_history) if metrics_history else 0
    avg_memory = sum(m["memory_percent"] for m in metrics_history) / len(metrics_history) if metrics_history else 0
    peak_cpu = max((m["cpu_percent"] for m in metrics_history), default=0)
    peak_memory = max((m["memory_percent"] for m in metrics_history), default=0)

    console.print("\n[bold]📊 Performance Summary[/bold]")
    summary_table = Table()
    summary_table.add_column("Metric", style="cyan")
    summary_table.add_column("Average", style="magenta")
    summary_table.add_column("Peak", style="yellow")

    summary_table.add_row("CPU Usage", f"{avg_cpu:.1f}%", f"{peak_cpu:.1f}%")
    summary_table.add_row("Memory Usage", f"{avg_memory:.1f}%", f"{peak_memory:.1f}%")

    console.print(summary_table)

    # Show metrics over time
    if len(metrics_history) > 1:
        console.print("\n[bold]📈 Metrics Over Time[/bold]")
        time_table = Table()
        time_table.add_column("Time (s)", style="cyan", justify="right")
        time_table.add_column("CPU %", style="magenta", justify="right")
        time_table.add_column("Memory %", style="yellow", justify="right")

        # Show every 5th metric or up to 10 metrics
        step = max(1, len(metrics_history) // 10)
        for i in range(0, len(metrics_history), step):
            metric = metrics_history[i]
            time_table.add_row(
                f"{metric['elapsed']:.0f}",
                f"{metric['cpu_percent']:.1f}",
                f"{metric['memory_percent']:.1f}"
            )

        console.print(time_table)

    # Save to file if requested
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(metrics_history, f, indent=2)
        console.print(f"\n[green]💾 Metrics saved to {output_file}[/green]")


@app.command()
def alerts():
    """Set up and manage monitoring alerts"""

    console.print(Panel("[bold]🔔 Monitoring Alerts[/bold]", title="Alert Configuration"))

    # Show current alert configuration
    alert_configs = [
        ("CPU Threshold", "85%", "Trigger when CPU exceeds threshold"),
        ("Memory Threshold", "90%", "Trigger when memory exceeds threshold"),
        ("Disk Threshold", "95%", "Trigger when disk usage exceeds threshold"),
        ("Response Time", "5s", "Trigger when response time exceeds threshold"),
        ("Error Rate", "5%", "Trigger when error rate exceeds threshold")
    ]

    table = Table(title="Current Alert Configuration")
    table.add_column("Alert Type", style="cyan")
    table.add_column("Threshold", style="magenta")
    table.add_column("Description", style="dim")

    for alert_type, threshold, description in alert_configs:
        table.add_row(alert_type, threshold, description)

    console.print(table)

    console.print("\n[dim]To configure alerts, set environment variables:[/dim]")
    console.print("[dim]MEKONG_ALERT_CPU_THRESHOLD=85[/dim]")
    console.print("[dim]MEKONG_ALERT_MEMORY_THRESHOLD=90[/dim]")
    console.print("[dim]MEKONG_ALERT_DISK_THRESHOLD=95[/dim]")


if __name__ == "__main__":
    app()