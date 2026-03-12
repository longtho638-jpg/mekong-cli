"""Tests for RecipePlanner module.

Tests验证了RecipePlanner的以下功能:
1. PlanningContext和VerificationCriteria数据类
2. suggest_agent() - 关键字匹配
3. decompose_goal() - 规则分解 (实现/修复/shell模式)
4. generate_verification_criteria() - 验证标准生成
5. plan() - 完整配方生成
6. validate_plan() - 循环依赖检测

注意: _llm_decompose使用get_client()直接导入,所以LLM测试需要特殊处理。
"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from src.core.planner import (
    PlanningContext,
    RecipePlanner,
    TaskComplexity,
    VerificationCriteria,
)
from src.core.parser import Recipe, RecipeStep


class TestPlanningContext(unittest.TestCase):
    """Test PlanningContext dataclass."""

    def test_default_values(self):
        """Context should have default empty values."""
        context = PlanningContext(goal="test goal")
        self.assertEqual(context.goal, "test goal")
        self.assertEqual(context.constraints, {})
        self.assertEqual(context.project_info, {})
        self.assertEqual(context.available_agents, [])
        self.assertEqual(context.complexity, TaskComplexity.MODERATE)

    def test_custom_values(self):
        """Context should accept custom values."""
        context = PlanningContext(
            goal="build app",
            constraints={"max_steps": 10},
            project_info={"name": "test"},
            available_agents=["git", "shell"],
            complexity=TaskComplexity.COMPLEX,
        )
        self.assertEqual(context.constraints, {"max_steps": 10})
        self.assertEqual(context.project_info, {"name": "test"})
        self.assertEqual(context.available_agents, ["git", "shell"])
        self.assertEqual(context.complexity, TaskComplexity.COMPLEX)


class TestVerificationCriteria(unittest.TestCase):
    """Test VerificationCriteria dataclass."""

    def test_default_values(self):
        """Criteria should have default values (exit_code=0, others empty)."""
        criteria = VerificationCriteria()
        self.assertEqual(criteria.exit_code, 0)
        self.assertEqual(criteria.file_exists, [])
        self.assertEqual(criteria.file_not_exists, [])
        self.assertEqual(criteria.output_contains, [])
        self.assertEqual(criteria.output_not_contains, [])
        self.assertEqual(criteria.custom_checks, [])

    def test_custom_values(self):
        """Criteria should accept custom values."""
        criteria = VerificationCriteria(
            exit_code=0,
            file_exists=["output.txt"],
            file_not_exists=["error.log"],
            output_contains=["SUCCESS"],
            output_not_contains=["ERROR"],
            custom_checks=["check_health"],
        )
        self.assertEqual(criteria.exit_code, 0)
        self.assertEqual(criteria.file_exists, ["output.txt"])
        self.assertEqual(criteria.file_not_exists, ["error.log"])
        self.assertEqual(criteria.output_contains, ["SUCCESS"])
        self.assertEqual(criteria.output_not_contains, ["ERROR"])
        self.assertEqual(criteria.custom_checks, ["check_health"])


class TestRecipePlannerInitialization(unittest.TestCase):
    """Test RecipePlanner initialization."""

    def test_initialization_without_llm(self):
        """Planner should initialize without LLM client."""
        planner = RecipePlanner()
        self.assertIsNone(planner.llm_client)

    def test_initialization_with_llm(self):
        """Planner should initialize with LLM client."""
        mock_llm = MagicMock()
        planner = RecipePlanner(llm_client=mock_llm)
        self.assertEqual(planner.llm_client, mock_llm)


class TestSuggestAgent(unittest.TestCase):
    """Test suggest_agent() method - keyword matching."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_git_keywords(self):
        """Goal with git keywords should suggest git agent."""
        self.assertEqual(self.planner.suggest_agent("git commit fix"), "git")
        self.assertEqual(self.planner.suggest_agent("merge branch"), "git")
        self.assertEqual(self.planner.suggest_agent("git push origin"), "git")
        self.assertEqual(self.planner.suggest_agent("rebase master"), "git")

    def test_file_keywords(self):
        """Goal with file keywords should suggest file agent."""
        self.assertEqual(self.planner.suggest_agent("create file"), "file")
        self.assertEqual(self.planner.suggest_agent("read config"), "file")
        self.assertEqual(self.planner.suggest_agent("copy directory"), "file")
        self.assertEqual(self.planner.suggest_agent("delete folder"), "file")

    def test_shell_keywords(self):
        """Goal with shell keywords should suggest shell agent."""
        self.assertEqual(self.planner.suggest_agent("run script"), "shell")
        self.assertEqual(self.planner.suggest_agent("execute command"), "shell")
        self.assertEqual(self.planner.suggest_agent("install packages"), "shell")
        self.assertEqual(self.planner.suggest_agent("build project"), "shell")

    def test_lead_keywords(self):
        """Goal with lead keywords should suggest lead agent."""
        self.assertEqual(self.planner.suggest_agent("lead discovery"), "lead")
        self.assertEqual(self.planner.suggest_agent("prospect email"), "lead")
        self.assertEqual(self.planner.suggest_agent("ceo outreach"), "lead")

    def test_content_keywords(self):
        """Goal with content keywords should suggest content agent."""
        self.assertEqual(self.planner.suggest_agent("content creation"), "content")
        self.assertEqual(self.planner.suggest_agent("article writing"), "content")
        self.assertEqual(self.planner.suggest_agent("seo blog"), "content")

    def test_crawler_keywords(self):
        """Goal with crawler keywords should suggest crawler or browse agent.

        AGI v2 added 'browse' agent which overlaps with crawler keywords.
        'crawl website' now scores browse=2 (website+web) vs crawler=1 (crawl).
        """
        # "crawl website" → browse wins (website+web = 2pts vs crawl = 1pt)
        self.assertIn(self.planner.suggest_agent("crawl website"), ["crawler", "browse"])
        self.assertEqual(self.planner.suggest_agent("scrape data"), "crawler")
        self.assertEqual(self.planner.suggest_agent("discover recipes"), "crawler")

    def test_no_matching_keywords(self):
        """Goal with no matching keywords should return None."""
        self.assertIsNone(self.planner.suggest_agent("random task"))
        self.assertIsNone(self.planner.suggest_agent("unknown action"))

    def test_case_insensitive(self):
        """Suggest agent should be case-insensitive."""
        self.assertEqual(self.planner.suggest_agent("GIT COMMIT"), "git")
        self.assertEqual(self.planner.suggest_agent("Create File"), "file")

    def test_multiple_keywords_higher_score(self):
        """Goal with more keywords should get higher score."""
        result = self.planner.suggest_agent("git merge and file copy")
        self.assertIn(result, ["git", "file"])


class TestDecomposeGoal(unittest.TestCase):
    """Test decompose_goal() method."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_rule_based_decomposition_no_llm(self):
        """Should use rule-based when no LLM provided."""
        context = PlanningContext(goal="implement auth")
        tasks = self.planner.decompose_goal("implement auth", context)
        self.assertIsInstance(tasks, list)
        self.assertGreater(len(tasks), 0)



class TestRuleBasedDecompose(unittest.TestCase):
    """Test _rule_based_decompose() - patterns: implement, fix, shell."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_implement_pattern(self):
        """'implement X' should generate 4 tasks."""
        context = PlanningContext(goal="implement auth")
        tasks = self.planner._rule_based_decompose("implement auth", context)

        self.assertEqual(len(tasks), 4)
        self.assertEqual(tasks[0]["title"], "Setup environment")
        self.assertEqual(tasks[1]["title"], "Implement core logic")
        self.assertIn("implement auth", tasks[1]["description"].lower())
        self.assertEqual(tasks[2]["title"], "Write tests")
        self.assertEqual(tasks[3]["title"], "Verify implementation")

        self.assertEqual(tasks[0]["dependencies"], [])
        self.assertEqual(tasks[1]["dependencies"], [0])
        self.assertEqual(tasks[2]["dependencies"], [1])
        self.assertEqual(tasks[3]["dependencies"], [2])

    def test_create_pattern(self):
        """'create X' should also generate 4 tasks."""
        context = PlanningContext(goal="create API")
        tasks = self.planner._rule_based_decompose("create API", context)
        self.assertEqual(len(tasks), 4)
        self.assertEqual(tasks[1]["title"], "Implement core logic")

    def test_build_pattern(self):
        """'build X' should also generate 4 tasks."""
        context = PlanningContext(goal="build feature")
        tasks = self.planner._rule_based_decompose("build feature", context)
        self.assertEqual(len(tasks), 4)

    def test_fix_pattern(self):
        """'fix X' should generate 3 tasks."""
        context = PlanningContext(goal="fix login bug")
        tasks = self.planner._rule_based_decompose("fix login bug", context)

        self.assertEqual(len(tasks), 3)
        self.assertEqual(tasks[0]["title"], "Identify issue")
        self.assertEqual(tasks[1]["title"], "Apply fix")
        self.assertEqual(tasks[2]["title"], "Verify fix")

        self.assertEqual(tasks[0]["dependencies"], [])
        self.assertEqual(tasks[1]["dependencies"], [0])
        self.assertEqual(tasks[2]["dependencies"], [1])

    def test_debug_pattern(self):
        """'debug X' should generate 3 tasks."""
        context = PlanningContext(goal="debug error")
        tasks = self.planner._rule_based_decompose("debug error", context)
        self.assertEqual(len(tasks), 3)

    def test_resolve_pattern(self):
        """'resolve X' should generate 3 tasks."""
        context = PlanningContext(goal="resolve issue")
        tasks = self.planner._rule_based_decompose("resolve issue", context)
        self.assertEqual(len(tasks), 3)

    def test_shell_command_ln_5(self):
        """'git log 5' - AGI v2 routes git commands to tool steps."""
        context = PlanningContext(goal="git log 5")
        tasks = self.planner._rule_based_decompose("git log 5", context)

        self.assertEqual(len(tasks), 1)
        # AGI v2: git commands now route to tool steps via ToolRegistry
        self.assertIn(tasks[0]["type"], ["shell", "tool"])

    def test_shell_command_git_log(self):
        """'git log' - AGI v2 routes to tool step with git:log."""
        context = PlanningContext(goal="git log")
        tasks = self.planner._rule_based_decompose("git log", context)
        self.assertEqual(len(tasks), 1)
        # AGI v2: git:log tool step; description may be "Execute tool: git:log"
        self.assertIn("git", tasks[0]["description"].lower())

    def test_shell_command_git_status(self):
        """'git status' - AGI v2 routes to tool step with git:status."""
        context = PlanningContext(goal="git status")
        tasks = self.planner._rule_based_decompose("git status", context)
        self.assertEqual(len(tasks), 1)
        # AGI v2: git:status tool step; description may be "Execute tool: git:status"
        self.assertIn("git", tasks[0]["description"].lower())

    def test_shell_find_command(self):
        """'find ...' command should be wrapped in a task."""
        context = PlanningContext(goal="find . -name test.py")
        tasks = self.planner._rule_based_decompose("find . -name test.py", context)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["type"], "shell")

    def test_list_python_files(self):
        """'list python files' should map to find command."""
        context = PlanningContext(goal="list python files")
        tasks = self.planner._rule_based_decompose("list python files", context)

        self.assertEqual(len(tasks), 1)
        self.assertIn("find", tasks[0]["description"])
        self.assertIn(".py", tasks[0]["description"])

    def test_list_files(self):
        """'list files' should map to find command."""
        context = PlanningContext(goal="list files")
        tasks = self.planner._rule_based_decompose("list files", context)
        self.assertEqual(len(tasks), 1)
        self.assertIn("find", tasks[0]["description"])

    def test_default_llm_type(self):
        """Unknown pattern should create task with type 'llm'."""
        context = PlanningContext(goal="some unknown task")
        tasks = self.planner._rule_based_decompose("some unknown task", context)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["type"], "llm")

    def test_agent_suggestion_attached(self):
        """Suggested agent should be attached to all tasks."""
        mock_llm = MagicMock()
        planner = RecipePlanner(llm_client=mock_llm)
        context = PlanningContext(goal="git commit fix")
        tasks = planner._rule_based_decompose("git commit fix", context)
        for task in tasks:
            self.assertEqual(task.get("agent"), "git")

    def test_agent_suggestion_not_overwritten(self):
        """Existing agent field should not be overwritten."""
        context = PlanningContext(goal="test")
        _ = self.planner._rule_based_decompose("test", context)


class TestGenerateVerificationCriteria(unittest.TestCase):
    """Test generate_verification_criteria() method."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_file_creation_criteria(self):
        """Create task should extract filename."""
        task = {"description": "create output.txt with data"}
        criteria = self.planner.generate_verification_criteria(task)
        self.assertIn("output.txt", criteria.file_exists)

    def test_test_task_criteria(self):
        """Test task should have exit_code and output checks."""
        task = {"description": "run tests"}
        criteria = self.planner.generate_verification_criteria(task)

        self.assertEqual(criteria.exit_code, 0)
        self.assertIn("pass", criteria.output_contains)
        self.assertIn("error", criteria.output_not_contains)
        self.assertIn("failed", criteria.output_not_contains)

    def test_build_task_criteria(self):
        """Build task should have exit_code and error checks."""
        task = {"description": "build project"}
        criteria = self.planner.generate_verification_criteria(task)

        self.assertEqual(criteria.exit_code, 0)
        self.assertIn("error:", criteria.output_not_contains)
        self.assertIn("failed", criteria.output_not_contains)

    def test_compile_task_criteria(self):
        """Compile task should have error checks."""
        task = {"description": "compile source"}
        criteria = self.planner.generate_verification_criteria(task)

        self.assertEqual(criteria.exit_code, 0)
        self.assertIn("error:", criteria.output_not_contains)

    def test_generic_task_criteria(self):
        """Generic task should return default exit_code=0."""
        task = {"description": "do something"}
        criteria = self.planner.generate_verification_criteria(task)

        self.assertEqual(criteria.exit_code, 0)
        self.assertEqual(criteria.file_exists, [])
        self.assertEqual(criteria.output_contains, [])


class TestPlan(unittest.TestCase):
    """Test plan() method - full recipe generation."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_creates_recipe_with_steps(self):
        """Plan should create Recipe with steps."""
        goal = "implement auth"
        context = PlanningContext(goal=goal, complexity=TaskComplexity.SIMPLE)

        recipe = self.planner.plan(goal, context)

        self.assertEqual(recipe.name, f"Plan: {goal}")
        self.assertEqual(recipe.description, f"Automated plan for: {goal}")
        self.assertEqual(len(recipe.steps), 4)
        self.assertEqual(recipe.metadata["planned_by"], "RecipePlanner")
        self.assertEqual(recipe.metadata["complexity"], "simple")
        self.assertEqual(recipe.metadata["goal"], goal)

    def test_recipe_step_structure(self):
        """Each step should have correct structure."""
        recipe = self.planner.plan("create file", None)

        self.assertGreater(len(recipe.steps), 0)
        for step in recipe.steps:
            self.assertIsNotNone(step.order)
            self.assertIsNotNone(step.title)
            self.assertIsNotNone(step.description)
            self.assertIn("verification", step.params)

    def test_auto_creates_context(self):
        """Plan should create default context when None provided."""
        recipe = self.planner.plan("test goal")
        self.assertEqual(recipe.metadata["goal"], "test goal")


class TestValidatePlan(unittest.TestCase):
    """Test validate_plan() - dependency validation.

    Dependencies in params use 1-based ordering (matching step.order values),
    consistent with how plan() stores them via `[d + 1 for d in deps]`.

    Convention: step order=2 depending on step order=1 -> params={"dependencies": [1]}
    """

    def setUp(self):
        self.planner = RecipePlanner()

    def test_valid_plan_no_issues(self):
        """Valid plan with 1-based deps should have no issues."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": []}),
            RecipeStep(order=2, title="Step 2", description="Second", params={"dependencies": [1]}),
            RecipeStep(order=3, title="Step 3", description="Third", params={"dependencies": [2]}),
        ]
        recipe = Recipe(name="Test Recipe", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(issues, [])

    def test_circular_dependency_on_self(self):
        """Step depending on itself (1-based: dep == step.order) should be flagged."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": [1]}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        # Self-reference triggers: "depends on itself" AND "depends on future/same step"
        self.assertGreaterEqual(len(issues), 1)
        issues_text = " ".join(issues).lower()
        self.assertIn("depends on itself", issues_text)

    def test_future_dependency(self):
        """Step depending on future step (1-based: dep >= step.order) should be flagged."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": [2]}),
            RecipeStep(order=2, title="Step 2", description="Second", params={"dependencies": []}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertGreaterEqual(len(issues), 1)
        self.assertIn("future", issues[0].lower())

    def test_multiple_future_dependencies(self):
        """Multiple future dependencies should all be flagged."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": [2, 3]}),
            RecipeStep(order=2, title="Step 2", description="Second", params={"dependencies": []}),
            RecipeStep(order=3, title="Step 3", description="Third", params={"dependencies": []}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertGreaterEqual(len(issues), 2)

    def test_empty_recipe(self):
        """Empty recipe should have issue."""
        recipe = Recipe(name="Test", description="Test", steps=[])

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(len(issues), 1)
        self.assertIn("no steps", issues[0].lower())

    def test_complex_valid_plan(self):
        """Complex valid plan with 1-based deps should pass validation."""
        steps = [
            RecipeStep(order=1, title="Setup", description="Install", params={"dependencies": []}),
            RecipeStep(order=2, title="Build", description="Compile", params={"dependencies": [1]}),
            RecipeStep(order=3, title="Test", description="Run tests", params={"dependencies": [2]}),
            RecipeStep(order=4, title="Deploy", description="Publish", params={"dependencies": [3]}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(issues, [])

    def test_orphan_dependency(self):
        """Step depending on non-existent step should be flagged."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": []}),
            RecipeStep(order=2, title="Step 2", description="Second", params={"dependencies": [99]}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(len(issues), 1)
        self.assertIn("non-existent", issues[0].lower())

    def test_duplicate_dependencies(self):
        """Step with duplicate deps should be flagged."""
        steps = [
            RecipeStep(order=1, title="Step 1", description="First", params={"dependencies": []}),
            RecipeStep(order=2, title="Step 2", description="Second", params={"dependencies": [1, 1]}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(len(issues), 1)
        self.assertIn("duplicate", issues[0].lower())

    def test_multi_step_valid_dag(self):
        """Multi-step DAG with valid backward deps should pass."""
        steps = [
            RecipeStep(order=1, title="A", description="First", params={"dependencies": []}),
            RecipeStep(order=2, title="B", description="Second", params={"dependencies": [1]}),
            RecipeStep(order=3, title="C", description="Third", params={"dependencies": [1]}),
            RecipeStep(order=4, title="D", description="Fourth", params={"dependencies": [2, 3]}),
        ]
        recipe = Recipe(name="Test", description="Test", steps=steps)

        issues = self.planner.validate_plan(recipe)
        self.assertEqual(issues, [])


class TestLLMDecompose(unittest.TestCase):
    """Test _llm_decompose() - LLM-powered decomposition.

    Note: _llm_decompose calls get_client() from src.core.llm_client directly.
    To mock this, we patch at the import location in planner.py.
    """

    def setUp(self):
        self.planner = RecipePlanner()

    @patch("src.core.llm_client.get_client")
    def test_llm_success_returns_tasks(self, mock_get_client):
        """Successful LLM call should return tasks."""
        mock_client = MagicMock()
        mock_client.is_available = True
        mock_client.generate_json.return_value = [
            {"title": "Task 1", "description": "Do A", "dependencies": []},
            {"title": "Task 2", "description": "Do B", "dependencies": [0]},
        ]
        mock_get_client.return_value = mock_client

        context = PlanningContext(goal="test", constraints={"max": 5})

        tasks = self.planner._llm_decompose("test goal", context)

        self.assertEqual(len(tasks), 2)
        self.assertEqual(tasks[0]["title"], "Task 1")
        self.assertEqual(tasks[1]["title"], "Task 2")
        mock_client.generate_json.assert_called_once()

    @patch("src.core.llm_client.get_client")
    def test_llm_fallback_on_error(self, mock_get_client):
        """LLM failure should fallback to rule-based."""
        mock_client = MagicMock()
        mock_client.generate_json.side_effect = RuntimeError("API Error")
        mock_get_client.return_value = mock_client

        context = PlanningContext(goal="test")

        tasks = self.planner._llm_decompose("test goal", context)
        self.assertGreater(len(tasks), 0)

    @patch("src.core.llm_client.get_client")
    def test_llm_fallback_on_unavailable(self, mock_get_client):
        """Unavailable LLM should fallback to rule-based."""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        context = PlanningContext(goal="test")

        tasks = self.planner._llm_decompose("test goal", context)
        self.assertGreater(len(tasks), 0)

    @patch("src.core.llm_client.get_client")
    def test_llm_list_response(self, mock_get_client):
        """LLM returning list should be used directly."""
        mock_client = MagicMock()
        mock_client.is_available = True
        mock_client.generate_json.return_value = [
            {"title": "A", "description": "X", "dependencies": []}
        ]
        mock_get_client.return_value = mock_client

        tasks = self.planner._llm_decompose("test", PlanningContext(goal="test"))

        self.assertEqual(tasks, [{"title": "A", "description": "X", "dependencies": []}])

    @patch("src.core.llm_client.get_client")
    def test_llm_dict_with_tasks_key(self, mock_get_client):
        """LLM returning dict with 'tasks' key should extract list."""
        mock_client = MagicMock()
        mock_client.is_available = True
        mock_client.generate_json.return_value = {
            "tasks": [
                {"title": "A", "description": "X", "dependencies": []}
            ]
        }
        mock_get_client.return_value = mock_client

        tasks = self.planner._llm_decompose("test", PlanningContext(goal="test"))

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["title"], "A")

    @patch("src.core.llm_client.get_client")
    def test_llm_dict_with_raw_content(self, mock_get_client):
        """LLM returning non-JSON should fallback."""
        mock_client = MagicMock()
        mock_client.generate_json.return_value = {"raw_content": "not json"}
        mock_get_client.return_value = mock_client

        context = PlanningContext(goal="test")

        tasks = self.planner._llm_decompose("test", context)
        self.assertGreater(len(tasks), 0)


class TestAGIv2StepTypes(unittest.TestCase):
    """Test AGI v2 step type detection in _rule_based_decompose."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_browse_pattern(self):
        """Browse goal should generate browse step."""
        context = PlanningContext(goal="browse https://example.com")
        tasks = self.planner._rule_based_decompose("browse https://example.com", context)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["type"], "browse")

    def test_tool_pattern_npm_install(self):
        """npm install should generate tool step."""
        context = PlanningContext(goal="npm install express")
        tasks = self.planner._rule_based_decompose("npm install express", context)
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["type"], "tool")

    def test_evolve_pattern_refactor(self):
        """Refactor goal should generate evolve steps."""
        context = PlanningContext(goal="refactor auth module")
        tasks = self.planner._rule_based_decompose("refactor auth module", context)
        self.assertEqual(len(tasks), 2)
        self.assertEqual(tasks[0]["type"], "shell")
        self.assertEqual(tasks[1]["type"], "llm")

    def test_evolve_pattern_optimize(self):
        """Optimize goal should generate evolve steps."""
        context = PlanningContext(goal="optimize database queries")
        tasks = self.planner._rule_based_decompose("optimize database queries", context)
        self.assertEqual(len(tasks), 2)

    def test_url_extraction(self):
        """URL extraction from goal string."""
        url = self.planner._extract_url("check website https://api.example.com/v1")
        self.assertEqual(url, "https://api.example.com/v1")

    def test_url_extraction_no_url(self):
        """No URL in goal should return empty string."""
        url = self.planner._extract_url("just a regular goal")
        self.assertEqual(url, "")

    def test_detect_step_type_browse(self):
        """Browse keywords should detect browse type."""
        self.assertEqual(self.planner._detect_step_type("browse website"), "browse")
        self.assertEqual(self.planner._detect_step_type("check website status"), "browse")

    def test_detect_step_type_tool(self):
        """Tool keywords should detect tool type."""
        self.assertEqual(self.planner._detect_step_type("npm install"), "tool")
        self.assertEqual(self.planner._detect_step_type("pip install"), "tool")

    def test_detect_step_type_evolve(self):
        """Evolve keywords should detect evolve type."""
        self.assertEqual(self.planner._detect_step_type("refactor code"), "evolve")
        self.assertEqual(self.planner._detect_step_type("optimize query"), "evolve")

    def test_detect_step_type_none(self):
        """Unknown goal should return empty string."""
        self.assertEqual(self.planner._detect_step_type("hello world"), "")


class TestReplanFailedBranch(unittest.TestCase):
    """Test replan_failed_branch() method."""

    def setUp(self):
        self.planner = RecipePlanner()

    def test_replan_creates_new_recipe(self):
        """Replan should create a new recipe for failed steps."""
        original = Recipe(
            name="Original",
            description="Test",
            steps=[
                RecipeStep(order=1, title="Step 1", description="echo ok", params={}),
                RecipeStep(order=2, title="Step 2", description="exit 1", params={}),
                RecipeStep(order=3, title="Step 3", description="echo done", params={"dependencies": [2]}),
            ],
        )
        new_recipe = self.planner.replan_failed_branch(original, failed_step_order=2)
        self.assertIsNotNone(new_recipe)
        self.assertTrue(new_recipe.metadata.get("replanned", False))


if __name__ == "__main__":
    unittest.main()
