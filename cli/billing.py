import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

from core.constants import PROVIDERS_COSTS

try:
    from license import LicenseValidator, LicenseTier
except ImportError:
    LicenseValidator = None
    LicenseTier = None

console = Console()

def _get_license_validator():
    """Lazy load license validator."""
    if LicenseValidator is None:
        console.print("[red]Error: license module not found.[/red]")
        raise typer.Exit(code=1)
    return LicenseValidator()

def _display_quota_table(validator, tier: str):
    """Helper to display quota limits."""
    table = Table(title=f"📊 Quota Limits ({tier.upper()})", box=None)
    table.add_column("Feature", style="cyan")
    table.add_column("Limit", style="green")

    features_to_check = [
        ("max_daily_video", "Max Daily Video"),
        ("niches", "Niches"),
        ("monthly_api_calls", "API Calls/Month"),
        ("monthly_commands", "Commands/Month"),
        ("team_members", "Team Members"),
        ("white_label", "White Label"),
    ]

    for feature_key, display_name in features_to_check:
        quota = validator.check_quota(feature_key)
        limit = quota['limit']

        limit_str = "Unlimited" if limit == -1 else str(limit)
        if feature_key == "white_label":
             limit_str = "✅ Yes" if quota['allowed'] else "❌ No"

        table.add_row(display_name, limit_str)

    console.print(table)

def activate_cmd(key: str = typer.Option(..., prompt="License Key")):
    """
    Activate Mekong-CLI license.
    """
    console.print("\n[bold blue]🔐 Activating License...[/bold blue]")

    validator = _get_license_validator()
    try:
        license_data = validator.activate(key)
        tier = license_data["tier"]

        console.print(Panel(f"[bold green]✅ License Activated![/bold green]\n\nTier: [cyan]{tier.upper()}[/cyan]\nActivated: {license_data['activated_at']}", expand=False))

        _display_quota_table(validator, tier)

        console.print("\n[dim]Configuration saved to ~/.mekong/license.json[/dim]")

    except ValueError as e:
        console.print(f"\n[bold red]❌ Activation Failed:[/bold red] {e}")
        raise typer.Exit(code=1)

def status_cmd():
    """
    Show current license status and quota.
    """
    validator = _get_license_validator()
    license_data = validator.get_license()

    if not license_data:
        console.print(Panel("[yellow]⚠️  No license activated (using Starter tier)[/yellow]", expand=False))
        _display_quota_table(validator, "starter")
        console.print("\n[bold]Upgrade:[/bold] [cyan]mekong activate <key>[/cyan]")
        return

    tier = license_data["tier"]
    console.print("\n[bold]Status:[/bold] [green]ACTIVE[/green]")
    console.print(f"[bold]Tier:[/bold]   [cyan]{tier.upper()}[/cyan]")
    console.print(f"[bold]Key:[/bold]    {license_data.get('key', 'N/A')}")
    console.print("-" * 30)

    _display_quota_table(validator, tier)

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

    table = Table(title="Provider Pricing (per 1K tokens)", box=None)
    table.add_column("Provider", style="white")
    table.add_column("Cost", style="magenta")
    table.add_column("Use Case", style="dim")

    for name, price, use_case in PROVIDERS_COSTS:
        table.add_row(name, price, use_case)

    console.print(table)
    console.print("\n   [dim]Target: 70% cost reduction vs GPT-4 only[/dim]")
