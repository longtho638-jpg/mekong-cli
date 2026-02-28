"""
Mekong CLI - Pattern Analyzer (Learner)

Analyzes execution memory to detect failure patterns,
recipe effectiveness, and time-of-day correlations.
"""

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List

from .event_bus import Event, EventType, get_event_bus
from .memory import MemoryStore


@dataclass
class Pattern:
    """A detected execution pattern."""

    pattern_type: str  # "repeated_failure" | "time_correlation" | "recipe_effectiveness"
    description: str
    confidence: float  # 0.0-1.0
    data: Dict[str, Any] = field(default_factory=dict)


class PatternAnalyzer:
    """Analyzes memory entries to detect patterns and suggest improvements."""

    FAILURE_THRESHOLD: int = 3

    def __init__(self, memory_store: MemoryStore) -> None:
        """
        Initialize analyzer.

        Args:
            memory_store: MemoryStore instance to analyze
        """
        self.memory = memory_store
        bus = get_event_bus()
        bus.subscribe(EventType.MEMORY_RECORDED, self.on_memory_recorded)

    def analyze_failures(self) -> List[Pattern]:
        """Detect goals with repeated consecutive failures."""
        patterns: List[Pattern] = []
        goal_streaks: Dict[str, int] = {}

        for entry in self.memory._entries:
            if entry.status != "success":
                goal_streaks[entry.goal] = goal_streaks.get(entry.goal, 0) + 1
            else:
                goal_streaks[entry.goal] = 0

        for goal, streak in goal_streaks.items():
            if streak >= self.FAILURE_THRESHOLD:
                patterns.append(Pattern(
                    pattern_type="repeated_failure",
                    description=f"Goal '{goal}' failed {streak} consecutive times",
                    confidence=min(streak / 10, 1.0),
                    data={"goal": goal, "streak": streak},
                ))
        return patterns

    def get_recipe_effectiveness(self) -> Dict[str, float]:
        """Return success rate per recipe name."""
        recipe_results: Dict[str, List[bool]] = {}
        for entry in self.memory._entries:
            if entry.recipe_used:
                recipe_results.setdefault(entry.recipe_used, []).append(
                    entry.status == "success"
                )
        return {
            name: (sum(results) / len(results)) * 100
            for name, results in recipe_results.items()
            if results
        }

    def get_time_patterns(self) -> List[Pattern]:
        """Bucket executions by time-of-day, report best performing slot."""
        slots = {"00-06": [], "06-12": [], "12-18": [], "18-24": []}
        for entry in self.memory._entries:
            hour = time.localtime(entry.timestamp).tm_hour
            if hour < 6:
                key = "00-06"
            elif hour < 12:
                key = "06-12"
            elif hour < 18:
                key = "12-18"
            else:
                key = "18-24"
            slots[key].append(entry.status == "success")

        patterns: List[Pattern] = []
        for slot, results in slots.items():
            if len(results) >= 3:
                rate = sum(results) / len(results)
                if rate > 0.7:
                    patterns.append(Pattern(
                        pattern_type="time_correlation",
                        description=f"Higher success rate ({rate:.0%}) during {slot}",
                        confidence=min(len(results) / 20, 1.0),
                        data={"slot": slot, "rate": rate, "count": len(results)},
                    ))
        return patterns

    def on_memory_recorded(self, event: Event) -> None:
        """EventBus subscriber — analyze on new memory entry."""
        failures = self.analyze_failures()
        if failures:
            bus = get_event_bus()
            for pattern in failures:
                bus.emit(EventType.PATTERN_DETECTED, {
                    "pattern_type": pattern.pattern_type,
                    "description": pattern.description,
                    "confidence": pattern.confidence,
                })


__all__ = [
    "Pattern",
    "PatternAnalyzer",
]
