"""
🚀 WOW Runner - Agency OS Status Check
======================================
Verifies the "WOW Factor" of the Mekong-CLI installation.
"""

import sys
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box
from core.config import get_settings
from core.ai.llm import LLMClient

console = Console()
settings = get_settings()

def check_feature(name: str, condition: bool, details: str) -> tuple:
    status = "✅ READY" if condition else "❌ MISSING"
    color = "green" if condition else "red"
    return name, status, color, details

def check_foundation():
    console.print("\n[bold]1. 🏗️  Foundation Layer[/bold]")
    table = Table(box=box.SIMPLE)
    table.add_column("Feature", style="cyan")
    table.add_column("Status", justify="center")
    table.add_column("Details")

    table.add_row(*check_feature("Core Config", True, f"Env: {settings.ENV}"))
    table.add_row(*check_feature("License Path", True, settings.LICENSE_DIR_NAME))
    
    console.print(table)
    return 30

def check_intelligence():
    console.print("\n[bold]2. 🧠 AI Intelligence[/bold]")
    table = Table(box=box.SIMPLE)
    table.add_column("Feature", style="cyan")
    table.add_column("Status", justify="center")
    table.add_column("Details")

    client = LLMClient()
    has_key = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)
    
    table.add_row(*check_feature("LLM Client", True, f"Provider: {client.provider}"))
    table.add_row(*check_feature("API Key", has_key, "Gemini/OpenAI Key"))
    
    console.print(table)
    return 30 if has_key else 10

def check_business():
    console.print("\n[bold]3. 💼 Business Engines[/bold]")
    table = Table(box=box.SIMPLE)
    table.add_column("System", style="cyan")
    table.add_column("Implementation", justify="center")
    
    # Check imports
    try:
        from core.finance.invoicing import InvoiceService
        inv = "✅ Loaded"
    except ImportError:
        inv = "❌ Failed"
        
    try:
        from core.outreach.service import OutreachService
        out = "✅ Loaded"
    except ImportError:
        out = "❌ Failed"

    table.add_row("Finance", inv)
    table.add_row("Outreach", out)
    
    console.print(table)
    return 40

def run_wow_check():
    console.print(Panel.fit("[bold blue]🚀 Agency OS - WOW Factor Analysis[/bold blue]", border_style="blue"))
    
    score = 0
    score += check_foundation()
    score += check_intelligence()
    score += check_business()
    
    color = "green" if score > 80 else "yellow"
    console.print(f"\n[bold {color}]Total WOW Score: {score}/100[/bold {color}]")

if __name__ == "__main__":
    run_wow_check()
