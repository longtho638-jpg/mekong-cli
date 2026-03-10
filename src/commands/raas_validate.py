"""
RaaS License Validation Command — Phase 1 Gate

Command: mekong validate-license

Validates RaaS license key against RaaS Gateway with certificate-based authentication.

Usage:
    mekong validate-license [--check] [--renew] [--status]

Environment Variables:
    RAAS_LICENSE_KEY: License key (mk_* or JWT format)
    RAAS_GATEWAY_URL: Gateway URL (default: https://raas.agencyos.network)
    RAAS_USE_CERTIFICATE_AUTH: Enable certificate auth (default: true)
"""

import typer
from rich.console import Console
from rich.panel import Panel
from datetime import datetime, timezone
import os

console = Console()

app = typer.Typer(help="RaaS License validation commands")


@app.command("validate-license")
def validate_license(
    license_key: str = typer.Option(
        None,
        "--key", "-k",
        help="License key (mk_* or JWT format). Uses RAAS_LICENSE_KEY env if not provided."
    ),
    check: bool = typer.Option(
        False,
        "--check", "-c",
        help="Check license status without validation"
    ),
    renew: bool = typer.Option(
        False,
        "--renew", "-r",
        help="Force certificate renewal before validation"
    ),
    no_certificate: bool = typer.Option(
        False,
        "--no-cert",
        help="Disable certificate-based authentication"
    ),
):
    """
    Validate RaaS license key against RaaS Gateway.

    Uses certificate-based authentication by default.
    All API requests include required certificate headers:
    - X-Cert-ID: Certificate ID
    - X-Cert-Sig: ECDSA signature
    - X-Cert-Timestamp: ISO8601 timestamp
    """
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]=== RaaS License Validation ===[/bold cyan]\n")

    # Get license key
    if not license_key:
        license_key = os.getenv("RAAS_LICENSE_KEY")

    if not license_key and not check:
        console.print(
            "[red]Error:[/red] No license key provided.\n"
            "Set [cyan]RAAS_LICENSE_KEY[/cyan] environment variable or use [cyan]--key[/cyan] option.\n"
        )
        raise typer.Exit(1)

    # Initialize auth client
    use_certificate_auth = not no_certificate and os.getenv("RAAS_USE_CERTIFICATE_AUTH", "true").lower() != "false"

    try:
        client = RaaSAuthClient(use_certificate_auth=use_certificate_auth)
    except Exception as e:
        console.print(f"[red]Error initializing auth client: {e}[/red]")
        raise typer.Exit(1)

    # Check mode - show status without validation
    if check:
        _show_license_status(client)
        return

    # Certificate renewal if requested
    if renew and use_certificate_auth:
        console.print("[dim]Rotating certificate...[/dim]")
        try:
            client.rotate_certificate()
            console.print("[green]✓ Certificate rotated[/green]\n")
        except Exception as e:
            console.print(f"[yellow]⚠ Certificate rotation failed: {e}[/yellow]\n")

    # Show certificate info if enabled
    if use_certificate_auth:
        cert_status = client.get_certificate_status()
        if cert_status.get("has_certificate"):
            console.print(
                f"[dim]Certificate: {cert_status.get('certificate_id', 'N/A')}[/dim]\n"
            )

    # Validate credentials
    console.print("[dim]Validating license with RaaS Gateway...[/dim]")
    console.print(f"[dim]Gateway: {client.gateway_url}[/dim]\n")

    result = client.validate_credentials(license_key)

    # Display result
    if result.valid and result.tenant:
        _show_success_result(result, client)
        raise typer.Exit(0)
    else:
        _show_failure_result(result)
        raise typer.Exit(1)


def _show_success_result(result, client):
    """Display successful validation result."""
    tenant = result.tenant

    # Build success panel
    lines = [
        "[bold green]✓ License validated successfully![/bold green]\n",
        f"[bold]Tenant ID:[/bold] {tenant.tenant_id}",
        f"[bold]Tier:[/bold] {tenant.tier.upper()}",
        f"[bold]Role:[/bold] {tenant.role}",
    ]

    if tenant.features:
        lines.append(f"[bold]Features:[/bold] {', '.join(tenant.features)}")

    if tenant.expires_at:
        days_left = (tenant.expires_at - datetime.now(timezone.utc)).days
        expiry_status = f"{tenant.expires_at.strftime('%Y-%m-%d %H:%M')} ({days_left} days remaining)"
        if days_left < 7:
            expiry_status += " [yellow]⚠ Expiring soon![/yellow]"
        elif days_left < 0:
            expiry_status += " [red]✗ Expired![/red]"
        lines.append(f"[bold]Expires:[/bold] {expiry_status}")

    # Show certificate info
    if client._certificate_store:
        cert_status = client.get_certificate_status()
        if cert_status.get("has_certificate"):
            lines.append("")
            lines.append("[bold]Certificate Auth:[/bold]")
            lines.append(f"  ID: {cert_status.get('certificate_id', 'N/A')}")
            lines.append(f"  Valid: {cert_status.get('is_valid', False)}")
            if cert_status.get("should_rotate"):
                lines.append("  [yellow]⚠ Should rotate soon[/yellow]")

    console.print(Panel("\n".join(lines), title="🎯 Validation Result", border_style="green"))

    # Show API headers that will be used
    console.print("\n[bold]API Headers (for subsequent requests):[/bold]")
    headers = client._get_certificate_headers() if client._certificate_store else {}
    if headers:
        for key, value in headers.items():
            if key == "Authorization":
                console.print(f"  {key}: Bearer {value[:20]}...")
            elif key == "X-Cert-Sig":
                console.print(f"  {key}: {value[:32]}...")
            else:
                console.print(f"  {key}: {value}")
    console.print()


def _show_failure_result(result):
    """Display failed validation result."""
    error_message = result.error or "Unknown error"
    error_code = result.error_code or "unknown_error"

    # Specific error messages
    error_details = {
        "missing_credentials": "No license key provided. Set RAAS_LICENSE_KEY env var or use --key option.",
        "invalid_api_key_format": "License key must start with 'mk_' and be at least 8 characters.",
        "invalid_jwt_format": "Invalid JWT format. Expected: header.payload.signature",
        "token_expired": "JWT token has expired. Please renew or generate a new token.",
        "unknown_format": "Unrecognized license key format. Use mk_* (API key) or JWT format.",
        "gateway_error": "RaaS Gateway unreachable. Check your internet connection.",
        "invalid_license": "License key is invalid or has been revoked.",
        "insufficient_permissions": "License key lacks required permissions.",
    }

    detail = error_details.get(error_code, f"Error code: {error_code}")

    lines = [
        "[bold red]✗ License validation failed[/bold red]\n",
        f"[red]{error_message}[/red]",
        "",
        f"[dim]{detail}[/dim]",
    ]

    console.print(Panel("\n".join(lines), title="❌ Validation Failed", border_style="red"))


def _show_license_status(client):
    """Show current license status without validation."""
    console.print("[bold cyan]=== License Status ===[/bold cyan]\n")

    # Check environment
    has_env_key = bool(os.getenv("RAAS_LICENSE_KEY"))
    console.print(f"RAAS_LICENSE_KEY env: {'[green]Set[/green]' if has_env_key else '[red]Not set[/red]'}")

    # Check stored credentials
    try:
        creds = client._load_credentials()
        has_stored = bool(creds.get("token"))
        console.print(f"Stored credentials: {'[green]Found[/green]' if has_stored else '[red]None[/red]'}")
    except Exception:
        console.print("Stored credentials: [yellow]Unable to check[/yellow]")

    # Check session cache
    if client._session_cache:
        cache = client._session_cache
        console.print("\n[bold]Session Cache:[/bold]")
        console.print(f"  Tenant: {cache.tenant_id}")
        console.print(f"  Tier: {cache.tier}")
        console.print(f"  Valid: [green]Yes[/green] (expires in {(cache.session_expires_at - datetime.now(timezone.utc)).total_seconds() / 60:.0f} min)")
    else:
        console.print("\nSession Cache: [dim]None or expired[/dim]")

    # Check certificate
    if client._certificate_store:
        cert_status = client.get_certificate_status()
        console.print("\n[bold]Certificate:[/bold]")
        console.print(f"  Present: {'[green]Yes[/green]' if cert_status.get('has_certificate') else '[red]No[/red]'}")
        if cert_status.get("has_certificate"):
            console.print(f"  ID: {cert_status.get('certificate_id', 'N/A')}")
            console.print(f"  Valid: {'[green]Yes[/green]' if cert_status.get('is_valid') else '[red]No[/red]'}")
            console.print(f"  Should Rotate: {'[yellow]Yes[/yellow]' if cert_status.get('should_rotate') else '[green]No[/green]'}")

    console.print()


@app.command("license-status")
def license_status():
    """Show current RaaS license status."""
    from src.core.raas_auth import RaaSAuthClient

    try:
        client = RaaSAuthClient()
        _show_license_status(client)
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        raise typer.Exit(1)


__all__ = ["app", "validate_license", "license_status"]
