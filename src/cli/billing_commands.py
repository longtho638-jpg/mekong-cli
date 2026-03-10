"""
Mekong CLI - Billing Commands

CLI interface for API usage billing operations:
- simulate: Simulate usage and billing calculation
- submit-usage: Submit real usage for billing
- reconcile: Trigger reconciliation audit
- emit-event: Emit billing events to webhook
"""

import typer
import json
import logging
import os
from datetime import datetime, date
from typing import Optional
from rich.console import Console
from rich.table import Table

from src.billing.engine import get_engine, BillingResult
from src.billing.idempotency import get_idempotency_manager
from src.billing.reconciliation import get_reconciliation_service
from src.billing.event_emitter import get_emitter
from src.core.event_bus import get_event_bus, EventType
from src.raas.billing_sync import BillingSyncService, SyncConfig, get_service

console = Console()
logger = logging.getLogger(__name__)

app = typer.Typer(
    name="billing",
    help="💰 Billing operations: usage submission, reconciliation, events",
)


# =============================================================================
# Helper Functions
# =============================================================================


def print_billing_result(result: BillingResult) -> None:
    """Print billing result to console."""
    console.print("\n[bold green]✓ Billing Calculation Complete[/bold green]\n")

    # Summary table
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Metric", style="dim")
    table.add_column("Value")

    table.add_row("License Key", result.license_key)
    table.add_row("Period", f"{result.period_start.date()} → {result.period_end.date()}")
    table.add_row("Line Items", str(len(result.line_items)))
    table.add_row("Subtotal", f"${result.subtotal}")
    table.add_row("Discount", f"${result.discount}")
    table.add_row("Total", f"[bold green]${result.total}[/bold green]")
    table.add_row("Currency", result.currency)

    console.print(table)

    # Line items
    if result.line_items:
        console.print("\n[bold]Line Items:[/bold]")
        item_table = Table(show_header=True, header_style="bold yellow")
        item_table.add_column("Event Type")
        item_table.add_column("Model")
        item_table.add_column("Quantity")
        item_table.add_column("Unit")
        item_table.add_column("Unit Price")
        item_table.add_column("Amount")

        for item in result.line_items:
            item_table.add_row(
                item.event_type,
                item.model_name or "-",
                str(item.quantity),
                item.unit,
                f"${item.unit_price}",
                f"${item.final_amount}",
            )

        console.print(item_table)


def print_error(message: str, details: Optional[str] = None) -> None:
    """Print error message."""
    console.print(f"[bold red]✗ Error:[/bold red] {message}")
    if details:
        console.print(f"[dim]{details}[/dim]")


def print_success(message: str) -> None:
    """Print success message."""
    console.print(f"[bold green]✓[/bold green] {message}")


# =============================================================================
# CLI Commands
# =============================================================================


@app.command("simulate")
def simulate_billing(
    license_key: str = typer.Option(..., "--license", "-l", help="License key"),
    api_calls: int = typer.Option(100, "--api-calls", help="Number of API calls"),
    token_input: int = typer.Option(1000, "--token-input", help="Input tokens (in K)"),
    token_output: int = typer.Option(500, "--token-output", help="Output tokens (in K)"),
    agent_spawns: int = typer.Option(10, "--agent-spawns", help="Number of agent spawns"),
    model: Optional[str] = typer.Option(None, "--model", "-m", help="Model name"),
    period_start: Optional[str] = typer.Option(None, "--period-start", help="Period start (YYYY-MM-DD)"),
    period_end: Optional[str] = typer.Option(None, "--period-end", help="Period end (YYYY-MM-DD)"),
) -> None:
    """
    🧪 Simulate billing calculation for usage.

    Example:
        mekong billing simulate -l lk_abc123 --api-calls 5000 --token-input 10000
    """
    from datetime import datetime
    from src.core.usage_metering import UsageEvent
    from src.core.anomaly_detector import AnomalyCategory
    from src.core.usage_metering import UsageEventType

    console.print("[bold cyan]🧪 Simulating Billing Calculation[/bold cyan]\n")

    # Create usage events
    events = [
        UsageEvent(
            event_type=UsageEventType.API_CALL,
            category=AnomalyCategory.API_CALLS,
            metric="requests",
            value=api_calls,
            timestamp=datetime.now().timestamp(),
            metadata={"source": "cli_simulate"},
        ),
        UsageEvent(
            event_type=UsageEventType.TOKEN_USAGE,
            category=AnomalyCategory.TOKEN_USAGE,
            metric="input_tokens",
            value=token_input,
            timestamp=datetime.now().timestamp(),
            metadata={"source": "cli_simulate"},
        ),
        UsageEvent(
            event_type=UsageEventType.TOKEN_USAGE,
            category=AnomalyCategory.TOKEN_USAGE,
            metric="output_tokens",
            value=token_output,
            timestamp=datetime.now().timestamp(),
            metadata={"source": "cli_simulate"},
        ),
        UsageEvent(
            event_type=UsageEventType.AGENT_SPAWN,
            category=AnomalyCategory.AGENT_SPAWNS,
            metric="spawns",
            value=agent_spawns,
            timestamp=datetime.now().timestamp(),
            metadata={"source": "cli_simulate", "model": model},
        ),
    ]

    # Parse dates
    from datetime import datetime as dt
    period_start_dt = dt.now()
    period_end_dt = dt.now()

    if period_start:
        period_start_dt = dt.strptime(period_start, "%Y-%m-%d")
    if period_end:
        period_end_dt = dt.strptime(period_end, "%Y-%m-%d")

    try:
        # Calculate billing
        engine = get_engine()
        import asyncio

        result = asyncio.run(engine.calculate_charges(
            license_key=license_key,
            usage_events=events,
            period_start=period_start_dt,
            period_end=period_end_dt,
        ))

        print_billing_result(result)

        console.print(
            "\n[ydim]Simulation only — no charges applied[/ydim]"
        )

    except Exception as e:
        print_error("Billing simulation failed", str(e))
        raise SystemExit(1)


@app.command("submit-usage")
def submit_usage(
    license_key: str = typer.Option(..., "--license", "-l", help="License key"),
    events_file: Optional[str] = typer.Option(None, "--events-file", "-f", help="JSON file with usage events"),
    event_type: Optional[str] = typer.Option(None, "--event-type", "-t", help="Event type (if not using file)"),
    metric: Optional[str] = typer.Option("requests", "--metric", "-m", help="Metric name"),
    value: Optional[float] = typer.Option(None, "--value", "-v", help="Usage value"),
    model: Optional[str] = typer.Option(None, "--model", help="Model name"),
    batch_id: Optional[str] = typer.Option(None, "--batch-id", help="Batch ID for idempotency"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Simulate without submitting"),
) -> None:
    """
    📤 Submit usage events for billing (with idempotency).

    Submit via file:
        mekong billing submit-usage -l lk_abc --events-file usage.json

    Submit single event:
        mekong billing submit-usage -l lk_abc -t api_call -v 100
    """
    import asyncio
    from datetime import datetime, timezone

    console.print("[bold cyan]📤 Submitting Usage for Billing[/bold cyan]\n")

    # Load events
    events = []
    if events_file:
        try:
            with open(events_file, "r") as f:
                events_data = json.load(f)
                events = events_data.get("events", events_data)
        except FileNotFoundError:
            print_error("Events file not found", events_file)
            raise SystemExit(1)
        except json.JSONDecodeError as e:
            print_error("Invalid JSON in events file", str(e))
            raise SystemExit(1)
    elif event_type and value is not None:
        events = [
            {
                "event_type": event_type,
                "metric": metric,
                "value": value,
                "model": model,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metadata": {"source": "cli"},
            }
        ]
    else:
        print_error(
            "Missing required arguments",
            "Provide --events-file OR (--event-type and --value)",
        )
        raise SystemExit(1)

    if not events:
        print_error("No events to process")
        raise SystemExit(1)

    console.print(f"Processing {len(events)} event(s)...")

    # Generate batch ID
    idempotency_manager = get_idempotency_manager()
    if not batch_id:
        batch_id = idempotency_manager.generate_batch_id(
            license_key=license_key,
            events=events,
        )

    console.print(f"Batch ID: [cyan]{batch_id}[/cyan]")

    if dry_run:
        console.print("\n[yellow]🛑 Dry run — not submitting[/yellow]")
        return

    # Process batch
    async def process_batch(events_list):
        """Process batch and return billing record ID."""
        # Convert to UsageEvent objects
        from src.core.usage_metering import UsageEvent, UsageEventType
        from src.core.anomaly_detector import AnomalyCategory

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

        # Calculate billing
        engine = get_engine()
        result = await engine.calculate_charges(
            license_key=license_key,
            usage_events=usage_events,
            period_start=datetime.now(),
            period_end=datetime.now(),
        )

        # In production, would save to database here
        billing_record_id = f"br_{batch_id}_{int(datetime.now().timestamp())}"

        # Emit event
        emitter = get_emitter()
        emitter.emit_billing_recorded(result, billing_record_id)

        return billing_record_id

    try:
        result = asyncio.run(idempotency_manager.process_batch(
            batch_id=batch_id,
            license_key=license_key,
            key_id="",  # Would fetch from license
            events=events,
            process_fn=process_batch,
        ))

        if result.is_duplicate:
            console.print(
                "\n[yellow]⚠ Duplicate batch detected (already processed)[/yellow]"
            )
            console.print(f"Billing Record: {result.billing_record_id}")
        elif result.status == "completed":
            print_success("Batch processed successfully")
            console.print(f"Billing Record ID: [green]{result.billing_record_id}[/green]")
            console.print(f"Total Charge: [green]${result.total_charge}[/green]")
        elif result.status == "failed":
            print_error("Batch processing failed", result.error_message)
            raise SystemExit(1)
        else:
            console.print(f"Status: {result.status}")

    except Exception as e:
        print_error("Failed to submit usage", str(e))
        raise SystemExit(1)


@app.command("reconcile")
def trigger_reconciliation(
    license_key: Optional[str] = typer.Option(None, "--license", "-l", help="Specific license to reconcile"),
    audit_date: Optional[str] = typer.Option(None, "--date", "-d", help="Audit date (YYYY-MM-DD, default: yesterday)"),
    all_licenses: bool = typer.Option(False, "--all", help="Reconcile all licenses"),
) -> None:
    """
    🔍 Trigger reconciliation audit for variance detection.

    Example:
        mekong billing reconcile --all
        mekong billing reconcile -l lk_abc123 --date 2026-03-06
    """
    import asyncio
    from datetime import timedelta

    console.print("[bold cyan]🔍 Running Reconciliation Audit[/bold cyan]\n")

    # Parse date
    if audit_date:
        try:
            audit_dt = date.fromisoformat(audit_date)
        except ValueError:
            print_error("Invalid date format", "Use YYYY-MM-DD")
            raise SystemExit(1)
    else:
        audit_dt = date.today() - timedelta(days=1)

    console.print(f"Audit Date: [cyan]{audit_dt}[/cyan]")
    console.print(f"License: [cyan]{license_key or 'all'}[/cyan]\n")

    try:
        service = get_reconciliation_service()

        # Run reconciliation
        results = asyncio.run(service.run_daily_reconciliation(audit_date=audit_dt))

        # Print results
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("License Key")
        table.add_column("Status")
        table.add_column("Expected")
        table.add_column("Actual")
        table.add_column("Variance")
        table.add_column("Variance %")

        matched = 0
        variance = 0
        investigating = 0

        for result in results:
            if license_key and result.license_key != license_key:
                continue

            if result.status == "matched":
                matched += 1
                status_style = "green"
            elif result.status == "variance":
                variance += 1
                status_style = "yellow"
            else:
                investigating += 1
                status_style = "red"

            table.add_row(
                result.license_key,
                f"[{status_style}]{result.status}[/{status_style}]",
                f"${result.expected_amount}",
                f"${result.actual_amount}",
                f"${result.variance}",
                f"{result.variance_percent:.2f}%",
            )

        console.print(table)

        # Summary
        console.print("\n[bold]Summary:[/bold]")
        console.print(f"  Matched: [green]{matched}[/green]")
        console.print(f"  Variance: [yellow]{variance}[/yellow]")
        console.print(f"  Investigating: [red]{investigating}[/red]")

        if variance > 0 or investigating > 0:
            console.print(
                "\n[yellow]⚠ Variances detected — review reconciliation_audits table[/yellow]"
            )

    except Exception as e:
        print_error("Reconciliation failed", str(e))
        logger.exception("Reconciliation error")
        raise SystemExit(1)


@app.command("emit-event")
def emit_billing_event(
    event_type: str = typer.Argument(..., help="Event type (billing:recorded, billing:overage, etc.)"),
    payload: Optional[str] = typer.Option(None, "--payload", "-p", help="JSON payload"),
    payload_file: Optional[str] = typer.Option(None, "--payload-file", "-f", help="JSON file with payload"),
    webhook_url: Optional[str] = typer.Option(None, "--webhook", "-w", help="Webhook URL to emit to"),
) -> None:
    """
    📡 Emit billing event to event bus or webhook.

    Event types:
    - billing:recorded
    - billing:overage
    - billing:period_closed
    - billing:reconciliation
    - billing:batch_processed
    - billing:idempotency_conflict

    Example:
        mekong billing emit-event billing:recorded -p '{"license_key": "lk_abc", "total": "49.00"}'
    """
    import requests

    console.print("[bold cyan]📡 Emitting Billing Event[/bold cyan]\n")

    # Load payload
    event_data = {}
    if payload:
        try:
            event_data = json.loads(payload)
        except json.JSONDecodeError as e:
            print_error("Invalid JSON payload", str(e))
            raise SystemExit(1)
    elif payload_file:
        try:
            with open(payload_file, "r") as f:
                event_data = json.load(f)
        except FileNotFoundError:
            print_error("Payload file not found", payload_file)
            raise SystemExit(1)
        except json.JSONDecodeError as e:
            print_error("Invalid JSON in payload file", str(e))
            raise SystemExit(1)

    # Map event type string to EventType enum
    event_type_map = {
        "billing:recorded": EventType.BILLING_RECORDED,
        "billing:overage": EventType.BILLING_OVERAGE,
        "billing:period_closed": EventType.BILLING_PERIOD_CLOSED,
        "billing:reconciliation": EventType.BILLING_RECONCILIATION,
        "billing:batch_processed": EventType.BILLING_BATCH_PROCESSED,
        "billing:idempotency_conflict": EventType.BILLING_IDEMPOTENCY_CONFLICT,
    }

    if event_type not in event_type_map:
        print_error(
            f"Unknown event type: {event_type}",
            f"Valid types: {', '.join(event_type_map.keys())}",
        )
        raise SystemExit(1)

    event_enum = event_type_map[event_type]

    # Emit to local event bus
    event_bus = get_event_bus()
    event = event_bus.emit(event_enum, event_data)

    console.print(f"Event Type: [cyan]{event_type}[/cyan]")
    console.print(f"Timestamp: [cyan]{datetime.fromtimestamp(event.timestamp)}[/cyan]")
    console.print(f"Payload: {json.dumps(event_data, indent=2)}")

    # Emit to webhook if provided
    if webhook_url:
        console.print(f"\nSending to webhook: {webhook_url}")
        try:
            response = requests.post(
                webhook_url,
                json={
                    "event_type": event_type,
                    "timestamp": datetime.fromtimestamp(event.timestamp).isoformat(),
                    "data": event_data,
                },
                timeout=10,
            )
            response.raise_for_status()
            print_success(f"Webhook response: {response.status_code}")
        except requests.RequestException as e:
            print_error("Webhook failed", str(e))
            raise SystemExit(1)
    else:
        console.print("\n[ydim]No webhook URL provided — emitted to local event bus only[/ydim]")


@app.command("status")
def billing_status(
    license_key: str = typer.Option(..., "--license", "-l", help="License key"),
) -> None:
    """
    📊 Get billing status for a license.
    """
    import asyncio

    console.print("[bold cyan]📊 Billing Status[/bold cyan]\n")
    console.print(f"License: [cyan]{license_key}[/cyan]\n")

    try:
        from src.db.repository import get_repository

        repo = get_repository()
        license_info = asyncio.run(repo.get_license_by_key(license_key))

        if not license_info:
            print_error("License not found")
            raise SystemExit(1)

        # Get current period usage
        from src.billing.engine import get_engine

        engine = get_engine()
        from datetime import datetime

        result = asyncio.run(engine.calculate_period_charges(
            license_key=license_key,
            period_start=datetime.now().replace(day=1),
            period_end=datetime.now(),
        ))

        table = Table(show_header=True, header_style="bold green")
        table.add_column("Metric")
        table.add_column("Value")

        table.add_row("Tier", license_info.get("tier", "unknown"))
        table.add_row("Status", license_info.get("status", "unknown"))
        table.add_row("Period Start", result.period_start.date().isoformat())
        table.add_row("Current Charge", f"${result.total}")
        table.add_row("Line Items", str(len(result.line_items)))

        console.print(table)

    except Exception as e:
        print_error("Failed to get billing status", str(e))
        raise SystemExit(1)


@app.command("sync")
def billing_sync(
    license_key: Optional[str] = typer.Option(None, "--license", "-l", help="License key (defaults to MEKONG_API_KEY)"),
    dry_run: bool = typer.Option(False, "--dry-run", "-n", help="Simulate without submitting"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Show detailed sync information"),
    force: bool = typer.Option(False, "--force", "-f", help="Force resync already synced records"),
    limit: Optional[int] = typer.Option(None, "--limit", help="Limit number of records to sync"),
) -> None:
    """
    🔄 Sync usage records from local SQLite to RaaS Gateway.

    Fetches unsynced records from local SQLite store, formats them
    into RaaS Gateway v2/usage schema, and POSTs with idempotency
    key + retry logic (exponential backoff).

    Examples:
        mekong billing sync
        mekong billing sync -v
        mekong billing sync --dry-run
        mekong billing sync --force --limit 50
    """

    console.print("[bold cyan]🔄 Billing Sync - RaaS Gateway[/bold cyan]\n")

    # Override API key if provided
    config = None
    if license_key:
        config = SyncConfig(api_key=license_key)

    service = get_service()
    if config:
        service = BillingSyncService(config)

    # Show config info
    api_key = license_key or os.getenv("MEKONG_API_KEY") or os.getenv("RAAS_LICENSE_KEY", "")
    if not api_key:
        print_error(
            "API key not configured",
            "Set MEKONG_API_KEY or RAAS_LICENSE_KEY environment variable"
        )
        raise SystemExit(1)

    console.print("Gateway: [cyan]https://raas.agencyos.network/v2/usage[/cyan]")
    console.print(f"API Key: [cyan]mk_***{api_key[-4:] if len(api_key) > 4 else api_key}[/cyan]")
    console.print()

    if dry_run:
        console.print("[yellow]🛑 Dry run mode - will not submit[/yellow]\n")

        # Show what would be synced
        records = service.fetch_unsynced_records(limit)
        if not records:
            console.print("[dim]No unsynced records found.[/dim]")
        else:
            console.print(f"Would sync [cyan]{len(records)}[/cyan] record(s):")
            for record in records[:5]:
                console.print(f"  • {record.event_type} - {record.endpoint or 'N/A'} - {record.timestamp}")
            if len(records) > 5:
                console.print(f"  ... and {len(records) - 5} more")

        payload = service.build_payload(records) if records else {}
        console.print(f"\nPayload size: [cyan]{len(json.dumps(payload))}[/cyan] bytes")
        return

    # Execute sync
    if force:
        console.print("[yellow]⚠ Force resync mode - re-syncing already synced records[/yellow]\n")
        result = service.force_resync(limit)
    else:
        result = service.sync_to_gateway(limit)

    # Display result
    if result.success:
        print_success(f"Synced {result.records_synced} record(s)")
        console.print(f"Payload size: [cyan]{result.total_payload_size}[/cyan] bytes")
        console.print(f"Elapsed: [cyan]{result.elapsed_ms:.0f}[/cyan]ms")
        console.print(f"Idempotency key: [dim]{result.idempotency_key}[/dim]")

        if result.gateway_response:
            console.print(f"\nGateway response: [green]{result.gateway_response.get('status', 'OK')}[/green]")
    else:
        print_error("Sync failed", result.error)
        console.print(f"Records failed: [red]{result.records_failed}[/red]")
        console.print(f"Retry count: [yellow]{result.retry_count}[/yellow]")
        raise SystemExit(1)


@app.command("sync-status")
def billing_sync_status() -> None:
    """
    📊 Show billing sync status.

    Displays:
    - Number of unsynced records
    - Number of synced records
    - Last sync timestamp
    - Recent sync history
    """

    console.print("[bold cyan]📊 Billing Sync Status[/bold cyan]\n")

    service = get_service()
    status = service.get_sync_status()

    # Connection status
    table = Table(title="Sync Status", show_header=False, box=None)
    table.add_column("Property", style="dim")
    table.add_column("Value", style="green" if status.get("api_key_configured") else "red")

    table.add_row("API Key", "✓ Configured" if status["api_key_configured"] else "✗ Not configured")
    table.add_row("Gateway", status["gateway_url"])
    table.add_row("Unsynced Records", str(status["unsynced_records"]))
    table.add_row("Synced Records", str(status["synced_records"]))
    table.add_row("Last Sync", status["last_sync"] or "Never")

    console.print(table)

    # Recent history
    if status["recent_history"]:
        console.print("\n[bold]Recent Sync History:[/bold]")
        history_table = Table(show_header=True, header_style="bold cyan")
        history_table.add_column("Time", style="dim")
        history_table.add_column("Records", style="white")
        history_table.add_column("Status", style="white")
        history_table.add_column("Key", style="dim")

        for entry in status["recent_history"][:5]:
            status_style = "green" if entry["status"] == "success" else "red"
            history_table.add_row(
                entry["created_at"][:19] if entry["created_at"] else "N/A",
                str(entry["records_count"]),
                f"[{status_style}]{entry['status']}[/{status_style}]",
                entry["idempotency_key"][:20] + "...",
            )

        console.print(history_table)


# =============================================================================
# Main Entry Point
# =============================================================================


def main() -> None:
    """Main entry point for billing CLI."""
    app()


if __name__ == "__main__":
    main()
