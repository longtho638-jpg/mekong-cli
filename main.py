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

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import typer
from rich.console import Console
from rich.prompt import Prompt
from rich import print as rprint

# Local imports
try:
    from deploy_automation import run_deploy
    from license import LicenseTier, LicenseValidator
except ImportError:
    # Fallback/Mock for environments where dependencies might be missing during dev
    run_deploy = None
    LicenseTier = None
    LicenseValidator = None

# --- Configuration & Constants ---

APP_NAME = "🌊 MEKONG-CLI"
TEMPLATE_REPO_STARTER = os.getenv("TEMPLATE_REPO", "https://github.com/longtho638-jpg/hybrid-agent-template.git")
TEMPLATE_REPO_PRO = os.getenv("PRO_TEMPLATE_REPO", "https://github.com/longtho638-jpg/mekong-template-pro.git")

NICHES: Dict[str, str] = {
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

NICHE_DESCRIPTIONS: List[str] = [
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

VIBES: List[Tuple[str, str, str, str]] = [
    ("mien-tay", "Miền Tây", "Thân thiện, chân thành, ấm áp", "hen, nghen, tui, bà con"),
    ("mien-bac", "Miền Bắc", "Lịch sự, trang trọng, chỉn chu", "ạ, nhé, vâng, xin phép"),
    ("mien-trung", "Miền Trung", "Mộc mạc, thật thà, kiên cường", "mô, tê, răng, rứa"),
    ("gen-z", "Gen Z", "Trendy, năng động, hài hước", "slay, vibe, chill, xịn xò"),
    ("professional", "Professional", "Chuyên nghiệp, thuyết phục", "chiến lược, tối ưu, giải pháp"),
]

AGENTS_CORE = [
    {"name": "Scout", "role": "Thu thập thông tin", "status": "Ready", "icon": "🔍"},
    {"name": "Editor", "role": "Biên tập nội dung", "status": "Ready", "icon": "✏️"},
    {"name": "Director", "role": "Đạo diễn video", "status": "Ready", "icon": "🎬"},
    {"name": "Community", "role": "Đăng bài & tương tác", "status": "Ready", "icon": "🤝"},
]

AGENTS_MEKONG = [
    {"name": "Market Analyst", "role": "Phân tích giá nông sản ĐBSCL", "status": "Ready", "icon": "📊"},
    {"name": "Zalo Integrator", "role": "Tích hợp Zalo OA/Mini App", "status": "Ready", "icon": "💬"},
    {"name": "Local Copywriter", "role": "Viết content giọng địa phương", "status": "Ready", "icon": "🎤"},
]

PROVIDERS_COSTS = [
    ("Llama 3.1 8B", "$0.0001", "Simple text"),
    ("Llama 3.1 70B", "$0.0006", "Medium tasks"),
    ("Gemini 2.5 Flash", "$0.0007", "Vision, long context"),
    ("Gemini 2.5 Pro", "$0.006", "Complex reasoning"),
    ("Claude Sonnet", "$0.018", "Code, analysis"),
]

MCP_PACKAGES = [
    "@anthropic/mcp-server-filesystem",
    "@anthropic/mcp-server-fetch",
    "@anthropic/mcp-server-playwright"
]

# --- App Initialization ---

app = typer.Typer(help=f"{APP_NAME}: Deploy Your Agency in 15 Minutes")
console = Console()

# --- Helper Functions ---

def _get_license_validator():
    """Lazy load license validator."""
    if LicenseValidator is None:
        console.print("[red]Error: license module not found.[/red]")
        raise typer.Exit(code=1)
    return LicenseValidator()

def _update_file_placeholders(file_path: Path, replacements: Dict[str, str]) -> bool:
    """Updates placeholders in a file with provided values."""
    if not file_path.exists():
        return False
    
    try:
        content = file_path.read_text(encoding="utf-8")
        for key, value in replacements.items():
            content = content.replace(f"{{{{ {key} }}}}", value)
        file_path.write_text(content, encoding="utf-8")
        return True
    except Exception as e:
        console.print(f"[red]Failed to update {file_path.name}:[/red] {e}")
        return False

# --- Commands ---

@app.command()
def init(project_name: str):
    """
    Initialize a new Hybrid Agent project from the Golden Template.
    """
    console.print(f"[bold blue]{APP_NAME}:[/bold blue] Initializing {project_name}...")
    
    target_dir = Path.cwd() / project_name
    
    if target_dir.exists():
        console.print(f"[bold red]Error:[/bold red] Directory {project_name} already exists!")
        raise typer.Exit(code=1)

    # Check license tier
    validator = _get_license_validator()
    tier = validator.get_tier()
    
    # Determine template repo
    is_pro = tier in [LicenseTier.PRO, LicenseTier.ENTERPRISE]
    template_repo = TEMPLATE_REPO_PRO if is_pro else TEMPLATE_REPO_STARTER
    
    if is_pro:
        console.print(f"   🔑 Pro/Enterprise tier detected")
        console.print(f"   📦 Cloning Pro template (10 niches, white-label)...")
    else:
        console.print(f"   🆓 Starter tier (Upgrade for Pro features)")
        console.print(f"   📦 Cloning Starter template (1 niche, basic features)...")

    try:
        subprocess.run(["git", "clone", template_repo, str(project_name)], check=True)
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
        
    except subprocess.CalledProcessError as e:
        console.print(f"[bold red]Failed to clone template:[/bold red] {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[bold red]Failed:[/bold red] {e}")
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
    
    # Interactive niche selection if not provided
    if not niche:
        console.print("\n[cyan]Available Niches (Pro tier required for all):[/cyan]")
        for description in NICHE_DESCRIPTIONS:
            console.print(f"  {description}")
        
        choice = Prompt.ask("\nSelect niche", choices=list(NICHES.keys()))
        niche = NICHES[choice]
    
    console.print(f"\nTuning for [cyan]{niche}[/cyan] in [cyan]{location}[/cyan]...")
    
    cwd = Path.cwd()
    config_path = cwd / "agent.config.yaml"
    gemini_md_path = cwd / ".gemini/GEMINI.md"
    
    if not config_path.exists() or not gemini_md_path.exists():
        console.print("[bold red]Error:[/bold red] Not a valid Mekong project root.")
        raise typer.Exit(code=1)

    replacements = {
        "project_name": cwd.name,
        "niche": niche,
        "location": location,
        "tone": tone
    }

    # Update config files
    if _update_file_placeholders(config_path, replacements):
        console.print("   ✅ Updated agent.config.yaml")
    
    if _update_file_placeholders(gemini_md_path, replacements):
        console.print("   ✅ Infused local vibe into GEMINI.md")

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
    
    env_content = []
    for secret in secrets:
        value = Prompt.ask(f"Enter {secret}", password=True)
        env_content.append(f"{secret}={value}")
    
    try:
        Path(".env").write_text("\n".join(env_content) + "\n", encoding="utf-8")
        console.print("\n[bold green]✅ .env file created locally (DO NOT COMMIT)[/bold green]")
    except Exception as e:
        console.print(f"[red]Error writing .env file:[/red] {e}")


@app.command(name="mcp-setup")
def setup_mcp():
    """
    Setup MCP (Model Context Protocol) servers for the project.
    """
    console.print("\n[bold blue]🔌 Setting up MCP Servers...[/bold blue]")
    
    cwd = Path.cwd()
    mcp_config = cwd / "mcp" / "settings.json"
    
    if not mcp_config.exists():
        console.print("[red]Error:[/red] Not a valid Mekong project (no mcp/settings.json)")
        raise typer.Exit(code=1)
    
    console.print("   📦 Installing MCP server packages...")
    
    try:
        # Install all packages in one go
        cmd = ["npm", "install", "-g"] + MCP_PACKAGES
        subprocess.run(cmd, check=True, capture_output=True)
        console.print("   ✅ MCP packages installed")
        
        # Verify configuration
        config = json.loads(mcp_config.read_text(encoding="utf-8"))
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
def run_scout_cmd(feature: str = typer.Argument(..., help="Feature to analyze")):
    """
    Run Scout Agent to analyze a feature (for testing).
    """
    console.print(f"\n[bold blue]🔍 Running Scout Agent...[/bold blue]")
    console.print(f"   Feature: {feature}")
    
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
    
    validator = _get_license_validator()
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
    validator = _get_license_validator()
    license_data = validator.get_license()
    
    if not license_data:
        console.print("\n[yellow]⚠️  No license activated (using Starter tier)[/yellow]")
        console.print("   Limits: 1 video/day, 1 niche")
        console.print("\n   Upgrade: [cyan]mekong activate[/cyan]")
        return
    
    tier = license_data["tier"]
    console.print(f"\n[bold green]License Status[/bold green]")
    console.print(f"   Tier: [cyan]{tier.upper()}[/cyan]")
    console.print(f"   Activated: {license_data['activated_at']}")
    
    # Check quota
    video_quota = validator.check_quota("max_daily_video")
    console.print(f"\n   Daily Videos: {video_quota['used']}/{video_quota['limit']}")


@app.command(name="deploy")
def deploy_cmd():
    """
    Deploy the Hybrid Agent to Google Cloud Run.
    """
    if run_deploy:
        run_deploy()
    else:
        console.print("[red]Deploy module not found.[/red]")


@app.command(name="agents")
def agents_cmd():
    """
    Show AI agents status and activity.
    """
    console.print(f"\n[bold blue]🤖 {APP_NAME} AI Agents[/bold blue]\n")
    
    console.print("   [cyan]Quad-Agent System:[/cyan]")
    for agent in AGENTS_CORE:
        console.print(f"      {agent['icon']} {agent['name']}: {agent['role']} [{agent['status']}]")
    
    console.print("\n   [cyan]Mekong-Specific Agents:[/cyan]")
    for agent in AGENTS_MEKONG:
        console.print(f"      {agent['icon']} {agent['name']}: {agent['role']} [{agent['status']}]")
    
    total_agents = len(AGENTS_CORE) + len(AGENTS_MEKONG)
    console.print(f"\n   [dim]Total: {total_agents} agents ready[/dim]")
    console.print("   [dim]Tip: Use '/nong-san' or '/tiep-thi' to activate agents[/dim]")


@app.command(name="costs")
def costs_cmd():
    """
    Show Hybrid Router cost savings analysis.
    """
    console.print("\n[bold blue]💰 Hybrid Router - Cost Savings[/bold blue]\n")
    
    console.print("   [cyan]Routing Strategy:[/cyan]")
    console.print("      GPT-4/Gemini Pro = 'Sếp' (complex tasks)")
    console.print("      Llama 3.1 = 'Lính' (simple tasks)")
    
    # Simulated stats
    console.print("\n   [cyan]This Month Stats:[/cyan]")
    console.print("      Tasks routed: 0")
    console.print("      If using GPT-4 only: $0.00")
    console.print("      With Hybrid Router: $0.00")
    console.print("      [green]Savings: $0.00 (0%)[/green]")
    
    console.print("\n   [cyan]Provider Pricing (per 1K tokens):[/cyan]")
    for name, price, use_case in PROVIDERS_COSTS:
        console.print(f"      {name}: {price} - {use_case}")
    
    console.print("\n   [dim]Target: 70% cost reduction vs GPT-4 only[/dim]")


@app.command(name="vibes")
def vibes_cmd():
    """
    Show available Vibe Tuning options.
    """
    console.print("\n[bold blue]🎤 Vibe Tuning - AI Voice Localization[/bold blue]\n")
    
    console.print("   [cyan]Available Vibes:[/cyan]\n")
    for vibe_id, name, tone, words in VIBES:
        console.print(f"   • [bold]{name}[/bold] ({vibe_id})")
        console.print(f"     Tone: {tone}")
        console.print(f"     Words: {words}")
        console.print()
    
    console.print("   [dim]Set vibe: mekong setup-vibe --location 'Can Tho'[/dim]")


if __name__ == "__main__":
    app()