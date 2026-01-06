import typer
from rich.console import Console

from core.constants import PROVIDERS_COSTS

try:
    from license import LicenseValidator
except ImportError:
    LicenseValidator = None

console = Console()

def _get_license_validator():
    """Lazy load license validator."""
    if LicenseValidator is None:
        console.print("[red]Error: license module not found.[/red]")
        raise typer.Exit(code=1)
    return LicenseValidator()

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
