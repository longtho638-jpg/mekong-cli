"""
📊 Telemetry - Usage Analytics & Performance Monitoring

Track command usage, performance metrics, and platform health.
Helps understand what features are most valuable.

Usage:
    from antigravity.core.telemetry import Telemetry
    telemetry = Telemetry()
    telemetry.track("command", "/master")
    telemetry.print_report()
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter
import json


@dataclass
class Event:
    """Single telemetry event."""
    category: str
    action: str
    timestamp: datetime
    duration_ms: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class Telemetry:
    """
    📊 Telemetry System
    
    Track usage patterns and performance.
    All data stays local, never sent externally.
    """
    
    def __init__(self, storage_path: str = ".antigravity/telemetry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.events: List[Event] = []
        self.enabled = True
        self._load_events()
    
    def track(
        self,
        category: str,
        action: str,
        duration_ms: int = None,
        metadata: Dict = None
    ) -> Event:
        """
        Track an event.
        
        Args:
            category: Event category (command, agent, crew, etc.)
            action: Specific action (/master, run_crew, etc.)
            duration_ms: Optional duration in milliseconds
            metadata: Optional additional data
        
        Returns:
            The tracked Event
        """
        if not self.enabled:
            return None
        
        event = Event(
            category=category,
            action=action,
            timestamp=datetime.now(),
            duration_ms=duration_ms,
            metadata=metadata or {},
        )
        
        self.events.append(event)
        self._save_events()
        
        return event
    
    def get_usage_stats(self, days: int = 30) -> Dict[str, Any]:
        """Get usage statistics for the last N days."""
        cutoff = datetime.now() - timedelta(days=days)
        recent_events = [e for e in self.events if e.timestamp > cutoff]
        
        # Count by category
        category_counts = Counter(e.category for e in recent_events)
        
        # Count by action
        action_counts = Counter(e.action for e in recent_events)
        
        # Average duration
        durations = [e.duration_ms for e in recent_events if e.duration_ms]
        avg_duration = sum(durations) / len(durations) if durations else 0
        
        # Daily activity
        daily_counts = Counter(e.timestamp.date() for e in recent_events)
        
        return {
            "total_events": len(recent_events),
            "days_active": len(daily_counts),
            "events_per_day": len(recent_events) / max(1, len(daily_counts)),
            "category_breakdown": dict(category_counts.most_common(10)),
            "top_actions": dict(action_counts.most_common(10)),
            "avg_duration_ms": avg_duration,
        }
    
    def get_command_stats(self) -> Dict[str, int]:
        """Get command usage statistics."""
        command_events = [e for e in self.events if e.category == "command"]
        return dict(Counter(e.action for e in command_events).most_common(20))
    
    def get_agent_stats(self) -> Dict[str, int]:
        """Get agent usage statistics."""
        agent_events = [e for e in self.events if e.category == "agent"]
        return dict(Counter(e.action for e in agent_events).most_common(20))
    
    def _save_events(self):
        """Save events to disk (keep last 10000)."""
        try:
            data = [
                {
                    "category": e.category,
                    "action": e.action,
                    "timestamp": e.timestamp.isoformat(),
                    "duration_ms": e.duration_ms,
                    "metadata": e.metadata,
                }
                for e in self.events[-10000:]
            ]
            path = self.storage_path / "events.json"
            path.write_text(json.dumps(data, indent=2))
        except Exception:
            pass
    
    def _load_events(self):
        """Load events from disk."""
        try:
            path = self.storage_path / "events.json"
            if path.exists():
                data = json.loads(path.read_text())
                for e in data:
                    self.events.append(Event(
                        category=e["category"],
                        action=e["action"],
                        timestamp=datetime.fromisoformat(e["timestamp"]),
                        duration_ms=e.get("duration_ms"),
                        metadata=e.get("metadata", {}),
                    ))
        except Exception:
            pass
    
    def print_report(self, days: int = 30):
        """Print telemetry report."""
        stats = self.get_usage_stats(days)
        
        print("\n" + "═" * 60)
        print("║" + "📊 TELEMETRY REPORT".center(58) + "║")
        print("═" * 60)
        
        print(f"\n📈 USAGE (Last {days} days):")
        print(f"   Total Events: {stats['total_events']}")
        print(f"   Days Active: {stats['days_active']}")
        print(f"   Events/Day: {stats['events_per_day']:.1f}")
        print(f"   Avg Duration: {stats['avg_duration_ms']:.0f}ms")
        
        if stats['top_actions']:
            print("\n🎯 TOP ACTIONS:")
            for action, count in list(stats['top_actions'].items())[:5]:
                print(f"   {action}: {count}")
        
        if stats['category_breakdown']:
            print("\n📦 BY CATEGORY:")
            for cat, count in stats['category_breakdown'].items():
                print(f"   {cat}: {count}")
        
        print("═" * 60)


# Global instance
_telemetry: Optional[Telemetry] = None


def get_telemetry() -> Telemetry:
    """Get global telemetry instance."""
    global _telemetry
    if _telemetry is None:
        _telemetry = Telemetry()
    return _telemetry


def track(category: str, action: str, **kwargs):
    """Quick track function."""
    return get_telemetry().track(category, action, **kwargs)
