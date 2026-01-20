"""
Telemetry Exporters
===================

Persistence and visualization utilities for telemetry data.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, List

if TYPE_CHECKING:
    from .telemetry import Event

logger = logging.getLogger(__name__)


def save_events(events: List["Event"], event_file: Path) -> None:
    """Persist event buffer to JSON."""
    try:
        data = [
            {
                "c": e.category,
                "a": e.action,
                "t": e.timestamp.isoformat(),
                "d": e.duration_ms,
                "s": e.status,
                "m": e.metadata,
            }
            for e in events
        ]
        event_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        logger.error(f"Telemetry save failed: {e}")


def load_events(event_file: Path) -> List["Event"]:
    """Load events from disk."""
    from .telemetry import Event

    events = []
    if not event_file.exists():
        return events
    try:
        raw = json.loads(event_file.read_text(encoding="utf-8"))
        for e in raw:
            events.append(
                Event(
                    category=e["c"],
                    action=e["a"],
                    timestamp=datetime.fromisoformat(e["t"]),
                    duration_ms=e.get("d"),
                    status=e.get("s", "success"),
                    metadata=e.get("m", {}),
                )
            )
    except Exception as e:
        logger.warning(f"Telemetry load failed: {e}")
    return events


def print_dashboard(summary: Dict[str, Any]) -> None:
    """Visualize telemetry insights in the terminal."""
    print("\n" + "=" * 60)
    print("|" + "AGENCY OS - TELEMETRY & INSIGHTS".center(58) + "|")
    print("=" * 60)

    if "volume" not in summary:
        print("   No operational data captured yet.")
        return

    print(
        f"\n  VOLUME: {summary['volume']['total_events']} events | "
        f"Error Rate: {summary['volume']['error_rate']:.1f}%"
    )
    print(f"  VELOCITY: Avg Response {summary['velocity']['avg_duration_ms']}ms")

    print("\n  TOP COMMANDS:")
    for action, count in summary["top_actions"].items():
        print(f"     * {action:<20} : {count} uses")

    print("\n  CATEGORIES:")
    for cat, count in summary["top_categories"].items():
        print(f"     * {cat:<20} : {count} uses")

    print("\n" + "=" * 60 + "\n")
