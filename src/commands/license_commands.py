"""
License Management Commands — ROIaaS Phase 6

Commands for generating, validating, and managing license keys.
Phase 6: Gateway-based validation, usage reporting, dashboard handoff.
"""

import os
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from typing import Optional

from src.lib.license_generator import generate_license, validate_license, get_tier_limits, TIER_LIMITS
from src.lib.usage_meter import get_usage_summary, get_meter
from src.core.raas_auth import get_auth_client
from src.core.gateway_client import get_gateway_client

console = Console()
app = typer.Typer(help="🔑 License key management with RaaS Gateway integration")


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
    key: Optional[str] = typer.Argument(None, help="License key to validate"),
    gateway: bool = typer.Option(False, "--gateway", "-g", help="Validate against RaaS Gateway (Phase 6)"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed validation info"),
) -> None:
    """Validate a license key (local or gateway-based).

    Phase 6: Use --gateway flag to validate against RaaS Gateway at raas.agencyos.network.
    """
    # Get license key from argument or environment
    license_key = key or os.getenv("RAAS_LICENSE_KEY")

    if not license_key:
        console.print("[bold red]✗ No license key provided[/bold red]")
        console.print("Usage: mekong license validate [KEY] [--gateway]")
        console.print("   or: export RAAS_LICENSE_KEY=mk_your_key")
        raise typer.Exit(code=1)

    # Check for local test mode
    local_test = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"

    if gateway and not local_test:
        # Phase 6.1: Gateway-based validation
        _validate_with_gateway(license_key, verbose)
    else:
        # Local validation (existing behavior)
        _validate_local(license_key, verbose, gateway_mode=gateway)


def _validate_local(key: str, verbose: bool, gateway_mode: bool = False) -> None:
    """Local license validation (fallback)."""
    # Check for local test mode - use RaaSAuthClient mock validation
    local_test = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"

    if local_test:
        # Use RaaSAuthClient for local mock validation (Phase 6.3)
        auth_client = get_auth_client()
        result = auth_client.validate_credentials(key)

        if result.valid and result.tenant:
            tenant = result.tenant
            console.print(f"[green]✓ Valid {tenant.tier.upper()} license (Local Test Mode)[/green]\n")

            table = Table(title="License Details", show_header=True)
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")

            table.add_row("Tenant ID", tenant.tenant_id)
            table.add_row("Tier", tenant.tier.upper())
            table.add_row("Role", tenant.role)
            table.add_row("Features", f"{len(tenant.features)} enabled")

            console.print(table)

            if tenant.features:
                console.print("\n[bold]Enabled Features:[/bold]")
                for feature in tenant.features[:5]:
                    console.print(f"  ✓ {feature}")

            # Dashboard handoff link (Phase 6.4)
            _show_dashboard_link(tenant.tenant_id, tenant.tier)
            return
        else:
            console.print(
                Panel(
                    f"[bold red]Local validation failed[/bold red]\n\n{result.error}",
                    title="❌ License Validation",
                    border_style="red",
                )
            )
            raise typer.Exit(code=1)

    # Traditional local validation (non-test mode)
    is_valid, info, error = validate_license(key)

    if is_valid:
        tier = info.get("tier", "unknown") if info else "unknown"
        key_id = info.get("key_id", "unknown") if info else "unknown"
        limits = get_tier_limits(tier)

        panel_content = (
            f"[bold green]Valid License (Local)[/bold green]\n\n"
            f"Tier: [bold]{tier}[/bold]\n"
            f"Key ID: {key_id}\n"
            f"Daily Limit: {limits['commands_per_day'] if limits['commands_per_day'] >= 0 else 'unlimited'} commands"
        )

        if gateway_mode:
            panel_content += "\n\n[yellow]⚠ Gateway validation unavailable - using local fallback[/yellow]"

        console.print(
            Panel(
                panel_content,
                title="✅ License Validation",
                border_style="green",
            )
        )

        # Dashboard handoff link (Phase 6.4)
        _show_dashboard_link(key_id, tier)

    else:
        console.print(
            Panel(
                f"[bold red]Invalid License[/bold red]\n\n{error}",
                title="❌ License Validation",
                border_style="red",
            )
        )
        raise typer.Exit(code=1)


def _validate_with_gateway(key: str, verbose: bool) -> None:
    """Phase 6.1: Gateway-based license validation."""
    console.print("[dim]Validating with RaaS Gateway...[/dim]\n")

    try:
        # Use RaaS Auth Client for gateway validation
        auth_client = get_auth_client()
        result = auth_client.validate_credentials(key)

        if result.valid and result.tenant:
            tenant = result.tenant
            console.print(f"[green]✓ Valid {tenant.tier.upper()} license[/green]\n")

            # Show detailed info
            table = Table(title="License Details", show_header=True)
            table.add_column("Property", style="cyan")
            table.add_column("Value", style="green")

            table.add_row("Tenant ID", tenant.tenant_id)
            table.add_row("Tier", tenant.tier.upper())
            table.add_row("Role", tenant.role)
            table.add_row("Features", f"{len(tenant.features)} enabled")

            if tenant.expires_at:
                table.add_row("Expires", tenant.expires_at.strftime("%Y-%m-%d %H:%M"))

            console.print(table)

            # Show features
            if tenant.features:
                console.print("\n[bold]Enabled Features:[/bold]")
                for feature in tenant.features[:10]:  # Show first 10
                    console.print(f"  ✓ {feature}")
                if len(tenant.features) > 10:
                    console.print(f"  ... and {len(tenant.features) - 10} more")

            # Dashboard handoff link (Phase 6.4)
            _show_dashboard_link(tenant.tenant_id, tenant.tier)

            if verbose:
                # Show gateway info
                gateway_info = auth_client.get_gateway_health()
                console.print(f"\n[dim]Gateway: {gateway_info.get('url', 'N/A')}[/dim]")
                console.print(f"[dim]Status: {gateway_info.get('status', 'N/A')}[/dim]")

        else:
            console.print(
                Panel(
                    f"[bold red]Gateway validation failed[/bold red]\n\n{result.error}",
                    title="❌ License Validation",
                    border_style="red",
                )
            )
            raise typer.Exit(code=1)

    except Exception as e:
        # Fallback to local validation
        console.print(f"[yellow]⚠ Gateway validation failed: {e}[/yellow]")
        console.print("[dim]Falling back to local validation...[/dim]\n")
        _validate_local(key, verbose, gateway_mode=True)


def _show_dashboard_link(tenant_id: str, tier: str) -> None:
    """Phase 6.4: Show dashboard handoff link."""
    dashboard_url = f"https://agencyos.network/dashboard/{tenant_id}/license"

    console.print()
    console.print(Panel(
        f"[bold]Manage your license:[/bold]\n"
        f"[cyan]{dashboard_url}[/cyan]\n\n"
        f"[dim]Tier: {tier.upper()} | Tenant: {tenant_id}[/dim]",
        title="🌐 AgencyOS Dashboard",
        border_style="blue",
    ))


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
    key: Optional[str] = typer.Option(None, "--key", "-k", help="License key to check usage for"),
    reset: bool = typer.Option(False, "--reset", help="Reset usage counter"),
) -> None:
    """Show or reset usage statistics."""
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


@app.command("report")
def report(
    key: Optional[str] = typer.Option(None, "--key", "-k", help="License key"),
    days: int = typer.Option(30, "--days", "-d", help="Number of days to report"),
) -> None:
    """Phase 6.2: Usage report from RaaS Gateway.

    Fetches usage metrics from RaaS Gateway for the specified period.
    """
    license_key = key or os.getenv("RAAS_LICENSE_KEY")

    if not license_key:
        console.print("[bold red]✗ No license key provided[/bold red]")
        console.print("Set RAAS_LICENSE_KEY env var or use --key flag.")
        raise typer.Exit(code=1)

    # Check for local test mode
    local_test = os.getenv("RAAS_LOCAL_TEST", "").lower() == "true"

    if local_test:
        console.print("[yellow]⚠ Local test mode - showing mock data[/yellow]\n")
        _show_mock_usage_report(license_key, days)
        return

    try:
        # Fetch usage from gateway
        auth_client = get_auth_client()
        gateway_client = get_gateway_client()

        # First validate to get tenant info
        result = auth_client.validate_credentials(license_key)
        if not result.valid:
            console.print(f"[bold red]✗ Invalid license:[/bold red] {result.error}")
            raise typer.Exit(code=1)

        console.print("[dim]Fetching usage report from RaaS Gateway...[/dim]\n")

        # Get usage from gateway
        response = gateway_client.get("/v1/usage", params={
            "limit": days * 24,  # Hourly buckets
            "offset": 0,
        })

        if response.status_code == 200:
            data = response.data
            _display_gateway_usage_report(data, days)
        else:
            console.print(f"[yellow]⚠ Gateway returned {response.status_code} - showing local data[/yellow]")
            _show_local_usage_report(license_key, days)

    except Exception as e:
        console.print(f"[yellow]⚠ Gateway error: {e}[/yellow]")
        console.print("[dim]Showing local usage report...[/dim]\n")
        _show_local_usage_report(license_key, days)


def _display_gateway_usage_report(data: dict, days: int) -> None:
    """Display usage report from gateway data."""
    summary = data.get("summary", {})
    metrics = data.get("metrics", [])
    pagination = data.get("pagination", {})

    # Main summary table
    table = Table(title="📊 RaaS Usage Report", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Period", f"Last {days} days")
    table.add_row("Total Requests", f"{summary.get('total_requests', 0):,}")
    table.add_row("Total Payload", f"{summary.get('total_payload_size', 0):,} bytes")
    table.add_row("Hours Active", f"{summary.get('total_hours', 0)}")
    table.add_row("Data Points", f"{len(metrics)}")

    console.print(table)

    # Show breakdown by endpoint if available
    if metrics:
        endpoint_counts: dict = {}
        for metric in metrics:
            endpoint = metric.get("endpoint", "unknown")
            endpoint_counts[endpoint] = endpoint_counts.get(endpoint, 0) + metric.get("request_count", 0)

        if endpoint_counts:
            console.print("\n[bold]Endpoint Breakdown:[/bold]")
            endpoint_table = Table(show_header=True)
            endpoint_table.add_column("Endpoint", style="cyan")
            endpoint_table.add_column("Requests", style="green")

            for endpoint, count in sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                endpoint_table.add_row(endpoint, f"{count:,}")

            console.print(endpoint_table)

    # Dashboard handoff
    tenant_id = data.get("tenant_id", "unknown")
    _show_dashboard_link(tenant_id, "unknown")

    # Pagination info
    if pagination.get("has_more"):
        console.print(f"\n[dim]Showing {pagination.get('limit', 0)} of {pagination.get('total', 0)} records[/dim]")


def _show_local_usage_report(key: str, days: int) -> None:
    """Show local usage report as fallback."""
    is_valid, info, _ = validate_license(key)
    if not is_valid:
        console.print(f"[bold red]Invalid key:[/bold red] {info}")
        return

    key_id = info.get("key_id", "unknown") if info else "unknown"
    tier = info.get("tier", "unknown") if info else "unknown"

    try:
        usage = get_usage_summary(key_id)

        table = Table(title="📊 Local Usage Report", show_header=True)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")

        table.add_row("Period", f"Last {days} days (local)")
        table.add_row("Key ID", key_id)
        table.add_row("Tier", tier)
        table.add_row("Commands Today", f"{usage.get('commands_today', 0):,}")
        table.add_row("Total Commands", f"{usage.get('total_commands', 0):,}")
        table.add_row("Daily Limit", str(usage.get('daily_limit', 'N/A')))
        table.add_row("Remaining", str(usage.get('remaining', 'N/A')))

        console.print(table)

        _show_dashboard_link(key_id, tier)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")


def _show_mock_usage_report(key: str, days: int) -> None:
    """Show mock usage report for local testing."""
    import random

    console.print("[dim]Generating mock usage data...[/dim]\n")

    table = Table(title="📊 Mock Usage Report (Local Test Mode)", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    total_requests = random.randint(100, 1000)
    total_payload = random.randint(10000, 100000)

    table.add_row("Period", f"Last {days} days")
    table.add_row("Total Requests", f"{total_requests:,}")
    table.add_row("Total Payload", f"{total_payload:,} bytes")
    table.add_row("Hours Active", f"{random.randint(10, 50)}")
    table.add_row("Avg Requests/Hour", f"{total_requests // max(days * 24, 1):,}")

    console.print(table)

    console.print("\n[yellow]⚠ This is mock data. Set RAAS_LOCAL_TEST=false for real data.[/yellow]")


__all__ = ["app"]
