"""
Deploy Automation Module for Mekong-CLI.
Handles gcloud builds, secret injection, and Supabase linking for Google Cloud Run deployments.
"""

import os
import shutil
import subprocess
import typer
from typing import Dict, Optional
from rich.console import Console
from rich.panel import Panel
from rich.status import Status

console = Console()

class DeployManager:
    """Handles the deployment lifecycle of Agency OS services."""

    def __init__(self, service_name: str = "agent-backend", region: str = "asia-southeast1"):
        self.service_name = service_name
        self.region = region
        self.project_id: Optional[str] = None

    def validate_environment(self) -> bool:
        """Checks if all required tools and configs are present."""
        console.print("[bold blue]🔍 Pre-flight Checks...[/bold blue]")
        
        required_tools = ["gcloud", "git"]
        for tool in required_tools:
            if not shutil.which(tool):
                console.print(f"❌ [red]Required tool '{tool}' not found in PATH.[/red]")
                return False
        
        self.project_id = self._get_gcloud_project()
        if not self.project_id or self.project_id == "unknown":
            console.print("❌ [red]Google Cloud Project ID not set. Run: 'gcloud config set project <ID>'[/red]")
            return False
            
        if not os.path.isdir("./backend"):
            console.print("❌ [red]Directory './backend' not found. Ensure you are in the project root.[/red]")
            return False

        console.print(f"   ✅ Project: [green]{self.project_id}[/green]")
        return True

    def _get_gcloud_project(self) -> str:
        try:
            return subprocess.check_output(
                ["gcloud", "config", "get-value", "project"], 
                text=True, stderr=subprocess.DEVNULL
            ).strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            return "unknown"

    def parse_env(self, path: str = ".env") -> Dict[str, str]:
        """Reads secrets from .env file."""
        if not os.path.exists(path):
            return {}
        
        env_vars = {}
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip().strip('"').strip("'")
        return env_vars

    def run(self):
        """Executes the full deployment pipeline."""
        console.print(Panel("[bold green]🚀 STARTING DEPLOYMENT PIPELINE[/bold green]", expand=False))

        if not self.validate_environment():
            raise typer.Exit(1)

        # 1. Prepare Secrets
        env_vars = self.parse_env()
        if not env_vars:
            console.print("⚠️  [yellow].env file missing or empty. Deploying without custom secrets...[/yellow]")
        
        valid_env = {k: v for k, v in env_vars.items() if v}
        env_flags = ",".join([f"{k}={v}" for k, v in valid_env.items()])

        # 2. Deploy to Cloud Run
        with Status(f"[bold yellow]🏗️  Building & Deploying {self.service_name}...", console=console):
            cmd = [
                "gcloud", "run", "deploy", self.service_name,
                "--source", "./backend",
                "--project", self.project_id,
                "--region", self.region,
                "--allow-unauthenticated",
                "--memory", "2Gi",
                "--cpu", "2",
                "--timeout", "900"
            ]
            if env_flags:
                cmd.extend(["--set-env-vars", env_flags])

            try:
                # Use subprocess.Popen for streaming or run for simple execution
                process = subprocess.run(cmd, capture_output=True, text=True)
                if process.returncode != 0:
                    console.print("\n[bold red]❌ GCloud Deploy Failed[/bold red]")
                    console.print(process.stderr)
                    raise typer.Exit(1)
                
                console.print(f"\n✅ [bold green]{self.service_name} deployed successfully![/bold green]")
                
            except Exception as e:
                console.print(f"\n❌ [bold red]Unexpected error during deploy:[/bold red] {e}")
                raise typer.Exit(1)

        # 3. DB Migrations
        if shutil.which("supabase") and os.path.exists("supabase"):
            if typer.confirm("\n📦 Run Supabase migrations?"):
                subprocess.run(["supabase", "db", "push"])

def run_deploy():
    """Wrapper for CLI command."""
    manager = DeployManager()
    manager.run()

if __name__ == "__main__":
    run_deploy()