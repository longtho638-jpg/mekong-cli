"""
RaaS Auth CLI Commands — Authentication management

Commands:
  mekong auth login     — Login with API key or JWT
  mekong auth activate  — Activate license key
  mekong auth logout    — Clear stored credentials
  mekong auth status    — Show current auth status
  mekong auth validate  — Validate credentials

Part of Phase 6: CLI Integration with RaaS Gateway
Phase 1: CLI License Activation
"""

import typer
import os
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional

console = Console()
app = typer.Typer(name="auth", help="🔐 RaaS Gateway authentication")


@app.command("login")
def login(
    api_key: Optional[str] = typer.Argument(
        None,
        help="API key (mk_...) or JWT token. If omitted, reads from stdin or env.",
    ),
    no_persist: bool = typer.Option(
        False,
        "--no-persist",
        help="Don't save credentials to file (session only)",
    ),
) -> None:
    """
    🔑 Login to RaaS Gateway.

    Examples:
        mekong auth login mk_abc123...
        mekong auth login  # Reads from RAAS_LICENSE_KEY env
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]🔐 RaaS Gateway Login[/bold cyan]\n")

    # Get API key from various sources
    if not api_key:
        api_key = os.getenv("RAAS_LICENSE_KEY")

    if not api_key:
        # Interactive prompt
        api_key = typer.prompt(
            "Enter API key (mk_...) or JWT token",
            hide_input=True,
        )

    if not api_key.strip():
        console.print("[red]❌ No credentials provided[/red]\n")
        raise typer.Exit(1)

    # Login
    client = RaaSAuthClient()
    result = client.login(token=api_key.strip(), persist=not no_persist)

    if result.valid and result.tenant:
        console.print("[bold green]✅ Login successful![/bold green]\n")

        # Show tenant info
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Property", style="dim")
        table.add_column("Value", style="green")

        # Mask license key for display
        if result.tenant.license_key:
            key_display = f"{result.tenant.license_key[:8]}...{result.tenant.license_key[-4:]}"
        else:
            key_display = "(JWT)"

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
            for feature in result.tenant.features[:10]:  # Show first 10
                console.print(f"  • {feature}")
            if len(result.tenant.features) > 10:
                console.print(f"  ... and {len(result.tenant.features) - 10} more")

        console.print(
            Panel(
                f"Gateway: {client.gateway_url}\n"
                f"Credentials: {client.credentials_path}",
                title="📌 Session Info",
                border_style="cyan",
            )
        )
    else:
        console.print("[bold red]❌ Login failed[/bold red]\n")
        console.print(f"[red]Error:[/red] {result.error}\n")
        if result.error_code:
            console.print(f"[dim]Code: {result.error_code}[/dim]\n")
        raise typer.Exit(1)


@app.command("logout")
def logout() -> None:
    """
    🚪 Logout and clear stored credentials.

    Examples:
        mekong auth logout
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]🚪 Logging out...[/bold cyan]\n")

    client = RaaSAuthClient()
    cleared = client.logout()

    if cleared:
        console.print("[bold green]✅ Logged out successfully[/bold green]\n")
        console.print(
            "[dim]Stored credentials have been cleared.[/dim]\n"
            "Login again: [bold]mekong auth login[/bold]\n"
        )
    else:
        console.print("[yellow]⚠️ No stored credentials found[/yellow]\n")


@app.command("status")
def status(
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed status info",
    ),
) -> None:
    """
    📊 Show current authentication status.

    Examples:
        mekong auth status
        mekong auth status -v
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]📊 Authentication Status[/bold cyan]\n")

    client = RaaSAuthClient()
    session = client.get_session()

    table = Table(title="📜 RaaS Gateway Session", show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value", style="green" if session.authenticated else "red")

    # Auth status
    auth_status = "✅ Authenticated" if session.authenticated else "❌ Not authenticated"
    table.add_row("Status", auth_status)

    # Tenant info
    table.add_row("Tenant ID", session.tenant_id)
    table.add_row("Tier", session.tier.upper())

    # Secure storage info
    storage_status = "✅ Secure Storage" if session.uses_secure_storage else "⚠️ Plaintext File"
    table.add_row("Storage", storage_status)

    # Gateway
    table.add_row("Gateway URL", session.gateway_url or "(not set)")

    console.print(table)

    if verbose:
        console.print(f"\n[bold]Credentials File:[/bold] {session.credentials_path}")

        if session.last_validated:
            console.print(
                f"[bold]Last Validated:[/bold] {session.last_validated.strftime('%Y-%m-%d %H:%M:%S')}"
            )

        # Check file exists
        creds_path = session.credentials_path
        if os.path.exists(creds_path):
            console.print("[green]✓ Credentials file exists[/green]")
        else:
            console.print("[dim]ℹ Using secure storage (no file)[/dim]")

    if not session.authenticated:
        console.print(
            "\n[yellow]⚠️ No active session.[/yellow]\n"
            "Login: [bold]mekong auth login[/bold]\n"
        )


@app.command("validate")
def validate(
    token: Optional[str] = typer.Option(
        None,
        "--token",
        "-t",
        help="Token to validate (defaults to stored credentials)",
    ),
    gateway_url: Optional[str] = typer.Option(
        None,
        "--gateway",
        "-g",
        help="Gateway URL to validate against",
    ),
) -> None:
    """
    ✅ Validate credentials against RaaS Gateway.

    Examples:
        mekong auth validate
        mekong auth validate -t mk_abc123
        mekong auth validate -g https://raas.agencyos.network
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]✅ Validating Credentials...[/bold cyan]\n")

    client = RaaSAuthClient(gateway_url=gateway_url)
    result = client.validate_credentials(token)

    if result.valid and result.tenant:
        console.print("[bold green]✅ Valid Credentials![/bold green]\n")

        table = Table(show_header=True, header_style="bold green")
        table.add_column("Property", style="dim")
        table.add_column("Value", style="green")

        table.add_row("Tenant ID", result.tenant.tenant_id)
        table.add_row("Tier", result.tenant.tier.upper())
        table.add_row("Role", result.tenant.role)

        if result.tenant.license_key:
            masked = f"{result.tenant.license_key[:8]}...{result.tenant.license_key[-4:]}"
            table.add_row("License Key", masked)

        if result.tenant.expires_at:
            table.add_row(
                "Expires",
                result.tenant.expires_at.strftime("%Y-%m-%d %H:%M UTC"),
            )

        console.print(table)

        if result.tenant.features:
            console.print(f"\n[bold]Features:[/bold] ({len(result.tenant.features)})")
            for feature in result.tenant.features[:5]:
                console.print(f"  • {feature}")
    else:
        console.print("[bold red]❌ Invalid Credentials[/bold red]\n")
        console.print(f"[red]Error:[/red] {result.error}\n")
        if result.error_code:
            console.print(f"[dim]Code: {result.error_code}[/dim]\n")
        raise typer.Exit(1)


@app.command("whoami")
def whoami() -> None:
    """
    👤 Show current user/tenant info.

    Examples:
        mekong auth whoami
    """
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]👤 Current Identity[/bold cyan]\n")

    client = get_auth_client()
    tenant = client.get_tenant_context()

    if tenant:
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Property", style="dim")
        table.add_column("Value")

        table.add_row("Tenant ID", tenant.tenant_id)
        table.add_row("Tier", tenant.tier.upper())
        table.add_row("Role", tenant.role)

        if tenant.license_key:
            masked = f"{tenant.license_key[:8]}...{tenant.license_key[-4:]}"
            table.add_row("API Key", masked)

        console.print(table)
    else:
        console.print("[yellow]⚠️ No tenant context (not logged in)[/yellow]\n")
        console.print("Login: [bold]mekong auth login[/bold]\n")


# Import and register activate command as subcommand
def _register_activate_command() -> None:
    """Register activate command as subcommand of auth."""
    from src.cli.activate_commands import activate
    app.command("activate")(activate)


# Auto-register activate command when module is imported
_register_activate_command()
