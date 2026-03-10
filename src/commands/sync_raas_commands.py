"""
Sync RaaS CLI Command - Phase 6 Usage Reporting Integration

Synchronizes local CLI with RaaS Gateway for usage metering and billing.

Commands:
    mekong sync-raas              # Full sync: auth + entitlements + usage
    mekong sync-raas status       # Show sync status
    mekong sync-raas entitlement  # Show license entitlements
    mekong sync-raas events       # Show recent usage events
"""

import typer
from rich.console import Console
from rich.table import Table
from typing import Optional
from datetime import datetime, timezone
import os

console = Console()

app = typer.Typer(
    name="sync-raas",
    help="🔄 Sync with RaaS Gateway - usage metering & billing integration",
    rich_markup_mode="rich",
)


@app.command()
def sync_raas(
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show detailed sync information"
    ),
    dry_run: bool = typer.Option(
        False, "--dry-run", "-n", help="Show what would be synced without sending"
    ),
    no_billing: bool = typer.Option(
        False, "--no-billing", help="Don't push to Stripe/Polar billing"
    ),
) -> None:
    """
    🔄 Full sync with RaaS Gateway.

    Performs complete synchronization:
    1. Authenticate via JWT + mk_ API key
    2. Fetch license entitlements
    3. Register with webhook system (Stripe/Polar)
    4. Sync local usage metrics
    5. Push anonymized analytics to AgencyOS

    Examples:
        mekong sync-raas
        mekong sync-raas -v
        mekong sync-raas --dry-run
        mekong sync-raas --no-billing
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]🔄 Mekong Sync RaaS - Phase 6[/bold cyan]\n")

    # Step 1: Authenticate
    console.print("[dim]Step 1/5: Authenticating with RaaS Gateway...[/dim]")
    auth_result = _authenticate()
    if not auth_result:
        return

    console.print("[green]✓ Authenticated[/green]\n")

    # Step 2: Fetch entitlements
    console.print("[dim]Step 2/5: Fetching license entitlements...[/dim]")
    client = get_sync_client()
    entitlements = client.fetch_entitlements()

    if "error" in entitlements:
        console.print(f"[bold red]✗ Failed: {entitlements['error']}[/bold red]\n")
        return

    _display_entitlements(entitlements)
    console.print()

    # Step 3: Register webhook
    console.print("[dim]Step 3/5: Registering with billing system...[/dim]")
    if dry_run:
        console.print("[yellow]⊘ Skipped (dry run)[/yellow]\n")
    else:
        webhook_result = client.register_webhook(push_to_billing=not no_billing)
        if webhook_result.get("success"):
            console.print(f"[green]✓ Registered with {webhook_result.get('provider', 'billing')}[/green]\n")
        else:
            console.print(f"[yellow]⚠ Webhook registration: {webhook_result.get('error', 'skipped')}[/yellow]\n")

    # Step 4: Sync usage metrics
    console.print("[dim]Step 4/5: Syncing usage metrics...[/dim]")
    if dry_run:
        console.print("[yellow]⊘ Skipped (dry run)[/yellow]\n")
    else:
        sync_result = client.sync_metrics()
        if sync_result.success:
            console.print(f"[green]✓ Synced {sync_result.synced_count} events[/green]\n")
        else:
            console.print(f"[yellow]⚠ Sync: {sync_result.error}[/yellow]\n")

    # Step 5: Push analytics
    console.print("[dim]Step 5/5: Pushing analytics to AgencyOS...[/dim]")
    if dry_run:
        console.print("[yellow]⊘ Skipped (dry run)[/yellow]\n")
        console.print("[bold]Dry Run Complete[/bold]\n")
    else:
        analytics_result = client.push_analytics()
        if analytics_result.get("success"):
            console.print("[green]✓ Analytics pushed[/green]\n")
        else:
            console.print(f"[dim]Analytics: {analytics_result.get('error', 'skipped')}[/dim]\n")

    # Display summary
    _display_sync_summary(entitlements, verbose)


def _authenticate() -> bool:
    """Authenticate with RaaS Gateway. Returns True if successful."""
    from src.core.raas_auth import RaaSAuthClient

    auth_client = RaaSAuthClient()

    # Try to get existing session
    session = auth_client.get_session()
    if session.authenticated:
        return True

    # Check for API key
    api_key = os.getenv("RAAS_LICENSE_KEY")
    if not api_key:
        console.print("[bold red]✗ No license key found[/bold red]\n")
        console.print(
            "[yellow]Set your license key:[/yellow]\n"
            "  [cyan]export RAAS_LICENSE_KEY=mk_your_key[/cyan]\n\n"
            "Or get a key from:\n"
            "  [cyan]https://raas.agencyos.network[/cyan]\n"
        )
        return False

    # Validate credentials
    result = auth_client.validate_credentials(api_key)
    if not result.valid:
        console.print(f"[bold red]✗ Authentication failed: {result.error}[/bold red]\n")
        return False

    return True


def _display_entitlements(entitlements: dict) -> None:
    """Display license entitlements in table."""
    table = Table(title="License Entitlements", show_header=True, header_style="bold cyan")
    table.add_column("Property", style="dim")
    table.add_column("Value", style="green")

    table.add_row("Tenant ID", str(entitlements.get("tenant_id", "N/A")))
    table.add_row("Tier", entitlements.get("tier", "unknown").upper())
    table.add_row(
        "Features",
        ", ".join(entitlements.get("features", [])) or "None",
    )
    table.add_row("Rate Limit", f"{entitlements.get('rate_limit', 60)} requests/min")
    table.add_row(
        "Max Payload",
        f"{entitlements.get('max_payload_size', 1048576):,} bytes",
    )
    table.add_row("Retention", f"{entitlements.get('retention_days', 30)} days")

    if entitlements.get("expires_at"):
        table.add_row("Expires At", str(entitlements["expires_at"]))

    console.print(table)


def _display_sync_summary(entitlements: dict, verbose: bool = False) -> None:
    """Display sync summary."""
    summary_table = Table(title="Sync Summary", show_header=False, box=None)
    summary_table.add_column("Label", style="dim")
    summary_table.add_column("Value", style="cyan")

    summary_table.add_row("Sync Time", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"))
    summary_table.add_row("Gateway", "https://raas.agencyos.network")
    summary_table.add_row("Version", "v2.0.0 (CF Worker)")

    console.print(summary_table)

    if verbose:
        console.print("\n[dim]Anonymized analytics pushed to AgencyOS dashboard[/dim]")
        console.print("[dim]Dashboard: https://agencyos.network[/dim]\n")


@app.command("status")
def sync_status() -> None:
    """
    📊 Show sync status without uploading.

    Displays connection status, local metrics cache,
    and last sync timestamp.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]📊 Sync Status[/bold cyan]\n")

    client = get_sync_client()
    status = client.get_sync_status()

    # Connection status
    connection_table = Table(title="Connection Status", show_header=False, box=None)
    connection_table.add_column("Property", style="dim")
    connection_table.add_column("Value", style="green" if status.get("connected") else "red")

    connection_table.add_row("Gateway", "✓ Connected" if status.get("connected") else "✗ Disconnected")
    connection_table.add_row("License", "✓ Valid" if status.get("license_valid") else "✗ Invalid")
    connection_table.add_row("Last Sync", status.get("last_sync", "Never"))

    console.print(connection_table)
    console.print()

    # Local metrics
    metrics = status.get("local_metrics", {})
    if metrics.get("count", 0) > 0:
        metrics_table = Table(title="Local Metrics", show_header=True)
        metrics_table.add_column("Metric", style="cyan")
        metrics_table.add_column("Value", style="white")

        metrics_table.add_row("Events", str(metrics.get("count", 0)))
        metrics_table.add_row("Size", f"{metrics.get('total_size', 0):,} bytes")
        metrics_table.add_row("Oldest", metrics.get("oldest", "N/A"))
        metrics_table.add_row("Newest", metrics.get("newest", "N/A"))

        console.print(metrics_table)
    else:
        console.print("[dim]No local metrics cached.[/dim]\n")

    # Circuit breakers
    circuit_breakers = status.get("circuit_breakers", {})
    if circuit_breakers:
        console.print("\n[bold]Circuit Breakers:[/bold]")
        for gateway, info in circuit_breakers.items():
            state_color = {
                "closed": "green",
                "half-open": "yellow",
                "open": "red",
            }.get(info.get("state"), "white")
            console.print(f"  {gateway}: [{state_color}]{info.get('state')}[/{state_color}] ({info.get('failure_count', 0)} failures)")


@app.command("entitlement")
def show_entitlement(
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show raw entitlement response"
    ),
) -> None:
    """
    📋 Show license entitlements from RaaS Gateway.

    Fetches current license tier, features, rate limits,
    and entitlements from the central billing system.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]📋 License Entitlements[/bold cyan]\n")

    # Authenticate first
    if not _authenticate():
        return

    console.print("[green]✓ Authenticated[/green]\n")

    # Fetch entitlements
    client = get_sync_client()
    entitlements = client.fetch_entitlements()

    if "error" in entitlements:
        console.print(f"[bold red]✗ Failed: {entitlements['error']}[/bold red]\n")
        return

    _display_entitlements(entitlements)

    if verbose:
        import json
        console.print("\n[dim]Raw response:[/dim]")
        console.print(f"[dim]{json.dumps(entitlements, indent=2)}[/dim]\n")


@app.command("events")
def show_events(
    limit: int = typer.Option(
        20, "--limit", "-l", help="Number of events to show"
    ),
    event_type: Optional[str] = typer.Option(
        None, "--type", "-t", help="Filter by event type (cli:command, llm:call, etc.)"
    ),
) -> None:
    """
    📊 Show recent usage events.

    Displays locally cached usage events before sync.

    Examples:
        mekong sync-raas events
        mekong sync-raas events -l 50
        mekong sync-raas events -t cli:command
    """
    from pathlib import Path
    import json

    console.print("[bold cyan]📊 Recent Usage Events[/bold cyan]\n")

    # Find usage files
    usage_dir = Path.home() / ".mekong" / "usage"
    if not usage_dir.exists():
        console.print("[yellow]No usage data found.[/yellow]")
        console.print("[dim]Usage tracking starts on next command execution.[/dim]\n")
        return

    usage_files = sorted(usage_dir.glob("*.json"), reverse=True)[:limit]
    if not usage_files:
        console.print("[dim]No usage events cached.[/dim]\n")
        return

    console.print(f"Found [cyan]{len(usage_files)}[/cyan] event file(s)\n")

    # Display recent events
    events_table = Table(title=f"Last {len(usage_files)} Events", show_header=True)
    events_table.add_column("File", style="dim")
    events_table.add_column("Events", style="white")
    events_table.add_column("Size", style="green")
    events_table.add_column("Created", style="cyan")

    for usage_file in usage_files[:10]:  # Show max 10
        try:
            with open(usage_file, "r") as f:
                data = json.load(f)
            events = data.get("events", [])
            size = usage_file.stat().st_size
            created = datetime.fromtimestamp(usage_file.stat().st_mtime)

            events_table.add_row(
                usage_file.name,
                str(len(events)),
                f"{size:,} bytes",
                created.strftime("%Y-%m-%d %H:%M"),
            )
        except Exception:
            events_table.add_row(usage_file.name, "Error", "-", "-")

    console.print(events_table)

    if len(usage_files) > 10:
        console.print(f"\n[dim]... and {len(usage_files) - 10} more files[/dim]\n")


# Export the app for registration in main.py
