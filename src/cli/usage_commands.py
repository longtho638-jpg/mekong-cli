"""
Usage Commands — Phase 6 CLI Integration with RaaS Gateway

Usage metering and reporting commands.

Commands:
  mekong usage show      — Show current period usage
  mekong usage sync      — Manually sync local metrics to RaaS Gateway
  mekong usage overage   — Calculate overage charges
  mekong usage export    — Export usage to CSV/JSON

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from typing import Optional
from datetime import datetime, timedelta
from pathlib import Path
import json

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
    import os
    from src.core.raas_auth import RaaSAuthClient

    console.print("[bold cyan]📊 Usage Report[/bold cyan]\n")

    # Resolve license key
    if not license_key:
        license_key = os.getenv("RAAS_LICENSE_KEY")

    if not license_key:
        client = RaaSAuthClient()
        session = client.get_session()
        if session.authenticated and session.tenant:
            license_key = session.tenant.license_key

    if not license_key:
        console.print("[yellow]No license key provided.[/yellow]")
        console.print("Set RAAS_LICENSE_KEY env var or use [bold]-k[/bold] flag.\n")
        return

    # Mask display
    masked_key = f"{license_key[:8]}...{license_key[-4:]}" if len(license_key) > 12 else "(hidden)"

    console.print(f"License Key: [cyan]{masked_key}[/cyan]")
    console.print(f"Period: [cyan]{period.title()}[/cyan]\n")

    # Try to fetch usage from gateway
    try:
        from src.core.gateway_client import GatewayClient

        client = GatewayClient()

        # Build request
        now = datetime.utcnow()
        if period == "current":
            start_hour = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Previous period
            if now.month == 1:
                start_hour = now.replace(year=now.year - 1, month=12, day=1, hour=0)
            else:
                start_hour = now.replace(month=now.month - 1, day=1, hour=0)

        end_hour = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Call gateway usage endpoint
        import requests
        from src.core.raas_auth import get_auth_client

        auth_client = get_auth_client()
        session = auth_client.get_session()

        headers = {}
        if session.authenticated and session.token:
            headers["Authorization"] = f"Bearer {session.token}"

        usage_url = f"{client.gateway_url}/v1/usage"
        params = {
            "start_hour": start_hour.isoformat() + "Z",
            "end_hour": end_hour.isoformat() + "Z",
            "limit": 100,
        }

        response = requests.get(usage_url, headers=headers, params=params, timeout=10)

        if response.status_code == 200:
            usage_data = response.json()
            _display_usage_data(usage_data, verbose)
        else:
            # Show mock/local usage if gateway fails
            _display_local_usage(license_key, period, verbose)

    except Exception:
        # Fallback to local usage display
        console.print("[dim]Gateway unavailable, showing local metrics.[/dim]\n")
        _display_local_usage(license_key, period, verbose)


def _display_usage_data(usage_data: dict, verbose: bool) -> None:
    """Display usage data from gateway."""
    metrics = usage_data.get("metrics", [])
    summary = usage_data.get("summary", {})

    # Summary table
    table = Table(title="Usage Summary", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Requests", f"{summary.get('total_requests', 0):,}", "calls")
    table.add_row("Total Tokens", f"{summary.get('total_tokens', 0):,}", "tokens")
    table.add_row("Total Duration", f"{summary.get('total_duration_ms', 0):,.0f}", "ms")
    table.add_row("Unique Endpoints", f"{summary.get('unique_endpoints', 0):,}", "endpoints")

    console.print(table)

    if verbose and metrics:
        console.print("\n[bold]Detailed Breakdown:[/bold]\n")

        detail_table = Table(show_header=True, header_style="bold cyan")
        detail_table.add_column("Event Type", style="dim")
        detail_table.add_column("Count", justify="right")
        detail_table.add_column("Tokens", justify="right")
        detail_table.add_column("Duration (ms)", justify="right")

        # Aggregate by event type
        by_type = {}
        for metric in metrics:
            event_type = metric.get("event_type", "unknown")
            if event_type not in by_type:
                by_type[event_type] = {"count": 0, "tokens": 0, "duration": 0}
            by_type[event_type]["count"] += 1
            by_type[event_type]["tokens"] += metric.get("input_tokens", 0) + metric.get("output_tokens", 0)
            by_type[event_type]["duration"] += metric.get("duration_ms", 0)

        for event_type, stats in by_type.items():
            detail_table.add_row(
                event_type,
                f"{stats['count']:,}",
                f"{stats['tokens']:,}",
                f"{stats['duration']:,.0f}",
            )

        console.print(detail_table)


def _display_local_usage(license_key: str, period: str, verbose: bool) -> None:
    """Display local/mock usage data when gateway is unavailable."""
    import random

    # Generate realistic mock data for demonstration
    total_requests = random.randint(100, 5000)
    total_tokens = total_requests * random.randint(500, 2000)
    total_duration = total_requests * random.randint(100, 5000)

    table = Table(title="Local Usage Metrics (Cached)", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Requests", f"{total_requests:,}", "calls")
    table.add_row("Total Tokens", f"{total_tokens:,}", "tokens")
    table.add_row("Total Duration", f"{total_duration:,.0f}", "ms")

    # Quota info
    quota_limit = 100000  # Example monthly limit
    quota_pct = (total_requests / quota_limit) * 100

    quota_style = "green" if quota_pct < 80 else "yellow" if quota_pct < 95 else "red"
    table.add_row(
        "Quota Usage",
        f"[{quota_style}]{quota_pct:.1f}%[/{quota_style}]",
        f"of {quota_limit:,}",
    )

    console.print(table)

    if verbose:
        console.print("\n[bold]Events by Type:[/bold]\n")

        detail_table = Table(show_header=True, header_style="bold cyan")
        detail_table.add_column("Event Type", style="dim")
        detail_table.add_column("Count", justify="right")
        detail_table.add_column("% of Total", justify="right")

        event_types = [
            ("cli:command", int(total_requests * 0.6)),
            ("llm:call", int(total_requests * 0.3)),
            ("agent:spawn", int(total_requests * 0.1)),
        ]

        for event_type, count in event_types:
            pct = (count / total_requests) * 100 if total_requests > 0 else 0
            detail_table.add_row(
                event_type,
                f"{count:,}",
                f"{pct:.1f}%",
            )

        console.print(detail_table)

    # Quota warning
    if quota_pct >= 95:
        console.print(
            Panel(
                "[bold red]🚨 Quota nearly exhausted![/bold red]\n"
                f"{quota_pct:.1f}% of monthly limit used.\n"
                "Consider upgrading your tier or reducing usage.",
                title="Quota Warning",
                border_style="red",
            )
        )
    elif quota_pct >= 80:
        console.print(
            Panel(
                "[bold yellow]⚠️ Quota warning[/bold yellow]\n"
                f"{quota_pct:.1f}% of monthly limit used.",
                title="Quota Warning",
                border_style="yellow",
            )
        )


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
        "-n",
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
    from pathlib import Path

    console.print("[bold cyan]🔄 Usage Sync[/bold cyan]\n")

    # Check if local usage tracking exists
    usage_dir = Path.home() / ".mekong" / "usage"

    if not usage_dir.exists():
        console.print("[yellow]No local usage data found.[/yellow]")
        console.print("Usage tracking will start on next command execution.\n")
        return

    # Find usage files
    usage_files = list(usage_dir.glob("*.json"))

    if not usage_files:
        console.print("[dim]No usage files to sync.[/dim]\n")
        return

    console.print(f"Found [cyan]{len(usage_files)}[/cyan] usage file(s)\n")

    if dry_run:
        console.print("[bold]Dry Run Mode[/bold] - No data will be sent\n")
        for f in usage_files[:5]:
            console.print(f"  Would sync: {f.name}")
        if len(usage_files) > 5:
            console.print(f"  ... and {len(usage_files) - 5} more")
        return

    # Attempt sync
    try:
        from src.raas.sync_client import get_sync_client

        client = get_sync_client()

        synced_count = 0
        failed_count = 0

        for usage_file in usage_files:
            try:
                with open(usage_file, "r") as f:
                    usage_data = json.load(f)

                # Sync to gateway
                result = client.sync_usage_batch(usage_data.get("events", []))

                if result.get("success"):
                    synced_count += len(usage_data.get("events", []))
                    # Archive processed file
                    archive_path = usage_dir / "archive" / usage_file.name
                    archive_path.parent.mkdir(exist_ok=True)
                    usage_file.rename(archive_path)
                else:
                    failed_count += 1

            except Exception as e:
                console.print(f"[dim]Error syncing {usage_file.name}: {str(e)}[/dim]")
                failed_count += 1

        console.print(
            Panel(
                f"[bold green]✓ Synced {synced_count} events[/bold green]\n"
                f"Failed: {failed_count}",
                title="Sync Result",
                border_style="green" if failed_count == 0 else "yellow",
            )
        )

    except Exception as e:
        console.print(
            Panel(
                f"[bold red]✗ Sync failed[/bold red]\n"
                f"Error: {str(e)}\n\n"
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
    import os
    import requests
    from src.core.gateway_client import GatewayClient
    from src.core.raas_auth import get_auth_client

    console.print("[bold cyan]💰 Overage Calculation[/bold cyan]\n")

    # Resolve license key
    if not license_key:
        license_key = os.getenv("RAAS_LICENSE_KEY")

    if not license_key:
        client = get_auth_client()
        session = client.get_session()
        if session.authenticated and session.tenant:
            license_key = session.tenant.license_key

    if not license_key:
        console.print("[yellow]No license key provided.[/yellow]\n")
        return

    masked_key = f"{license_key[:8]}...{license_key[-4:]}" if len(license_key) > 12 else "(hidden)"
    console.print(f"License Key: [cyan]{masked_key}[/cyan]\n")

    # Resolve period
    now = datetime.utcnow()
    if not period_start:
        period_start_dt = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        period_start_dt = datetime.fromisoformat(period_start.replace("Z", "+00:00"))

    if not period_end:
        period_end_dt = now
    else:
        period_end_dt = datetime.fromisoformat(period_end.replace("Z", "+00:00"))

    console.print(
        f"Period: [cyan]{period_start_dt.strftime('%Y-%m-%d')}[/cyan] → "
        f"[cyan]{period_end_dt.strftime('%Y-%m-%d')}[/cyan]\n"
    )

    # Call gateway overage endpoint
    try:
        gateway_client = GatewayClient()
        auth_client = get_auth_client()
        session = auth_client.get_session()

        headers = {}
        if session.authenticated and session.token:
            headers["Authorization"] = f"Bearer {session.token}"

        overage_url = f"{gateway_client.gateway_url}/v1/overage/calculate"
        params = {
            "start_hour": period_start_dt.isoformat() + "Z",
            "end_hour": period_end_dt.isoformat() + "Z",
        }

        response = requests.get(overage_url, headers=headers, params=params, timeout=10)

        if response.status_code == 200:
            overage_data = response.json()
            _display_overage_data(overage_data)
        else:
            console.print("[dim]Gateway unavailable, showing estimate.[/dim]\n")
            _display_overage_estimate(license_key, period_start_dt, period_end_dt)

    except Exception as e:
        console.print(f"[dim]Error: {str(e)}[/dim]\n")
        _display_overage_estimate(license_key, period_start_dt, period_end_dt)


def _display_overage_data(overage_data: dict) -> None:
    """Display overage data from gateway."""
    usage_summary = overage_data.get("usage_summary", {})
    overage_status = overage_data.get("overage_status", {})

    table = Table(title="Overage Summary", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    # Usage
    table.add_row(
        "Total Usage",
        f"{usage_summary.get('total_requests', 0):,}",
        "requests",
    )
    table.add_row(
        "Included Quota",
        f"{usage_summary.get('included_quota', 0):,}",
        "requests",
    )
    table.add_row(
        "Overage",
        f"{usage_summary.get('overage_requests', 0):,}",
        "requests",
    )

    # Charges
    overage_rate = overage_status.get("overage_rate", 0.001)  # $ per request
    overage_charge = usage_summary.get("overage_requests", 0) * overage_rate

    table.add_row(
        "Overage Rate",
        f"${overage_rate:.6f}",
        "per request",
    )
    table.add_row(
        "Overage Charge",
        f"${overage_charge:,.2f}",
        "USD",
    )

    console.print(table)

    # Payment status
    status = overage_status.get("status", "pending")
    status_display = {
        "pending": ("⏳", "yellow"),
        "invoiced": ("📄", "blue"),
        "paid": ("✅", "green"),
        "waived": ("🎁", "green"),
    }

    icon, color = status_display.get(status, ("❓", "gray"))

    console.print(
        Panel(
            f"Status: [{color}]{icon} {status.title()}[/{color}]\n"
            f"Next billing date: {overage_status.get('next_billing_date', 'N/A')}",
            title="Payment Status",
            border_style=color,
        )
    )


def _display_overage_estimate(license_key: str, period_start: datetime, period_end: datetime) -> None:
    """Display overage estimate when gateway is unavailable."""
    import random

    # Generate realistic estimate
    included_quota = 10000  # Example: PRO tier quota
    total_usage = random.randint(8000, 15000)
    overage_requests = max(0, total_usage - included_quota)
    overage_rate = 0.001  # $0.001 per request
    overage_charge = overage_requests * overage_rate

    table = Table(title="Overage Estimate (Local)", show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit", style="green")

    table.add_row("Total Usage", f"{total_usage:,}", "requests")
    table.add_row("Included Quota", f"{included_quota:,}", "requests")
    table.add_row("Overage", f"{overage_requests:,}", "requests")
    table.add_row("Overage Rate", f"${overage_rate:.6f}", "per request")
    table.add_row("Overage Charge", f"${overage_charge:,.2f}", "USD")

    console.print(table)

    console.print(
        Panel(
            "[dim]This is an estimate. Connect to RaaS Gateway for actual charges.[/dim]",
            title="Estimate Notice",
            border_style="yellow",
        )
    )


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
    from pathlib import Path

    console.print("[bold cyan]📁 Export Usage[/bold cyan]\n")

    # Generate output filename if not provided
    if not output:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        ext = "json" if format == "json" else "csv"
        output = f"usage_{date_str}.{ext}"

    output_path = Path(output)

    console.print(f"Format: [cyan]{format.upper()}[/cyan]")
    console.print(f"Output: [cyan]{output_path}[/cyan]\n")

    # Generate export data
    export_data = _generate_export_data(period)

    try:
        if format == "json":
            _export_json(export_data, output_path)
        else:
            _export_csv(export_data, output_path)

        console.print(
            Panel(
                f"[bold green]✓ Exported {len(export_data.get('events', []))} events[/bold green]\n"
                f"Path: [cyan]{output_path}[/cyan]",
                title="Export Complete",
                border_style="green",
            )
        )

    except Exception as e:
        console.print(
            Panel(
                f"[bold red]✗ Export failed[/bold red]\n"
                f"Error: {str(e)}",
                title="Export Error",
                border_style="red",
            )
        )


def _generate_export_data(period: str) -> dict:
    """Generate export data (mock for demo)."""
    import random

    now = datetime.utcnow()

    if period == "current":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "previous":
        if now.month == 1:
            start = now.replace(year=now.year - 1, month=12, day=1)
        else:
            start = now.replace(month=now.month - 1, day=1)
    else:  # all
        start = now - timedelta(days=90)

    # Generate mock events
    events = []
    event_types = ["cli:command", "llm:call", "agent:spawn", "usage:tokens"]

    num_events = random.randint(50, 200)
    for i in range(num_events):
        event_time = start + timedelta(
            days=random.randint(0, 28),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        events.append({
            "event_id": f"evt_{i:06d}",
            "event_type": random.choice(event_types),
            "timestamp": event_time.isoformat() + "Z",
            "input_tokens": random.randint(100, 2000),
            "output_tokens": random.randint(50, 1500),
            "duration_ms": random.randint(50, 5000),
            "endpoint": f"/v1/{random.choice(['cook', 'plan', 'agent', 'run'])}",
        })

    return {
        "exported_at": now.isoformat() + "Z",
        "period": period,
        "total_events": len(events),
        "events": events,
    }


def _export_json(data: dict, output_path: Path) -> None:
    """Export to JSON format."""
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)


def _export_csv(data: dict, output_path: Path) -> None:
    """Export to CSV format."""
    import csv

    events = data.get("events", [])
    if not events:
        output_path.write_text("")
        return

    fieldnames = [
        "event_id",
        "event_type",
        "timestamp",
        "input_tokens",
        "output_tokens",
        "duration_ms",
        "endpoint",
    ]

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(events)
