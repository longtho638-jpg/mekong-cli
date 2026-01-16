
'''
📊 Telemetry - Performance Monitoring & Insights
===============================================

Provides non-invasive, localized usage tracking for Agency OS. 
Enables analysis of command frequency, agent performance, and system 
health without compromising user privacy (no data leaves the local machine).

Core Metrics:
- ⚡ Velocity: Duration of commands and agent executions.
- 📉 Frequency: Most used suites and subcommands.
- 🤖 Agent Efficiency: Success/Failure ratios per agent.
- 💾 Health: Resource consumption and data volume.

Binh Pháp: 📋 Sát (Observation) - Understanding the ground through data.
'''

import logging
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from collections import Counter

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class Event:
    '''A single discrete telemetry record.'''
    category: str
    action: str
    timestamp: datetime = field(default_factory=datetime.now)
    duration_ms: Optional[float] = None
    status: str = "success"
    metadata: Dict[str, Any] = field(default_factory=dict)


class Telemetry:
    '''
    📊 Telemetry Service
    
    Captures and analyzes operational data to drive platform optimization.
    Maintains a rolling local history of events.
    '''

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/telemetry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.event_file = self.storage_path / "events_v2.json"

        self.events: List[Event] = []
        self.max_events = 5000
        self.enabled = True

        self._load_events()

    def track(
        self,
        category: str,
        action: str,
        duration_ms: Optional[float] = None,
        status: str = "success",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Event:
        '''Records an operational event to the telemetry buffer.'''
        if not self.enabled:
            return None

        # Sanitize metadata
        safe_meta = {}
        if metadata:
            for k, v in metadata.items():
                if "key" in k.lower() or "secret" in k.lower() or "token" in k.lower() or "password" in k.lower():
                    safe_meta[k] = "[REDACTED]"
                else:
                    safe_meta[k] = v

        event = Event(
            category=category,
            action=action,
            duration_ms=duration_ms,
            status=status,
            metadata=safe_meta
        )

        self.events.append(event)

        # Maintain buffer size
        if len(self.events) > self.max_events:
            self.events.pop(0)

        self._save_events()
        return event

    def get_summary(self, days: int = 7) -> Dict[str, Any]:
        '''Aggregates recent data into a strategic summary.'''
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
                "error_rate": (fail_count / len(recent) * 100) if recent else 0.0
            },
            "velocity": {
                "avg_duration_ms": round(avg_dur, 2)
            },
            "top_categories": dict(cat_counts.most_common(5)),
            "top_actions": dict(act_counts.most_common(10))
        }

    def _save_events(self):
        '''Persists event buffer to JSON.'''
        try:
            data = [
                {
                    "c": e.category,
                    "a": e.action,
                    "t": e.timestamp.isoformat(),
                    "d": e.duration_ms,
                    "s": e.status,
                    "m": e.metadata
                }
                for e in self.events
            ]
            self.event_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Telemetry save failed: {e}")

    def _load_events(self):
        '''Loads events from disk on initialization.'''
        if not self.event_file.exists(): return
        try:
            raw = json.loads(self.event_file.read_text(encoding="utf-8"))
            for e in raw:
                self.events.append(Event(
                    category=e["c"],
                    action=e["a"],
                    timestamp=datetime.fromisoformat(e["t"]),
                    duration_ms=e.get("d"),
                    status=e.get("s", "success"),
                    metadata=e.get("m", {})
                ))
        except Exception as e:
            logger.warning(f"Telemetry load failed: {e}")

    def print_dashboard(self, days: int = 7):
        '''Visualizes telemetry insights in the terminal.'''
        s = self.get_summary(days)

        print("\n" + "═" * 60)
        print("║" + "📊 AGENCY OS - TELEMETRY & INSIGHTS".center(58) + "║")
        print("═" * 60)

        if "volume" not in s:
            print("   No operational data captured yet.")
            return

        print(f"\n  📈 VOLUME: {s['volume']['total_events']} events | Error Rate: {s['volume']['error_rate']:.1f}%")
        print(f"  ⚡ VELOCITY: Avg Response {s['velocity']['avg_duration_ms']}ms")

        print("\n  🎯 TOP COMMANDS:")
        for action, count in s["top_actions"].items():
            print(f"     • {action:<20} : {count} uses")

        print("\n  📦 CATEGORIES:")
        for cat, count in s["top_categories"].items():
            print(f"     • {cat:<20} : {count} uses")

        print("\n" + "═" * 60 + "\n")


# Global Singleton
_tel = None

def get_telemetry() -> Telemetry:
    '''Access the shared telemetry system.'''
    global _tel
    if _tel is None:
        _tel = Telemetry()
    return _tel

def track_event(cat: str, act: str, **kwargs):
    '''Shortcut for logging a telemetry event.'''
    return get_telemetry().track(cat, act, **kwargs)
