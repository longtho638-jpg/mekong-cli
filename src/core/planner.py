"""Mekong CLI - Recipe Planner.

Converts high-level goals into executable task lists using LLM.
Implements the PLAN phase of Plan-Execute-Verify pattern.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, Optional

if TYPE_CHECKING:
    from .llm_client import LLMClient

from .parser import Recipe, RecipeStep

logger = logging.getLogger(__name__)


class TaskComplexity(Enum):
    """Task complexity levels."""

    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


@dataclass
class PlanningContext:
    """Context for planning operations."""

    goal: str
    constraints: dict[str, Any] = field(default_factory=dict)
    project_info: dict[str, Any] = field(default_factory=dict)
    available_agents: list[str] = field(default_factory=list)
    complexity: TaskComplexity = TaskComplexity.MODERATE
    max_decomposition_depth: int = 2


@dataclass
class VerificationCriteria:
    """Success criteria for a recipe step."""

    exit_code: int | None = 0
    file_exists: list[str] = field(default_factory=list)
    file_not_exists: list[str] = field(default_factory=list)
    output_contains: list[str] = field(default_factory=list)
    output_not_contains: list[str] = field(default_factory=list)
    custom_checks: list[str] = field(default_factory=list)


class RecipePlanner:
    """Converts high-level goals into executable recipes with verification criteria.

    This is the PLAN phase of the Plan-Execute-Verify pattern.
    """

    # Keyword → agent mapping for smart routing
    AGENT_KEYWORDS: dict[str, list[str]] = {
        "git": ["git", "commit", "branch", "merge", "rebase", "diff", "log", "push", "pull", "clone", "stash"],
        "file": ["file", "read", "write", "copy", "move", "delete", "rename", "directory", "folder", "tree"],
        "shell": ["run", "execute", "script", "command", "install", "build", "compile"],
        "lead": ["lead", "prospect", "ceo", "email", "company", "hunt", "outreach"],
        "content": ["content", "article", "blog", "seo", "write", "copywriting"],
        "crawler": ["crawl", "scrape", "recipe", "discover"],
        # AGI v2: Tool and Browse agents
        "tool": ["tool", "registry", "suggest", "discover tool"],
        "browse": ["browse", "url", "http", "website", "page", "link", "web"],
        "evolve": ["refactor", "optimize", "improve", "clean", "evolve"],
    }

    # AGI v2: URL patterns for auto-detecting browse steps
    _URL_PREFIXES = ("http://", "https://", "www.")

    # AGI v2: Tool keyword → tool name mapping
    _TOOL_KEYWORDS: Dict[str, str] = {
        "git status": "git:status",
        "git diff": "git:diff",
        "git log": "git:log",
        "npm install": "npm:install",
        "npm test": "npm:test",
        "pip install": "pip:install",
        "docker build": "docker:build",
    }

    def __init__(self, llm_client: Optional["LLMClient"] = None) -> None:
        """Initialize planner.

        Args:
            llm_client: Optional LLM client for AI-powered planning

        """
        self.llm_client = llm_client

    def suggest_agent(self, goal: str) -> str | None:
        """Suggest the best agent for a goal based on keyword matching.

        Args:
            goal: User's high-level objective

        Returns:
            Agent name from AGENT_REGISTRY or None

        """
        goal_lower = goal.lower()
        scores: dict[str, int] = {}

        for agent_name, keywords in self.AGENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in goal_lower)
            if score > 0:
                scores[agent_name] = score

        if not scores:
            return None

        return max(scores, key=lambda k: scores[k])

    def _detect_step_type(self, goal: str) -> str:
        """AGI v2: Detect the best step type for a goal."""
        goal_lower = goal.lower()

        # URL detected → browse step
        if any(goal_lower.startswith(p) or f" {p}" in goal_lower for p in self._URL_PREFIXES):
            return "browse"

        # Known tool keyword → tool step
        for kw in self._TOOL_KEYWORDS:
            if kw in goal_lower:
                return "tool"

        # Refactor/optimize → evolve
        if any(w in goal_lower for w in ["refactor", "optimize", "improve code", "clean code"]):
            return "evolve"

        # Browse keywords
        if any(w in goal_lower for w in ["browse", "check website", "analyze page", "crawl", "scrape"]):
            return "browse"

        return ""  # No special type detected

    def _get_tool_name(self, goal: str) -> str:
        """AGI v2: Map a goal to a ToolRegistry tool name."""
        goal_lower = goal.lower()
        for kw, tool_name in self._TOOL_KEYWORDS.items():
            if kw in goal_lower:
                return tool_name
        return ""

    def _extract_url(self, goal: str) -> str:
        """AGI v2: Extract URL from a goal string."""
        import re as _re
        match = _re.search(r'https?://\S+|www\.\S+', goal)
        return match.group(0) if match else ""

    # Compound patterns that signal a task is complex
    _COMPOUND_PATTERNS = (
        " and then ", " after that ", " followed by ",
        " then ", " afterwards ", " subsequently ",
    )

    def _is_complex_task(self, task: dict[str, Any]) -> bool:
        """Determine if a task warrants further decomposition.

        A task is considered complex if any of these heuristics match:
        - Description contains compound connectors (and then / followed by / etc.)
        - Description length exceeds 100 characters
        - Task is explicitly marked complexity=complex

        Args:
            task: Task dictionary with at least a 'description' key.

        Returns:
            True if the task should be recursively decomposed.

        """
        # Explicit marker takes precedence
        if task.get("complexity") == "complex":
            return True

        description = task.get("description", "")

        # Length heuristic
        if len(description) > 100:
            return True

        # Compound-action heuristic (case-insensitive)
        desc_lower = description.lower()
        if any(pattern in desc_lower for pattern in self._COMPOUND_PATTERNS):
            return True

        return False

    def _recursive_decompose(
        self,
        goal: str,
        context: PlanningContext,
        depth: int = 0,
        max_depth: int = 2,
        parent_goal: str = "",
    ) -> list[dict[str, Any]]:
        """Recursively decompose a goal, expanding complex sub-tasks.

        Calls the base decomposition logic, then for each resulting task
        that is deemed complex (and depth < max_depth), replaces it with
        its own sub-decomposition.  Dependencies are adjusted so that the
        flat output preserves the correct ordering.

        Args:
            goal: Goal string to decompose.
            context: Planning context.
            depth: Current recursion depth (0 = top-level call).
            max_depth: Maximum allowed depth (default 2 per KISS).
            parent_goal: Parent goal string for traceability metadata.

        Returns:
            Flat list of task dicts with correct dependencies.

        """
        # Base decomposition (LLM or rule-based)
        if self.llm_client:
            base_tasks = self._llm_decompose(goal, context)
        else:
            base_tasks = self._rule_based_decompose(goal, context)

        # Tag every task with its parent goal
        for task in base_tasks:
            task["parent_goal"] = parent_goal or goal

        # If we've hit the depth limit, return as-is
        if depth >= max_depth:
            return base_tasks

        # Expand complex tasks
        result: list[dict[str, Any]] = []
        # index_offset tracks how many extra tasks we've inserted so far,
        # so we can shift dependency indices of later tasks.
        index_offset = 0

        for task in base_tasks:
            # Adjust this task's own dependencies for previously inserted tasks
            adjusted_deps = [d + index_offset for d in task.get("dependencies", [])]
            task = dict(task)  # shallow copy to avoid mutating original
            task["dependencies"] = adjusted_deps

            if not self._is_complex_task(task):
                result.append(task)
            else:
                # Recursively decompose
                sub_tasks = self._recursive_decompose(
                    goal=task.get("description", task.get("title", "")),
                    context=context,
                    depth=depth + 1,
                    max_depth=max_depth,
                    parent_goal=goal,
                )

                # The sub-tasks slot into position orig_idx + index_offset.
                # Their internal 0-based dependencies need to be shifted by
                # the current result length.
                insertion_base = len(result)
                expanded_tasks = []
                for sub_task in sub_tasks:
                    sub_copy = dict(sub_task)
                    sub_copy["dependencies"] = [
                        d + insertion_base for d in sub_task.get("dependencies", [])
                    ]
                    expanded_tasks.append(sub_copy)

                # Tasks that originally depended on orig_idx should now depend on
                # the *last* sub-task (which represents completion of this expansion).
                result.extend(expanded_tasks)

                # Every subsequent task that pointed to orig_idx must now point to
                # the last sub-task index.  We handle this by keeping the offset
                # increment as (len(sub_tasks) - 1) extra slots.
                index_offset += len(sub_tasks) - 1

        return result

    def decompose_goal(
        self, goal: str, context: PlanningContext,
    ) -> list[dict[str, Any]]:
        """Decompose high-level goal into atomic tasks.

        Uses recursive multi-step reasoning: the base decomposition is
        applied, then any task identified as complex is itself decomposed
        up to context.max_decomposition_depth levels deep.

        Args:
            goal: User's high-level objective
            context: Planning context with constraints

        Returns:
            List of task dictionaries with title, description, dependencies

        """
        return self._recursive_decompose(
            goal=goal,
            context=context,
            depth=0,
            max_depth=context.max_decomposition_depth,
        )

    def _rule_based_decompose(
        self, goal: str, context: PlanningContext,
    ) -> list[dict[str, Any]]:
        """Rule-based task decomposition (fallback when no LLM).

        Args:
            goal: User's objective
            context: Planning context

        Returns:
            List of task dictionaries

        """
        tasks: list[dict[str, Any]] = []
        suggested_agent = self.suggest_agent(goal)

        # Simple heuristic: check for common patterns
        goal_lower = goal.lower()

        # AGI v2: Detect special step type first
        detected_type = self._detect_step_type(goal)

        # AGI v2: URL/browse pattern → generate browse step
        if detected_type == "browse":
            url = self._extract_url(goal)
            tasks.append({
                "title": goal,
                "description": f"Browse and analyze: {url or goal}",
                "dependencies": [],
                "type": "browse",
                "url": url or "https://example.com",
                "action": "analyze" if "analyze" in goal_lower else "check",
            })

        # AGI v2: Tool pattern → generate tool step
        elif detected_type == "tool":
            tool_name = self._get_tool_name(goal)
            tasks.append({
                "title": goal,
                "description": f"Execute tool: {tool_name}",
                "dependencies": [],
                "type": "tool",
                "tool_name": tool_name,
                "tool_args": {},
            })

        # AGI v2: Evolve pattern → generate evolve step (shell with evolve command)
        elif detected_type == "evolve":
            tasks.extend([
                {
                    "title": f"Analyze: {goal}",
                    "description": "Scan source code for improvement opportunities",
                    "dependencies": [],
                    "type": "shell",
                },
                {
                    "title": f"Apply: {goal}",
                    "description": goal,
                    "dependencies": [0],
                    "type": "llm",
                },
            ])

        # Pattern: "implement X" or "create X"
        elif any(word in goal_lower for word in ["implement", "create", "build"]):
            tasks.extend(
                [
                    {
                        "title": "Setup environment",
                        "description": "Prepare project structure and dependencies",
                        "dependencies": [],
                    },
                    {
                        "title": "Implement core logic",
                        "description": f"Implement {goal}",
                        "dependencies": [0],
                    },
                    {
                        "title": "Write tests",
                        "description": "Create test cases",
                        "dependencies": [1],
                    },
                    {
                        "title": "Verify implementation",
                        "description": "Run tests and validate",
                        "dependencies": [2],
                    },
                ],
            )

        # Pattern: "fix X" or "debug X"
        elif any(word in goal_lower for word in ["fix", "debug", "resolve"]):
            tasks.extend(
                [
                    {
                        "title": "Identify issue",
                        "description": f"Analyze and locate problem: {goal}",
                        "dependencies": [],
                    },
                    {
                        "title": "Apply fix",
                        "description": "Implement solution",
                        "dependencies": [0],
                    },
                    {
                        "title": "Verify fix",
                        "description": "Test that issue is resolved",
                        "dependencies": [1],
                    },
                ],
            )

        # Pattern: shell commands (user typed something like "find ...", "ls ...", "git ...")
        elif any(
            goal_lower.startswith(cmd)
            for cmd in [
                "find ",
                "ls ",
                "git ",
                "cat ",
                "grep ",
                "mkdir ",
                "rm ",
                "cp ",
                "mv ",
                "echo ",
                "pip ",
                "npm ",
                "python",
                "node ",
                "cd ",
                "curl ",
                "wget ",
                "docker ",
                "make ",
                "brew ",
            ]
        ):
            # Smart normalization for common misformats
            import re as _re

            shell_cmd = goal
            # "git log 5" → "git log -n 5"
            git_log_match = _re.match(r"git\s+log\s+(\d+)$", goal, _re.IGNORECASE)
            if git_log_match:
                shell_cmd = f"git log --oneline -n {git_log_match.group(1)}"
            # "git diff" is fine as-is
            # "git status" is fine as-is

            tasks.append(
                {
                    "title": goal,
                    "description": shell_cmd,
                    "dependencies": [],
                    "type": "shell",
                },
            )

        # Pattern: list/show/search → map to shell find/grep
        elif any(word in goal_lower for word in ["list", "show", "search", "find"]):
            # Smart mapping: generate actual shell command
            if "python" in goal_lower or ".py" in goal_lower:
                cmd = "find src/ -name '*.py' -not -path '*/__pycache__/*' | sort"
            elif "file" in goal_lower:
                cmd = "find . -maxdepth 3 -not -path '*/node_modules/*' -not -path '*/.git/*' | head -50"
            else:
                cmd = "find . -maxdepth 2 -not -path '*/.git/*' | sort | head -30"
            tasks.append(
                {"title": goal, "description": cmd, "dependencies": [], "type": "shell"},
            )

        # Default: delegate to LLM if available, else echo the goal
        else:
            tasks.append(
                {"title": goal, "description": goal, "dependencies": [], "type": "llm"},
            )

        # Attach suggested agent to all tasks that don't already have one
        if suggested_agent:
            for task in tasks:
                task_dict: dict[str, Any] = task
                if "agent" not in task_dict:
                    task_dict["agent"] = suggested_agent

        return tasks

    def _llm_decompose(
        self, goal: str, context: PlanningContext,
    ) -> list[dict[str, Any]]:
        """LLM-powered task decomposition.

        Args:
            goal: User's objective
            context: Planning context

        Returns:
            List of task dictionaries from LLM

        """
        from src.core.llm_client import get_client

        client = get_client()
        if not client.is_available:
            logger.warning("[PLANNER] LLM unavailable — using rule-based fallback")
            return self._rule_based_decompose(goal, context)

        prompt = f"""Decompose this goal into atomic, executable tasks.

Goal: {goal}

Context:
- Complexity: {context.complexity.value}
- Constraints: {context.constraints}

Return ONLY a JSON array with tasks. Each task must have:
- title: Brief task name
- description: Detailed task description with the exact command or action
- dependencies: Array of task indices this depends on (empty array if none)

Example: [{{"title": "Setup", "description": "npm install", "dependencies": []}}]"""

        try:
            result = client.generate_json(prompt)

            # Handle different response shapes
            if isinstance(result, list):
                tasks = result
            elif isinstance(result, dict) and "tasks" in result:
                tasks = result["tasks"]
            elif isinstance(result, dict) and "raw_content" in result:
                logger.warning("[PLANNER] LLM returned non-JSON — using rule-based fallback")
                return self._rule_based_decompose(goal, context)
            else:
                tasks = [result]

            # Validate tasks
            validated = []
            for task in tasks:
                if isinstance(task, dict) and "title" in task:
                    validated.append(
                        {
                            "title": task.get("title", "Untitled"),
                            "description": task.get("description", ""),
                            "dependencies": task.get("dependencies", []),
                        },
                    )

            return validated if validated else self._rule_based_decompose(goal, context)

        except Exception as e:
            logger.exception("[PLANNER] LLM decomposition failed: %s", e)
            return self._rule_based_decompose(goal, context)

    def generate_verification_criteria(
        self, task: dict[str, Any],
    ) -> VerificationCriteria:
        """Generate verification criteria for a task.

        Args:
            task: Task dictionary with title and description

        Returns:
            VerificationCriteria object

        """
        criteria = VerificationCriteria()

        # Heuristic-based criteria generation
        description_lower = task.get("description", "").lower()

        # File creation tasks
        if "create" in description_lower or "generate" in description_lower:
            # Try to extract filename (basic pattern matching)
            words = task.get("description", "").split()
            for word in words:
                if "." in word:  # Likely a filename
                    criteria.file_exists.append(word)

        # Test tasks
        if "test" in description_lower:
            criteria.exit_code = 0
            criteria.output_contains.append("pass")
            criteria.output_not_contains.extend(["error", "failed"])

        # Build tasks
        if "build" in description_lower or "compile" in description_lower:
            criteria.exit_code = 0
            criteria.output_not_contains.extend(["error:", "failed"])

        return criteria

    def plan(self, goal: str, context: PlanningContext | None = None) -> Recipe:
        """Create executable recipe from high-level goal (AGI v2).

        Produces a DAG-aware recipe. Steps include dependency metadata
        enabling the DAGScheduler to run independent steps concurrently.

        Args:
            goal: User's high-level objective
            context: Optional planning context

        Returns:
            Recipe with steps, verification criteria, and DAG metadata


        """
        if context is None:
            context = PlanningContext(goal=goal)

        # Step 1: Decompose goal into tasks (now with dependency graph)
        tasks = self.decompose_goal(goal, context)

        # Step 2: Convert tasks to recipe steps with verification
        steps = []
        has_deps = False
        for idx, task in enumerate(tasks):
            deps = task.get("dependencies", [])
            # Map dependency indices (0-based) to step orders (1-based)
            step_deps = [d + 1 for d in deps if isinstance(d, int)]
            if step_deps:
                has_deps = True

            step = RecipeStep(
                order=idx + 1,
                title=task["title"],
                description=task["description"],
                agent=task.get("agent"),
                params={
                    "type": task.get("type", "shell"),
                    "dependencies": step_deps,
                    "verification": self.generate_verification_criteria(task).__dict__,
                },
            )
            # Attach dependencies as attribute for DAGScheduler
            step.dependencies = step_deps
            steps.append(step)

        # Step 3: Validate DAG (no circular deps)
        if has_deps:
            from .dag_scheduler import validate_dag

            dag_error = validate_dag(steps)
            if dag_error:
                logger.warning("[PLANNER] %s — falling back to sequential", dag_error)
                for step in steps:
                    step.dependencies = []
                    step.params["dependencies"] = []
                has_deps = False

        # Step 4: Create recipe
        recipe = Recipe(
            name=f"Plan: {goal}",
            description=f"Automated plan for: {goal}",
            steps=steps,
            metadata={
                "planned_by": "RecipePlanner",
                "complexity": context.complexity.value,
                "goal": goal,
                "dag_enabled": has_deps,
            },
        )
        return recipe

    def replan_failed_branch(
        self,
        recipe: Recipe,
        failed_step_order: int,
        error_context: str = "",
    ) -> Recipe:
        """
        Re-plan only the failed branch of a DAG.

        Instead of re-planning the entire recipe, re-decomposes only the
        failed step and its downstream dependents.

        Args:
            recipe: Original recipe.
            failed_step_order: Order of the step that failed.
            error_context: Error message or context from the failure.

        Returns:
            New recipe with the failed branch re-planned.
        """
        # Identify downstream steps that depend on the failed step
        failed_and_downstream = {failed_step_order}
        changed = True
        while changed:
            changed = False
            for step in recipe.steps:
                deps = step.params.get("dependencies", [])
                if step.order not in failed_and_downstream:
                    if any(d in failed_and_downstream for d in deps):
                        failed_and_downstream.add(step.order)
                        changed = True

        # Find the failed step
        failed_step = next(
            (s for s in recipe.steps if s.order == failed_step_order), None,
        )
        if not failed_step:
            return recipe

        # Re-decompose the failed step's goal
        goal = failed_step.description
        if error_context:
            goal = (
                f"{goal} (previous attempt failed: {error_context}. "
                f"Try a different approach.)"
            )

        context = PlanningContext(
            goal=goal,
            constraints={"retry": True, "previous_error": error_context},
        )
        new_tasks = self.decompose_goal(goal, context)

        # Build new step list: keep successful steps, replace failed branch
        kept_steps = [
            s for s in recipe.steps
            if s.order not in failed_and_downstream
        ]

        next_order = max((s.order for s in kept_steps), default=0) + 1
        for idx, task in enumerate(new_tasks):
            step = RecipeStep(
                order=next_order + idx,
                title=task["title"],
                description=task["description"],
                agent=task.get("agent"),
                params={
                    "type": task.get("type", "shell"),
                    "dependencies": [
                        next_order + d for d in task.get("dependencies", [])
                        if isinstance(d, int)
                    ],
                    "verification": self.generate_verification_criteria(
                        task,
                    ).__dict__,
                },
            )
            step.dependencies = step.params["dependencies"]
            kept_steps.append(step)

        recipe.steps = sorted(kept_steps, key=lambda s: s.order)
        recipe.metadata["replanned"] = True
        recipe.metadata["replanned_step"] = failed_step_order

        return recipe

    def validate_plan(self, recipe: Recipe) -> list[str]:
        """Validate recipe for common issues.

        Deps in params use 1-based ordering (matching step.order values),
        as produced by plan(). Self-reference: dep == step.order. Future dep:
        dep >= step.order (dep must be strictly less than step.order).

        Args:
            recipe: Recipe to validate

        Returns:
            List of validation warnings/errors

        """
        issues = []
        valid_orders = {s.order for s in recipe.steps}

        for step in recipe.steps:
            deps = step.params.get("dependencies", [])

            # Self-reference check (1-based)
            if step.order in deps:
                issues.append(f"Step {step.order} depends on itself")

            # Non-existent dependency
            non_existent = set()
            for dep in deps:
                if dep not in valid_orders:
                    non_existent.add(dep)
                    issues.append(f"Step {step.order} depends on non-existent step {dep}")

            # Future dependency: dep order must be strictly less than step order
            # Skip deps already flagged as non-existent to avoid double-reporting
            for dep in deps:
                if dep not in non_existent and dep >= step.order:
                    issues.append(f"Step {step.order} depends on future/same step {dep}")

            # Duplicate dependencies
            if len(deps) != len(set(deps)):
                issues.append(f"Step {step.order} has duplicate dependencies")

        # Check for empty steps
        if not recipe.steps:
            issues.append("Recipe has no steps")

        return issues


__all__ = [
    "PlanningContext",
    "RecipePlanner",
    "TaskComplexity",
    "VerificationCriteria",
]
