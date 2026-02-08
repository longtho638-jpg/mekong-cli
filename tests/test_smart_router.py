"""Tests for SmartRouter memory-aware intent routing."""

import tempfile
import unittest
from pathlib import Path

from src.core.nlu import Intent, IntentResult
from src.core.smart_router import RouteResult, SmartRouter
from src.core.memory import MemoryEntry, MemoryStore

import src.core.event_bus as _eb
from src.core.event_bus import EventBus


class TestSmartRouter(unittest.TestCase):
    """Test memory-aware intent-to-recipe routing."""

    def setUp(self):
        self._tmpdir = tempfile.mkdtemp()
        self._path = str(Path(self._tmpdir) / "memory.yaml")
        _eb._default_bus = EventBus()
        self.store = MemoryStore(store_path=self._path)
        self.router = SmartRouter(memory_store=self.store)

    def tearDown(self):
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)
        _eb._default_bus = None

    def test_route_unknown_intent(self):
        """UNKNOWN intent -> action='plan'."""
        ir = IntentResult(intent=Intent.UNKNOWN, confidence=0.1)
        result = self.router.route(ir)
        self.assertEqual(result.action, "plan")

    def test_route_with_no_recipes(self):
        """No recipes directory -> action='plan'."""
        ir = IntentResult(intent=Intent.DEPLOY, confidence=0.9)
        result = self.router.route(ir)
        self.assertEqual(result.action, "plan")

    def test_route_no_memory(self):
        """Works without memory store."""
        router = SmartRouter(memory_store=None)
        ir = IntentResult(intent=Intent.DEPLOY, confidence=0.9)
        result = router.route(ir)
        # No recipes dir -> plan
        self.assertEqual(result.action, "plan")

    def test_memory_check_viable(self):
        """Recipe with >50% success rate is viable."""
        for _ in range(5):
            self.store.record(MemoryEntry(goal="a", status="success", recipe_used="r1"))
        self.assertTrue(self.router._check_memory("r1"))

    def test_memory_check_low_success(self):
        """Recipe with <30% success rate is non-viable."""
        for _ in range(10):
            self.store.record(MemoryEntry(goal="a", status="failed", recipe_used="r1"))
        self.assertFalse(self.router._check_memory("r1"))

    def test_memory_check_insufficient_data(self):
        """< 3 entries => viable (not enough data)."""
        self.store.record(MemoryEntry(goal="a", status="failed", recipe_used="r1"))
        self.assertTrue(self.router._check_memory("r1"))

    def test_scan_recipes_empty_dir(self):
        """Handles missing recipes/ dir gracefully."""
        recipes = self.router._scan_recipes()
        self.assertIsInstance(recipes, dict)

    def test_route_result_dataclass(self):
        """RouteResult fields are correct."""
        r = RouteResult(
            action="recipe",
            recipe_path="/tmp/test.md",
            recipe_name="test",
            reason="exact match",
        )
        self.assertEqual(r.action, "recipe")
        self.assertEqual(r.recipe_path, "/tmp/test.md")
        self.assertEqual(r.reason, "exact match")

    def test_find_recipe_by_name_none(self):
        """No recipes -> returns None."""
        result = self.router._find_recipe_by_name("nonexistent")
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
