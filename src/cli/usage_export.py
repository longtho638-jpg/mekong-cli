"""
Usage Export — Export usage data to CSV/JSON formats.

Part of Phase 6: CLI Integration with RaaS Gateway
"""

import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from rich.console import Console

from src.cli.usage_types import ExportData, ExportEvent

console = Console()


def generate_export_data(period: str) -> ExportData:
    """Generate export data for the specified period."""
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

    events = generate_mock_events(start, num_events=random.randint(50, 200))

    return {
        "exported_at": now.isoformat() + "Z",
        "period": period,
        "total_events": len(events),
        "events": events,
    }


def generate_mock_events(start: datetime, num_events: int = 100) -> list[ExportEvent]:
    """Generate mock usage events for export."""
    event_types = ["cli:command", "llm:call", "agent:spawn", "usage:tokens"]
    endpoints = ["/v1/cook", "/v1/plan", "/v1/agent", "/v1/run"]

    events = []
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
            "endpoint": random.choice(endpoints),
        })

    return events


def export_to_json(data: ExportData, output_path: Path) -> bool:
    """Export data to JSON format."""
    try:
        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        console.print(f"[dim]JSON export error: {str(e)}[/dim]")
        return False


def export_to_csv(data: ExportData, output_path: Path) -> bool:
    """Export data to CSV format."""
    events = data.get("events", [])

    if not events:
        output_path.write_text("")
        return True

    fieldnames = [
        "event_id",
        "event_type",
        "timestamp",
        "input_tokens",
        "output_tokens",
        "duration_ms",
        "endpoint",
    ]

    try:
        with open(output_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(events)
        return True
    except Exception as e:
        console.print(f"[dim]CSV export error: {str(e)}[/dim]")
        return False


def generate_output_filename(format: str, period: str) -> str:
    """Generate default output filename."""
    date_str = datetime.utcnow().strftime("%Y-%m-%d")
    ext = "json" if format == "json" else "csv"
    return f"usage_{date_str}_{period}.{ext}"


def perform_export(
    format: str,
    output: Optional[str],
    period: str,
) -> dict:
    """Perform usage export operation."""
    # Generate output filename if not provided
    if not output:
        output = generate_output_filename(format, period)

    output_path = Path(output)

    # Generate export data
    export_data = generate_export_data(period)

    # Export based on format
    success = False
    if format == "json":
        success = export_to_json(export_data, output_path)
    else:
        success = export_to_csv(export_data, output_path)

    return {
        "success": success,
        "output_path": str(output_path),
        "event_count": len(export_data.get("events", [])),
        "format": format.upper(),
    }
