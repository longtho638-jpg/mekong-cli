"""Tests for MemoryStore execution memory."""

import tempfile
import time
import unittest
from pathlib import Path

from src.core.memory import MemoryEntry, MemoryStore


class TestMemoryEntry(unittest.TestCase):
    """Test MemoryEntry dataclass."""

    def test_memory_entry_creation(self):
        """Default fields are populated correctly."""
        entry = MemoryEntry(goal="deploy app", status="success")
        self.assertEqual(entry.goal, "deploy app")
        self.assertEqual(entry.status, "success")
        self.assertGreater(entry.timestamp, 0)
        self.assertEqual(entry.duration_ms, 0.0)
        self.assertEqual(entry.error_summary, "")
        self.assertEqual(entry.recipe_used, "")

    def test_memory_entry_with_error(self):
        """Error summary is stored."""
        entry = MemoryEntry(
            goal="build", status="failed",
            error_summary="exit code 1", recipe_used="build-recipe",
        )
        self.assertEqual(entry.error_summary, "exit code 1")
        self.assertEqual(entry.recipe_used, "build-recipe")


class TestMemoryStore(unittest.TestCase):
    """Test MemoryStore persistence and queries."""

    def _make_store(self, tmpdir):
        path = str(Path(tmpdir) / "memory.yaml")
        return MemoryStore(store_path=path)

    def test_record_and_query(self):
        """Record entries and query by pattern."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="deploy app", status="success"))
            store.record(MemoryEntry(goal="deploy api", status="failed"))
            store.record(MemoryEntry(goal="build project", status="success"))

            results = store.query("deploy")
            self.assertEqual(len(results), 2)

    def test_query_case_insensitive(self):
        """Query matches case-insensitively."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="Deploy App", status="success"))

            results = store.query("deploy")
            self.assertEqual(len(results), 1)

    def test_success_rate_all(self):
        """Global success rate calculated correctly."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="a", status="success"))
            store.record(MemoryEntry(goal="b", status="success"))
            store.record(MemoryEntry(goal="c", status="failed"))

            rate = store.get_success_rate()
            self.assertAlmostEqual(rate, 66.67, places=1)

    def test_success_rate_filtered(self):
        """Filtered success rate for specific pattern."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="deploy x", status="success"))
            store.record(MemoryEntry(goal="deploy y", status="failed"))
            store.record(MemoryEntry(goal="build z", status="success"))

            rate = store.get_success_rate("deploy")
            self.assertAlmostEqual(rate, 50.0, places=1)

    def test_get_last_failure(self):
        """Returns most recent failed entry."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="x", status="failed", error_summary="err1"))
            store.record(MemoryEntry(goal="x", status="success"))
            store.record(MemoryEntry(goal="x", status="failed", error_summary="err2"))

            failure = store.get_last_failure("x")
            self.assertIsNotNone(failure)
            self.assertEqual(failure.error_summary, "err2")

    def test_get_last_failure_none(self):
        """Returns None if no failures."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="x", status="success"))

            self.assertIsNone(store.get_last_failure("x"))

    def test_suggest_fix_with_history(self):
        """Returns error patterns from failures."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="deploy", status="failed", error_summary="timeout"))
            store.record(MemoryEntry(goal="deploy", status="failed", error_summary="auth error"))

            suggestion = store.suggest_fix("deploy")
            self.assertIn("timeout", suggestion)

    def test_suggest_fix_no_history(self):
        """Returns no-history message for unknown goals."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            suggestion = store.suggest_fix("unknown")
            self.assertIn("No failure history", suggestion)

    def test_recent_default_limit(self):
        """Returns last 20 entries by default."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            for i in range(25):
                store.record(MemoryEntry(goal=f"g{i}", status="success"))

            recent = store.recent()
            self.assertEqual(len(recent), 20)
            self.assertEqual(recent[-1].goal, "g24")

    def test_stats_structure(self):
        """Stats contain required keys."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.record(MemoryEntry(goal="a", status="success"))
            store.record(MemoryEntry(goal="a", status="failed"))

            s = store.stats()
            self.assertIn("total", s)
            self.assertIn("success_rate", s)
            self.assertIn("top_goals", s)
            self.assertIn("recent_failures", s)
            self.assertEqual(s["total"], 2)

    def test_persistence_roundtrip(self):
        """Data survives save/load cycle."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = str(Path(tmpdir) / "memory.yaml")
            store1 = MemoryStore(store_path=path)
            store1.record(MemoryEntry(goal="test", status="success", duration_ms=42.0))

            store2 = MemoryStore(store_path=path)
            self.assertEqual(len(store2._entries), 1)
            self.assertEqual(store2._entries[0].goal, "test")
            self.assertAlmostEqual(store2._entries[0].duration_ms, 42.0)

    def test_fifo_eviction(self):
        """Oldest entries evicted when exceeding MAX_ENTRIES."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            store.MAX_ENTRIES = 10
            for i in range(15):
                store.record(MemoryEntry(goal=f"g{i}", status="success"))

            self.assertEqual(len(store._entries), 10)
            self.assertEqual(store._entries[0].goal, "g5")

    def test_clear(self):
        """Clear empties store and removes file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = str(Path(tmpdir) / "memory.yaml")
            store = MemoryStore(store_path=path)
            store.record(MemoryEntry(goal="x", status="success"))
            self.assertTrue(Path(path).exists())

            store.clear()
            self.assertEqual(len(store._entries), 0)
            self.assertFalse(Path(path).exists())

    def test_empty_success_rate(self):
        """Success rate returns 0 for empty store."""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = self._make_store(tmpdir)
            self.assertEqual(store.get_success_rate(), 0.0)


if __name__ == "__main__":
    unittest.main()
