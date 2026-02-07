"""
Mekong CLI - Recipe Planner

Converts high-level goals into executable task lists using LLM.
Implements the PLAN phase of Plan-Execute-Verify pattern.
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

from .parser import Recipe, RecipeStep


class TaskComplexity(Enum):
    """Task complexity levels"""

    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


@dataclass
class PlanningContext:
    """Context for planning operations"""

    goal: str
    constraints: Dict[str, Any] = field(default_factory=dict)
    project_info: Dict[str, Any] = field(default_factory=dict)
    available_agents: List[str] = field(default_factory=list)
    complexity: TaskComplexity = TaskComplexity.MODERATE


@dataclass
class VerificationCriteria:
    """Success criteria for a recipe step"""

    exit_code: Optional[int] = 0
    file_exists: List[str] = field(default_factory=list)
    file_not_exists: List[str] = field(default_factory=list)
    output_contains: List[str] = field(default_factory=list)
    output_not_contains: List[str] = field(default_factory=list)
    custom_checks: List[str] = field(default_factory=list)


class RecipePlanner:
    """
    Converts high-level goals into executable recipes with verification criteria.

    This is the PLAN phase of the Plan-Execute-Verify pattern.
    """

    def __init__(self, llm_client: Optional[Any] = None):
        """
        Initialize planner.

        Args:
            llm_client: Optional LLM client for AI-powered planning
        """
        self.llm_client = llm_client

    def decompose_goal(
        self, goal: str, context: PlanningContext
    ) -> List[Dict[str, Any]]:
        """
        Decompose high-level goal into atomic tasks.

        Args:
            goal: User's high-level objective
            context: Planning context with constraints

        Returns:
            List of task dictionaries with title, description, dependencies
        """
        # If LLM client available, use AI decomposition
        if self.llm_client:
            return self._llm_decompose(goal, context)

        # Fallback: Rule-based decomposition
        return self._rule_based_decompose(goal, context)

    def _rule_based_decompose(
        self, goal: str, context: PlanningContext
    ) -> List[Dict[str, Any]]:
        """
        Rule-based task decomposition (fallback when no LLM).

        Args:
            goal: User's objective
            context: Planning context

        Returns:
            List of task dictionaries
        """
        tasks = []

        # Simple heuristic: check for common patterns
        goal_lower = goal.lower()

        # Pattern: "implement X" or "create X"
        if any(word in goal_lower for word in ["implement", "create", "build"]):
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
                ]
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
                ]
            )

        # Default: single task
        else:
            tasks.append(
                {"title": goal, "description": f"Execute: {goal}", "dependencies": []}
            )

        return tasks

    def _llm_decompose(
        self, goal: str, context: PlanningContext
    ) -> List[Dict[str, Any]]:
        """
        LLM-powered task decomposition.

        Args:
            goal: User's objective
            context: Planning context

        Returns:
            List of task dictionaries from LLM
        """
        from src.core.llm_client import get_client

        client = get_client()
        if not client.is_available:
            print("[PLANNER] LLM unavailable — using rule-based fallback")
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
                print("[PLANNER] LLM returned non-JSON — using rule-based fallback")
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
                        }
                    )

            return validated if validated else self._rule_based_decompose(goal, context)

        except Exception as e:
            print(f"[PLANNER] LLM decomposition failed: {e}")
            return self._rule_based_decompose(goal, context)

    def generate_verification_criteria(
        self, task: Dict[str, Any]
    ) -> VerificationCriteria:
        """
        Generate verification criteria for a task.

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

    def plan(self, goal: str, context: Optional[PlanningContext] = None) -> Recipe:
        """
        Create executable recipe from high-level goal.

        This is the main planning entry point.

        Args:
            goal: User's high-level objective
            context: Optional planning context

        Returns:
            Recipe with steps and verification criteria
        """
        if context is None:
            context = PlanningContext(goal=goal)

        # Step 1: Decompose goal into tasks
        tasks = self.decompose_goal(goal, context)

        # Step 2: Convert tasks to recipe steps with verification
        steps = []
        for idx, task in enumerate(tasks):
            step = RecipeStep(
                order=idx + 1,
                title=task["title"],
                description=task["description"],
                agent=task.get("agent"),
                params={
                    "dependencies": task.get("dependencies", []),
                    "verification": self.generate_verification_criteria(task).__dict__,
                },
            )
            steps.append(step)

        # Step 3: Create recipe
        recipe = Recipe(
            name=f"Plan: {goal}",
            description=f"Automated plan for: {goal}",
            steps=steps,
            metadata={
                "planned_by": "RecipePlanner",
                "complexity": context.complexity.value,
                "goal": goal,
            },
        )

        return recipe

    def validate_plan(self, recipe: Recipe) -> List[str]:
        """
        Validate recipe for common issues.

        Args:
            recipe: Recipe to validate

        Returns:
            List of validation warnings/errors
        """
        issues = []

        # Check for circular dependencies
        for step in recipe.steps:
            deps = step.params.get("dependencies", [])
            if step.order - 1 in deps:
                issues.append(f"Step {step.order} has circular dependency on itself")

            for dep in deps:
                if dep >= step.order - 1:
                    issues.append(f"Step {step.order} depends on future step {dep + 1}")

        # Check for empty steps
        if not recipe.steps:
            issues.append("Recipe has no steps")

        return issues


__all__ = [
    "RecipePlanner",
    "PlanningContext",
    "VerificationCriteria",
    "TaskComplexity",
]
