#!/usr/bin/env python3
"""
Mekong-CLI: Automation Tool for Hybrid Agent Franchise
"""

import os
import shutil
import typer
import yaml
import subprocess
from pathlib import Path
from rich.console import Console
from rich.prompt import Prompt
from rich import print as rprint

app = typer.Typer(help="Mekong-CLI: Build & Deploy Hybrid Agents")
console = Console()


# TEMPLATE_REPO = "https://github.com/YOUR_USERNAME/hybrid-agent-template.git"
# Support local path for testing, but default to git repo for production
TEMPLATE_REPO = os.getenv("TEMPLATE_REPO", "https://github.com/YOUR_USERNAME/hybrid-agent-template.git")

@app.command()
def init(project_name: str):
    """
    Initialize a new Hybrid Agent project from the Golden Template.
    """
    console.print(f"[bold blue]🌊 Mekong-CLI:[/bold blue] Initializing {project_name}...")
    
    target_dir = Path(os.getcwd()) / project_name
    
    if target_dir.exists():
        console.print(f"[bold red]Error:[/bold red] Directory {project_name} already exists!")
        raise typer.Exit(code=1)

    # Copy template (Logic switched to git clone for production feeling, but keeping local fallback if handy)
    try:
        if "github.com" in TEMPLATE_REPO:
            console.print(f"   ⬇️  Cloning template from {TEMPLATE_REPO}...")
            subprocess.run(["git", "clone", TEMPLATE_REPO, project_name], check=True)
        else:
            # Fallback for local template during development
            local_template = Path(TEMPLATE_REPO).resolve()
            if not local_template.exists():
                 # Fallback to sibling directory
                 local_template = Path("../hybrid-agent-template").resolve()
            
            if local_template.exists():
                console.print(f"   📂 Copying local template from {local_template}...")
                shutil.copytree(local_template, target_dir)
            else:
                raise Exception(f"Template not found at {TEMPLATE_REPO}")

        console.print(f"   ✅ Template setup complete")

        
        # Remove template git history if inherited
        git_dir = target_dir / ".git"
        if git_dir.exists():
            shutil.rmtree(git_dir)
            console.print("   ✅ Removed old git history")
            
        console.print(f"\n[bold green]🚀 Project {project_name} created successfully![/bold green]")
        console.print(f"Next steps:\n  cd {project_name}\n  mekong setup-vibe")
        
    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command(name="setup-vibe")
def setup_vibe(
    niche: str = typer.Option(..., prompt="Target Niche (e.g., Rice, Fish)"),
    location: str = typer.Option(..., prompt="Location (e.g., Can Tho)"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="Brand Tone")
):
    """
    Customize the Agent's soul (.gemini/GEMINI.md) for a specific niche.
    """
    console.print(f"\n[bold blue]🎨 Setup Vibe:[/bold blue] Tuning for {niche} in {location}...")
    
    cwd = Path(os.getcwd())
    config_path = cwd / "agent.config.yaml"
    gemini_md_path = cwd / ".gemini/GEMINI.md"
    
    if not config_path.exists() or not gemini_md_path.exists():
        console.print("[bold red]Error:[/bold red] Not a valid Mekong project root.")
        raise typer.Exit(code=1)

    # 1. Update agent.config.yaml
    try:
        with open(config_path, "r") as f:
            content = f.read()
        
        # Simple string replacement for config
        content = content.replace('{{ project_name }}', cwd.name)
        content = content.replace('{{ niche }}', niche)
        content = content.replace('{{ location }}', location)
        content = content.replace('{{ tone }}', tone)
        
        with open(config_path, "w") as f:
            f.write(content)
        console.print("   ✅ Updated agent.config.yaml")
        
    except Exception as e:
        console.print(f"[red]Failed to update config:[/red] {e}")

    # 2. Update GEMINI.md (The Soul)
    try:
        with open(gemini_md_path, "r") as f:
            md_content = f.read()
            
        md_content = md_content.replace('{{ project_name }}', cwd.name)
        md_content = md_content.replace('{{ niche }}', niche)
        md_content = md_content.replace('{{ location }}', location)
        md_content = md_content.replace('{{ tone }}', tone)
        
        with open(gemini_md_path, "w") as f:
            f.write(md_content)
        console.print("   ✅ Infused local vibe into GEMINI.md")
        
    except Exception as e:
        console.print(f"[red]Failed to update GEMINI.md:[/red] {e}")

    console.print("\n[bold green]✨ Vibe Setup Complete![/bold green]")


@app.command(name="generate-secrets")
def generate_secrets():
    """
    Interactive secret generation (.env).
    """
    console.print("\n[bold blue]🔐 Secret Generator[/bold blue]")
    
    secrets = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "GOOGLE_API_KEY",
        "OPENROUTER_API_KEY",
        "ELEVENLABS_API_KEY"
    ]
    
    env_content = ""
    for secret in secrets:
        value = Prompt.ask(f"Enter {secret}", password=True)
        env_content += f"{secret}={value}\n"
    
    with open(".env", "w") as f:
        f.write(env_content)
    
    console.print("\n[bold green]✅ .env file created locally (DO NOT COMMIT)[/bold green]")




from deploy_automation import run_deploy
from license import LicenseValidator

@app.command(name="activate")
def activate_cmd(key: str = typer.Option(..., prompt="License Key")):
    """
    Activate Mekong-CLI license.
    """
    console.print("\n[bold blue]🔐 Activating License...[/bold blue]")
    
    validator = LicenseValidator()
    try:
        license_data = validator.activate(key)
        tier = license_data["tier"]
        
        console.print(f"\n[bold green]✅ License Activated![/bold green]")
        console.print(f"   Tier: [cyan]{tier.upper()}[/cyan]")
        console.print(f"   Activated: {license_data['activated_at']}")
        
        # Show tier benefits
        if tier == "starter":
            console.print("\n   Benefits: 1 video/day, 1 niche")
        elif tier == "pro":
            console.print("\n   Benefits: 10 videos/day, 10 niches, white-label")
        elif tier == "enterprise":
            console.print("\n   Benefits: Unlimited everything!")
            
    except ValueError as e:
        console.print(f"\n[bold red]❌ Error:[/bold red] {e}")
        raise typer.Exit(code=1)

@app.command(name="status")
def status_cmd():
    """
    Show current license status and quota.
    """
    validator = LicenseValidator()
    license = validator.get_license()
    
    if not license:
        console.print("\n[yellow]⚠️  No license activated (using Starter tier)[/yellow]")
        console.print("   Limits: 1 video/day, 1 niche")
        console.print("\n   Upgrade: [cyan]mekong activate[/cyan]")
        return
    
    tier = license["tier"]
    console.print(f"\n[bold green]License Status[/bold green]")
    console.print(f"   Tier: [cyan]{tier.upper()}[/cyan]")
    console.print(f"   Activated: {license['activated_at']}")
    
    # Check quota
    video_quota = validator.check_quota("max_daily_video")
    console.print(f"\n   Daily Videos: {video_quota['used']}/{video_quota['limit']}")

@app.command(name="deploy")
def deploy_cmd():
    """
    Deploy the Hybrid Agent to Google Cloud Run.
    """
    run_deploy()

if __name__ == "__main__":
    app()
