"""
License Management Commands — ROIaaS Phase 2

Commands for generating, validating, and managing license keys.
"""

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from src.lib.license_generator import generate_license, validate_license, get_tier_limits, TIER_LIMITS
from src.lib.usage_meter import get_usage_summary, get_meter

console = Console()
app = typer.Typer()


@app.command()
def generate(
    tier: str = typer.Option("trial", "--tier", "-t", help="License tier (free/trial/pro/enterprise)"),
    email: str = typer.Option(..., "--email", "-e", help="User email for license"),
    days: int = typer.Option(None, "--days", "-d", help="Expiry in days (for trial tier)"),
) -> None:
    """Generate a new license key."""
    try:
        key = generate_license(tier, email, days)
        limits = get_tier_limits(tier)

        console.print(
            Panel(
                f"[bold green]{key}[/bold green]\n\n"
                f"[dim]Tier: {tier}[/dim]\n"
                f"[dim]Email: {email}[/dim]\n"
                f"[dim]Daily Limit: {limits['commands_per_day'] if limits['commands_per_day'] >= 0 else 'unlimited'} commands[/dim]\n"
                f"[dim]Expiry: {days} days[/dim]" if days else "[dim]Expiry: None[/dim]",
                title="🔑 License Key Generated",
                border_style="green",
            )
        )
    except ValueError as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def validate(
    key: str = typer.Argument(..., help="License key to validate"),
) -> None:
    """Validate a license key."""
    is_valid, info, error = validate_license(key)

    if is_valid:
        tier = info.get("tier", "unknown") if info else "unknown"
        key_id = info.get("key_id", "unknown") if info else "unknown"
        limits = get_tier_limits(tier)

        console.print(
            Panel(
                f"[bold green]Valid License[/bold green]\n\n"
                f"Tier: [bold]{tier}[/bold]\n"
                f"Key ID: {key_id}\n"
                f"Daily Limit: {limits['commands_per_day'] if limits['commands_per_day'] >= 0 else 'unlimited'} commands",
                title="✅ License Validation",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                f"[bold red]Invalid License[/bold red]\n\n{error}",
                title="❌ License Validation",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)


@app.command()
def revoke(
    key: str = typer.Argument(..., help="License key to revoke"),
    force: bool = typer.Option(False, "--force", "-f", help="Skip confirmation"),
) -> None:
    """Revoke a license key (add to revocation list)."""
    if not force:
        confirm = typer.confirm(f"Are you sure you want to revoke this key?\n\n{key}")
        if not confirm:
            console.print("[dim]Cancelled[/dim]")
            raise typer.Exit(code=0)

    # Add to revocation list (stored in ~/.mekong/revoked.json)
    from pathlib import Path
    import json

    revoked_path = Path.home() / ".mekong" / "revoked.json"
    revoked_path.parent.mkdir(parents=True, exist_ok=True)

    revoked = []
    if revoked_path.exists():
        with open(revoked_path, "r") as f:
            revoked = json.load(f)

    # Extract key_id from key
    parts = key.split("-")
    key_id = parts[2] if len(parts) >= 3 else key

    if key_id not in revoked:
        revoked.append(key_id)
        with open(revoked_path, "w") as f:
            json.dump(revoked, f, indent=2)

    console.print(f"[bold green]✅ Key revoked:[/bold green] {key_id}")


@app.command()
def status(
    key: str = typer.Option(None, "--key", "-k", help="License key to check status for"),
) -> None:
    """Show license status and usage."""
    license_key = key or typer.Option(os.getenv("RAAS_LICENSE_KEY", ""), help="License key")

    if not license_key:
        console.print("[bold red]No license key provided.[/bold red]")
        console.print("Set RAAS_LICENSE_KEY env var or use --key flag.")
        raise typer.Exit(code=1)

    # Validate key
    is_valid, info, error = validate_license(license_key)
    if not is_valid:
        console.print(f"[bold red]Invalid key:[/bold red] {error}")
        raise typer.Exit(code=1)

    tier = info.get("tier", "unknown") if info else "unknown"
    key_id = info.get("key_id", "unknown") if info else "unknown"
    limits = get_tier_limits(tier)

    # Get usage
    try:
        usage = get_usage_summary(key_id)
    except Exception:
        usage = {}

    table = Table(title="License Status", show_lines=True)
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="bold")

    table.add_row("Status", "✅ Valid" if is_valid else "❌ Invalid")
    table.add_row("Tier", tier)
    table.add_row("Key ID", key_id)
    table.add_row("Daily Limit", str(limits["commands_per_day"]) if limits["commands_per_day"] >= 0 else "Unlimited")
    table.add_row("Commands Today", str(usage.get("commands_today", 0)))
    table.add_row("Total Commands", str(usage.get("total_commands", 0)))
    table.add_row("Remaining", str(usage.get("remaining", "N/A")))

    console.print(table)


@app.command()
def tiers() -> None:
    """Show available license tiers and limits."""
    table = Table(title="License Tiers", show_lines=True)
    table.add_column("Tier", style="cyan", justify="center")
    table.add_column("Commands/Day", justify="right")
    table.add_column("Max Days", justify="right")
    table.add_column("Description", style="dim")

    tier_descriptions = {
        "free": "Basic access for individuals",
        "trial": "7-day trial with full features",
        "pro": "Professional use with high limits",
        "enterprise": "Unlimited access for teams",
    }

    for tier, limits in TIER_LIMITS.items():
        daily = limits["commands_per_day"]
        max_days = limits["max_days"]
        table.add_row(
            tier,
            str(daily) if daily >= 0 else "Unlimited",
            str(max_days) if max_days else "Unlimited",
            tier_descriptions.get(tier, ""),
        )

    console.print(table)


@app.command()
def usage(
    key: str = typer.Option(None, "--key", "-k", help="License key to check usage for"),
    reset: bool = typer.Option(False, "--reset", help="Reset usage counter"),
) -> None:
    """Show or reset usage statistics."""
    import os
    from src.lib.license_generator import validate_license

    license_key = key or os.getenv("RAAS_LICENSE_KEY", "")

    if not license_key:
        console.print("[bold red]No license key provided.[/bold red]")
        console.print("Set RAAS_LICENSE_KEY env var or use --key flag.")
        raise typer.Exit(code=1)

    # Extract key_id
    is_valid, info, _ = validate_license(license_key)
    if not is_valid:
        console.print(f"[bold red]Invalid key:[/bold red] {info}")
        raise typer.Exit(code=1)

    key_id = info.get("key_id", "unknown") if info else "unknown"

    if reset:
        meter = get_meter()
        if meter.reset_usage(key_id):
            console.print("[bold green]✅ Usage reset successfully[/bold green]")
        else:
            console.print("[bold yellow]⚠️  No usage record found[/bold yellow]")
    else:
        try:
            usage = get_usage_summary(key_id)
            if "error" in usage:
                console.print(f"[bold yellow]⚠️  {usage['error']}[/bold yellow]")
            else:
                console.print(Panel(
                    f"[bold]Key ID:[/bold] {usage.get('key_id', 'N/A')}\n"
                    f"[bold]Tier:[/bold] {usage.get('tier', 'N/A')}\n"
                    f"[bold]Commands Today:[/bold] {usage.get('commands_today', 0)}\n"
                    f"[bold]Daily Limit:[/bold] {usage.get('daily_limit', 'N/A')}\n"
                    f"[bold]Remaining:[/bold] {usage.get('remaining', 'N/A')}\n"
                    f"[bold]Total Commands:[/bold] {usage.get('total_commands', 0)}",
                    title="📊 Usage Statistics",
                    border_style="blue",
                ))
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {e}")
            raise typer.Exit(code=1)


# Import os for status command
import os

__all__ = ["app"]
