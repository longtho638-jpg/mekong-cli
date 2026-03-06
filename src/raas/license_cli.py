"""
RaaS License CLI — License key management and verification

Commands:
- mekong license check — Check current license status
- mekong license generate — Generate new license key
- mekong license validate — Validate a license key
"""
import typer
from rich.console import Console
from rich.table import Table
from datetime import datetime
import secrets
import hashlib

from src.lib.raas_gate import LicenseService, LicenseTier, PREMIUM_FEATURES

console = Console()
app = typer.Typer(help="RaaS License Management")


def _generate_key(tier: LicenseTier, tenant_id: str = None) -> str:
    """Generate a license key with embedded tier and timestamp.

    Format: raas_{tier}_{timestamp}_{random}_hmac

    Args:
        tier: License tier (pro, enterprise)
        tenant_id: Optional tenant identifier to embed

    Returns:
        Generated license key string
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    random_part = secrets.token_hex(8)
    tenant_part = tenant_id[:8] if tenant_id else "anon"

    # Create payload
    payload = f"{tier}_{timestamp}_{tenant_part}_{random_part}"

    # Generate HMAC (using secret from env or default)
    import os
    secret = os.getenv("RAAS_KEY_SECRET", "mekong-cli-default-secret-change-in-prod")
    hmac_sig = hashlib.sha256(f"{payload}{secret}".encode()).hexdigest()[:8]

    return f"raas_{payload}_{hmac_sig}"


@app.command("check")
def check_license():
    """Check current license status."""
    service = LicenseService.getInstance()
    validation = service.validateSync()

    # Display license status table
    table = Table(title="📜 RaaS License Status", show_header=True)
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    tier_display = {
        'free': '🔓 FREE',
        'pro': '💎 PRO',
        'enterprise': '🏢 ENTERPRISE'
    }

    table.add_row("Tier", tier_display.get(validation.tier, validation.tier.upper()))
    table.add_row("Valid", "✅ Yes" if validation.valid else "❌ No")
    table.add_row("Features", f"{len(validation.features)} enabled")

    console.print(table)

    # Show enabled features
    if validation.features:
        console.print("\n[bold]Enabled Features:[/bold]")
        for feature in validation.features:
            console.print(f"  • {feature}")

    # Show tier comparison
    console.print("\n[bold]Tier Comparison:[/bold]")
    console.print(f"  FREE: {len(PREMIUM_FEATURES['free'])} features")
    console.print(f"  PRO: {len(PREMIUM_FEATURES['pro'])} features")
    console.print(f"  ENTERPRISE: {len(PREMIUM_FEATURES['enterprise'])} features")

    if not validation.valid:
        console.print(
            "\n[yellow]⚠️  No valid license found.[/yellow]\n"
            "Set [bold]RAAS_LICENSE_KEY[/bold] environment variable to unlock premium features.\n"
            "Generate a key: [bold]mekong license generate --tier pro[/bold]"
        )


@app.command("generate")
def generate_license(
    tier: str = typer.Option(
        "pro",
        "--tier", "-t",
        help="License tier: pro or enterprise"
    ),
    tenant_id: str = typer.Option(
        None,
        "--tenant",
        help="Tenant ID to embed in license"
    ),
    quantity: int = typer.Option(
        1,
        "--quantity", "-q",
        help="Number of keys to generate"
    )
):
    """Generate new license key(s)."""
    # Validate tier
    tier_lower = tier.lower()
    if tier_lower not in ('pro', 'enterprise'):
        console.print(f"[red]Error:[/red] Invalid tier '{tier}'. Must be 'pro' or 'enterprise'.")
        raise typer.Exit(1)

    license_tier: LicenseTier = tier_lower  # type: ignore
    tier_upper = tier_lower.upper()

    console.print(f"\n[bold]Generating {quantity} {tier_upper} license key(s)...[/bold]\n")

    for i in range(quantity):
        key = _generate_key(license_tier, tenant_id)

        # Display key
        console.print(f"[green]Key {i+1}:[/green]")
        console.print(f"  [cyan]{key}[/cyan]")
        console.print(f"  Tier: {tier_upper}")
        if tenant_id:
            console.print(f"  Tenant: {tenant_id}")
        console.print()

    console.print(
        "[yellow]⚠️  Keep these keys secure![/yellow]\n"
        "Add to .env: [bold]RAAS_LICENSE_KEY=your_key[/bold]"
    )


@app.command("validate")
def validate_license(
    key: str = typer.Argument(
        None,
        help="License key to validate"
    ),
    from_env: bool = typer.Option(
        True,
        "--env", "-e",
        help="Read from RAAS_LICENSE_KEY env var"
    )
):
    """Validate a license key."""
    service = LicenseService.getInstance()

    if from_env or not key:
        import os
        key = os.getenv("RAAS_LICENSE_KEY", "")
        if not key:
            console.print("[red]Error:[/red] No license key provided and RAAS_LICENSE_KEY not set.")
            raise typer.Exit(1)

    validation = service.validateSync(key)

    if validation.valid:
        console.print(f"\n[green]✅ Valid {validation.tier.upper()} license![/green]")
        console.print(f"Features enabled: {len(validation.features)}")
    else:
        console.print("\n[red]❌ Invalid or missing license.[/red]")
        console.print(f"Tier: {validation.tier.upper()} (limited access)")

    console.print("\n[bold]Available Features:[/bold]")
    for feature in validation.features:
        console.print(f"  ✓ {feature}")


@app.command("features")
def list_features():
    """List all premium features by tier."""
    console.print("\n[bold]📦 RaaS Premium Features[/bold]\n")

    for tier_name, features in PREMIUM_FEATURES.items():
        tier_display = {
            'free': '🔓 FREE',
            'pro': '💎 PRO',
            'enterprise': '🏢 ENTERPRISE'
        }
        console.print(f"[bold]{tier_display.get(tier_name, tier_name.upper())}[/bold] ({len(features)} features)")
        for feature in features:
            console.print(f"  • {feature}")
        console.print()


if __name__ == "__main__":
    app()
