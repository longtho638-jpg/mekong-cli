"""Tests for PatternAnalyzer learning engine."""

import tempfile
import time
import unittest
from pathlib import Path

from src.core.event_bus import EventBus, EventType
from src.core.memory import MemoryEntry, MemoryStore
from src.core.learner import Pattern, PatternAnalyzer

# Override the global event bus for test isolation
import src.core.event_bus as _eb


class TestPatternAnalyzer(unittest.TestCase):
    """Test pattern detection and analysis."""

    def setUp(self):
        """Create fresh memory store and analyzer per test."""
        self._tmpdir = tempfile.mkdtemp()
        self._path = str(Path(self._tmpdir) / "memory.yaml")
        # Reset event bus to isolated instance
        _eb._default_bus = EventBus()
        self.store = MemoryStore(store_path=self._path)
        self.analyzer = PatternAnalyzer(self.store)

    def tearDown(self):
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)
        _eb._default_bus = None

    def test_analyze_no_failures(self):
        """No patterns when all successes."""
        self.store.record(MemoryEntry(goal="deploy", status="success"))
        patterns = self.analyzer.analyze_failures()
        self.assertEqual(len(patterns), 0)

    def test_analyze_repeated_failures(self):
        """Detects repeated failure pattern."""
        for _ in range(4):
            self.store.record(MemoryEntry(goal="deploy app", status="failed"))

        patterns = self.analyzer.analyze_failures()
        self.assertGreater(len(patterns), 0)
        self.assertEqual(patterns[0].pattern_type, "repeated_failure")
        self.assertIn("deploy app", patterns[0].description)

    def test_analyze_mixed_no_pattern(self):
        """No pattern when failures are below threshold."""
        self.store.record(MemoryEntry(goal="x", status="failed"))
        self.store.record(MemoryEntry(goal="x", status="success"))
        self.store.record(MemoryEntry(goal="x", status="failed"))

        patterns = self.analyzer.analyze_failures()
        self.assertEqual(len(patterns), 0)

    def test_recipe_effectiveness(self):
        """Tracks per-recipe success rate."""
        self.store.record(MemoryEntry(goal="a", status="success", recipe_used="r1"))
        self.store.record(MemoryEntry(goal="b", status="success", recipe_used="r1"))
        self.store.record(MemoryEntry(goal="c", status="failed", recipe_used="r2"))

        effectiveness = self.analyzer.get_recipe_effectiveness()
        self.assertAlmostEqual(effectiveness["r1"], 100.0)
        self.assertAlmostEqual(effectiveness["r2"], 0.0)

    def test_recipe_effectiveness_empty(self):
        """Returns empty dict for no entries."""
        effectiveness = self.analyzer.get_recipe_effectiveness()
        self.assertEqual(effectiveness, {})

    def test_time_patterns(self):
        """Buckets executions by time-of-day."""
        # Create entries with known timestamps
        base_time = time.time()
        for i in range(5):
            self.store.record(MemoryEntry(
                goal=f"task{i}", status="success",
                timestamp=base_time + i,
            ))

        patterns = self.analyzer.get_time_patterns()
        # May or may not find patterns depending on time — just verify no crash
        self.assertIsInstance(patterns, list)

    def test_event_subscriber_emits_pattern(self):
        """on_memory_recorded emits PATTERN_DETECTED when pattern found."""
        detected = []
        bus = _eb.get_event_bus()
        bus.subscribe(EventType.PATTERN_DETECTED, lambda e: detected.append(e))

        # Record enough failures to trigger pattern
        for _ in range(4):
            self.store.record(MemoryEntry(goal="failing task", status="failed"))

        self.assertGreater(len(detected), 0)
        self.assertEqual(detected[0].type, EventType.PATTERN_DETECTED)

    def test_empty_memory(self):
        """Handles empty memory gracefully."""
        patterns = self.analyzer.analyze_failures()
        self.assertEqual(patterns, [])
        effectiveness = self.analyzer.get_recipe_effectiveness()
        self.assertEqual(effectiveness, {})
        time_p = self.analyzer.get_time_patterns()
        self.assertEqual(time_p, [])

    def test_pattern_dataclass(self):
        """Pattern dataclass fields are correct."""
        p = Pattern(
            pattern_type="repeated_failure",
            description="test",
            confidence=0.8,
            data={"key": "val"},
        )
        self.assertEqual(p.pattern_type, "repeated_failure")
        self.assertEqual(p.confidence, 0.8)
        self.assertEqual(p.data["key"], "val")


if __name__ == "__main__":
    unittest.main()
