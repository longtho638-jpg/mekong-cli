"""
License Activation CLI Command — Phase 6

Commands:
    mekong license-activate <key>  - Activate license key
    mekong license-status          - Show current license status
    mekong license-deactivate      - Deactivate current license

Usage:
    mekong license-activate mk_your_license_key
    mekong license-status
    mekong license-deactivate
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional
import os

console = Console()

app = typer.Typer(
    name="license-activation",
    help="🔑 License activation and management",
    rich_markup_mode="rich",
)


@app.command("activate")
def activate_license(
    license_key: Optional[str] = typer.Argument(
        None,
        help="RaaS License Key (mk_...)",
    ),
    from_env: bool = typer.Option(
        False,
        "--from-env",
        "-e",
        help="Read license key from RAAS_LICENSE_KEY env var",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed activation information",
    ),
) -> None:
    """
    🔑 Activate RaaS license key.

    Validates license key against RaaS Gateway and stores locally.

    Examples:
        mekong license-activate mk_abc123...
        mekong license-activate --from-env
        mekong license-activate -v
    """
    from src.core.raas_auth import RaaSAuthClient
    from src.core.license_manager import get_license_manager, LicenseData

    console.print("[bold cyan]🔑 RaaS License Activation[/bold cyan]\n")

    # Get license key
    if from_env:
        license_key = os.getenv("RAAS_LICENSE_KEY")
        if not license_key:
            console.print(
                "[bold red]✗ Error:[/bold red] RAAS_LICENSE_KEY not set\n"
                "[dim]Export your license key first:[/dim]\n"
                "  [cyan]export RAAS_LICENSE_KEY=mk_your_key[/cyan]\n"
            )
            raise SystemExit(1)
    elif not license_key:
        console.print(
            "[bold red]✗ Error:[/bold red] No license key provided\n"
            "[dim]Usage:[/dim]\n"
            "  [cyan]mekong license-activate mk_your_key[/cyan]\n\n"
            "[dim]Or use --from-env to read from RAAS_LICENSE_KEY[/dim]\n"
        )
        raise SystemExit(1)

    # Validate format
    if not license_key.startswith("mk_"):
        console.print(
            "[yellow]⚠ Warning:[/yellow] License key should start with 'mk_'\n"
        )

    # Step 1: Validate with RaaS Gateway
    console.print("[dim]Step 1/3: Validating with RaaS Gateway...[/dim]")
    auth_client = RaaSAuthClient()
    result = auth_client.validate_credentials(license_key)

    if not result.valid:
        console.print(f"[bold red]✗ Validation failed: {result.error}[/bold red]\n")
        console.print(
            "[dim]Get a license key from:[/dim]\n"
            "  [cyan]https://raas.agencyos.network[/cyan]\n"
        )
        raise SystemExit(1)

    console.print("[green]✓ License validated[/green]\n")

    # Step 2: Store license locally
    console.print("[dim]Step 2/3: Storing license...[/dim]")
    license_manager = get_license_manager()

    license_data = LicenseData(
        license_key=license_key,
        tenant_id=result.tenant_id,
        tier=result.tier,
        features=result.features if hasattr(result, 'features') else [],
        rate_limit=result.rate_limit if hasattr(result, 'rate_limit') else 60,
        expires_at=result.expires_at.isoformat() if hasattr(result, 'expires_at') and result.expires_at else None,
    )

    if not license_manager.save_license(license_data):
        console.print("[bold red]✗ Failed to save license[/bold red]\n")
        raise SystemExit(1)

    console.print("[green]✓ License stored[/green]\n")

    # Step 3: Update validation timestamp
    console.print("[dim]Step 3/3: Updating validation...[/dim]")
    license_manager.update_validation_timestamp()
    console.print("[green]✓ Activation complete[/green]\n")

    # Display summary
    _display_license_summary(license_data, verbose)


@app.command("status")
def license_status(
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed license information",
    ),
    json_output: bool = typer.Option(
        False,
        "--json",
        "-j",
        help="Output as JSON",
    ),
) -> None:
    """
    📋 Show current license status.

    Displays activated license tier, features, and expiry.

    Examples:
        mekong license-status
        mekong license-status -v
        mekong license-status --json
    """
    from src.core.license_manager import get_license_manager

    console.print("[bold cyan]📋 License Status[/bold cyan]\n")

    license_manager = get_license_manager()
    license_data = license_manager.get_license()

    if not license_data:
        console.print(
            Panel(
                "[yellow]No license activated[/yellow]\n\n"
                "Activate your license with:\n"
                "  [cyan]mekong license-activate mk_your_key[/cyan]\n\n"
                "Or set environment variable:\n"
                "  [cyan]export RAAS_LICENSE_KEY=mk_your_key[/cyan]",
                title="No License",
                border_style="yellow",
            )
        )
        return

    if json_output:
        import json
        print(json.dumps(license_data.to_dict(), indent=2, default=str))
        return

    # Status indicator
    if license_data.is_expired:
        status = "❌ Expired"
        status_color = "red"
    elif license_data.days_until_expiry and license_data.days_until_expiry <= 7:
        status = f"⚠️ Expiring in {license_data.days_until_expiry} days"
        status_color = "yellow"
    else:
        status = "✅ Active"
        status_color = "green"

    console.print(f"[bold {status_color}]{status}[/bold {status_color}]\n")

    # License details table
    table = Table(title="License Details", show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value", style="green")

    table.add_row("Tenant ID", license_data.tenant_id)
    table.add_row("Tier", license_data.tier.upper())
    table.add_row("Rate Limit", f"{license_data.rate_limit} requests/min")
    table.add_row("Max Payload", f"{license_data.max_payload_size:,} bytes")
    table.add_row("Retention", f"{license_data.retention_days} days")

    if license_data.features:
        table.add_row("Features", ", ".join(license_data.features))
    else:
        table.add_row("Features", "[dim]Default features[/dim]")

    if license_data.expires_at:
        table.add_row("Expires At", license_data.expires_at)
        if license_data.days_until_expiry is not None:
            table.add_row("Days Until Expiry", str(license_data.days_until_expiry))

    table.add_row("Activated At", license_data.activated_at)
    table.add_row("Last Validated", license_data.last_validated)

    console.print(table)

    if verbose:
        console.print(f"\n[dim]License file: {license_manager.license_path}[/dim]\n")


@app.command("deactivate")
def deactivate_license(
    force: bool = typer.Option(
        False,
        "--force",
        "-f",
        help="Deactivate without confirmation",
    ),
) -> None:
    """
    🚫 Deactivate current license.

    Removes stored license from local storage.

    Examples:
        mekong license-deactivate
        mekong license-deactivate --force
    """
    from src.core.license_manager import get_license_manager

    console.print("[bold cyan]🚫 Deactivate License[/bold cyan]\n")

    license_manager = get_license_manager()
    license_data = license_manager.get_license()

    if not license_data:
        console.print("[yellow]No license to deactivate[/yellow]\n")
        return

    if not force:
        # Show confirmation
        console.print(
            f"Current license: [cyan]{license_data.tenant_id}[/cyan] ({license_data.tier.upper()})\n"
        )
        confirm = typer.confirm("Are you sure you want to deactivate this license?")
        if not confirm:
            console.print("[dim]Deactivation cancelled[/dim]\n")
            return

    if license_manager.clear_license():
        console.print(
            Panel(
                "[green]✓ License deactivated[/green]\n\n"
                "Activate a new license with:\n"
                "  [cyan]mekong license-activate mk_your_key[/cyan]",
                title="Success",
                border_style="green",
            )
        )
    else:
        console.print("[bold red]✗ Failed to deactivate license[/bold red]\n")


def _display_license_summary(license_data, verbose: bool = False) -> None:
    """Display license activation summary."""
    tier_color = {
        "free": "dim",
        "pro": "green",
        "enterprise": "bold magenta",
        "unlimited": "bold cyan",
    }.get(license_data.tier.lower(), "white")

    summary = Table(show_header=False, box=None)
    summary.add_column("Label", style="dim")
    summary.add_column("Value", style=tier_color)

    summary.add_row("Tenant", license_data.tenant_id)
    summary.add_row("Tier", license_data.tier.upper())
    summary.add_row("Rate Limit", f"{license_data.rate_limit}/min")

    if license_data.days_until_expiry:
        summary.add_row("Expires In", f"{license_data.days_until_expiry} days")
    elif license_data.expires_at:
        summary.add_row("Expires", "Never")

    console.print(summary)

    if verbose:
        if license_data.features:
            console.print(f"\n[dim]Features: {', '.join(license_data.features)}[/dim]")
        console.print("[dim]Gateway: https://raas.agencyos.network[/dim]\n")


# Export for registration in main.py
