"""
Telemetry - Performance Monitoring & Insights
==============================================

Provides non-invasive, localized usage tracking for Agency OS.
No data leaves the local machine.
"""

import functools
import logging
import time
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .pricing import estimate_cost
from .telemetry_exporters import load_events, print_dashboard, save_events

# Try to import DB for persistent metrics
try:
    from core.infrastructure.database import get_db
except ImportError:
    get_db = lambda: None

logger = logging.getLogger(__name__)


@dataclass
class Event:
    """A single discrete telemetry record."""

    category: str
    action: str
    timestamp: datetime = field(default_factory=datetime.now)
    duration_ms: Optional[float] = None
    status: str = "success"
    metadata: Dict[str, Any] = field(default_factory=dict)


class Telemetry:
    """Telemetry Service - Captures operational data for optimization."""

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/telemetry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.event_file = self.storage_path / "events_v2.json"

        self.events: List[Event] = []
        self.max_events = 5000
        self.enabled = True

        self.events = load_events(self.event_file)
        self.db = get_db()

    def track(
        self,
        category: str,
        action: str,
        duration_ms: Optional[float] = None,
        status: str = "success",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Event:
        """Records an operational event to the telemetry buffer and Supabase."""
        if not self.enabled:
            return None

        # Sanitize metadata - redact sensitive fields
        safe_meta = {}
        if metadata:
            for k, v in metadata.items():
                if any(x in k.lower() for x in ["key", "secret", "token", "password"]):
                    safe_meta[k] = "[REDACTED]"
                else:
                    safe_meta[k] = v

        event = Event(
            category=category,
            action=action,
            duration_ms=duration_ms,
            status=status,
            metadata=safe_meta,
        )

        self.events.append(event)

        # 1. Persistent Storage (Supabase) if it's an agent metric
        if self.db and category == "agent":
            try:
                metric_data = {
                    "agent_id": safe_meta.get("agent_id", action),
                    "agent_role": safe_meta.get("agent_role"),
                    "operation": action,
                    "status": status,
                    "execution_time_ms": duration_ms or 0.0,
                    "input_tokens": safe_meta.get("input_tokens", 0),
                    "output_tokens": safe_meta.get("output_tokens", 0),
                    "error_message": safe_meta.get("error"),
                    "context_id": safe_meta.get("context_id"),
                    "metadata": safe_meta
                }
                # Background push (simplified - in a real scenario we'd use a thread/queue)
                self.db.table("agent_metrics").insert(metric_data).execute()
            except Exception as e:
                logger.debug(f"Failed to push telemetry to Supabase: {e}")

        # Maintain buffer size
        if len(self.events) > self.max_events:
            self.events.pop(0)

        save_events(self.events, self.event_file)
        return event

    def get_summary(self, days: int = 7) -> Dict[str, Any]:
        """Aggregates recent data into a strategic summary."""
        cutoff = datetime.now() - timedelta(days=days)
        recent = [e for e in self.events if e.timestamp > cutoff]

        if not recent:
            return {"status": "No data for this period."}

        cat_counts = Counter(e.category for e in recent)
        act_counts = Counter(e.action for e in recent)

        durations = [e.duration_ms for e in recent if e.duration_ms is not None]
        avg_dur = sum(durations) / len(durations) if durations else 0.0

        fail_count = sum(1 for e in recent if e.status == "failed")

        return {
            "period": f"Last {days} days",
            "volume": {
                "total_events": len(recent),
                "error_rate": (fail_count / len(recent) * 100) if recent else 0.0,
            },
            "velocity": {"avg_duration_ms": round(avg_dur, 2)},
            "top_categories": dict(cat_counts.most_common(5)),
            "top_actions": dict(act_counts.most_common(10)),
        }

    def print_dashboard(self, days: int = 7):
        """Visualizes telemetry insights in the terminal."""
        print_dashboard(self.get_summary(days))


def agent_telemetry(operation: Optional[str] = None):
    """
    Decorator for Antigravity agents to track performance automatically.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            op_name = operation or func.__name__

            # Extract agent info if possible
            agent_id = "unknown"
            agent_role = None
            if args and hasattr(args[0], "id"):
                agent_id = args[0].id
            if args and hasattr(args[0], "role"):
                agent_role = str(args[0].role)

            try:
                result = func(*args, **kwargs)
                duration = (time.perf_counter() - start_time) * 1000

                # Extract token info if result is a dict with usage data
                metadata = {
                    "agent_id": agent_id,
                    "agent_role": agent_role,
                }
                if isinstance(result, dict) and "usage" in result:
                    usage = result["usage"]
                    input_tokens = usage.get("input_tokens", 0)
                    output_tokens = usage.get("output_tokens", 0)
                    model_id = usage.get("model", "unknown")

                    metadata["input_tokens"] = input_tokens
                    metadata["output_tokens"] = output_tokens
                    metadata["model_id"] = model_id
                    metadata["estimated_cost_usd"] = estimate_cost(model_id, input_tokens, output_tokens)

                track_event("agent", op_name, duration_ms=duration, status="success", metadata=metadata)
                return result
            except Exception as e:
                duration = (time.perf_counter() - start_time) * 1000
                track_event("agent", op_name, duration_ms=duration, status="failed", metadata={
                    "agent_id": agent_id,
                    "agent_role": agent_role,
                    "error": str(e)
                })
                raise e
        return wrapper
    return decorator


# Global Singleton
_tel = None


def get_telemetry() -> Telemetry:
    """Access the shared telemetry system."""
    global _tel
    if _tel is None:
        _tel = Telemetry()
    return _tel


def track_event(cat: str, act: str, **kwargs):
    """Shortcut for logging a telemetry event."""
    return get_telemetry().track(cat, act, **kwargs)
