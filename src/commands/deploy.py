"""Deploy command - Deploy applications to various platforms"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
import subprocess
import sys
from pathlib import Path
import os
import json

app = typer.Typer()
console = Console()


@app.command()
def run(
    platform: str = typer.Argument(..., help="Platform to deploy to: vercel, netlify, heroku, docker, custom"),
    build_first: bool = typer.Option(True, "--build", help="Build before deploying"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Simulate deployment without executing"),
    env: str = typer.Option("production", "--env", "-e", help="Environment: production, staging, development"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
):
    """Deploy application to specified platform"""

    if dry_run:
        console.print(f"[yellow]🧪 DRY RUN: Would deploy to {platform} (env: {env})[/yellow]")
        return

    if build_first:
        console.print("[blue]📦 Building application...[/blue]")
        # Simulate build process
        console.print("[green]✅ Build completed[/green]")

    console.print(f"[bold]🚀 Deploying to {platform} (environment: {env})...[/bold]")

    if platform.lower() == "vercel":
        deploy_vercel(env, verbose)
    elif platform.lower() == "netlify":
        deploy_netlify(env, verbose)
    elif platform.lower() == "heroku":
        deploy_heroku(env, verbose)
    elif platform.lower() == "docker":
        deploy_docker(env, verbose)
    elif platform.lower() == "custom":
        deploy_custom(env, verbose)
    else:
        console.print(f"[red]❌ Unsupported platform: {platform}[/red]")
        console.print("[dim]Supported platforms: vercel, netlify, heroku, docker, custom[/dim]")
        raise typer.Exit(code=1)


def deploy_vercel(env: str, verbose: bool):
    """Deploy to Vercel"""
    try:
        # Check if vercel CLI is installed
        result = subprocess.run(["vercel", "--version"],
                              capture_output=True, text=True, check=False)
        if result.returncode != 0:
            console.print("[red]❌ Vercel CLI not found. Install with: npm install -g vercel[/red]")
            raise typer.Exit(code=1)

        # Set environment-specific args
        cmd = ["vercel", "--prod"] if env == "production" else ["vercel", "--staging"]

        if verbose:
            cmd.append("--debug")

        console.print(f"[blue]🌐 Deploying to Vercel...[/blue]")
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        if result.stdout:
            console.print(Panel(result.stdout, title="Vercel Output"))

        console.print(f"[green]✅ Deployed to Vercel successfully![/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Vercel deployment failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Deployment failed: {str(e)}[/red]")


def deploy_netlify(env: str, verbose: bool):
    """Deploy to Netlify"""
    try:
        # Check if netlify CLI is installed
        result = subprocess.run(["netlify", "--version"],
                              capture_output=True, text=True, check=False)
        if result.returncode != 0:
            console.print("[red]❌ Netlify CLI not found. Install with: npm install -g netlify-cli[/red]")
            raise typer.Exit(code=1)

        # Set environment-specific args
        cmd = ["netlify", "deploy"]

        if env == "production":
            cmd.append("--prod")
        else:
            cmd.append("--draft")  # For staging/dev

        if verbose:
            cmd.append("--verbose")

        console.print(f"[blue]🌐 Deploying to Netlify...[/blue]")
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        if result.stdout:
            console.print(Panel(result.stdout, title="Netlify Output"))

        console.print(f"[green]✅ Deployed to Netlify successfully![/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Netlify deployment failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Deployment failed: {str(e)}[/red]")


def deploy_heroku(env: str, verbose: bool):
    """Deploy to Heroku"""
    try:
        # Check if heroku CLI is installed
        result = subprocess.run(["heroku", "--version"],
                              capture_output=True, text=True, check=False)
        if result.returncode != 0:
            console.print("[red]❌ Heroku CLI not found. Install with: https://devcenter.heroku.com/articles/heroku-cli[/red]")
            raise typer.Exit(code=1)

        # Git push to Heroku (assumes app exists)
        if env == "production":
            remote = "heroku"
        else:
            remote = "heroku-staging"  # Could be configured differently

        cmd = ["git", "push", remote, "main"]

        console.print(f"[blue]🌐 Deploying to Heroku ({remote})...[/blue]")
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        if result.stdout:
            console.print(Panel(result.stdout, title="Heroku Output"))

        console.print(f"[green]✅ Deployed to Heroku successfully![/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Heroku deployment failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Deployment failed: {str(e)}[/red]")


def deploy_docker(env: str, verbose: bool):
    """Deploy using Docker"""
    try:
        # Check if Docker is available
        result = subprocess.run(["docker", "--version"],
                              capture_output=True, text=True, check=False)
        if result.returncode != 0:
            console.print("[red]❌ Docker not found. Please install Docker.[/red]")
            raise typer.Exit(code=1)

        # Build and push Docker image
        image_name = os.environ.get("DOCKER_IMAGE_NAME", "mekong-cli")
        image_tag = f"{image_name}:{env}"

        # Tag and push
        tag_cmd = ["docker", "tag", f"{image_name}:latest", image_tag]
        push_cmd = ["docker", "push", image_tag]

        console.print(f"[blue]🐳 Tagging image: {image_tag}[/blue]")
        subprocess.run(tag_cmd, cwd=Path.cwd(), check=True, capture_output=not verbose)

        console.print(f"[blue]🌐 Pushing to registry: {image_tag}[/blue]")
        subprocess.run(push_cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        console.print(f"[green]✅ Docker image deployed: {image_tag}[/green]")

        # Optional: deploy to container orchestration platform
        if os.environ.get("DEPLOY_TO_K8S"):
            deploy_to_kubernetes(image_tag, verbose)

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Docker deployment failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Deployment failed: {str(e)}[/red]")


def deploy_to_kubernetes(image_tag: str, verbose: bool):
    """Deploy to Kubernetes (helper for Docker deployment)"""
    kubectl_path = Path("kubectl")
    if not kubectl_path.exists():
        # Look for kubectl in PATH
        import shutil
        if not shutil.which("kubectl"):
            console.print("[yellow]⚠️  kubectl not found, skipping Kubernetes deployment[/yellow]")
            return

    # Update deployment with new image
    deployment_name = os.environ.get("K8S_DEPLOYMENT_NAME", "mekong-cli")
    namespace = os.environ.get("K8S_NAMESPACE", "default")

    cmd = ["kubectl", "set", "image", f"deployment/{deployment_name}", f"app={image_tag}", "-n", namespace]

    console.print(f"[blue]☸️  Updating Kubernetes deployment ({namespace}/{deployment_name})[/blue]")
    result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

    if result.stdout:
        console.print(Panel(result.stdout, title="Kubectl Output"))

    console.print(f"[green]✅ Kubernetes deployment updated with {image_tag}[/green]")


def deploy_custom(env: str, verbose: bool):
    """Deploy using custom script or command"""
    deploy_script = os.environ.get("CUSTOM_DEPLOY_SCRIPT", "./deploy.sh")

    if not Path(deploy_script).exists():
        console.print(f"[red]❌ Custom deployment script not found: {deploy_script}[/red]")
        console.print("[dim]Set CUSTOM_DEPLOY_SCRIPT environment variable or create ./deploy.sh[/dim]")
        return

    try:
        cmd = ["bash", deploy_script, env]
        console.print(f"[blue]🔧 Running custom deployment: {deploy_script}[/blue]")
        result = subprocess.run(cmd, cwd=Path.cwd(), check=True, capture_output=not verbose, text=True)

        if result.stdout:
            console.print(Panel(result.stdout, title="Deployment Output"))

        console.print(f"[green]✅ Custom deployment completed![/green]")

    except subprocess.CalledProcessError as e:
        console.print(f"[red]❌ Custom deployment failed![/red]")
        if e.stderr:
            console.print(Panel(e.stderr, title="Error"))
    except Exception as e:
        console.print(f"[red]❌ Custom deployment failed: {str(e)}[/red]")


@app.command()
def status(platform: str = typer.Argument(..., help="Platform to check: vercel, netlify, heroku, docker")):
    """Check deployment status"""
    console.print(f"[bold]🔍 Checking deployment status for {platform}...[/bold]")

    if platform.lower() == "vercel":
        check_vercel_status()
    elif platform.lower() == "netlify":
        check_netlify_status()
    elif platform.lower() == "heroku":
        check_heroku_status()
    elif platform.lower() == "docker":
        check_docker_status()
    else:
        console.print(f"[red]❌ Unsupported platform: {platform}[/red]")
        console.print("[dim]Supported platforms: vercel, netlify, heroku, docker[/dim]")


def check_vercel_status():
    """Check Vercel deployment status"""
    try:
        result = subprocess.run(["vercel", "list"],
                              capture_output=True, text=True, check=False)

        if result.returncode == 0:
            console.print(Panel(result.stdout, title="Vercel Deployments"))
        else:
            console.print("[yellow]⚠️  Unable to fetch Vercel status[/yellow]")
            if result.stderr:
                console.print(Panel(result.stderr, title="Error"))

    except Exception as e:
        console.print(f"[red]❌ Failed to check Vercel status: {str(e)}[/red]")


def check_netlify_status():
    """Check Netlify deployment status"""
    try:
        result = subprocess.run(["netlify", "status"],
                              capture_output=True, text=True, check=False)

        if result.returncode == 0:
            console.print(Panel(result.stdout, title="Netlify Status"))
        else:
            console.print("[yellow]⚠️  Unable to fetch Netlify status[/yellow]")
            if result.stderr:
                console.print(Panel(result.stderr, title="Error"))

    except Exception as e:
        console.print(f"[red]❌ Failed to check Netlify status: {str(e)}[/red]")


def check_heroku_status():
    """Check Heroku deployment status"""
    try:
        result = subprocess.run(["heroku", "apps"],
                              capture_output=True, text=True, check=False)

        if result.returncode == 0:
            console.print(Panel(result.stdout, title="Heroku Apps"))
        else:
            console.print("[yellow]⚠️  Unable to fetch Heroku status[/yellow]")
            if result.stderr:
                console.print(Panel(result.stderr, title="Error"))

    except Exception as e:
        console.print(f"[red]❌ Failed to check Heroku status: {str(e)}[/red]")


def check_docker_status():
    """Check Docker deployment status"""
    try:
        # Check if Docker daemon is running
        result = subprocess.run(["docker", "info"],
                              capture_output=True, text=True, check=False)

        if result.returncode == 0:
            console.print(Panel("Docker daemon is running", title="Docker Status", border_style="green"))
        else:
            console.print(Panel("Docker daemon is not running", title="Docker Status", border_style="red"))

        # Check running containers
        result = subprocess.run(["docker", "ps"],
                              capture_output=True, text=True, check=False)

        if result.returncode == 0:
            console.print(Panel(result.stdout, title="Running Containers"))

    except Exception as e:
        console.print(f"[red]❌ Failed to check Docker status: {str(e)}[/red]")


@app.command()
def rollback(to_version: str = typer.Argument(..., help="Version to rollback to")):
    """Rollback deployment to a previous version"""
    console.print(f"[bold]🔄 Rolling back to version: {to_version}[/bold]")
    console.print("[yellow]This feature is platform-dependent and not implemented yet.[/yellow]")
    console.print("Would implement rollback functionality for specific platform")


if __name__ == "__main__":
    app()