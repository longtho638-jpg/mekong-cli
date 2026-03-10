"""
ROI Usage Subcommand — Usage metering reporting

Part of mekong roi unified command (Phase 6).
"""

import typer
import asyncio
import json
from rich.console import Console
from rich.table import Table
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal

console = Console()
app = typer.Typer(name="usage", help="📊 Usage metering")


@app.command("report")
def usage_report(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key (defaults to env var)"),
    period: str = typer.Option("current", "--period", "-p", help="Period: current, last, custom"),
    start_date: Optional[str] = typer.Option(None, "--start", help="Start date (YYYY-MM-DD, used with period=custom)"),
    end_date: Optional[str] = typer.Option(None, "--end", help="End date (YYYY-MM-DD, used with period=custom)"),
) -> None:
    """
    📊 Show usage report for billing period.

    Examples:
        mekong roi usage report
        mekong roi usage report -k lk_abc123 --period last
        mekong roi usage report --period custom --start 2026-03-01 --end 2026-03-07
    """
    console.print("[bold cyan]📊 Usage Report[/bold cyan]\n")

    # Resolve license key
    if not license_key:
        import os
        license_key = os.getenv("RAAS_LICENSE_KEY", "")
        if not license_key:
            console.print("[yellow]No license key provided. Set RAAS_LICENSE_KEY env var or use --key.[/yellow]\n")

    # Calculate date range
    if period == "current":
        end_dt = datetime.now()
        start_dt = end_dt.replace(day=1)
    elif period == "last":
        end_dt = datetime.now().replace(day=1) - timedelta(days=1)
        start_dt = end_dt.replace(day=1)
    elif period == "custom":
        if not start_date or not end_date:
            console.print("[red]Error:[/red] --start and --end required for custom period")
            raise typer.Exit(1)
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    else:
        console.print(f"[red]Error:[/red] Invalid period: {period}")
        raise typer.Exit(1)

    console.print(f"License: {license_key[:12] if license_key else '(none)'}...")
    console.print(f"Period: {start_dt.date()} → {end_dt.date()}\n")

    try:
        # Get usage data
        from src.db.repository import get_repository
        repo = get_repository()

        # Fetch usage events
        usage_events = asyncio.run(repo.get_usage_events(
            license_key=license_key if license_key else None,
            start_date=start_dt,
            end_date=end_dt,
        ))

        if not usage_events:
            console.print("[yellow]No usage data found for this period.[/yellow]\n")
            return

        # Aggregate by event type
        aggregated = {}
        for event in usage_events:
            event_type = event.get('event_type', 'unknown')
            if event_type not in aggregated:
                aggregated[event_type] = {'count': 0, 'value': Decimal('0')}
            aggregated[event_type]['count'] += 1
            aggregated[event_type]['value'] += Decimal(str(event.get('value', 0)))

        # Display table
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Event Type", style="dim")
        table.add_column("Count", justify="right")
        table.add_column("Total Value", justify="right")

        for event_type, data in sorted(aggregated.items()):
            table.add_row(
                event_type,
                str(data['count']),
                f"{data['value']:,.0f}"
            )

        console.print(table)

        # Calculate total cost
        from src.billing.engine import get_engine
        from src.core.usage_metering import UsageEvent, UsageEventType
        from src.core.anomaly_detector import AnomalyCategory

        engine = get_engine()
        usage_events_obj = [
            UsageEvent(
                event_type=UsageEventType(e.get('event_type', 'usage:api_call')),
                category=AnomalyCategory.API_CALLS,
                metric=e.get('metric', 'requests'),
                value=e.get('value', 0),
                timestamp=float(e.get('timestamp', datetime.now().timestamp())),
                metadata=e.get('metadata', {}),
            )
            for e in usage_events
        ]

        result = asyncio.run(engine.calculate_charges(
            license_key=license_key if license_key else "anonymous",
            usage_events=usage_events_obj,
            period_start=start_dt,
            period_end=end_dt,
        ))

        # Cost summary
        cost_table = Table(title="💰 Cost Summary", show_header=True, header_style="bold green")
        cost_table.add_column("Metric", style="dim")
        cost_table.add_column("Value", justify="right")

        cost_table.add_row("Subtotal", f"${result.subtotal:,.2f}")
        cost_table.add_row("Discount", f"-${result.discount:,.2f}")
        cost_table.add_row("Total", f"${result.total:,.2f}")

        console.print(cost_table)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("submit")
def submit_usage(
    license_key: str = typer.Option(..., "--key", "-k", help="License key"),
    events_file: Optional[str] = typer.Option(None, "--events-file", "-f", help="JSON file with usage events"),
    event_type: Optional[str] = typer.Option(None, "--event-type", "-t", help="Event type"),
    metric: str = typer.Option("requests", "--metric", "-m", help="Metric name"),
    value: Optional[float] = typer.Option(None, "--value", "-v", help="Usage value"),
    model: Optional[str] = typer.Option(None, "--model", help="Model name"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Simulate without submitting"),
) -> None:
    """
    📤 Submit usage events for billing.

    Submit via file:
        mekong roi usage submit -k lk_abc --events-file usage.json

    Submit single event:
        mekong roi usage submit -k lk_abc -t api_call -v 100
    """
    console.print("[bold cyan]📤 Submitting Usage for Billing[/bold cyan]\n")

    # Load events
    events = []
    if events_file:
        try:
            with open(events_file, "r") as f:
                events_data = json.load(f)
                events = events_data.get("events", events_data)
        except FileNotFoundError:
            console.print(f"[red]Error:[/red] Events file not found: {events_file}")
            raise typer.Exit(1)
        except json.JSONDecodeError as e:
            console.print(f"[red]Error:[/red] Invalid JSON: {str(e)}")
            raise typer.Exit(1)
    elif event_type and value is not None:
        events = [
            {
                "event_type": event_type,
                "metric": metric,
                "value": value,
                "model": model,
                "timestamp": datetime.now().isoformat(),
                "metadata": {"source": "cli"},
            }
        ]
    else:
        console.print(
            "[red]Error:[/red] Provide --events-file OR (--event-type and --value)\n"
        )
        raise typer.Exit(1)

    if not events:
        console.print("[red]Error:[/red] No events to process\n")
        raise typer.Exit(1)

    console.print(f"Processing {len(events)} event(s)...\n")

    if dry_run:
        console.print("[yellow]🛑 Dry run — not submitting[/yellow]\n")
        console.print("Events to submit:")
        for i, event in enumerate(events[:5], 1):
            console.print(f"  {i}. {event.get('event_type')}: {event.get('value')}")
        if len(events) > 5:
            console.print(f"  ... and {len(events) - 5} more")
        return

    # Submit events
    try:
        from src.billing.idempotency import get_idempotency_manager
        from src.core.usage_metering import UsageEvent, UsageEventType
        from src.core.anomaly_detector import AnomalyCategory
        from src.billing.engine import get_engine

        idempotency_manager = get_idempotency_manager()

        # Generate batch ID
        batch_id = idempotency_manager.generate_batch_id(
            license_key=license_key,
            events=events,
        )

        console.print(f"Batch ID: [cyan]{batch_id}[/cyan]\n")

        async def process_batch(events_list):
            """Process batch and return billing record ID."""
            usage_events = [
                UsageEvent(
                    event_type=UsageEventType(e.get("event_type", "usage:api_call")),
                    category=AnomalyCategory.API_CALLS,
                    metric=e.get("metric", "requests"),
                    value=e.get("value", 0),
                    timestamp=(
                        datetime.fromisoformat(e["timestamp"]).timestamp()
                        if e.get("timestamp")
                        else datetime.now().timestamp()
                    ),
                    metadata=e.get("metadata", {}),
                )
                for e in events_list
            ]

            engine = get_engine()
            result = await engine.calculate_charges(
                license_key=license_key,
                usage_events=usage_events,
                period_start=datetime.now(),
                period_end=datetime.now(),
            )

            billing_record_id = f"br_{batch_id}_{int(datetime.now().timestamp())}"

            from src.billing.event_emitter import get_emitter
            emitter = get_emitter()
            emitter.emit_billing_recorded(result, billing_record_id)

            return billing_record_id

        result = asyncio.run(idempotency_manager.process_batch(
            batch_id=batch_id,
            license_key=license_key,
            key_id="",
            events=events,
            process_fn=process_batch,
        ))

        if result.is_duplicate:
            console.print("[yellow]⚠ Duplicate batch (already processed)[/yellow]")
            console.print(f"Billing Record: {result.billing_record_id}")
        elif result.status == "completed":
            console.print("[bold green]✓ Batch processed successfully[/bold green]")
            console.print(f"Billing Record ID: [green]{result.billing_record_id}[/green]")
            console.print(f"Total Charge: [green]${result.total_charge:.2f}[/green]")
        elif result.status == "failed":
            console.print(f"[red]✗ Failed:[/red] {result.error_message}")
            raise typer.Exit(1)

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)


@app.command("quota")
def check_quota(
    license_key: Optional[str] = typer.Option(None, "--key", "-k", help="License key (defaults to env var)"),
) -> None:
    """
    🎯 Check quota status and remaining capacity.

    Examples:
        mekong roi usage quota
        mekong roi usage quota -k lk_abc123
    """
    console.print("[bold cyan]🎯 Quota Status[/bold cyan]\n")

    if not license_key:
        import os
        license_key = os.getenv("RAAS_LICENSE_KEY", "")
        if not license_key:
            console.print("[yellow]No license key provided.[/yellow]\n")

    try:
        from src.lib.raas_gate import LicenseService
        from src. raas.quota_cache import get_quota_cache

        service = LicenseService.getInstance()
        service.validateSync(license_key)

        # Get quota cache
        quota_cache = get_quota_cache()
        quota_status = asyncio.run(quota_cache.get_quota_status(license_key or "anonymous"))

        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Quota Type", style="dim")
        table.add_column("Used", justify="right")
        table.add_column("Limit", justify="right")
        table.add_column("Remaining", justify="right")
        table.add_column("Usage %", justify="right")

        for quota_type in ['daily', 'monthly']:
            used = quota_status.get(f'{quota_type}_used', 0)
            limit = quota_status.get(f'{quota_type}_limit', 0)
            remaining = limit - used
            usage_pct = (used / limit * 100) if limit > 0 else 0

            # Color coding
            used_style = "green"
            if usage_pct >= 80:
                used_style = "yellow"
            if usage_pct >= 95:
                used_style = "red"

            table.add_row(
                quota_type.capitalize(),
                f"[{used_style}]{used:,.0f}[/{used_style}]",
                f"{limit:,.0f}",
                f"[{used_style}]{remaining:,.0f}[/{used_style}]",
                f"[{used_style}]{usage_pct:.1f}%[/{used_style}]",
            )

        console.print(table)

        # Warnings
        if quota_status.get('daily_usage_pct', 0) >= 95:
            console.print("\n[yellow]⚠️  Daily quota nearly exhausted (≥95%)[/yellow]")
        if quota_status.get('monthly_usage_pct', 0) >= 95:
            console.print("\n[yellow]⚠️  Monthly quota nearly exhausted (≥95%)[/yellow]")

    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")
        raise typer.Exit(1)
