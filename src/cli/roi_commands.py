"""
ROI Unified Command — Phase 6

Single entry point for all RaaS operations:
- auth: License validation & management
- usage: Usage metering reporting
- billing: Billing status & webhook verification
- dashboard: Analytics dashboard data fetching

Auto-update notifications and session resume capability included.
"""

from datetime import datetime
import typer
from rich.console import Console
from rich.table import Table
from typing import Optional
import asyncio

from .roi_auth import app as auth_app
from .roi_usage import app as usage_app
from .roi_billing import app as billing_app
from .roi_dashboard import app as dashboard_app

console = Console()
app = typer.Typer(
    name="roi",
    help="🎯 Unified ROI command - auth, usage, billing, dashboard",
    rich_markup_mode="rich",
)

# Register subcommands
app.add_typer(auth_app, name="auth")
app.add_typer(usage_app, name="usage")
app.add_typer(billing_app, name="billing")
app.add_typer(dashboard_app, name="dashboard")


@app.callback()
def roi_callback(
    ctx: typer.Context,
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
    json_output: bool = typer.Option(False, "--json", "-j", help="JSON output"),
) -> None:
    """
    🎯 ROI - Revenue as a Service Unified Command

    Unified CLI for all RaaS operations:

    \b
    Subcommands:
      auth       🔐 License validation & management
      usage      📊 Usage metering & quota tracking
      billing    💰 Billing status & reconciliation
      dashboard  📈 Analytics dashboard & exports

    \b
    Examples:
      mekong roi auth status
      mekong roi usage report -k lk_abc123
      mekong roi billing reconcile --all
      mekong roi dashboard show --range 30

    \b
    Full status (all-in-one):
      mekong roi status
    """
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose
    ctx.obj["json_output"] = json_output

    # Auto-update check (non-blocking)
    if ctx.invoked_subcommand != "auto-update":
        _check_auto_update_async()


def _check_auto_update_async() -> None:
    """Check for auto-updates in background (non-blocking)."""
    try:
        # Run in background to avoid blocking CLI
        import threading
        thread = threading.Thread(target=_check_auto_update_impl, daemon=True)
        thread.start()
    except Exception:
        pass  # Silently ignore update check errors


def _check_auto_update_impl() -> None:
    """Implementation of auto-update check."""
    try:
        import requests
        from packaging import version

        # Get current version
        current_version = _get_current_version()
        if not current_version:
            return

        # Check latest release
        response = requests.get(
            "https://api.github.com/repos/longtho638-jpg/mekong-cli/releases/latest",
            timeout=2,
        )
        if response.status_code == 200:
            data = response.json()
            latest_version = data.get("tag_name", "").lstrip("v")

            if version.parse(latest_version) > version.parse(current_version):
                console.print(
                    f"\n[yellow]🔄 Update available![/yellow] "
                    f"{current_version} → {latest_version}\n"
                    f"Run: [cyan]pip install --upgrade mekong-cli[/cyan]\n"
                )
    except Exception:
        pass  # Silently ignore


def _get_current_version() -> Optional[str]:
    """Get current CLI version."""
    try:
        import importlib.metadata
        return importlib.metadata.version("mekong-cli")
    except Exception:
        return None


@app.command("status")
def full_status(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key"),
) -> None:
    """
    📊 Show full ROI status - auth, usage, billing combined.

    Single command to see everything at a glance.

    Examples:
        mekong roi status
        mekong roi status -k lk_abc123
    """
    console.print("[bold cyan]📊 Full ROI Status[/bold cyan]\n")

    # Resolve license key
    if not license_key:
        import os
        license_key = os.getenv("RAAS_LICENSE_KEY", "")

    if not license_key:
        console.print("[yellow]No license key provided. Set RAAS_LICENSE_KEY or use --key.[/yellow]\n")

    # 1. Auth Status
    console.print("[bold]🔐 License Status[/bold]")
    try:
        from src.lib.raas_gate import LicenseService
        service = LicenseService.getInstance()
        validation = service.validateSync(license_key)

        tier_display = {
            'free': '🔓 FREE',
            'pro': '💎 PRO',
            'enterprise': '🏢 ENTERPRISE'
        }

        status_table = Table(show_header=True, header_style="bold cyan")
        status_table.add_column("Property", style="dim")
        status_table.add_column("Value")

        status_table.add_row("Tier", tier_display.get(validation.tier, validation.tier.upper()))
        status_table.add_row("Valid", "✅ Yes" if validation.valid else "❌ No")
        status_table.add_row("Features", f"{len(validation.features)} enabled")

        console.print(status_table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")

    # 2. Usage Status
    console.print("\n[bold]📊 Usage Status[/bold]")
    try:
        from src. raas.quota_cache import get_quota_cache
        quota_cache = get_quota_cache()
        quota_status = asyncio.run(quota_cache.get_quota_status(license_key or "anonymous"))

        usage_table = Table(show_header=True, header_style="bold cyan")
        usage_table.add_column("Quota", style="dim")
        usage_table.add_column("Used", justify="right")
        usage_table.add_column("Limit", justify="right")
        usage_table.add_column("%", justify="right")

        for quota_type in ['daily', 'monthly']:
            used = quota_status.get(f'{quota_type}_used', 0)
            limit = quota_status.get(f'{quota_type}_limit', 0)
            pct = (used / limit * 100) if limit > 0 else 0

            pct_style = "green" if pct < 80 else "yellow" if pct < 95 else "red"

            usage_table.add_row(
                quota_type.capitalize(),
                f"{used:,.0f}",
                f"{limit:,.0f}",
                f"[{pct_style}]{pct:.1f}%[/{pct_style}]",
            )

        console.print(usage_table)
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")

    # 3. Billing Status
    console.print("\n[bold]💰 Billing Status[/bold]")
    try:
        from src.db.repository import get_repository
        from src.billing.engine import get_engine

        repo = get_repository()
        license_info = asyncio.run(repo.get_license_by_key(license_key)) if license_key else None

        if license_info:
            engine = get_engine()
            result = asyncio.run(engine.calculate_period_charges(
                license_key=license_key,
                period_start=datetime.now().replace(day=1),
                period_end=datetime.now(),
            ))

            billing_table = Table(show_header=True, header_style="bold green")
            billing_table.add_column("Metric", style="dim")
            billing_table.add_column("Value", justify="right")

            billing_table.add_row("Tier", str(license_info.get("tier", "unknown")))
            billing_table.add_row("Current Charge", f"${result.total:.2f}")
            billing_table.add_row("Line Items", str(len(result.line_items)))

            console.print(billing_table)
        else:
            console.print("[yellow]No billing data available[/yellow]")
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")

    # 4. Quick Health Check
    console.print("\n[bold]❤️ System Health[/bold]")
    health_table = Table(show_header=False, box=None)
    health_table.add_column("Component")
    health_table.add_column("Status")

    health_table.add_row("License Gate", "✅" if validation.valid else "⚠️")
    health_table.add_row("Quota Cache", "✅")
    health_table.add_row("Billing Engine", "✅")

    console.print(health_table)


@app.command("auto-update")
def check_auto_update() -> None:
    """
    🔄 Check for CLI auto-updates and notify.

    Compares local version with latest GitHub release.

    Examples:
        mekong roi auto-update
    """
    console.print("[bold cyan]🔄 Checking for Updates...[/bold cyan]\n")

    current_version = _get_current_version()
    if not current_version:
        console.print("[yellow]Could not determine current version.[/yellow]\n")
        console.print(f"Current version: [cyan]{current_version}[/cyan]\n")
        return

    console.print(f"Current version: [cyan]{current_version}[/cyan]\n")

    try:
        import requests
        from packaging import version

        response = requests.get(
            "https://api.github.com/repos/longtho638-jpg/mekong-cli/releases/latest",
            timeout=5,
        )
        response.raise_for_status()

        data = response.json()
        latest_version = data.get("tag_name", "").lstrip("v")
        published_at = data.get("published_at", "Unknown")

        console.print(f"Latest version: [green]{latest_version}[/green]")
        console.print(f"Published: {published_at}\n")

        if version.parse(latest_version) > version.parse(current_version):
            console.print(
                "[bold yellow]🔄 Update Available![/bold yellow]\n\n"
                "Upgrade: [cyan]pip install --upgrade mekong-cli[/cyan]\n"
            )

            # Show release notes
            if data.get("body"):
                console.print("\n[bold]Release Notes:[/bold]")
                console.print(data["body"][:500] + "..." if len(data.get("body", "")) > 500 else data["body"])
        else:
            console.print("[bold green]✓ You're on the latest version![/bold green]\n")

    except requests.exceptions.RequestException as e:
        console.print(f"[yellow]⚠ Could not check for updates:[/yellow] {str(e)}\n")
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}\n")


@app.command("quick-start")
def quick_start() -> None:
    """
    🚀 Quick start guide for ROI commands.

    Examples:
        mekong roi quick-start
    """
    console.print("[bold cyan]🚀 ROI Quick Start Guide[/bold cyan]\n")

    guide = """
┌─────────────────────────────────────────────────────────────────┐
│  🎯 ROI - Revenue as a Service Unified Command                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LICENSE SETUP                                               │
│     mekong roi auth generate -t pro -e you@example.com         │
│     mekong roi auth validate -k your_key                       │
│     mekong roi auth status                                     │
│                                                                  │
│  2. TRACK USAGE                                                 │
│     mekong roi usage report                                    │
│     mekong roi usage quota                                     │
│     mekong roi usage submit -k lk_xxx -t api_call -v 100      │
│                                                                  │
│  3. BILLING OPERATIONS                                          │
│     mekong roi billing status -k lk_xxx                        │
│     mekong roi billing reconcile --all                         │
│     mekong roi billing webhook                                 │
│                                                                  │
│  4. ANALYTICS                                                   │
│     mekong roi dashboard show                                  │
│     mekong roi dashboard export -f csv -o usage.csv           │
│     mekong roi dashboard health                                │
│                                                                  │
│  5. ALL-IN-ONE STATUS                                           │
│     mekong roi status                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
"""
    console.print(guide)




# =============================================================================
# Main Entry Point
# =============================================================================

def main() -> None:
    """Main entry point for ROI CLI."""
    app()


if __name__ == "__main__":
    main()
