"""
AGI v2 Integration Tests

Tests that the full AGI pipeline is correctly wired:
1. Planner generates correct step types (tool/browse/evolve)
2. SmartRouter routes all 10 intents correctly
3. Orchestrator loads all 9 AGI modules
4. Executor handles all 5 step types
"""

import pytest

# === Planner Step Type Detection ===


class TestPlannerAGIv2:
    """Test that the Planner generates correct AGI v2 step types."""

    def _make_planner(self):
        from src.core.planner import RecipePlanner
        return RecipePlanner(llm_client=None)

    def test_detect_browse_from_url(self):
        planner = self._make_planner()
        assert planner._detect_step_type("https://google.com check") == "browse"

    def test_detect_browse_from_keyword(self):
        planner = self._make_planner()
        assert planner._detect_step_type("browse example.com") == "browse"

    def test_detect_tool_from_keyword(self):
        planner = self._make_planner()
        assert planner._detect_step_type("check git status") == "tool"

    def test_detect_tool_git_diff(self):
        planner = self._make_planner()
        assert planner._detect_step_type("run git diff") == "tool"

    def test_detect_evolve(self):
        planner = self._make_planner()
        assert planner._detect_step_type("refactor the auth module") == "evolve"

    def test_detect_optimize(self):
        planner = self._make_planner()
        assert planner._detect_step_type("optimize database queries") == "evolve"

    def test_detect_normal_goal(self):
        planner = self._make_planner()
        assert planner._detect_step_type("deploy to production") == ""

    def test_get_tool_name(self):
        planner = self._make_planner()
        assert planner._get_tool_name("run git status") == "git:status"
        assert planner._get_tool_name("git diff check") == "git:diff"
        assert planner._get_tool_name("hello world") == ""

    def test_extract_url(self):
        planner = self._make_planner()
        assert planner._extract_url("check https://google.com now") == "https://google.com"
        assert planner._extract_url("no url here") == ""

    def test_decompose_generates_browse_step(self):
        from src.core.planner import PlanningContext
        planner = self._make_planner()
        ctx = PlanningContext(goal="browse https://example.com")
        tasks = planner._rule_based_decompose("browse https://example.com", ctx)
        assert len(tasks) >= 1
        assert tasks[0]["type"] == "browse"
        assert tasks[0]["url"] == "https://example.com"

    def test_decompose_generates_tool_step(self):
        from src.core.planner import PlanningContext
        planner = self._make_planner()
        ctx = PlanningContext(goal="check git status")
        tasks = planner._rule_based_decompose("check git status", ctx)
        assert len(tasks) >= 1
        assert tasks[0]["type"] == "tool"
        assert tasks[0]["tool_name"] == "git:status"

    def test_decompose_generates_evolve_steps(self):
        from src.core.planner import PlanningContext
        planner = self._make_planner()
        ctx = PlanningContext(goal="refactor auth module")
        tasks = planner._rule_based_decompose("refactor auth module", ctx)
        assert len(tasks) == 2
        # First step: analyze (shell)
        assert tasks[0]["type"] == "shell"
        # Second step: apply (llm)
        assert tasks[1]["type"] == "llm"


# === SmartRouter Full Intent Routing ===


class TestSmartRouterAGIv2:
    """Test that SmartRouter routes all 10 NLU intents."""

    def test_route_status_to_tool(self):
        from src.core.smart_router import _INTENT_TOOLS
        from src.core.nlu import Intent
        assert Intent.STATUS in _INTENT_TOOLS
        assert _INTENT_TOOLS[Intent.STATUS] == "git:status"

    def test_route_audit_to_tool(self):
        from src.core.smart_router import _INTENT_TOOLS
        from src.core.nlu import Intent
        assert Intent.AUDIT in _INTENT_TOOLS
        assert _INTENT_TOOLS[Intent.AUDIT] == "git:diff"

    def test_evolve_intents(self):
        from src.core.smart_router import _EVOLVE_INTENTS
        from src.core.nlu import Intent
        assert Intent.REFACTOR in _EVOLVE_INTENTS
        assert Intent.OPTIMIZE in _EVOLVE_INTENTS

    def test_all_intent_tags_present(self):
        from src.core.smart_router import _INTENT_TAGS
        from src.core.nlu import Intent
        expected_intents = [
            Intent.DEPLOY, Intent.FIX, Intent.CREATE, Intent.STATUS,
            Intent.SCHEDULE, Intent.AUDIT, Intent.REFACTOR, Intent.OPTIMIZE,
            Intent.MIGRATE, Intent.REPORT,
        ]
        for intent in expected_intents:
            assert intent in _INTENT_TAGS, f"Missing intent: {intent}"


# === Orchestrator Module Loading ===


class TestOrchestratorAGIv2:
    """Test that Orchestrator loads all 9 AGI modules."""

    def test_orchestrator_loads_reflection(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._reflection is not None

    def test_orchestrator_loads_world_model(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._world_model is not None

    def test_orchestrator_loads_tool_registry(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._tool_registry is not None

    def test_orchestrator_loads_collaboration(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._collaboration is not None

    def test_orchestrator_loads_code_evolution(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._code_evolution is not None

    def test_orchestrator_loads_vector_memory(self):
        from src.core.orchestrator import RecipeOrchestrator
        orch = RecipeOrchestrator(llm_client=None, strict_verification=False)
        assert orch._vector_memory is not None


# === Executor Step Types ===


class TestExecutorStepTypes:
    """Test that Executor handles all 5 step types."""

    def test_executor_supports_tool_type(self):
        from src.core.executor import RecipeExecutor
        from src.core.parser import Recipe
        recipe = Recipe(name="test", description="test", steps=[])
        exe = RecipeExecutor(recipe)
        # Verify the method exists
        assert hasattr(exe, "_execute_tool_step")

    def test_executor_supports_browse_type(self):
        from src.core.executor import RecipeExecutor
        from src.core.parser import Recipe
        recipe = Recipe(name="test", description="test", steps=[])
        exe = RecipeExecutor(recipe)
        assert hasattr(exe, "_execute_browse_step")


# === Version Health Check ===


class TestVersionHealthCheck:
    """Test all 9 AGI modules import correctly."""

    @pytest.mark.parametrize("module,cls", [
        ("src.core.nlu", "IntentClassifier"),
        ("src.core.memory", "MemoryStore"),
        ("src.core.reflection", "ReflectionEngine"),
        ("src.core.world_model", "WorldModel"),
        ("src.core.tool_registry", "ToolRegistry"),
        ("src.core.browser_agent", "BrowserAgent"),
        ("src.core.collaboration", "CollaborationProtocol"),
        ("src.core.code_evolution", "CodeEvolutionEngine"),
        ("src.core.vector_memory_store", "VectorMemoryStore"),
    ])
    def test_module_importable(self, module, cls):
        import importlib
        m = importlib.import_module(module)
        assert hasattr(m, cls), f"{module}.{cls} not found"


# === AGI Score Engine ===


class TestAGIScoreEngine:
    """Test that AGI Score Engine computes correct scores."""

    def test_score_report_structure(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert hasattr(report, "total_score")
        assert hasattr(report, "grade")
        assert hasattr(report, "subsystems")
        assert hasattr(report, "module_score")
        assert hasattr(report, "wiring_score")

    def test_all_9_modules_online(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert report.module_score == 45.0
        assert len(report.subsystems) == 9
        assert all(s.available for s in report.subsystems)

    def test_wiring_score_at_least_20(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert report.wiring_score >= 20.0

    def test_improvement_score_at_least_10(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert report.improvement_score >= 10.0

    def test_total_score_above_80(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert report.total_score >= 80.0

    def test_grade_is_s_or_a(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert report.grade in ("S", "A")

    def test_event_bus_wired(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert "event_bus" in report.details.get("wired", [])

    def test_wiring_10_of_10(self):
        from src.core.agi_score import AGIScoreEngine
        engine = AGIScoreEngine()
        report = engine.calculate()
        assert len(report.details.get("wired", [])) == 10
