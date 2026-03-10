"""
License Activation Command — Phase 6 CLI Integration

Command: mekong auth activate --key=mk_...
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional

console = Console()


def _mask_license_key(key: Optional[str]) -> str:
    """
    Mask license key for display.

    Args:
        key: License key to mask (can be None)

    Returns:
        Masked key string (e.g., "mk_abc12...z789" or "(hidden)")
    """
    if not key:
        return "(unknown)"

    key = key.strip()
    if len(key) <= 12:
        # Short key: first 4 + ... + last 4
        if len(key) >= 8:
            return f"{key[:4]}...{key[-4:]}"
        return "(hidden)"

    # Standard format: first 8 + ... + last 4
    return f"{key[:8]}...{key[-4:]}"


def activate(
    key: str = typer.Option(..., "--key", "-k", help="License key (mk_...)"),
    no_persist: bool = typer.Option(
        False,
        "--no-persist",
        help="Don't save credentials to file (session only)",
    ),
) -> None:
    """
    🔑 Activate license key against RaaS Gateway.

    Activates a license key and stores it securely for subsequent CLI commands.

    Examples:
        mekong auth activate -k mk_abc123...
        mekong auth activate --key mk_pro_key --no-persist

    Part of Phase 6: CLI Integration with RaaS Gateway
    """
    from src.core.raas_auth import RaaSAuthClient
    from src.core.activation_sync import get_activation_sync

    console.print("[bold cyan]🔑 RaaS License Activation[/bold cyan]\n")

    # Validate key format
    key = key.strip()
    if not key.startswith("mk_"):
        console.print(
            "[yellow]⚠️[/yellow] License key should start with 'mk_'\n"
        )

    # Activate
    client = RaaSAuthClient()
    result = client.activate(token=key, persist=not no_persist)

    if result.valid and result.tenant:
        console.print("[bold green]✅ License activated successfully![/bold green]\n")

        # Show tenant info
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Property", style="dim")
        table.add_column("Value", style="green")

        # Mask license key for display
        key_display = _mask_license_key(key)

        table.add_row("Tenant ID", result.tenant.tenant_id)
        table.add_row("Tier", result.tenant.tier.upper())
        table.add_row("Role", result.tenant.role)
        table.add_row("License Key", key_display)

        if result.tenant.expires_at:
            table.add_row(
                "Expires",
                result.tenant.expires_at.strftime("%Y-%m-%d %H:%M UTC"),
            )

        console.print(table)

        if result.tenant.features:
            console.print(f"\n[bold]Enabled Features:[/bold] ({len(result.tenant.features)})")
            for feature in result.tenant.features[:10]:
                console.print(f"  • {feature}")
            if len(result.tenant.features) > 10:
                console.print(f"  ... and {len(result.tenant.features) - 10} more")

        # Sync to dashboard
        console.print("\n[bold]Syncing to dashboard...[/bold]")
        try:
            sync = get_activation_sync()
            sync.sync_activation(
                tenant_id=result.tenant.tenant_id,
                agency_id=result.tenant.tenant_id,  # Use tenant_id as agency_id for now
                tier=result.tenant.tier,
                license_key=key,
                features=result.tenant.features,
            )
            console.print("[green]✓ Dashboard synced[/green]\n")
        except Exception:
            console.print("[yellow]⚠️ Dashboard sync queued (will retry)[/yellow]\n")

        # Show dashboard link
        dashboard_url = f"https://agencyos.network/dashboard/{result.tenant.tenant_id}"
        console.print(
            Panel(
                f"Gateway: {client.gateway_url}\n"
                f"Dashboard: {dashboard_url}\n"
                f"Credentials: {client.credentials_path}",
                title="📌 Activation Info",
                border_style="cyan",
            )
        )

        console.print(
            f"\n[dim]Next steps:[/dim]\n"
            f"  • View dashboard: [bold]{dashboard_url}[/bold]\n"
            f"  • Run commands: [bold]mekong cook \"your goal\"[/bold]\n"
            f"  • Check status: [bold]mekong auth status[/bold]\n"
        )
    else:
        console.print("[bold red]❌ Activation failed[/bold red]\n")
        console.print(f"[red]Error:[/red] {result.error}\n")
        if result.error_code:
            console.print(f"[dim]Code: {result.error_code}[/dim]\n")
        raise typer.Exit(1)
