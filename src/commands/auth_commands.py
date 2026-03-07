"""
Authentication Commands for Mekong CLI

Commands:
- mekong login: Interactive login with license key
- mekong logout: Clear stored credentials
- mekong auth status: Show current auth state
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, Confirm

from .secure_storage import get_secure_storage, SecureStorageError
from .login_client import get_gateway_client, GatewayClientError

console = Console()

app = typer.Typer(help="Authentication commands")


@app.command("login")
def login(
    license_key: str = typer.Option(
        None,
        "--key", "-k",
        help="License key (raas-* or mk_* format). Prompts if not provided."
    ),
    email: str = typer.Option(
        None,
        "--email", "-e",
        help="Email associated with license. Prompts if not provided."
    ),
    non_interactive: bool = typer.Option(
        False,
        "--non-interactive",
        help="Skip interactive prompts (for CI/CD)"
    )
):
    """
    Login to Mekong CLI with RaaS license key.

    Stores the license key securely using platform-native storage.
    """
    console.print("[bold blue]Mekong CLI Login[/bold blue]\n")

    # Get email
    if not email:
        if non_interactive:
            console.print("[red]Error: --email required in non-interactive mode[/red]")
            raise typer.Exit(1)
        email = Prompt.ask("Enter your email")

    # Get license key
    if not license_key:
        if non_interactive:
            console.print("[red]Error: --key required in non-interactive mode[/red]")
            raise typer.Exit(1)
        license_key = Prompt.ask(
            "Enter your license key",
            password=True  # Hide input
        )

    # Validate license key format
    if not license_key.startswith(("raas-", "raasjwt-", "mk_")):
        console.print(
            "[red]Error: Invalid license key format.[/red]\n"
            "License key must start with:\n"
            "  - raas- (standard license)\n"
            "  - raasjwt- (JWT license)\n"
            "  - mk_ (API key)\n"
        )
        raise typer.Exit(1)

    # Verify with gateway
    console.print("\n[dim]Verifying license with RaaS Gateway...[/dim]")

    try:
        client = get_gateway_client()
        result = client.verify_license(license_key, email)

        if not result.valid:
            console.print(f"[red]✗ License validation failed: {result.error}[/red]")
            raise typer.Exit(1)

        # Store license
        console.print("[green]✓ License verified![/green]")
        console.print("[dim]Storing securely...[/dim]")

        storage = get_secure_storage()
        storage.store_license(license_key)

        # Success message
        console.print("\n[bold green]✓ Login successful![/bold green]\n")

        if result.tier:
            console.print(f"  Tier: [cyan]{result.tier}[/cyan]")
        if result.email:
            console.print(f"  Email: [cyan]{result.email}[/cyan]")
        if result.expires_at:
            console.print(f"  Expires: [cyan]{result.expires_at}[/cyan]")
        if result.features:
            features = ", ".join(result.features[:5])
            if len(result.features) > 5:
                features += "..."
            console.print(f"  Features: [cyan]{features}[/cyan]")

        console.print(
            "\n[dim]You can now use Mekong CLI commands.[/dim]\n"
            "[dim]Run 'mekong auth status' to check your license status.[/dim]\n"
        )

    except GatewayClientError as e:
        console.print(f"[red]✗ Gateway error: {str(e)}[/red]")
        console.print(
            "\n[dim]Tip: Check your internet connection and try again.[/dim]\n"
            "[dim]If the problem persists, contact support.[/dim]\n"
        )
        raise typer.Exit(1)

    except SecureStorageError as e:
        console.print(f"[red]✗ Storage error: {str(e)}[/red]")
        console.print(
            "\n[dim]License verified but could not be stored securely.[/dim]\n"
            "[dim]You can still use the CLI by setting RAAS_LICENSE_KEY env var.[/dim]\n"
        )
        raise typer.Exit(1)


@app.command("logout")
def logout():
    """
    Logout and clear stored credentials.

    Removes the license key from secure storage.
    """
    console.print("[bold blue]Mekong CLI Logout[/bold blue]\n")

    try:
        storage = get_secure_storage()

        if not storage.is_configured():
            console.print("[yellow]No credentials found. Already logged out.[/yellow]\n")
            return

        # Confirm logout
        if Confirm.ask("Are you sure you want to logout?", default=True):
            storage.delete_license()
            console.print("[green]✓ Logout successful![/green]\n")
            console.print(
                "[dim]You will need to login again to use premium features.[/dim]\n"
            )
        else:
            console.print("[dim]Logout cancelled.[/dim]\n")

    except SecureStorageError as e:
        console.print(f"[red]✗ Error: {str(e)}[/red]\n")
        raise typer.Exit(1)


@app.command("status")
def status():
    """
    Show current authentication status.

    Displays license tier, email, and expiry if logged in.
    """
    console.print("[bold blue]Mekong CLI Auth Status[/bold blue]\n")

    storage = get_secure_storage()
    license_key = storage.get_license()

    if not license_key:
        console.print("[yellow]Not logged in[/yellow]\n")
        console.print(
            "Run [cyan]mekong login[/cyan] to login with your license key.\n"
        )
        raise typer.Exit(1)

    # Mask license key for display
    masked = license_key[:8] + "..." + license_key[-4:] if len(license_key) > 12 else "***"

    # Verify current status with gateway
    console.print("[dim]Checking license status with gateway...[/dim]\n")

    try:
        client = get_gateway_client()
        result = client.verify_license(license_key)

        # Create status table
        table = Table(show_header=False, box=None, padding=(0, 1))
        table.add_column("Label", style="dim")
        table.add_column("Value")

        table.add_row("Status:", "[green]✓ Logged in[/green]" if result.valid else "[red]✗ Invalid[/red]")
        table.add_row("License:", masked)

        if result.tier:
            table.add_row("Tier:", result.tier.upper())
        if result.email:
            table.add_row("Email:", result.email)
        if result.expires_at:
            table.add_row("Expires:", result.expires_at)
        if result.features:
            table.add_row("Features:", ", ".join(result.features))

        console.print(table)

        if not result.valid:
            console.print(
                f"\n[red]⚠ License invalid: {result.error}[/red]\n"
                "Run [cyan]mekong login[/cyan] to update your license.\n"
            )
            raise typer.Exit(1)

        console.print("\n[dim]✓ Your license is active and valid.[/dim]\n")

    except GatewayClientError:
        # Gateway unreachable - show local status only
        console.print("[yellow]⚠ Gateway unreachable - showing local status only[/yellow]\n")

        table = Table(show_header=False, box=None, padding=(0, 1))
        table.add_column("Label", style="dim")
        table.add_column("Value")

        table.add_row("Status:", "[yellow]Unknown (offline)[/yellow]")
        table.add_row("License:", masked)
        table.add_row("Storage:", "Secure storage configured")

        console.print(table)
        console.print(
            "\n[dim]Tip: Connect to internet to verify license status.[/dim]\n"
        )


@app.command()
def verify(
    license_key: str = typer.Argument(..., help="License key to verify")
):
    """
    Verify a license key without storing it.

    Useful for checking a license before purchasing or transferring.
    """
    console.print("[bold blue]License Verification[/bold blue]\n")

    try:
        client = get_gateway_client()
        result = client.verify_license(license_key)

        if result.valid:
            console.print("[bold green]✓ Valid License[/bold green]\n")

            table = Table(show_header=True, box=None, padding=(0, 1))
            table.add_column("Attribute", style="dim")
            table.add_column("Value")

            if result.tier:
                table.add_row("Tier", result.tier.upper())
            if result.email:
                table.add_row("Email", result.email)
            if result.expires_at:
                table.add_row("Expires", result.expires_at)
            if result.features:
                table.add_row("Features", ", ".join(result.features))

            console.print(table)
        else:
            console.print("[red]✗ Invalid License[/red]\n")
            console.print(f"[dim]Error: {result.error}[/dim]\n")
            raise typer.Exit(1)

    except GatewayClientError as e:
        console.print(f"[red]✗ Verification failed: {str(e)}[/red]\n")
        raise typer.Exit(1)
