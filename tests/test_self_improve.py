"""
Tests for SelfImprover — self-evolution engine.

Covers: deprecate_bad_recipes, suggest_new_recipes, journal persistence,
FIFO eviction, evolution stats, full analyze_and_improve cycle.
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.self_improve import SelfImprover, JournalEntry
from src.core.memory import MemoryEntry, MemoryStore
from src.core.recipe_gen import RecipeGenerator
from src.core.event_bus import EventBus, EventType


class TestJournalEntryDataclass(unittest.TestCase):
    """Tests for the JournalEntry dataclass."""

    def test_fields_populated(self):
        """JournalEntry should store all fields."""
        e = JournalEntry(
            action="generated", target="deploy", reason="auto", data={"k": "v"}
        )
        self.assertEqual(e.action, "generated")
        self.assertEqual(e.target, "deploy")
        self.assertEqual(e.reason, "auto")
        self.assertEqual(e.data, {"k": "v"})

    def test_default_timestamp(self):
        """Timestamp should default to current time."""
        e = JournalEntry()
        self.assertGreater(e.timestamp, 0)


class TestDeprecateBadRecipes(unittest.TestCase):
    """Tests for deprecate_bad_recipes()."""

    def _make_improver(self, entries):
        """Helper to create SelfImprover with mock memory."""
        tmpdir = tempfile.mkdtemp()
        journal_path = os.path.join(tmpdir, "journal.yaml")

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = entries

        generator = MagicMock(spec=RecipeGenerator)
        return SelfImprover(memory, generator, journal_path=journal_path)

    def test_deprecate_low_success_rate(self):
        """Recipe with <20% success over 10+ runs should be deprecated."""
        entries = []
        for i in range(12):
            status = "failed" if i < 10 else "success"
            entries.append(
                MemoryEntry(goal="task", status=status, recipe_used="bad-recipe")
            )

        improver = self._make_improver(entries)
        deprecated = improver.deprecate_bad_recipes()
        self.assertIn("bad-recipe", deprecated)

    def test_no_deprecation_few_runs(self):
        """Recipe with <10 runs should not be deprecated."""
        entries = [
            MemoryEntry(goal="task", status="failed", recipe_used="new-recipe")
            for _ in range(5)
        ]

        improver = self._make_improver(entries)
        deprecated = improver.deprecate_bad_recipes()
        self.assertEqual(deprecated, [])

    def test_no_deprecation_high_success(self):
        """Recipe with >50% success should not be deprecated."""
        entries = []
        for i in range(12):
            status = "success" if i < 8 else "failed"
            entries.append(
                MemoryEntry(goal="task", status=status, recipe_used="good-recipe")
            )

        improver = self._make_improver(entries)
        deprecated = improver.deprecate_bad_recipes()
        self.assertEqual(deprecated, [])

    def test_deprecation_emits_event(self):
        """Deprecation should emit RECIPE_DEPRECATED event."""
        entries = [
            MemoryEntry(goal="task", status="failed", recipe_used="doomed")
            for _ in range(15)
        ]

        bus = EventBus()
        received = []
        bus.subscribe(EventType.RECIPE_DEPRECATED, lambda e: received.append(e))

        with patch("src.core.self_improve.get_event_bus", return_value=bus):
            improver = self._make_improver(entries)
            improver.deprecate_bad_recipes()

        self.assertEqual(len(received), 1)
        self.assertEqual(received[0].data["name"], "doomed")


class TestSuggestNewRecipes(unittest.TestCase):
    """Tests for suggest_new_recipes()."""

    def test_suggest_from_manual_success(self):
        """Goals that succeeded without recipe should be suggested."""
        entries = [
            MemoryEntry(goal="manual task", status="success", recipe_used=""),
        ]

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = entries
        generator = MagicMock(spec=RecipeGenerator)

        tmpdir = tempfile.mkdtemp()
        improver = SelfImprover(
            memory, generator, journal_path=os.path.join(tmpdir, "j.yaml")
        )
        suggestions = improver.suggest_new_recipes()
        self.assertIn("manual task", suggestions)

    def test_no_suggest_for_recipe_runs(self):
        """Goals that used a recipe should not be suggested."""
        entries = [
            MemoryEntry(goal="recipe task", status="success", recipe_used="my-recipe"),
        ]

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = entries
        generator = MagicMock(spec=RecipeGenerator)

        tmpdir = tempfile.mkdtemp()
        improver = SelfImprover(
            memory, generator, journal_path=os.path.join(tmpdir, "j.yaml")
        )
        suggestions = improver.suggest_new_recipes()
        self.assertEqual(suggestions, [])

    def test_max_five_suggestions(self):
        """Should return at most 5 suggestions."""
        entries = [
            MemoryEntry(goal=f"goal-{i}", status="success", recipe_used="")
            for i in range(10)
        ]

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = entries
        generator = MagicMock(spec=RecipeGenerator)

        tmpdir = tempfile.mkdtemp()
        improver = SelfImprover(
            memory, generator, journal_path=os.path.join(tmpdir, "j.yaml")
        )
        suggestions = improver.suggest_new_recipes()
        self.assertLessEqual(len(suggestions), 5)


class TestJournalPersistence(unittest.TestCase):
    """Tests for journal save/load and FIFO eviction."""

    def test_journal_save_and_load(self):
        """Journal entries should survive save/reload."""
        tmpdir = tempfile.mkdtemp()
        path = os.path.join(tmpdir, "journal.yaml")

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = []
        generator = MagicMock(spec=RecipeGenerator)

        improver = SelfImprover(memory, generator, journal_path=path)
        improver._record(JournalEntry(action="test", target="t1", reason="r1"))
        improver._record(JournalEntry(action="test", target="t2", reason="r2"))

        # Reload
        improver2 = SelfImprover(memory, generator, journal_path=path)
        journal = improver2.get_journal()
        self.assertEqual(len(journal), 2)
        self.assertEqual(journal[0].target, "t1")

    def test_journal_fifo_eviction(self):
        """>200 entries should evict oldest."""
        tmpdir = tempfile.mkdtemp()
        path = os.path.join(tmpdir, "journal.yaml")

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = []
        generator = MagicMock(spec=RecipeGenerator)

        improver = SelfImprover(memory, generator, journal_path=path)

        for i in range(210):
            improver._record(
                JournalEntry(action="fill", target=f"t-{i}", reason="fill")
            )

        self.assertLessEqual(len(improver.get_journal(limit=999)), 200)


class TestEvolutionStats(unittest.TestCase):
    """Tests for get_evolution_stats()."""

    def test_correct_counts(self):
        """Stats should reflect journal content."""
        tmpdir = tempfile.mkdtemp()
        path = os.path.join(tmpdir, "journal.yaml")

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = []
        generator = MagicMock(spec=RecipeGenerator)

        improver = SelfImprover(memory, generator, journal_path=path)
        improver._record(JournalEntry(action="generated", target="a", reason="r"))
        improver._record(JournalEntry(action="generated", target="b", reason="r"))
        improver._record(JournalEntry(action="deprecated", target="c", reason="r"))

        stats = improver.get_evolution_stats()
        self.assertEqual(stats["total_generated"], 2)
        self.assertEqual(stats["total_deprecated"], 1)
        self.assertEqual(stats["journal_size"], 3)
        self.assertGreater(stats["last_evolution"], 0)

    def test_empty_journal_stats(self):
        """Empty journal should return zero counts."""
        tmpdir = tempfile.mkdtemp()
        path = os.path.join(tmpdir, "journal.yaml")

        memory = MagicMock(spec=MemoryStore)
        memory.recent.return_value = []
        generator = MagicMock(spec=RecipeGenerator)

        improver = SelfImprover(memory, generator, journal_path=path)
        stats = improver.get_evolution_stats()
        self.assertEqual(stats["total_generated"], 0)
        self.assertEqual(stats["total_deprecated"], 0)
        self.assertEqual(stats["last_evolution"], 0)


if __name__ == "__main__":
    unittest.main()
