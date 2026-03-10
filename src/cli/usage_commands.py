"""
Usage Commands — Phase 6 CLI Integration with RaaS Gateway

Usage metering and reporting commands.

Commands:
  mekong usage show      — Show current period usage
  mekong usage report    — Comprehensive usage report with entitlements
  mekong usage sync      — Manually sync local metrics to RaaS Gateway
  mekong usage overage   — Calculate overage charges
  mekong usage export    — Export usage to CSV/JSON

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import typer
from typing import Optional
from datetime import datetime

from rich.console import Console
from rich.panel import Panel

from src.cli.usage_tracker import (
    fetch_usage_from_gateway,
    sync_local_usage,
    get_period_bounds,
    get_license_key,
    mask_license_key,
)
from src.cli.usage_report import (
    display_usage_data,
    display_local_usage,
    display_report_table,
)
from src.cli.usage_export import perform_export
from src.cli.usage_overage import (
    fetch_overage_from_gateway,
    display_overage_data,
    generate_overage_estimate,
    display_overage_estimate,
)

console = Console()
app = typer.Typer(
    name="usage",
    help="📊 Usage metering and reporting",
    rich_markup_mode="rich",
)


@app.command("show")
def show_usage(
    license_key: Optional[str] = typer.Option(
        None,
        "--key",
        "-k",
        help="License key (defaults to RAAS_LICENSE_KEY env)",
    ),
    period: str = typer.Option(
        "current",
        "--period",
        "-p",
        help="Period: 'current' or 'previous'",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed breakdown",
    ),
) -> None:
    """
    📊 Show current period usage.

    Displays API calls, tokens, and quota consumption.

    Examples:
        mekong usage show
        mekong usage show -k mk_abc123
        mekong usage show -p previous -v
    """
    console.print("[bold cyan]📊 Usage Report[/bold cyan]\n")

    resolved_key = get_license_key(license_key)
    if not resolved_key:
        console.print("[yellow]No license key provided.[/yellow]")
        console.print("Set RAAS_LICENSE_KEY env var or use [bold]-k[/bold] flag.\n")
        return

    console.print(f"License Key: [cyan]{mask_license_key(resolved_key)}[/cyan]")
    console.print(f"Period: [cyan]{period.title()}[/cyan]\n")

    start, end = get_period_bounds(period)
    usage_data = fetch_usage_from_gateway(resolved_key, start, end)

    if usage_data:
        display_usage_data(usage_data, verbose)
    else:
        console.print("[dim]Gateway unavailable, showing local metrics.[/dim]\n")
        display_local_usage(resolved_key, period, verbose)


@app.command("report")
def report_usage(
    license_key: Optional[str] = typer.Option(
        None,
        "--key",
        "-k",
        help="License key (defaults to RAAS_LICENSE_KEY env)",
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Show detailed breakdown",
    ),
) -> None:
    """
    📊 Comprehensive usage report with entitlements.

    Displays total requests, rate limit status, billing cycle details,
    and tier information from RaaS Gateway.

    Examples:
        mekong usage report
        mekong usage report -k mk_abc123
        mekong usage report -v
    """
    import requests

    from src.core.gateway_client import GatewayClient
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]📊 Usage Report[/bold cyan]\n")

    resolved_key = get_license_key(license_key)
    if not resolved_key:
        console.print("[yellow]No license key provided.[/yellow]")
        console.print("Set RAAS_LICENSE_KEY env var or use [bold]-k[/bold] flag.\n")
        return

    console.print(f"License Key: [cyan]{mask_license_key(resolved_key)}[/cyan]\n")

    try:
        client = GatewayClient()
        auth_client = get_auth_client()
        session = auth_client.get_session()

        headers = {}
        if session.authenticated and session.token:
            headers["Authorization"] = f"Bearer {session.token}"

        now = datetime.now().replace(tzinfo=None)
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now.replace(hour=0, minute=0, second=0, microsecond=0)

        usage_url = f"{client.gateway_url}/v1/usage"
        usage_params = {
            "start_hour": start.isoformat() + "Z",
            "end_hour": end.isoformat() + "Z",
            "limit": 100,
        }

        usage_response = requests.get(
            usage_url,
            headers=headers,
            params=usage_params,
            timeout=10,
        )

        entitlements_url = f"{client.gateway_url}/v1/license/entitlements"
        entitlements_response = requests.get(
            entitlements_url,
            headers=headers,
            timeout=10,
        )

        usage_data = usage_response.json() if usage_response.status_code == 200 else None
        entitlements_data = entitlements_response.json() if entitlements_response.status_code == 200 else None

        rate_limit_remaining = int(usage_response.headers.get("X-RateLimit-Remaining", 0))
        rate_limit_limit = int(usage_response.headers.get("X-RateLimit-Limit", 0))
        rate_limit_reset = usage_response.headers.get("X-RateLimit-Reset", "")

        display_report_table(
            usage_data=usage_data,
            entitlements_data=entitlements_data,
            rate_limit_remaining=rate_limit_remaining,
            rate_limit_limit=rate_limit_limit,
            rate_limit_reset=rate_limit_reset,
            verbose=verbose,
        )

    except requests.RequestException as e:
        console.print(f"[dim]Gateway error: {str(e)}[/dim]\n")
        display_local_usage(resolved_key, "current", verbose)
    except Exception as e:
        console.print(f"[dim]Error: {str(e)}[/dim]\n")
        display_local_usage(resolved_key, "current", verbose)


@app.command("sync")
def sync_usage(
    force: bool = typer.Option(
        False,
        "--force",
        "-f",
        help="Force sync even if recently synced",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Show what would be synced without sending",
    ),
) -> None:
    """
    🔄 Manually sync local metrics to RaaS Gateway.

    Pushes locally tracked usage events to the gateway.

    Examples:
        mekong usage sync
        mekong usage sync --force
        mekong usage sync --dry-run
    """
    console.print("[bold cyan]🔄 Usage Sync[/bold cyan]\n")

    result = sync_local_usage(force=force, dry_run=dry_run)

    if result["status"] == "no_data":
        console.print("[yellow]No local usage data found.[/yellow]")
        console.print("Usage tracking will start on next command execution.\n")
    elif result["status"] == "no_files":
        console.print("[dim]No usage files to sync.[/dim]\n")
    elif result["status"] == "dry_run":
        console.print("[bold]Dry Run Mode[/bold] - No data will be sent\n")
        for f in result.get("files", []):
            console.print(f"  Would sync: {f}")
        if result.get("total_files", 0) > 5:
            console.print(f"  ... and {result['total_files'] - 5} more")
    elif result["status"] in ("complete", "partial"):
        console.print(
            Panel(
                f"[bold green]✓ Synced {result['synced_count']} events[/bold green]\n"
                f"Failed: {result['failed_count']}",
                title="Sync Result",
                border_style="green" if result["status"] == "complete" else "yellow",
            )
        )
    else:
        console.print(
            Panel(
                f"[bold red]✗ Sync failed[/bold red]\n"
                f"Error: {result.get('message', 'Unknown error')}\n\n"
                "The RaaS Gateway may be unavailable. Data will retry on next sync.",
                title="Sync Error",
                border_style="red",
            )
        )


@app.command("overage")
def calculate_overage(
    license_key: Optional[str] = typer.Option(
        None,
        "--key",
        "-k",
        help="License key (defaults to RAAS_LICENSE_KEY env)",
    ),
    period_start: Optional[str] = typer.Option(
        None,
        "--start",
        "-s",
        help="Period start (ISO format, e.g., 2026-03-01)",
    ),
    period_end: Optional[str] = typer.Option(
        None,
        "--end",
        "-e",
        help="Period end (ISO format, e.g., 2026-03-31)",
    ),
) -> None:
    """
    💰 Calculate overage charges.

    Computes overage fees based on usage exceeding quota.

    Examples:
        mekong usage overage
        mekong usage overage -k mk_abc123 -s 2026-03-01 -e 2026-03-31
    """
    console.print("[bold cyan]💰 Overage Calculation[/bold cyan]\n")

    resolved_key = get_license_key(license_key)
    if not resolved_key:
        console.print("[yellow]No license key provided.[/yellow]\n")
        return

    console.print(f"License Key: [cyan]{mask_license_key(resolved_key)}[/cyan]\n")

    now = datetime.utcnow()
    if not period_start:
        start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_dt = datetime.fromisoformat(period_start.replace("Z", "+00:00"))

    if not period_end:
        end_dt = now
    else:
        end_dt = datetime.fromisoformat(period_end.replace("Z", "+00:00"))

    console.print(
        f"Period: [cyan]{start_dt.strftime('%Y-%m-%d')}[/cyan] → "
        f"[cyan]{end_dt.strftime('%Y-%m-%d')}[/cyan]\n"
    )

    overage_data = fetch_overage_from_gateway(resolved_key, start_dt, end_dt)

    if overage_data:
        display_overage_data(overage_data)
    else:
        console.print("[dim]Gateway unavailable, showing estimate.[/dim]\n")
        estimate = generate_overage_estimate(start_dt, end_dt)
        display_overage_estimate(estimate)


@app.command("export")
def export_usage(
    format: str = typer.Option(
        "json",
        "--format",
        "-f",
        help="Export format: json, csv",
    ),
    output: Optional[str] = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: usage_YYYY-MM-DD.ext)",
    ),
    period: str = typer.Option(
        "current",
        "--period",
        "-p",
        help="Period: current, previous, all",
    ),
) -> None:
    """
    📁 Export usage data to CSV/JSON.

    Examples:
        mekong usage export -f json -o usage-march.json
        mekong usage export -f csv -p previous
    """
    console.print("[bold cyan]📁 Export Usage[/bold cyan]\n")
    console.print(f"Format: [cyan]{format.upper()}[/cyan]")
    console.print(f"Output: [cyan]{output or '(auto-generated)'}[/cyan]\n")

    result = perform_export(format=format, output=output, period=period)

    if result["success"]:
        console.print(
            Panel(
                f"[bold green]✓ Exported {result['event_count']} events[/bold green]\n"
                f"Path: [cyan]{result['output_path']}[/cyan]",
                title="Export Complete",
                border_style="green",
            )
        )
    else:
        console.print(
            Panel(
                "[bold red]✗ Export failed[/bold red]\n"
                "Check file permissions and try again.",
                title="Export Error",
                border_style="red",
            )
        )
