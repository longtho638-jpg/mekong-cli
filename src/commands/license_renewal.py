"""
License Renewal Flow — ROIaaS Phase 6d

Commands for handling license renewal with deep linking and post-renewal sync.
"""

import webbrowser
import typer
from rich.console import Console
from rich.panel import Panel

from src.lib.quota_error_messages import get_renewal_url
from src.lib.raas_gate import get_license_gate

console = Console()
app = typer.Typer()


@app.command()
def renewal_open(
    auto: bool = typer.Option(False, "--auto", "-a", help="Open browser automatically")
) -> None:
    """
    Open license renewal portal with user context.

    Detects current license and opens renewal page with pre-filled data.
    """
    gate = get_license_gate()

    # Get current license info
    key_id = gate._key_id
    tier = gate._license_tier
    email = ""  # Would need to fetch from user profile

    # Build deep-linked renewal URL
    renewal_url = get_renewal_url(key_id=key_id or "", tier=tier or "", email=email)

    console.print(
        Panel(
            f"[bold]License Renewal Portal[/bold]\n\n"
            f"Key ID: {key_id or 'N/A'}\n"
            f"Tier: {tier or 'N/A'}\n\n"
            f"Renewal URL:\n[link={renewal_url}]{renewal_url}[/link]\n\n"
            f"Opening in browser..." if auto else "Use --auto to open in browser",
            title="🔄 License Renewal",
            border_style="yellow",
        )
    )

    if auto:
        webbrowser.open(renewal_url)


@app.command()
def renewal_status() -> None:
    """
    Check and display license renewal eligibility.

    Shows days remaining, renewal options, and upgrade paths.
    """
    gate = get_license_gate()

    if not gate.has_license:
        console.print(
            Panel(
                "No license found. Use [bold]mekong license generate[/bold] to create one.",
                title="⚠️ No License",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)

    # Get license status
    is_valid, info, error = gate.validate_remote(gate.license_key or "")

    if not is_valid:
        console.print(
            Panel(
                f"License invalid: {error}\n\n"
                f"Renew now: [link={get_renewal_url()}]{get_renewal_url()}[/link]",
                title="⚠️ License Invalid",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)

    if info:
        status = info.get("status", "active")
        tier = info.get("tier", "unknown")

        if status == "expired":
            expires_at = info.get("expires_at")
            expiry_date = "unknown"
            if expires_at:
                from datetime import datetime, timezone
                expiry_date = datetime.fromtimestamp(expires_at, tz=timezone.utc).strftime("%Y-%m-%d")

            renewal_url = get_renewal_url(
                key_id=info.get("key_id", ""),
                tier=tier,
            )

            console.print(
                Panel(
                    f"Expired on: {expiry_date}\n"
                    f"Tier: {tier}\n\n"
                    f"[bold]Renew now:[/bold] [link={renewal_url}]{renewal_url}[/link]",
                    title="⏰ License Expired",
                    border_style="orange",
                )
            )
        else:
            console.print(
                Panel(
                    f"Status: {status}\n"
                    f"Tier: {tier}\n"
                    f"Key ID: {info.get('key_id', 'N/A')}\n\n"
                    f"✅ License is active",
                    title="✓ License Active",
                    border_style="green",
                )
            )


@app.command()
def renewal_sync() -> None:
    """
    Sync license after renewal.

    Forces re-validation with RaaS backend to pick up renewed license.
    """
    gate = get_license_gate()

    if not gate.has_license:
        console.print("[red]No license to sync[/red]")
        raise typer.Exit(code=1)

    console.print("🔄 Syncing license with RaaS backend...")

    # Force re-validation
    is_valid, info, error = gate.validate_remote(gate.license_key or "")

    if is_valid and info:
        status = info.get("status", "unknown")
        tier = info.get("tier", "unknown")

        console.print(
            Panel(
                f"Status: [green]{status}[/green]\n"
                f"Tier: {tier}\n"
                f"Key ID: {info.get('key_id', 'N/A')}\n\n"
                f"License synced successfully!",
                title="✅ License Synced",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                f"Sync failed: {error}\n\n"
                f"Please ensure you've renewed at:\n"
                f"[link={get_renewal_url()}]{get_renewal_url()}[/link]",
                title="❌ Sync Failed",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
