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


class TestSwarmDispatcher(unittest.TestCase):
    """Tests for SwarmDispatcher — Phase 04 swarm task distribution."""

    def setUp(self):
        from src.core.swarm import SwarmRegistry, SwarmDispatcher
        # Use temp config so no disk persistence
        self._tmpdir = tempfile.mkdtemp()
        config_path = str(Path(self._tmpdir) / "swarm.yaml")
        self.registry = SwarmRegistry(config_path=config_path)
        self.dispatcher = SwarmDispatcher(self.registry)

    def tearDown(self):
        import shutil
        shutil.rmtree(self._tmpdir, ignore_errors=True)

    # --- Route step type ---

    def _make_step(self, description="echo hello", step_type=None):
        """Helper: create minimal step-like object."""
        class FakeStep:
            pass
        step = FakeStep()
        step.description = description
        step.params = {"type": step_type} if step_type else {}
        return step

    def test_route_step_explicit_git(self):
        """Step with params type='git' -> 'git'."""
        step = self._make_step(step_type="git")
        self.assertEqual(self.dispatcher._route_step(step), "git")

    def test_route_step_explicit_file(self):
        """Step with params type='file' -> 'file'."""
        step = self._make_step(step_type="file")
        self.assertEqual(self.dispatcher._route_step(step), "file")

    def test_route_step_explicit_shell(self):
        """Step with params type='shell' -> 'shell'."""
        step = self._make_step(step_type="shell")
        self.assertEqual(self.dispatcher._route_step(step), "shell")

    def test_route_step_git_keyword_in_description(self):
        """Description with 'git ' keyword -> 'git'."""
        step = self._make_step(description="git status")
        self.assertEqual(self.dispatcher._route_step(step), "git")

    def test_route_step_default_shell(self):
        """Unknown description defaults to 'shell'."""
        step = self._make_step(description="echo hello")
        self.assertEqual(self.dispatcher._route_step(step), "shell")

    # --- Healthy nodes ---

    def test_get_healthy_nodes_empty_registry(self):
        """No nodes -> empty list."""
        self.assertEqual(self.dispatcher.get_healthy_nodes(), [])

    def test_get_healthy_nodes_filters_unhealthy(self):
        """Only healthy nodes returned."""
        n1 = self.registry.register_node("n1", "localhost", 9001, "tok1")
        n1.status = "healthy"
        n2 = self.registry.register_node("n2", "localhost", 9002, "tok2")
        n2.status = "unreachable"

        healthy = self.dispatcher.get_healthy_nodes()
        self.assertEqual(len(healthy), 1)
        self.assertEqual(healthy[0].name, "n1")

    # --- Fallback to local ---

    def test_dispatch_fallback_local_no_nodes(self):
        """No remote nodes -> dispatch_local returns ExecutionResult."""
        from src.core.verifier import ExecutionResult
        step = self._make_step(description="echo test")
        result = self.dispatcher.dispatch(step)
        self.assertIsInstance(result, ExecutionResult)

    def test_dispatch_local_shell_success(self):
        """Local shell dispatch returns exit_code 0 for simple echo."""
        step = self._make_step(description="echo hello", step_type="shell")
        result = self.dispatcher.dispatch(step)
        self.assertEqual(result.exit_code, 0)

    # --- Orchestrator integration ---

    def test_orchestrator_use_swarm_false_no_dispatcher(self):
        """use_swarm=False -> dispatcher is None."""
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(use_swarm=False)
        self.assertIsNone(orch.dispatcher)

    def test_orchestrator_use_swarm_true_has_dispatcher(self):
        """use_swarm=True -> dispatcher is SwarmDispatcher."""
        from src.core.orchestrator import RecipeOrchestrator
        from src.core.swarm import SwarmDispatcher
        orch = RecipeOrchestrator(use_swarm=True)
        self.assertIsInstance(orch.dispatcher, SwarmDispatcher)


if __name__ == "__main__":
    unittest.main()
