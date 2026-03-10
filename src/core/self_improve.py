"""Mekong CLI - Self-Improvement Engine.

Analyzes execution patterns, deprecates bad recipes, suggests new ones.
Maintains evolution journal in .mekong/journal.yaml.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

from .event_bus import EventType, get_event_bus
from .memory import MemoryStore
from .recipe_gen import RecipeGenerator


@dataclass
class JournalEntry:
    """A single evolution journal entry."""

    timestamp: float = field(default_factory=time.time)
    action: str = ""  # "generated" | "deprecated" | "suggestion"
    target: str = ""  # recipe name or goal
    reason: str = ""
    data: dict[str, Any] = field(default_factory=dict)


class SelfImprover:
    """Analyzes execution patterns and triggers self-improvement."""

    MAX_JOURNAL: int = 200
    DEPRECATION_THRESHOLD: float = 0.2  # 20%
    MIN_RUNS_FOR_DEPRECATION: int = 10

    def __init__(
        self,
        memory_store: MemoryStore,
        recipe_generator: RecipeGenerator,
        journal_path: str | None = None,
    ) -> None:
        """Initialize self-improver.

        Args:
            memory_store: Memory store for execution history
            recipe_generator: Generator for creating new recipes
            journal_path: Path to journal file

        """
        self.memory = memory_store
        self.generator = recipe_generator
        self.journal_path = journal_path or ".mekong/journal.yaml"
        self._journal: list[JournalEntry] = []
        self._load_journal()

    def analyze_and_improve(self) -> list[JournalEntry]:
        """Run full self-improvement cycle."""
        new_entries: list[JournalEntry] = []

        # Step 1: Deprecate bad recipes
        deprecated = self.deprecate_bad_recipes()
        for name in deprecated:
            entry = JournalEntry(
                action="deprecated", target=name,
                reason="Success rate below threshold",
            )
            self._record(entry)
            new_entries.append(entry)

        # Step 2: Suggest new recipes from successful manual runs
        suggestions = self.suggest_new_recipes()
        for goal in suggestions:
            recipe = self.generator.from_successful_run(
                next(e for e in self.memory.recent(100)
                     if e.goal == goal and e.status == "success"),
            )
            if recipe.valid:
                path = self.generator.save_recipe(recipe)
                entry = JournalEntry(
                    action="generated", target=recipe.name,
                    reason=f"Auto-generated from successful goal: {goal}",
                    data={"path": path},
                )
                self._record(entry)
                new_entries.append(entry)

        return new_entries

    def deprecate_bad_recipes(self) -> list[str]:
        """Find and deprecate recipes with low success rates."""
        deprecated: list[str] = []
        entries = self.memory.recent(500)

        # Group by recipe_used
        recipe_runs: dict[str, list[str]] = {}
        for e in entries:
            if e.recipe_used:
                recipe_runs.setdefault(e.recipe_used, []).append(e.status)

        bus = get_event_bus()
        for recipe_name, statuses in recipe_runs.items():
            if len(statuses) < self.MIN_RUNS_FOR_DEPRECATION:
                continue
            success_rate = sum(1 for s in statuses if s == "success") / len(statuses)
            if success_rate < self.DEPRECATION_THRESHOLD:
                # Mark as deprecated
                deprecated.append(recipe_name)
                if bus:
                    bus.emit(EventType.RECIPE_DEPRECATED, {
                        "name": recipe_name,
                        "success_rate": success_rate,
                        "total_runs": len(statuses),
                    })

        return deprecated

    def suggest_new_recipes(self) -> list[str]:
        """Find successful goals that have no associated recipe."""
        entries = self.memory.recent(100)
        suggestions: list[str] = []

        # Find goals that succeeded without a recipe
        seen_goals: set = set()
        for e in entries:
            if e.status == "success" and not e.recipe_used and e.goal not in seen_goals:
                seen_goals.add(e.goal)
                suggestions.append(e.goal)

        return suggestions[:5]  # Limit suggestions

    def get_journal(self, limit: int = 20) -> list[JournalEntry]:
        """Get recent journal entries."""
        return self._journal[-limit:]

    def get_evolution_stats(self) -> dict[str, Any]:
        """Get evolution statistics."""
        generated = sum(1 for e in self._journal if e.action == "generated")
        deprecated = sum(1 for e in self._journal if e.action == "deprecated")
        return {
            "total_generated": generated,
            "total_deprecated": deprecated,
            "journal_size": len(self._journal),
            "last_evolution": self._journal[-1].timestamp if self._journal else 0,
        }

    def _load_journal(self) -> None:
        """Load journal from YAML file."""
        path = Path(self.journal_path)
        if not path.exists():
            self._journal = []
            return
        try:
            data = yaml.safe_load(path.read_text()) or []
            self._journal = [
                JournalEntry(
                    timestamp=d.get("timestamp", 0),
                    action=d.get("action", ""),
                    target=d.get("target", ""),
                    reason=d.get("reason", ""),
                    data=d.get("data", {}),
                )
                for d in data
            ]
        except Exception:
            self._journal = []

    def _save_journal(self) -> None:
        """Save journal to YAML file."""
        path = Path(self.journal_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        data = [
            {
                "timestamp": e.timestamp,
                "action": e.action,
                "target": e.target,
                "reason": e.reason,
                "data": e.data,
            }
            for e in self._journal
        ]
        path.write_text(yaml.dump(data, default_flow_style=False))

    def _record(self, entry: JournalEntry) -> None:
        """Record a journal entry with FIFO eviction."""
        self._journal.append(entry)
        if len(self._journal) > self.MAX_JOURNAL:
            self._journal = self._journal[-self.MAX_JOURNAL:]
        self._save_journal()


__all__ = [
    "JournalEntry",
    "SelfImprover",
]
