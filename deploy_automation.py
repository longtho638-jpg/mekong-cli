"""
Deploy Automation Module for Mekong-CLI.
Handles gcloud builds, secret injection, and Supabase linking for Google Cloud Run deployments.
"""

import os
import shutil
import subprocess
import typer
from pathlib import Path
from typing import Dict, Optional
from rich.console import Console

console = Console()

def run_deploy():
    """Execute the full deployment pipeline to Cloud Run."""
    console.print("\n[bold blue]🚀 Starting Deployment Pipeline[/bold blue]")
    
    # 1. Pre-flight Checks
    _check_command("gcloud")
    # Supabase CLI is optional for deployment but good for migrations
    # _check_command("supabase") 
    
    project_id = _get_gcloud_project()
    if project_id == "unknown":
        console.print("[red]❌ Could not determine Google Cloud Project ID. Run 'gcloud config set project <PROJECT_ID>'[/red]")
        raise typer.Exit(1)
        
    console.print(f"Target Project: [green]{project_id}[/green]")
    
    # 2. Secret Injection
    console.print("\n[yellow]🔐 Injecting Secrets to Cloud Run...[/yellow]")
    env_vars = _parse_env_file(".env")
    if not env_vars:
        console.print("[red]❌ .env file missing or empty. Run 'mekong generate-secrets' first.[/red]")
        raise typer.Exit(1)
        
    # 3. Build & Deploy Backend
    service_name = "agent-backend"
    region = "asia-southeast1"
    
    console.print(f"\n[yellow]🏗️  Building & Deploying {service_name} to {region}...[/yellow]")
    
    # Filter out empty values to avoid gcloud errors
    valid_env_vars = {k: v for k, v in env_vars.items() if v}
    env_flags = ",".join([f"{k}={v}" for k, v in valid_env_vars.items()])

    # Construct gcloud command
    # using --source . uploads the current directory to Cloud Build
    cmd = [
        "gcloud", "run", "deploy", service_name,
        "--source", "./backend",
        "--project", project_id,
        "--region", region,
        "--allow-unauthenticated", # Public API for demonstration
        "--set-env-vars", env_flags
    ]
    
    # Add standard config
    # 2GB RAM / 2 vCPU is good for Agentic workloads
    cmd.extend(["--memory", "2Gi", "--cpu", "2", "--timeout", "900"])
    
    try:
        # Stream output to console
        subprocess.run(cmd, check=True)
        console.print(f"\n[bold green]✅ Backend Deployed Successfully![/bold green]")
        console.print(f"   Service URL should be visible above.")
        
    except subprocess.CalledProcessError:
        console.print("\n[bold red]❌ Deploy Failed. Check the logs above.[/bold red]")
        raise typer.Exit(1)

    # 4. Supabase Migration (Optional)
    if shutil.which("supabase"):
        if typer.confirm("\nRun Supabase migrations?"):
            try:
                subprocess.run(["supabase", "db", "push"], check=True)
                console.print("[green]✅ Database Migrated[/green]")
            except subprocess.CalledProcessError:
                console.print("[red]⚠️  Migration Failed[/red]")
    else:
         console.print("\n[dim]Supabase CLI not found, skipping migrations.[/dim]")

def _check_command(cmd: str) -> None:
    """Verify that a command-line tool is installed."""
    if shutil.which(cmd) is None:
        console.print(f"[bold red]Error:[/bold red] '{cmd}' is not installed or not in PATH.")
        console.print(f"Please install it before proceeding.")
        raise typer.Exit(1)

def _get_gcloud_project() -> str:
    """Retrieve the current active project ID from gcloud config."""
    try:
        result = subprocess.check_output(
            ["gcloud", "config", "get-value", "project"], 
            text=True,
            stderr=subprocess.DEVNULL
        ).strip()
        return result if result else "unknown"
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"

def _parse_env_file(path: str) -> Dict[str, str]:
    """Parse a .env file into a dictionary."""
    if not os.path.exists(path):
        return {}
    
    env_vars = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                
                if "=" in line:
                    key, val = line.split("=", 1)
                    # Remove potential quotes around values
                    val = val.strip().strip('"').strip("'")
                    env_vars[key.strip()] = val
    except Exception as e:
        console.print(f"[red]Error reading .env file:[/red] {e}")
        return {}
        
    return env_vars