"""
ROI Auth Subcommand — License authentication & management

Part of mekong roi unified command (Phase 6).
"""

import typer
import secrets
import hashlib
from rich.console import Console
from rich.table import Table
from datetime import datetime, timezone
from typing import Optional

console = Console()
app = typer.Typer(name="auth", help="🔐 License authentication")


@app.command("validate")
def validate_license(
    license_key: str = typer.Option(..., "--key", "-k", help="License key to validate"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed validation info"),
) -> None:
    """
    🔍 Validate license key against backend.

    Examples:
        mekong roi auth validate -k lk_abc123
        mekong roi auth validate -k lk_abc123 -v
    """
    from src.lib.raas_gate_validator import RaasGateValidator

    console.print("[bold cyan]🔍 Validating License Key...[/bold cyan]\n")

    validator = RaasGateValidator()
    is_valid, error_message = validator.validate(license_key)

    if is_valid:
        console.print("[bold green]✅ Valid License![/bold green]\n")

        # Show license details if verbose
        if verbose:
            from src.lib.raas_gate import LicenseService
            service = LicenseService.getInstance()
            validation = service.validateSync(license_key)

            table = Table(show_header=True, header_style="bold cyan")
            table.add_column("Property", style="dim")
            table.add_column("Value", style="green")

            tier_display = {
                'free': '🔓 FREE',
                'pro': '💎 PRO',
                'enterprise': '🏢 ENTERPRISE'
            }

            table.add_row("Tier", tier_display.get(validation.tier, validation.tier.upper()))
            table.add_row("Features", f"{len(validation.features)} enabled")
            table.add_row("Valid Until", "Never" if not hasattr(validation, 'expires_at') else str(validation.expires_at))

            console.print(table)

            if validation.features:
                console.print("\n[bold]Enabled Features:[/bold]")
                for feature in validation.features:
                    console.print(f"  • {feature}")
    else:
        console.print("[bold red]❌ Invalid License[/bold red]\n")
        console.print(f"[red]{error_message}[/red]\n")
        console.print(
            "[yellow]To get a license key:[/yellow]\n"
            "  mekong roi auth generate --tier pro --email you@example.com\n"
        )
        raise typer.Exit(1)


@app.command("status")
def license_status(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key (defaults to env var)"),
) -> None:
    """
    📊 Show current license status (masked).

    Examples:
        mekong roi auth status
        mekong roi auth status -k lk_abc123
    """
    from src.lib.raas_gate_validator import RaasGateValidator

    console.print("[bold cyan]📊 License Status[/bold cyan]\n")

    validator = RaasGateValidator()
    is_valid, error_message = validator.validate(license_key)

    table = Table(title="📜 RaaS License Status", show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value", style="green")

    # Mask license key
    if license_key:
        masked = f"{license_key[:8]}...{license_key[-4:]}" if len(license_key) > 12 else "***"
    else:
        import os
        env_key = os.getenv("RAAS_LICENSE_KEY", "")
        masked = f"{env_key[:8]}...{env_key[-4:]}" if env_key and len(env_key) > 12 else "(not set)"

    table.add_row("License Key", masked)
    table.add_row("Valid", "✅ Yes" if is_valid else "❌ No")

    console.print(table)

    if not is_valid:
        console.print(
            "\n[yellow]⚠️  No valid license found.[/yellow]\n"
            "Generate a key: [bold]mekong roi auth generate --tier pro[/bold]\n"
        )


@app.command("generate")
def generate_license(
    tier: str = typer.Option("pro", "--tier", "-t", help="License tier: free, pro, enterprise"),
    email: str = typer.Option(..., "--email", "-e", help="Email address for license"),
    quantity: int = typer.Option(1, "--quantity", "-q", help="Number of keys to generate"),
) -> None:
    """
    🔑 Generate new license key(s).

    Examples:
        mekong roi auth generate -t pro -e you@example.com
        mekong roi auth generate -t enterprise -e company@example.com -q 3
    """

    console.print(f"[bold cyan]🔑 Generating {quantity} {tier.upper()} license key(s)...[/bold cyan]\n")

    # Validate tier
    tier_lower = tier.lower()
    if tier_lower not in ('free', 'pro', 'enterprise'):
        console.print("[red]Error:[/red] Invalid tier. Must be 'free', 'pro', or 'enterprise'.")
        raise typer.Exit(1)

    for i in range(quantity):
        key = _generate_key(tier_lower, email)

        console.print(f"[green]Key {i+1}:[/green]")
        console.print(f"  [cyan]{key}[/cyan]")
        console.print(f"  Tier: {tier.upper()}")
        console.print(f"  Email: {email}")
        console.print()

    console.print(
        "[yellow]⚠️  Keep these keys secure![/yellow]\n"
        "Add to .env: [bold]RAAS_LICENSE_KEY=your_key[/bold]\n"
        "Validate: [bold]mekong roi auth validate -k your_key[/bold]\n"
    )


def _generate_key(tier: str, email: str) -> str:
    """Generate a license key with embedded tier and email.

    Format: raas_{tier}_{timestamp}_{email_hash}_{random}_hmac
    """
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    email_hash = hashlib.sha256(email.encode()).hexdigest()[:8]
    random_part = secrets.token_hex(8)

    payload = f"{tier}_{timestamp}_{email_hash}_{random_part}"

    import os
    secret = os.getenv("RAAS_KEY_SECRET", "mekong-cli-default-secret-change-in-prod")
    hmac_sig = hashlib.sha256(f"{payload}{secret}".encode()).hexdigest()[:8]

    return f"raas_{payload}_{hmac_sig}"


@app.command("renew")
def renew_license(
    license_key: str = typer.Option(..., "--key", "-k", help="License key to renew"),
    tier: str = typer.Option("pro", "--tier", "-t", help="Target tier for renewal"),
) -> None:
    """
    🔄 Renew existing license.

    Examples:
        mekong roi auth renew -k raas_pro_xxx -t enterprise
    """
    console.print("[bold cyan]🔄 Processing License Renewal...[/bold cyan]\n")
    console.print(f"Current Key: {license_key[:12]}...\n")
    console.print(f"Target Tier: {tier.upper()}\n")

    # In production, this would call the backend renewal API
    console.print(
        "[yellow]⚠️  Renewal not implemented in CLI.[/yellow]\n"
        "Visit [cyan]https://raas.mekong.dev/pricing[/cyan] to renew your license.\n"
    )


@app.command("info")
def license_info(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key"),
) -> None:
    """
    ℹ️  Show detailed license information.

    Examples:
        mekong roi auth info
        mekong roi auth info -k raas_pro_xxx
    """
    from src.lib.raas_gate_validator import RaasGateValidator

    console.print("[bold cyan]ℹ️  License Information[/bold cyan]\n")

    validator = RaasGateValidator()
    is_valid, error_message = validator.validate(license_key)

    table = Table(show_header=True, header_style="bold green" if is_valid else "bold red")
    table.add_column("Property", style="dim")
    table.add_column("Value")

    table.add_row("Status", "✅ Valid" if is_valid else "❌ Invalid")

    console.print(table)

    if not is_valid:
        console.print(f"\n[red]Error:[/red] {error_message}\n")
