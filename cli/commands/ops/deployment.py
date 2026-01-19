"""
🚀 Deployment Operations Module
================================

Backend deployment to Google Cloud Run and other platforms.

Commands:
- deploy: Deploy backend to Cloud Run
"""

import typer
from rich.console import Console

console = Console()


def deploy_backend_cmd(
    service: str = typer.Option("agent-backend", help="Cloud Run Service Name"),
    region: str = typer.Option("asia-southeast1", help="GCP Region")
):
    """🚀 Deploy backend to Google Cloud Run."""
    from core.ops.deploy import DeployManager

    try:
        manager = DeployManager(service_name=service, region=region)
        manager.run()
    except Exception as e:
        console.print(f"[red]Deploy failed:[/red] {e}")
        raise typer.Exit(code=1)
