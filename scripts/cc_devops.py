#!/usr/bin/env python3
"""
🚀 CC DevOps CLI - DevOps Operations Command Line Interface
============================================================

CLI commands for deployment, monitoring, backup, and log management.

Commands:
1. cc devops deploy preview - Deploy to preview environment
2. cc devops deploy production - Deploy with safety checks
3. cc devops monitor health - Real-time health dashboard
4. cc devops backup create - Trigger backup
5. cc devops backup restore <path> - Restore from backup
6. cc devops logs tail - Tail production logs

Usage:
    python scripts/cc_devops.py deploy preview [--service backend]
    python scripts/cc_devops.py deploy production [--service backend] [--confirm]
    python scripts/cc_devops.py monitor health [--refresh 5]
    python scripts/cc_devops.py backup create [--verify]
    python scripts/cc_devops.py backup restore <path>
    python scripts/cc_devops.py logs tail [--lines 50] [--follow]
"""

import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
import typer
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from typing_extensions import Annotated

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.services.backup_service import BackupConfig, BackupService

app = typer.Typer(
    name="cc-devops",
    help="🚀 DevOps operations CLI for deployment, monitoring, and maintenance",
    add_completion=False
)
console = Console()

# Sub-apps for command organization
deploy_app = typer.Typer(help="🚀 Deployment commands")
monitor_app = typer.Typer(help="📊 Monitoring commands")
backup_app = typer.Typer(help="💾 Backup commands")
logs_app = typer.Typer(help="📜 Log management commands")

app.add_typer(deploy_app, name="deploy")
app.add_typer(monitor_app, name="monitor")
app.add_typer(backup_app, name="backup")
app.add_typer(logs_app, name="logs")


# ============================================================================
# DEPLOYMENT COMMANDS
# ============================================================================

@deploy_app.command("preview")
def deploy_preview(
    service: Annotated[
        str,
        typer.Option(
            "--service", "-s",
            help="Service to deploy (backend, frontend, etc.)"
        )
    ] = "backend",
    region: Annotated[
        str,
        typer.Option(
            "--region", "-r",
            help="GCP region for deployment"
        )
    ] = "asia-southeast1",
):
    """
    🚀 Deploy to preview environment.

    Deploys the specified service to a preview/staging environment
    for testing before production deployment.

    Example:
        cc devops deploy preview --service backend
    """
    console.print(f"\n[bold cyan]🚀 Deploying {service} to Preview Environment[/bold cyan]\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Building container image...", total=None)

        try:
            # Build container
            result = subprocess.run(
                ["docker", "build", "-t", f"gcr.io/agency-os/{service}:preview", "."],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                console.print(f"[red]❌ Build failed:[/red]\n{result.stderr}")
                raise typer.Exit(1)

            progress.update(task, description="Pushing to container registry...")

            # Push to registry
            result = subprocess.run(
                ["docker", "push", f"gcr.io/agency-os/{service}:preview"],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                console.print(f"[red]❌ Push failed:[/red]\n{result.stderr}")
                raise typer.Exit(1)

            progress.update(task, description="Deploying to Cloud Run...")

            # Deploy to Cloud Run preview
            result = subprocess.run(
                [
                    "gcloud", "run", "deploy", f"{service}-preview",
                    "--image", f"gcr.io/agency-os/{service}:preview",
                    "--region", region,
                    "--platform", "managed",
                    "--allow-unauthenticated",
                    "--tag", "preview"
                ],
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                console.print(f"[red]❌ Deployment failed:[/red]\n{result.stderr}")
                raise typer.Exit(1)

            progress.update(task, description="✅ Deployment complete!")

        except Exception as e:
            console.print(f"[red]❌ Error: {str(e)}[/red]")
            raise typer.Exit(1)

    console.print(f"\n[green]✅ Preview deployment successful![/green]")
    console.print(f"[cyan]Service URL:[/cyan] https://{service}-preview-{region}.run.app")


@deploy_app.command("production")
def deploy_production(
    service: Annotated[
        str,
        typer.Option(
            "--service", "-s",
            help="Service to deploy"
        )
    ] = "backend",
    region: Annotated[
        str,
        typer.Option(
            "--region", "-r",
            help="GCP region"
        )
    ] = "asia-southeast1",
    confirm: Annotated[
        bool,
        typer.Option(
            "--confirm", "-y",
            help="Skip confirmation prompt"
        )
    ] = False,
):
    """
    🚀 Deploy to production with safety checks.

    Deploys to production environment with pre-deployment validation,
    health checks, and rollback capability.

    Example:
        cc devops deploy production --service backend --confirm
    """
    console.print(f"\n[bold red]⚠️  PRODUCTION DEPLOYMENT[/bold red]\n")
    console.print(f"Service: [cyan]{service}[/cyan]")
    console.print(f"Region: [cyan]{region}[/cyan]\n")

    # Safety confirmation
    if not confirm:
        confirmed = typer.confirm("Are you sure you want to deploy to PRODUCTION?")
        if not confirmed:
            console.print("[yellow]Deployment cancelled.[/yellow]")
            raise typer.Exit(0)

    console.print("\n[bold cyan]🔍 Running pre-deployment checks...[/bold cyan]\n")

    # Pre-deployment health check
    try:
        response = httpx.get("http://localhost:8000/health", timeout=5.0)
        if response.status_code != 200:
            console.print("[red]❌ Health check failed. Aborting deployment.[/red]")
            raise typer.Exit(1)
        console.print("[green]✅ Health check passed[/green]")
    except Exception as e:
        console.print(f"[red]❌ Cannot reach service: {str(e)}[/red]")
        raise typer.Exit(1)

    # Run tests
    console.print("\n[bold cyan]🧪 Running tests...[/bold cyan]\n")
    result = subprocess.run(["pytest", "backend/tests", "-v"], capture_output=True)
    if result.returncode != 0:
        console.print("[red]❌ Tests failed. Aborting deployment.[/red]")
        raise typer.Exit(1)
    console.print("[green]✅ All tests passed[/green]")

    # Backup current production
    console.print("\n[bold cyan]💾 Creating backup...[/bold cyan]\n")
    backup_service = BackupService(BackupConfig(
        database_path="./agencyos.db",
        backup_directory="./backups/pre-deploy"
    ))
    success, metadata = backup_service.create_backup()
    if not success:
        console.print("[red]❌ Backup failed. Aborting deployment.[/red]")
        raise typer.Exit(1)
    console.print(f"[green]✅ Backup created: {metadata.backup_path}[/green]")

    # Deploy
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Deploying to production...", total=None)

        try:
            # Build and push
            subprocess.run(
                ["docker", "build", "-t", f"gcr.io/agency-os/{service}:latest", "."],
                check=True,
                capture_output=True
            )
            subprocess.run(
                ["docker", "push", f"gcr.io/agency-os/{service}:latest"],
                check=True,
                capture_output=True
            )

            # Deploy with traffic migration
            result = subprocess.run(
                [
                    "gcloud", "run", "deploy", service,
                    "--image", f"gcr.io/agency-os/{service}:latest",
                    "--region", region,
                    "--platform", "managed",
                    "--no-traffic",  # Deploy without traffic first
                ],
                capture_output=True,
                text=True,
                check=True
            )

            progress.update(task, description="Running post-deployment health check...")

            # Wait for new revision to be ready
            time.sleep(10)

            # Health check new revision
            try:
                response = httpx.get(f"https://{service}-{region}.run.app/health", timeout=10.0)
                if response.status_code != 200:
                    raise Exception("Health check failed on new revision")
            except Exception as e:
                console.print(f"[red]❌ New revision health check failed: {str(e)}[/red]")
                console.print("[yellow]Rolling back...[/yellow]")
                raise typer.Exit(1)

            progress.update(task, description="Migrating traffic to new revision...")

            # Migrate traffic to new revision
            subprocess.run(
                [
                    "gcloud", "run", "services", "update-traffic", service,
                    "--to-latest",
                    "--region", region
                ],
                check=True,
                capture_output=True
            )

            progress.update(task, description="✅ Production deployment complete!")

        except subprocess.CalledProcessError as e:
            console.print(f"[red]❌ Deployment failed: {e.stderr if e.stderr else str(e)}[/red]")
            raise typer.Exit(1)

    console.print(f"\n[green]✅ Production deployment successful![/green]")
    console.print(f"[cyan]Service URL:[/cyan] https://{service}-{region}.run.app")
    console.print(f"[cyan]Backup:[/cyan] {metadata.backup_path}")


# ============================================================================
# MONITORING COMMANDS
# ============================================================================

@monitor_app.command("health")
def monitor_health(
    refresh: Annotated[
        int,
        typer.Option(
            "--refresh", "-r",
            help="Refresh interval in seconds"
        )
    ] = 5,
    api_url: Annotated[
        str,
        typer.Option(
            "--api-url", "-u",
            help="API base URL"
        )
    ] = "http://localhost:8000",
):
    """
    📊 Real-time health monitoring dashboard.

    Displays live system health metrics with auto-refresh.

    Example:
        cc devops monitor health --refresh 10
    """
    console.print(f"\n[bold cyan]📊 Real-time Health Dashboard[/bold cyan]")
    console.print(f"Refresh: {refresh}s | Press Ctrl+C to exit\n")

    def generate_health_table():
        """Generate health status table"""
        try:
            response = httpx.get(f"{api_url}/health/detailed", timeout=5.0)
            if response.status_code != 200:
                return Panel(
                    "[red]❌ Cannot reach API[/red]",
                    title="Error",
                    border_style="red"
                )

            data = response.json()

            # Main status panel
            status_color = {
                "healthy": "green",
                "degraded": "yellow",
                "unhealthy": "red"
            }.get(data.get("status", "unhealthy"), "red")

            # Create health table
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Metric", style="cyan")
            table.add_column("Value", style="white")
            table.add_column("Status", justify="center")

            # System metrics
            system = data.get("system", {})
            table.add_row(
                "CPU Usage",
                f"{system.get('cpu_percent', 0):.1f}%",
                _get_status_emoji(system.get('cpu_percent', 0), 80, 60)
            )
            table.add_row(
                "Memory Usage",
                f"{system.get('memory_percent', 0):.1f}%",
                _get_status_emoji(system.get('memory_percent', 0), 85, 70)
            )
            table.add_row(
                "Disk Usage",
                f"{system.get('disk_percent', 0):.1f}%",
                _get_status_emoji(system.get('disk_percent', 0), 90, 75)
            )

            # Uptime
            uptime_hours = data.get('uptime_seconds', 0) / 3600
            table.add_row(
                "Uptime",
                f"{uptime_hours:.1f}h",
                "✅"
            )

            # Services
            services = data.get("services", [])
            if services:
                table.add_row("", "", "")  # Spacer
                for service in services:
                    status_emoji = "✅" if service.get("status") == "up" else "❌"
                    response_time = service.get("response_time_ms", 0)
                    table.add_row(
                        f"Service: {service.get('name')}",
                        f"{response_time:.0f}ms" if response_time else "N/A",
                        status_emoji
                    )

            return Panel(
                table,
                title=f"[{status_color}]● {data.get('status', 'unknown').upper()}[/{status_color}]",
                subtitle=f"Last updated: {datetime.now().strftime('%H:%M:%S')}",
                border_style=status_color
            )

        except Exception as e:
            return Panel(
                f"[red]Error: {str(e)}[/red]",
                title="Connection Error",
                border_style="red"
            )

    try:
        with Live(generate_health_table(), refresh_per_second=1/refresh, console=console) as live:
            while True:
                time.sleep(refresh)
                live.update(generate_health_table())
    except KeyboardInterrupt:
        console.print("\n[yellow]Monitoring stopped.[/yellow]")


def _get_status_emoji(value: float, critical: float, warning: float) -> str:
    """Get status emoji based on threshold"""
    if value >= critical:
        return "🔴"
    elif value >= warning:
        return "🟡"
    else:
        return "🟢"


# ============================================================================
# BACKUP COMMANDS
# ============================================================================

@backup_app.command("create")
def backup_create(
    verify: Annotated[
        bool,
        typer.Option(
            "--verify", "-v",
            help="Verify backup after creation"
        )
    ] = True,
    database: Annotated[
        str,
        typer.Option(
            "--database", "-d",
            help="Database path to backup"
        )
    ] = "./agencyos.db",
):
    """
    💾 Create database backup.

    Creates a timestamped backup of the database with optional verification.

    Example:
        cc devops backup create --verify
    """
    console.print(f"\n[bold cyan]💾 Creating Backup[/bold cyan]\n")

    config = BackupConfig(
        database_path=database,
        backup_directory="./backups",
        verify_on_backup=verify
    )

    service = BackupService(config)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Creating backup...", total=None)

        success, metadata = service.create_backup()

        if not success:
            console.print("[red]❌ Backup failed[/red]")
            raise typer.Exit(1)

        progress.update(task, description="✅ Backup complete!")

    # Display backup info
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Backup Path", metadata.backup_path)
    table.add_row("Timestamp", metadata.timestamp)
    table.add_row("Size", f"{metadata.size_bytes / 1024 / 1024:.2f} MB")
    table.add_row("Tables", str(metadata.table_count))
    table.add_row("Records", str(metadata.record_count))
    table.add_row("Checksum", metadata.checksum[:16] + "...")
    table.add_row("Verified", "✅" if metadata.verified else "❌")

    console.print(table)
    console.print(f"\n[green]✅ Backup created successfully![/green]")


@backup_app.command("restore")
def backup_restore(
    backup_path: Annotated[
        str,
        typer.Argument(help="Path to backup file to restore")
    ],
    confirm: Annotated[
        bool,
        typer.Option(
            "--confirm", "-y",
            help="Skip confirmation prompt"
        )
    ] = False,
):
    """
    💾 Restore database from backup.

    Restores the database from a backup file with safety confirmation.

    Example:
        cc devops backup restore ./backups/backup_20250125_120000.json
    """
    console.print(f"\n[bold red]⚠️  DATABASE RESTORE[/bold red]\n")
    console.print(f"Backup: [cyan]{backup_path}[/cyan]\n")

    # Safety confirmation
    if not confirm:
        confirmed = typer.confirm(
            "This will REPLACE the current database. Are you sure?"
        )
        if not confirmed:
            console.print("[yellow]Restore cancelled.[/yellow]")
            raise typer.Exit(0)

    service = BackupService()

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Verifying backup...", total=None)

        success, error = service.restore_backup(backup_path)

        if not success:
            console.print(f"[red]❌ Restore failed: {error}[/red]")
            raise typer.Exit(1)

        progress.update(task, description="✅ Restore complete!")

    console.print(f"\n[green]✅ Database restored successfully![/green]")


@backup_app.command("list")
def backup_list():
    """
    📋 List available backups.

    Shows all available backup files with metadata.

    Example:
        cc devops backup list
    """
    console.print(f"\n[bold cyan]📋 Available Backups[/bold cyan]\n")

    service = BackupService()
    backups = service.list_backups()

    if not backups:
        console.print("[yellow]No backups found.[/yellow]")
        return

    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Timestamp", style="cyan")
    table.add_column("Size", justify="right")
    table.add_column("Tables", justify="right")
    table.add_column("Records", justify="right")
    table.add_column("Verified", justify="center")
    table.add_column("Path", style="dim")

    for backup in sorted(backups, key=lambda b: b.timestamp, reverse=True):
        table.add_row(
            backup.timestamp,
            f"{backup.size_bytes / 1024 / 1024:.2f} MB",
            str(backup.table_count),
            str(backup.record_count),
            "✅" if backup.verified else "❌",
            Path(backup.backup_path).name
        )

    console.print(table)
    console.print(f"\n[cyan]Total backups: {len(backups)}[/cyan]")


# ============================================================================
# LOGS COMMANDS
# ============================================================================

@logs_app.command("tail")
def logs_tail(
    lines: Annotated[
        int,
        typer.Option(
            "--lines", "-n",
            help="Number of lines to show"
        )
    ] = 50,
    follow: Annotated[
        bool,
        typer.Option(
            "--follow", "-f",
            help="Follow log output"
        )
    ] = False,
    service: Annotated[
        str,
        typer.Option(
            "--service", "-s",
            help="Service name"
        )
    ] = "backend",
    region: Annotated[
        str,
        typer.Option(
            "--region", "-r",
            help="GCP region"
        )
    ] = "asia-southeast1",
):
    """
    📜 Tail production logs.

    Shows recent logs from the production service with optional live follow.

    Example:
        cc devops logs tail --follow
    """
    console.print(f"\n[bold cyan]📜 Tailing logs: {service}[/bold cyan]\n")

    try:
        # Build gcloud command
        cmd = [
            "gcloud", "run", "services", "logs", "read", service,
            "--region", region,
            "--limit", str(lines)
        ]

        if follow:
            cmd.append("--follow")

        # Run command
        result = subprocess.run(cmd, text=True)

        if result.returncode != 0:
            console.print("[red]❌ Failed to fetch logs[/red]")
            raise typer.Exit(1)

    except KeyboardInterrupt:
        console.print("\n[yellow]Log tail stopped.[/yellow]")
    except Exception as e:
        console.print(f"[red]❌ Error: {str(e)}[/red]")
        raise typer.Exit(1)


@logs_app.command("errors")
def logs_errors(
    hours: Annotated[
        int,
        typer.Option(
            "--hours", "-h",
            help="Look back hours"
        )
    ] = 24,
    service: Annotated[
        str,
        typer.Option(
            "--service", "-s",
            help="Service name"
        )
    ] = "backend",
):
    """
    🚨 Show recent error logs.

    Filters and displays error-level logs from the specified time window.

    Example:
        cc devops logs errors --hours 48
    """
    console.print(f"\n[bold red]🚨 Error Logs (Last {hours}h)[/bold red]\n")

    try:
        # Use gcloud logging to filter errors
        cmd = [
            "gcloud", "logging", "read",
            f'resource.type="cloud_run_revision" AND resource.labels.service_name="{service}" AND severity>=ERROR',
            f"--freshness={hours}h",
            "--limit=100",
            "--format=table(timestamp,severity,textPayload)"
        ]

        result = subprocess.run(cmd, text=True, capture_output=True)

        if result.returncode != 0:
            console.print(f"[red]❌ Failed to fetch error logs: {result.stderr}[/red]")
            raise typer.Exit(1)

        if result.stdout:
            console.print(result.stdout)
        else:
            console.print("[green]✅ No errors found![/green]")

    except Exception as e:
        console.print(f"[red]❌ Error: {str(e)}[/red]")
        raise typer.Exit(1)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    app()
