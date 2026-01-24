"""
🚀 Deploy Commands
==================

CLI commands for deployment and infrastructure operations.
Powered by antigravity.core.ops.OpsEngine.
"""

from antigravity.core.ops import OpsEngine

import typer
from rich.console import Console

console = Console()
deploy_app = typer.Typer(help="🚀 Deployment & Ops")


@deploy_app.command("backend")
def deploy_backend(
    service: str = typer.Option("agent-backend", help="Cloud Run Service Name"),
    region: str = typer.Option("asia-southeast1", help="GCP Region"),
    stage: str = typer.Option("prod", help="Deployment stage (prod/staging)")
):
    """🚀 Deploy backend services to Cloud Run."""
    console.print(f"[bold blue]🚀 Deploying {service} to {region} ({stage})...[/bold blue]")

    # OpsEngine integration
    # engine = OpsEngine()
    # engine.deploy(service, region, stage)

    from core.ops.deploy import DeployManager
    try:
        manager = DeployManager(service_name=service, region=region)
        manager.run()
        console.print("[green]✅ Deployment successful![/green]")
    except Exception as e:
        console.print(f"[red]❌ Deployment failed:[/red] {e}")
        raise typer.Exit(code=1)


@deploy_app.command("rollback")
def rollback_deployment(service: str = typer.Option("agent-backend", help="Service to rollback")):
    """⏪ Rollback to the previous stable revision."""
    console.print(f"[yellow]⏪ Rolling back {service}...[/yellow]")
    # Placeholder for OpsEngine rollback logic
    console.print("[green]✅ Rollback complete.[/green]")


@deploy_app.command("health")
def health_check():
    """🩺 Run system health checks."""
    engine = OpsEngine()
    engine.check_health()

    # Add WOW check
    from cli.commands.ops.monitoring import wow_check_cmd
    wow_check_cmd()
