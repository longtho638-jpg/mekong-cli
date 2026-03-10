"""
Mekong Sync CLI Command - RaaS Usage Metrics Synchronization

Synchronizes local usage metrics with RaaS Gateway billing system.

Usage:
    mekong sync              # Sync metrics to gateway
    mekong sync status       # Show sync status without uploading
    mekong sync dry-run      # Calculate but don't upload
"""

import typer
import json
from typing import Any
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()

app = typer.Typer(help="🔄 RaaS usage metrics synchronization")


@app.command()
def sync(
    dry_run: bool = typer.Option(
        False, "--dry-run", "-n", help="Calculate metrics but don't upload"
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show detailed metrics"
    ),
) -> None:
    """
    🔄 Synchronize local usage metrics with RaaS Gateway.

    Validates RAAS_LICENSE_KEY, collects local telemetry,
    and syncs to central billing system.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]🔄 Mekong Sync - RaaS Gateway[/bold cyan]\n")

    client = get_sync_client()

    # Step 1: Validate license
    console.print("[dim]Step 1/3: Validating license...[/dim]")
    is_valid, error = client.validate_license()

    if not is_valid:
        console.print("[bold red]✗ License validation failed[/bold red]")
        console.print(f"[red]{error}[/red]")
        console.print()
        console.print("[yellow]Get a license key:[/yellow]")
        console.print("  [cyan]https://raas.agencyos.network[/cyan]")
        console.print()
        console.print("[dim]Or set environment variable:[/dim]")
        console.print("  [cyan]export RAAS_LICENSE_KEY=mk_your_key[/cyan]\n")
        raise SystemExit(1)

    console.print("[green]✓ License valid[/green]\n")

    # Step 2: Get usage summary
    console.print("[dim]Step 2/3: Collecting local metrics...[/dim]")
    summary = client.get_usage_summary()

    if summary.total_requests == 0:
        console.print("[yellow]⚠ No local metrics found[/yellow]")
        console.print("[dim]Usage metrics are collected automatically during CLI usage.[/dim]\n")
        if not dry_run:
            console.print("[dim]Run some commands first, then sync again.[/dim]\n")
        else:
            console.print("[dim]Dry run complete.[/dim]\n")
        return

    console.print(f"[green]✓ Found {summary.total_requests} requests[/green]\n")

    # Step 3: Sync to gateway
    if dry_run:
        console.print("[dim]Step 3/3: Dry run (skipping upload)...[/dim]")
        result = client.sync_metrics(dry_run=True)
        console.print("[green]✓ Dry run complete[/green]\n")
    else:
        console.print("[dim]Step 3/3: Syncing to RaaS Gateway...[/dim]")
        result = client.sync_metrics()

        if not result.success:
            console.print("[bold red]✗ Sync failed[/bold red]")
            console.print(f"[red]{result.error}[/red]\n")

            if result.rate_limit_reset_in:
                console.print(
                    f"[dim]Rate limit resets in {result.rate_limit_reset_in}s[/dim]\n"
                )
            raise SystemExit(1)

        console.print(f"[green]✓ Synced {result.synced_count} requests[/green]\n")

    # Display summary
    _display_summary(summary, result, verbose)


def _display_summary(
    summary: Any, result: Any, verbose: bool = False
) -> None:
    """Display sync summary in formatted table."""

    # Main metrics table
    table = Table(title="📊 Sync Summary", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Total Requests", str(summary.total_requests))
    table.add_row("Total Payload", f"{summary.total_payload_size:,} bytes")
    table.add_row("Hours Active", str(summary.hours_active))

    if summary.peak_hour:
        table.add_row(
            "Peak Hour",
            f"{summary.peak_hour} ({summary.peak_requests} requests)",
        )

    if result.rate_limit_remaining is not None:
        table.add_row(
            "Rate Limit Remaining",
            str(result.rate_limit_remaining),
        )

    table.add_row(
        "Sync Time",
        f"{result.elapsed_ms:.0f}ms",
    )

    console.print(table)
    console.print()

    # Verbose: show endpoint breakdown
    if verbose and summary.endpoints:
        endpoint_table = Table(title="📍 Endpoint Breakdown")
        endpoint_table.add_column("Endpoint", style="cyan")
        endpoint_table.add_column("Requests", style="green")

        for endpoint, count in sorted(
            summary.endpoints.items(), key=lambda x: x[1], reverse=True
        ):
            endpoint_table.add_row(endpoint, str(count))

        console.print(endpoint_table)
        console.print()

    # Method breakdown
    if verbose and summary.methods:
        method_table = Table(title="🔧 Method Breakdown")
        method_table.add_column("Method", style="cyan")
        method_table.add_column("Requests", style="green")

        for method, count in sorted(
            summary.methods.items(), key=lambda x: x[1], reverse=True
        ):
            method_table.add_row(method, str(count))

        console.print(method_table)
        console.print()

    # Success panel
    if result.success:
        console.print(
            Panel(
                f"[green]✓ Sync completed successfully![/green]\n\n"
                f"Synced [bold]{result.synced_count}[/bold] requests "
                f"([bold]{result.total_payload_size:,}[/bold] bytes)\n"
                f"Gateway response: [dim]{result.gateway_response}[/dim]",
                title="✅ Sync Status",
                border_style="green",
            )
        )


@app.command("status")
def status(
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show detailed status"
    ),
) -> None:
    """
    📊 Show sync status without uploading.

    Displays local metrics and connection status.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]📊 Sync Status[/bold cyan]\n")

    client = get_sync_client()

    # Get status
    status_info = client.get_sync_status()

    # License status
    if status_info["license_valid"]:
        console.print("[green]✓ License valid[/green]\n")
    else:
        console.print("[bold red]✗ License invalid[/bold red]")
        console.print(f"[red]{status_info['license_error']}[/red]\n")

    # Metrics summary
    table = Table(title="📊 Local Metrics", show_header=True)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Total Requests", str(status_info["metrics_count"]))
    table.add_row("Total Payload", f"{status_info['total_payload_size']:,} bytes")
    table.add_row("Hours Active", str(status_info["hours_active"]))

    if status_info["peak_hour"]:
        table.add_row(
            "Peak Hour",
            f"{status_info['peak_hour']} ({status_info['peak_requests']} requests)",
        )

    console.print(table)
    console.print()

    # Circuit breaker status
    if status_info["circuit_breakers"]:
        circuit_table = Table(title="🔌 Circuit Breakers")
        circuit_table.add_column("Gateway", style="cyan")
        circuit_table.add_column("State", style="green")
        circuit_table.add_column("Failures", style="white")

        for gateway, info in status_info["circuit_breakers"].items():
            state_color = {
                "closed": "green",
                "half-open": "yellow",
                "open": "red",
            }.get(info["state"], "white")

            circuit_table.add_row(
                gateway,
                f"[{state_color}]{info['state']}[/{state_color}]",
                str(info["failure_count"]),
            )

        console.print(circuit_table)
        console.print()

    # Verbose: show breakdown
    if verbose:
        if status_info["endpoints"]:
            endpoint_table = Table(title="📍 Endpoints")
            endpoint_table.add_column("Endpoint", style="cyan")
            endpoint_table.add_column("Count", style="white")

            for endpoint, count in sorted(
                status_info["endpoints"].items(), key=lambda x: x[1], reverse=True
            ):
                endpoint_table.add_row(endpoint, str(count))

            console.print(endpoint_table)
            console.print()

        if status_info["methods"]:
            method_table = Table(title="🔧 Methods")
            method_table.add_column("Method", style="cyan")
            method_table.add_column("Count", style="white")

            for method, count in sorted(
                status_info["methods"].items(), key=lambda x: x[1], reverse=True
            ):
                method_table.add_row(method, str(count))

            console.print(method_table)
            console.print()


@app.command("reset")
def reset(
    confirm: bool = typer.Option(
        False, "--confirm", "-y", help="Skip confirmation prompt"
    ),
) -> None:
    """
    ⚠️  Reset local usage metrics (admin only).

    Clears all locally stored telemetry data.
    Use with caution - this does NOT affect server-side metrics.
    """
    from src.core.telemetry_reporter import TelemetryReporter

    if not confirm:
        console.print(
            "[bold yellow]⚠️  Warning: This will delete all local usage metrics![/bold yellow]\n"
        )
        console.print(
            "[dim]This action:[/dim]"
        )
        console.print("  • Clears local telemetry cache")
        console.print("  • Does NOT affect server-side metrics")
        console.print("  • Cannot be undone\n")

        proceed = typer.confirm("Are you sure you want to continue?")
        if not proceed:
            console.print("[yellow]Cancelled.[/yellow]\n")
            raise SystemExit(0)

    console.print("[dim]Resetting local metrics...[/dim]")

    try:
        # Reset telemetry
        reporter = TelemetryReporter()
        reporter._metrics = []  # Clear metrics list

        # Reset sync client
        _reset_sync_client()

        console.print("[green]✓ Local metrics reset complete[/green]\n")
        console.print(
            "[dim]Note: Server-side metrics at RaaS Gateway are not affected.[/dim]\n"
        )

    except Exception as e:
        console.print(f"[bold red]✗ Reset failed: {str(e)}[/bold red]\n")
        raise SystemExit(1)


def _reset_sync_client() -> None:
    """Helper to reset sync client (for CLI)."""
    from src.raas.sync_client import reset_sync_client as _reset

    _reset()


@app.command("kv-sync")
def kv_sync(
    force: bool = typer.Option(
        False, "--force", "-f", help="Force refresh from KV"
    ),
) -> None:
    """🔄 Sync rate limit state with KV store."""
    from src.core.kv_store_client import get_kv_client

    console.print("[bold cyan]🔄 KV Store Sync[/bold cyan]\n")

    client = get_kv_client()
    success, message = client.sync_state()

    if success:
        console.print(f"[green]✓ {message}[/green]\n")
        state = client.get_rate_limit_state(force_refresh=force)
        _display_rate_limit_state(state)
    else:
        console.print(f"[bold red]✗ {message}[/bold red]\n")
        raise typer.Exit(code=1)


@app.command("kv-status")
def kv_status() -> None:
    """📊 Show KV store health and rate limit state."""
    from src.core.kv_store_client import show_kv_status

    show_kv_status()


def _display_rate_limit_state(state: Any) -> None:
    """Display rate limit state in table."""
    from rich.table import Table

    table = Table(title="Rate Limit State")
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")

    table.add_row("Remaining", str(state.remaining))
    table.add_row("Limit", str(state.limit))
    table.add_row("Reset In", f"{state.seconds_until_reset}s")
    table.add_row("Synced At", state.synced_at.strftime("%H:%M:%S"))

    console.print(table)


@app.command("encrypted")
def sync_encrypted(
    dry_run: bool = typer.Option(
        False, "--dry-run", "-n", help="Calculate but don't upload"
    ),
    no_billing: bool = typer.Option(
        False, "--no-billing", help="Don't push to Stripe/Polar"
    ),
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show detailed metrics"
    ),
) -> None:
    """
    🔐 Synchronize with encrypted payload (Phase 5).

    Uses AES-256-GCM encryption for payload security
    and pushes to Stripe/Polar billing providers.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]🔐 Mekong Sync Encrypted - Phase 5[/bold cyan]\n")

    client = get_sync_client()

    # Step 1: Validate license
    console.print("[dim]Step 1/4: Validating license...[/dim]")
    is_valid, error = client.validate_license()

    if not is_valid:
        console.print("[bold red]✗ License validation failed[/bold red]")
        console.print(f"[red]{error}[/red]\n")
        console.print("[yellow]Get a license key:[/yellow]")
        console.print("  [cyan]https://raas.agencyos.network[/cyan]\n")
        raise SystemExit(1)

    console.print("[green]✓ License valid[/green]\n")

    # Step 2: Fetch entitlements
    console.print("[dim]Step 2/4: Fetching entitlements...[/dim]")
    entitlements = client.fetch_entitlements()

    if "error" not in entitlements:
        console.print(
            f"[green]✓ Tier:[/green] {entitlements.get('tier', 'unknown')} | "
            f"Rate limit: {entitlements.get('rate_limit', 60)}/min\n"
        )
    else:
        console.print(f"[yellow]⚠ Entitlements: {entitlements.get('error')}[/yellow]\n")

    # Step 3: Sync with encryption
    if dry_run:
        console.print("[dim]Step 3/4: Dry run (skipping upload)...[/dim]")
        result = client.sync_metrics_encrypted(dry_run=True, push_to_billing=not no_billing)
        console.print("[green]✓ Dry run complete[/green]\n")
    else:
        console.print("[dim]Step 3/4: Syncing encrypted payload...[/dim]")
        result = client.sync_metrics_encrypted(push_to_billing=not no_billing)

        if not result.success:
            console.print("[bold red]✗ Sync failed[/bold red]")
            console.print(f"[red]{result.error}[/red]\n")
            raise SystemExit(1)

        console.print(f"[green]✓ Synced {result.synced_count} events[/green]\n")

    # Display summary
    console.print(
        Panel(
            f"[green]✓ Sync completed![/green]\n\n"
            f"Events: [bold]{result.synced_count}[/bold]\n"
            f"Payload: [bold]{result.total_payload_size:,}[/bold] bytes\n"
            f"Time: [bold]{result.elapsed_ms:.0f}[/bold]ms",
            title="🔐 Encrypted Sync Status",
            border_style="green",
        )
    )


@app.command("entitlement")
def show_entitlement(
    verbose: bool = typer.Option(
        False, "--verbose", "-v", help="Show full entitlement details"
    ),
) -> None:
    """
    📋 Show license entitlements from RaaS Gateway.

    Fetches current license tier, features, rate limits,
    and entitlements from the central billing system.
    """
    from src.raas.sync_client import get_sync_client

    console.print("[bold cyan]📋 License Entitlements[/bold cyan]\n")

    client = get_sync_client()

    # Validate license first
    console.print("[dim]Validating license...[/dim]")
    is_valid, error = client.validate_license()

    if not is_valid:
        console.print("[bold red]✗ License invalid[/bold red]")
        console.print(f"[red]{error}[/red]\n")
        return

    console.print("[green]✓ License valid[/green]\n")

    # Fetch entitlements
    console.print("[dim]Fetching entitlements from RaaS Gateway...[/dim]")
    entitlements = client.fetch_entitlements()

    if "error" in entitlements:
        console.print(f"[bold red]✗ Failed: {entitlements['error']}[/bold red]\n")
        raise SystemExit(1)

    # Display entitlements
    table = Table(title="License Entitlements", show_header=True)
    table.add_column("Property", style="cyan")
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
    console.print()

    # Verbose: show raw response
    if verbose:
        console.print("[dim]Raw response:[/dim]")
        console.print(json.dumps(entitlements, indent=2))
        console.print()


# Import json for verbose output
