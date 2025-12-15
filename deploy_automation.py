"""
Deploy Automation Module for Mekong-CLI
Handles gcloud builds, secret injection, and Supabase linking.
"""

import os
import subprocess
import typer
from rich.console import Console
from pathlib import Path

console = Console()

def run_deploy():
    """Execute the full deployment pipeline."""
    console.print("\n[bold blue]🚀 Starting Deployment Pipeline[/bold blue]")
    
    # 1. Pre-flight Checks
    _check_command("gcloud")
    _check_command("supabase")
    
    project_id = _get_gcloud_project()
    console.print(f"Target Project: [green]{project_id}[/green]")
    
    # 2. Secret Injection
    console.print("\n[yellow]🔐 Injecting Secrets to Cloud Run...[/yellow]")
    env_vars = _parse_env_file(".env")
    if not env_vars:
        console.print("[red]❌ .env file missing or empty. Run 'mekong generate-secrets' first.[/red]")
        raise typer.Exit(1)
        
    # 3. Build & Deploy Backend
    service_name = "agent-backend"
    console.print(f"\n[yellow]🏗️  Building & Deploying {service_name}...[/yellow]")
    
    # Construct gcloud command
    cmd = [
        "gcloud", "run", "deploy", service_name,
        "--source", "./backend",
        "--project", project_id,
        "--region", "asia-southeast1",
        "--allow-unauthenticated",
        "--set-env-vars", ",".join([f"{k}={v}" for k, v in env_vars.items()])
    ]
    
    # Add standard config
    cmd.extend(["--memory", "2Gi", "--cpu", "2", "--timeout", "900"])
    
    try:
        subprocess.run(cmd, check=True)
        console.print(f"[bold green]✅ Backend Deployed Successfully![/bold green]")
    except subprocess.CalledProcessError:
        console.print("[bold red]❌ Deploy Failed[/bold red]")
        raise typer.Exit(1)

    # 4. Supabase Migration (Optional)
    if typer.confirm("Run Supabase migrations?"):
        try:
            subprocess.run(["supabase", "db", "push"], check=True)
            console.print("[green]✅ Database Migrated[/green]")
        except subprocess.CalledProcessError:
            console.print("[red]⚠️  Migration Failed[/red]")

def _check_command(cmd: str):
    if shutil.which(cmd) is None:
        console.print(f"[bold red]Error:[/bold red] '{cmd}' is not installed.")
        raise typer.Exit(1)

def _get_gcloud_project():
    try:
        return subprocess.check_output(
            ["gcloud", "config", "get-value", "project"], 
            text=True
        ).strip()
    except:
        return "unknown"

def _parse_env_file(path: str):
    if not os.path.exists(path):
        return {}
    vars = {}
    with open(path, "r") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                key, val = line.strip().split("=", 1)
                vars[key] = val
    return vars

import shutil
