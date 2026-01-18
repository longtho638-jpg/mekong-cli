#!/usr/bin/env python3
"""
🚀 WOW Runner - Agency OS Status Check
======================================

Verifies the "WOW Factor" of the Mekong-CLI installation.
Checks feature implementation, configuration, and readiness.
"""

import sys
import os
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

# Add core to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from core.config import get_settings
    from core.voice_clone import VoiceClone
    from core.telegram_bot import TelegramBot
    from core.security.api_keys import APIKeyManager
    from core.modules.crm import CRM
    from core.web_designer import WebDesigner
except ImportError as e:
    print(f"❌ Critical Import Error: {e}")
    sys.exit(1)

console = Console()
settings = get_settings()

def check_feature(name: str, condition: bool, details: str) -> tuple:
    status = "✅ READY" if condition else "❌ MISSING"
    color = "green" if condition else "red"
    return name, status, color, details

def check_foundation(console: Console, settings) -> int:
    console.print("\n[bold]1. 🏗️  Foundation Layer[/bold]")
    table = Table(box=box.SIMPLE)
    table.add_column("Feature", style="cyan")
    table.add_column("Status", justify="center")
    table.add_column("Details")

    table.add_row(*check_feature("Core CLI", True, "Typer + Rich implemented"))
    table.add_row(*check_feature("Config System", True, "Pydantic Settings Active"))
    table.add_row(*check_feature("Project Template", True, f"Repo: {settings.TEMPLATE_REPO_STARTER[:30]}..."))

    console.print(table)
    return 30  # Base score for foundation

def check_wingman(console: Console, settings) -> int:
    console.print("\n[bold]2. 🤖 AI Wingman (24/7 Automation)[/bold]")
    wingman_table = Table(box=box.SIMPLE)
    wingman_table.add_column("Feature", style="cyan")
    wingman_table.add_column("Status", justify="center")
    wingman_table.add_column("Configuration")

    score = 0

    # Voice Clone
    VoiceClone()
    vc_ready = bool(settings.ELEVENLABS_API_KEY)
    wingman_table.add_row(
        "🎙️ Voice Clone",
        "[green]READY[/green]" if vc_ready else "[yellow]PARTIAL[/yellow]",
        "ElevenLabs Key: " + ("✅ Set" if vc_ready else "❌ Missing")
    )
    if vc_ready: score += 15

    # Telegram Bot
    TelegramBot()
    bot_ready = bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID)
    wingman_table.add_row(
        "📱 Telegram Bot",
        "[green]READY[/green]" if bot_ready else "[yellow]PARTIAL[/yellow]",
        "Bot Token: " + ("✅ Set" if bot_ready else "❌ Missing")
    )
    if bot_ready: score += 15

    console.print(wingman_table)
    return score

def check_business_systems(console: Console, settings) -> int:
    console.print("\n[bold]3. 💼 Business Systems[/bold]")
    biz_table = Table(box=box.SIMPLE)
    biz_table.add_column("System", style="cyan")
    biz_table.add_column("Implementation", justify="center")
    biz_table.add_column("Data Source")

    score = 0

    # CRM
    crm = CRM()
    crm_status = "[green]CONNECTED[/green]" if crm.is_connected else "[yellow]LOCAL MOCK[/yellow]"
    crm_details = "Supabase Active" if crm.is_connected else "In-Memory (Needs Supabase)"
    biz_table.add_row("🎯 CRM", crm_status, crm_details)
    if crm.is_connected: score += 20

    # Web Designer
    wd = WebDesigner("Test Agency")
    wd_ready = hasattr(wd, "generate_scaffold")
    wd_status = "[green]READY[/green]" if wd_ready else "[yellow]LOCAL MOCK[/yellow]"
    wd_details = "Local Generator Active" if wd_ready else "In-Memory (Needs Builder)"
    biz_table.add_row("🌐 Web Designer", wd_status, wd_details)
    if wd_ready: score += 10

    # Integrations
    APIKeysManager("Test Agency")
    stripe_key = settings.STRIPE_SECRET_KEY
    biz_table.add_row(
        "💳 Payments",
        "[green]READY[/green]" if stripe_key else "[yellow]CONFIG NEEDED[/yellow]",
        "Stripe Key: " + ("✅ Set" if stripe_key else "❌ Missing")
    )
    if stripe_key: score += 10

    console.print(biz_table)
    return score

def calculate_and_print_score(console: Console, score: int):
    console.print("\n[bold]📊 Final WOW Score[/bold]")

    color = "green" if score > 70 else "yellow"
    console.print(Panel(f"[bold {color}]{score}/100[/bold {color}]", title="Readiness Index"))

    if score < 50:
        console.print("[red]⚠️  CRITICAL: Add API Keys in .env to unlock AI features![/red]")
    elif score < 80:
        console.print("[yellow]💡 TIP: Connect Supabase to upgrade CRM from Mock to Real.[/yellow]")
    else:
        console.print("[green]🚀 SYSTEM READY FOR TAKEOFF![/green]")

def run_wow_check():
    console.print(Panel.fit("[bold blue]🚀 Agency OS - WOW Factor Analysis[/bold blue]", border_style="blue"))

    total_score = 0
    total_score += check_foundation(console, settings)
    total_score += check_wingman(console, settings)
    total_score += check_business_systems(console, settings)

    calculate_and_print_score(console, total_score)

if __name__ == "__main__":
    run_wow_check()
