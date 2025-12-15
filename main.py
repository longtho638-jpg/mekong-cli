#!/usr/bin/env python3
"""
MEKONG-CLI: Local Agency Automation Tool

Deploy Your Agency in 15 Minutes.
Powered by Hybrid Agentic Architecture 2026.

Commands:
    mekong init <name>        - Initialize new project
    mekong setup-vibe         - Configure AI voice/tone
    mekong mcp-setup          - Setup MCP servers
    mekong generate-secrets   - Create .env file
    mekong deploy             - Deploy to Cloud Run
    mekong activate           - Activate license
    mekong status             - Show license status
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

app = typer.Typer(help="🌊 MEKONG-CLI: Deploy Your Agency in 15 Minutes")
console = Console()



# TEMPLATE_REPO = "https://github.com/YOUR_USERNAME/hybrid-agent-template.git"
# Support local path for testing, but default to git repo for production
TEMPLATE_REPO = os.getenv("TEMPLATE_REPO", "https://github.com/YOUR_USERNAME/hybrid-agent-template.git")

@app.command()
def init(project_name: str):
    """
    Initialize a new Hybrid Agent project from the Golden Template.
    """
    console.print(f"[bold blue]🌊 MEKONG-CLI:[/bold blue] Initializing {project_name}...")
    
    target_dir = Path(os.getcwd()) / project_name
    
    if target_dir.exists():
        console.print(f"[bold red]Error:[/bold red] Directory {project_name} already exists!")
        raise typer.Exit(code=1)

    # Check license tier to determine which template to use
    from license import LicenseValidator, LicenseTier
    validator = LicenseValidator()
    tier = validator.get_tier()
    
    # Determine template repo based on tier
    if tier in [LicenseTier.PRO, LicenseTier.ENTERPRISE]:
        # Pro/Enterprise: Clone private repo
        template_repo = os.getenv("PRO_TEMPLATE_REPO", "https://github.com/longtho638-jpg/mekong-template-pro.git")
        console.print(f"   🔑 Pro/Enterprise tier detected")
        console.print(f"   📦 Cloning Pro template (10 niches, white-label)...")
    else:
        # Starter: Clone public repo
        template_repo = os.getenv("TEMPLATE_REPO", "https://github.com/longtho638-jpg/hybrid-agent-template.git")
        console.print(f"   🆓 Starter tier (Upgrade for Pro features)")
        console.print(f"   📦 Cloning Starter template (1 niche, basic features)...")

    try:
        subprocess.run(["git", "clone", template_repo, project_name], check=True)
        console.print(f"   ✅ Template setup complete")
        
        # Remove template git history
        git_dir = target_dir / ".git"
        if git_dir.exists():
            shutil.rmtree(git_dir)
            console.print("   ✅ Removed old git history")
            
        console.print(f"\n[bold green]🚀 Project {project_name} created successfully![/bold green]")
        
        if tier == LicenseTier.STARTER:
            console.print(f"\n   💡 [yellow]Want 10 niches + white-label? Upgrade to Pro:[/yellow]")
            console.print(f"      [cyan]mekong activate --key mk_live_pro_xxxxx[/cyan]")
        
        console.print(f"\nNext steps:\n  cd {project_name}\n  mekong setup-vibe")
        
    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")
        raise typer.Exit(code=1)

        raise typer.Exit(code=1)


@app.command(name="setup-vibe")
def setup_vibe(
    niche: str = typer.Option(None, help="Target Niche (or select interactively)"),
    location: str = typer.Option(..., prompt="Location (e.g., Can Tho)"),
    tone: str = typer.Option("Bình dân, Chân thành", prompt="Brand Tone")
):
    """
    Customize the Agent's soul (.gemini/GEMINI.md) for a specific niche.
    """
    console.print(f"\n[bold blue]🎨 Setup Vibe:[/bold blue]")
    
    # If niche not provided, show interactive selection
    if not niche:
        console.print("\n[cyan]Available Niches (Pro tier required for all):[/cyan]")
        niches = [
            "🌾 rice-trading (Lúa Gạo)",
            "🐟 fish-seafood (Cá Tra)",
            "🛋️ furniture (Nội Thất)",
            "🏗️ construction-materials (Vật Liệu XD)",
            "🚜 agriculture-tools (Máy Nông Nghiệp)",
            "🏠 real-estate (Bất Động Sản)",
            "🍜 restaurants (Nhà Hàng)",
            "💅 beauty-spa (Thẩm Mỹ Viện)",
            "🚗 automotive (Ô Tô)",
            "📚 education (Trung Tâm Học)"
        ]
        
        for i, n in enumerate(niches, 1):
            console.print(f"  {i}. {n}")
        
        choice = Prompt.ask("\nSelect niche", choices=[str(i) for i in range(1, 11)])
        niche_map = {
            "1": "rice-trading",
            "2": "fish-seafood",
            "3": "furniture",
            "4": "construction-materials",
            "5": "agriculture-tools",
            "6": "real-estate",
            "7": "restaurants",
            "8": "beauty-spa",
            "9": "automotive",
            "10": "education"
        }
        niche = niche_map[choice]
    
    console.print(f"\nTuning for [cyan]{niche}[/cyan] in [cyan]{location}[/cyan]...")

    
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

@app.command(name="mcp-setup")
def setup_mcp():
    """
    Setup MCP (Model Context Protocol) servers for the project.
    """
    console.print("\n[bold blue]🔌 Setting up MCP Servers...[/bold blue]")
    
    cwd = Path(os.getcwd())
    mcp_config = cwd / "mcp" / "settings.json"
    
    if not mcp_config.exists():
        console.print("[red]Error:[/red] Not a valid Mekong project (no mcp/settings.json)")
        raise typer.Exit(code=1)
    
    # Install MCP dependencies
    console.print("   📦 Installing MCP server packages...")
    
    packages = [
        "@anthropic/mcp-server-filesystem",
        "@anthropic/mcp-server-fetch",
        "@anthropic/mcp-server-playwright"
    ]
    
    try:
        for pkg in packages:
            console.print(f"      Installing {pkg}...")
            subprocess.run(["npm", "install", "-g", pkg], 
                         check=True, capture_output=True)
        
        console.print("   ✅ MCP packages installed")
        
        # Verify configuration
        import json
        with open(mcp_config) as f:
            config = json.load(f)
        
        servers = config.get("mcpServers", {})
        console.print(f"\n   📋 Configured MCP Servers ({len(servers)}):")
        for name, conf in servers.items():
            desc = conf.get("description", "")
            console.print(f"      • {name}: {desc}")
        
        console.print("\n[bold green]✅ MCP Setup Complete![/bold green]")
        console.print("\n   Next: Set environment variables in .env")
        console.print("   Then: mekong run-scout 'feature-name' to test")
        
    except subprocess.CalledProcessError as e:
        console.print(f"[red]Failed to install MCP packages:[/red] {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(code=1)


@app.command(name="run-scout")
def run_scout_cmd(
    feature: str = typer.Argument(..., help="Feature to analyze")
):
    """
    Run Scout Agent to analyze a feature (for testing).
    """
    console.print(f"\n[bold blue]🔍 Running Scout Agent...[/bold blue]")
    console.print(f"   Feature: {feature}")
    
    # Quick test - just show what would happen
    console.print("\n   [cyan]Scout would:[/cyan]")
    console.print("   • Analyze git commits related to feature")
    console.print("   • Scan Product Hunt via Playwright MCP")
    console.print("   • Scan Reddit via Fetch MCP")
    console.print("   • Generate summary via OpenRouter (fast tier)")
    console.print("\n   [yellow]Note: Full execution requires backend running[/yellow]")


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
