"""
Compliance Reporting Commands — ROIaaS Phase 7

CLI commands for audit log export, digital signing, and verification.
"""

import os
import asyncio
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from datetime import datetime, timezone, timedelta
from pathlib import Path

from src.raas.audit_export import AuditExporter, ExportFilter
from src.raas.report_signer import (
    ReportSigner,
    get_signer,
)

console = Console()
app = typer.Typer()


def parse_date_range(date_range: str) -> tuple[datetime, datetime]:
    """Parse date range string into (date_from, date_to) tuple.

    Args:
        date_range: String in format "YYYY-MM-DD,YYYY-MM-DD" or "YYYY-MM-DD"

    Returns:
        Tuple of (date_from, date_to)
    """
    parts = date_range.split(",")
    if len(parts) == 1:
        # Single date = from that date to now
        date_from = datetime.strptime(parts[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_to = datetime.now(timezone.utc)
    else:
        date_from = datetime.strptime(parts[0], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        date_to = datetime.strptime(parts[1], "%Y-%m-%d").replace(tzinfo=timezone.utc)

    return date_from, date_to


@app.command()
def export(
    format: str = typer.Option(
        "json",
        "--format",
        "-f",
        help="Export format: json, csv, pdf"
    ),
    output: str = typer.Option(
        "audit_report",
        "--output",
        "-o",
        help="Output file path (without extension for CSV, with extension for JSON/PDF)"
    ),
    date_range: str = typer.Option(
        None,
        "--date-range",
        "-d",
        help="Date range: YYYY-MM-DD,YYYY-MM-DD or YYYY-MM-DD (for from-date to now)"
    ),
    license_key: str = typer.Option(
        None,
        "--license-key",
        "-k",
        help="Filter by license key ID"
    ),
    event_type: str = typer.Option(
        None,
        "--event-type",
        "-e",
        help="Filter by event type: violation, rate_limit, validation"
    ),
    limit: int = typer.Option(
        10000,
        "--limit",
        "-l",
        help="Maximum records to export"
    ),
    include_summary: bool = typer.Option(
        True,
        "--include-summary/--no-summary",
        help="Include summary statistics"
    ),
    sign: bool = typer.Option(
        False,
        "--sign",
        "-s",
        help="Sign the exported report"
    ),
) -> None:
    """Export audit logs to CSV, JSON, or PDF format."""
    try:
        # Parse date range
        if date_range:
            date_from, date_to = parse_date_range(date_range)
        else:
            # Default: last 30 days
            date_to = datetime.now(timezone.utc)
            date_from = date_to - timedelta(days=30)

        # Create filter
        filters = ExportFilter(
            date_from=date_from,
            date_to=date_to,
            license_key=license_key,
            event_type=event_type,
            limit=limit,
        )

        # Export
        exporter = AuditExporter()
        format_lower = format.lower()

        if format_lower == "json":
            output_path = output if output.endswith(".json") else f"{output}.json"
            json_content = asyncio.run(exporter.export_json(filters, include_summary))
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(json_content)

        elif format_lower == "csv":
            output_path = output
            output_path = asyncio.run(exporter.export_csv(filters, output_path))

        elif format_lower == "pdf":
            output_path = output if output.endswith(".pdf") else f"{output}.pdf"
            title = f"Compliance Audit Report ({date_from.date()} to {date_to.date()})"
            output_path = asyncio.run(exporter.export_pdf(filters, output_path, title))

        else:
            console.print(f"[bold red]Error:[/bold red] Unknown format '{format}'")
            raise typer.Exit(code=1)

        # Sign if requested
        signature_path = None
        if sign:
            if format_lower == "json":
                sig_output = output_path.replace(".json", ".sig")
            elif format_lower == "pdf":
                sig_output = output_path.replace(".pdf", ".sig")
            else:
                sig_output = f"{output_path}.sig"

            # Check for private key
            private_key_env = os.getenv("AUDIT_SIGNING_KEY")
            private_key = private_key_env or "~/.mekong/keys/audit_signing.pem"
            signer = ReportSigner()

            if not Path(private_key).expanduser().exists():
                # Generate key pair
                console.print("[yellow]No signing key found. Generating new key pair...[/yellow]")
                priv_path, pub_path = signer.generate_key_pair(
                    private_key_path=private_key,
                    public_key_path=private_key.replace("audit_signing.pem", "audit_signing_pub.pem")
                )
                console.print("[green]✓ Generated keys:[/green]")
                console.print(f"  Private: {priv_path}")
                console.print(f"  Public:  {pub_path}")
            else:
                signer.load_private_key(private_key)

            result = signer.create_signature_file(output_path, sig_output)
            signature_path = sig_output

            console.print(f"[green]✓ Report signed:[/green] {sig_output}")
            console.print(f"  Key ID: {result.key_id}")
            console.print(f"  Hash:   {result.hash_value[:32]}...")

        # Show summary for JSON export
        if format_lower == "json" and include_summary:
            events = asyncio.run(exporter.query_events(filters))
            summary = exporter._generate_summary(events)
            console.print(f"\n[dim]Summary: {summary['total_records']} total records exported[/dim]")

        # Success message
        console.print(
            Panel(
                f"[bold green]Export Complete[/bold green]\n\n"
                f"Output: {output_path}\n"
                f"Format: {format}\n"
                f"Date Range: {date_from.date()} to {date_to.date()}\n"
                f"License Key: {license_key or 'All'}\n"
                f"Event Type: {event_type or 'All'}\n"
                f"Limit: {limit} records"
                + (f"\n\n[green]Signature: {signature_path}[/green]" if signature_path else ""),
                title="📊 Audit Export",
                border_style="green",
            )
        )

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def verify(
    signature_file: str = typer.Argument(
        ...,
        help="Path to signature file (.sig)"
    ),
    report_file: str = typer.Option(
        None,
        "--report",
        "-r",
        help="Path to report file (auto-detected if not provided)"
    ),
    public_key: str = typer.Option(
        None,
        "--public-key",
        "-k",
        help="Path to public key file"
    ),
) -> None:
    """Verify a signed audit report."""
    try:
        # Load signature file
        sig_path = Path(signature_file).expanduser()
        if not sig_path.exists():
            console.print(f"[bold red]Error:[/bold red] Signature file not found: {signature_file}")
            raise typer.Exit(code=1)

        import json
        with open(sig_path, "r", encoding="utf-8") as f:
            signature_data = json.load(f)

        # Auto-detect report file if not provided
        if not report_file:
            report_file = signature_data.get("signed_file", "")
            if not report_file:
                # Try to infer from signature filename
                report_file = signature_file.replace(".sig", "")

        report_path = Path(report_file).expanduser()
        if not report_path.exists():
            console.print(f"[bold red]Error:[/bold red] Report file not found: {report_file}")
            raise typer.Exit(code=1)

        # Verify
        verifier = ReportSigner()
        if public_key:
            verifier.load_public_key(public_key)
        else:
            # Try default location
            default_pub = "~/.mekong/keys/audit_signing_pub.pem"
            if Path(default_pub).expanduser().exists():
                verifier.load_public_key(default_pub)

        result = verifier.verify_signature_file(str(report_path), str(sig_path))

        # Display results
        if result.valid and result.hash_match:
            console.print(
                Panel(
                    f"[bold green]✓ Signature Valid[/bold green]\n\n"
                    f"Report: {report_path}\n"
                    f"Signature: {sig_path}\n"
                    f"Key ID: {signature_data.get('key_id', 'Unknown')}\n"
                    f"Signed: {signature_data.get('timestamp', 'Unknown')}\n"
                    f"Hash: {signature_data.get('hash_value', 'Unknown')[:32]}...\n"
                    f"Verified: {result.timestamp}",
                    title="✅ Verification Success",
                    border_style="green",
                )
            )
        else:
            error_msg = []
            if not result.valid:
                error_msg.append(f"Signature invalid: {result.error}")
            if not result.hash_match:
                error_msg.append("Content hash mismatch - report may have been tampered!")

            console.print(
                Panel(
                    f"[bold red]✗ Verification Failed[/bold red]\n\n"
                    f"Report: {report_path}\n"
                    f"Signature: {sig_path}\n"
                    f"\n".join(error_msg),
                    title="❌ Verification Failure",
                    border_style="red",
                )
            )
            raise typer.Exit(code=1)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def summary(
    date_range: str = typer.Option(
        None,
        "--date-range",
        "-d",
        help="Date range: YYYY-MM-DD,YYYY-MM-DD"
    ),
    license_key: str = typer.Option(
        None,
        "--license-key",
        "-k",
        help="Filter by license key ID"
    ),
    output: str = typer.Option(
        None,
        "--output",
        "-o",
        help="Save summary to file"
    ),
) -> None:
    """Show audit log summary statistics."""
    try:
        # Parse date range
        if date_range:
            date_from, date_to = parse_date_range(date_range)
        else:
            # Default: last 30 days
            date_to = datetime.now(timezone.utc)
            date_from = date_to - timedelta(days=30)

        filters = ExportFilter(
            date_from=date_from,
            date_to=date_to,
            license_key=license_key,
            limit=10000,
        )

        # Query and compute summary
        exporter = AuditExporter()
        events = asyncio.run(exporter.query_events(filters))
        summary = exporter._generate_summary(events)

        # Display table
        table = Table(title=f"Audit Log Summary ({date_from.date()} to {date_to.date()})")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="bold")

        table.add_row("Total Records", str(summary["total_records"]))
        table.add_row("Violation Events", str(summary["violation_count"]))
        table.add_row("Rate Limit Events", str(summary["rate_limit_count"]))
        table.add_row("Validation Logs", str(summary["validation_count"]))
        table.add_row("Export Timestamp", summary["export_timestamp"])

        if license_key:
            table.add_row("License Key", license_key)

        console.print(table)

        # Additional breakdown
        if events["violation_events"]:
            violation_table = Table(title="Violation Events by Type")
            violation_table.add_column("Type", style="cyan")
            violation_table.add_column("Count", style="bold")

            type_counts = {}
            for event in events["violation_events"]:
                vtype = event.get("violation_type", "Unknown")
                type_counts[vtype] = type_counts.get(vtype, 0) + 1

            for vtype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
                violation_table.add_row(vtype, str(count))

            console.print(violation_table)

        if events["rate_limit_events"]:
            rate_table = Table(title="Rate Limit Events by Type")
            rate_table.add_column("Type", style="cyan")
            rate_table.add_column("Count", style="bold")

            type_counts = {}
            for event in events["rate_limit_events"]:
                etype = event.get("event_type", "Unknown")
                type_counts[etype] = type_counts.get(etype, 0) + 1

            for etype, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
                rate_table.add_row(etype, str(count))

            console.print(rate_table)

        # Save to file if requested
        if output:
            import json
            with open(output, "w", encoding="utf-8") as f:
                json.dump({
                    "summary": summary,
                    "date_range": {
                        "from": date_from.isoformat(),
                        "to": date_to.isoformat(),
                    },
                    "filters": {
                        "license_key": license_key,
                    },
                }, f, indent=2, default=str)
            console.print(f"\n[green]✓ Summary saved to:[/green] {output}")

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def init_keys(
    key_size: int = typer.Option(
        2048,
        "--key-size",
        "-k",
        help="RSA key size in bits"
    ),
    output_dir: str = typer.Option(
        "~/.mekong/keys",
        "--output",
        "-o",
        help="Output directory for keys"
    ),
) -> None:
    """Generate signing key pair for report signatures."""
    try:
        output_path = Path(output_dir).expanduser()
        output_path.mkdir(parents=True, exist_ok=True)

        private_key_path = str(output_path / "audit_signing.pem")
        public_key_path = str(output_path / "audit_signing_pub.pem")

        signer = ReportSigner()
        priv_path, pub_path = signer.generate_key_pair(
            key_size=key_size,
            private_key_path=private_key_path,
            public_key_path=public_key_path,
        )

        console.print(
            Panel(
                f"[bold green]✓ Key Pair Generated[/bold green]\n\n"
                f"Private Key: {priv_path}\n"
                f"  [dim](Keep this secure! Set permissions to 600)[/dim]\n\n"
                f"Public Key:  {pub_path}\n\n"
                f"Key ID: {signer.key_id}\n\n"
                f"[yellow]Set AUDIT_SIGNING_KEY env var to use the private key:[/yellow]\n"
                f"  export AUDIT_SIGNING_KEY={priv_path}",
                title="🔑 Signing Keys Initialized",
                border_style="green",
            )
        )

        # Set restrictive permissions on private key
        os.chmod(priv_path, 0o600)

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command()
def chain(
    input_file: str = typer.Argument(
        ...,
        help="Input file with events (JSON format)"
    ),
    previous_hash: str = typer.Option(
        "0" * 64,
        "--previous-hash",
        "-p",
        help="Previous block hash (for chaining)"
    ),
) -> None:
    """Compute hash chain for event integrity."""
    try:
        import json

        # Read events
        with open(input_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Extract events (handle both array and object with events key)
        if isinstance(data, list):
            events = data
        elif isinstance(data, dict) and "events" in data:
            # Flatten all event types
            events = []
            for event_list in data["events"].values():
                if isinstance(event_list, list):
                    events.extend(event_list)
        else:
            console.print("[bold red]Error:[/bold red] Invalid input format")
            raise typer.Exit(code=1)

        # Compute chain
        signer = get_signer()
        chain_hash = signer.compute_hash_chain(events, previous_hash)

        console.print(
            Panel(
                f"[bold green]Hash Chain Computed[/bold green]\n\n"
                f"Input: {input_file}\n"
                f"Events: {len(events)}\n"
                f"Previous Hash: {previous_hash[:16]}...\n"
                f"Chain Hash: [bold cyan]{chain_hash}[/bold cyan]",
                title="🔗 Hash Chain",
                border_style="green",
            )
        )

    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


__all__ = ["app"]
