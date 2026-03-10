"""
Mekong CLI - Smart Router (AGI v2)

Memory-aware intent-to-recipe routing.
Maps NLU results to the best recipe, tool, browse action, or plan.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from .nlu import Intent, IntentResult
from .memory import MemoryStore


@dataclass
class RouteResult:
    """Result of smart routing."""

    action: str  # "recipe" | "direct" | "plan" | "tool" | "browse" | "evolve"
    recipe_path: str = ""
    recipe_name: str = ""
    tool_name: str = ""
    url: str = ""
    reason: str = ""


# Intent-to-recipe-tag mapping (AGI v2: includes all 10 intents)
_INTENT_TAGS: Dict[Intent, str] = {
    Intent.DEPLOY: "deploy",
    Intent.AUDIT: "audit",
    Intent.CREATE: "create",
    Intent.FIX: "fix",
    Intent.STATUS: "status",
    Intent.SCHEDULE: "schedule",
    Intent.REFACTOR: "refactor",
    Intent.OPTIMIZE: "optimize",
    Intent.MIGRATE: "migrate",
    Intent.REPORT: "report",
}

# Intent-to-tool mapping: some intents map directly to ToolRegistry tools
_INTENT_TOOLS: Dict[Intent, str] = {
    Intent.STATUS: "git:status",
    Intent.AUDIT: "git:diff",
}

# Intents that benefit from code evolution analysis
_EVOLVE_INTENTS = {Intent.REFACTOR, Intent.OPTIMIZE}


class SmartRouter:
    """Memory-aware intent-to-recipe router with AGI v2 tool/browse awareness."""

    MIN_SUCCESS_RATE: float = 30.0

    def __init__(self, memory_store: Optional[MemoryStore] = None) -> None:
        """
        Initialize router.

        Args:
            memory_store: Optional MemoryStore for viability checks
        """
        self.memory = memory_store
        self._recipe_cache: Optional[Dict[str, str]] = None
        self._tool_registry: Optional[Any] = None
        self._browser_agent: Optional[Any] = None

        # AGI v2: Lazy-load tool registry
        try:
            from .tool_registry import ToolRegistry
            self._tool_registry = ToolRegistry()
        except Exception:
            pass

    def route(self, intent_result: IntentResult) -> RouteResult:
        """
        Route an intent to the best recipe, tool, or action.

        Priority:
        1. Exact recipe match
        2. Intent tag match
        3. AGI v2: Tool match for status/audit intents
        4. AGI v2: Evolve route for refactor/optimize intents
        5. Fallback to plan

        Args:
            intent_result: Classified intent from NLU

        Returns:
            RouteResult with action and recipe details
        """
        if intent_result.intent == Intent.UNKNOWN:
            return RouteResult(action="plan", reason="Unknown intent")

        # Try suggested recipe first
        if intent_result.suggested_recipe:
            path = self._find_recipe_by_name(intent_result.suggested_recipe)
            if path and self._check_memory(intent_result.suggested_recipe):
                return RouteResult(
                    action="recipe",
                    recipe_path=path,
                    recipe_name=intent_result.suggested_recipe,
                    reason="Suggested recipe match",
                )

        # Try intent-based recipe tag match
        tag = _INTENT_TAGS.get(intent_result.intent, "")
        if tag:
            recipes = self._scan_recipes()
            for name, path in recipes.items():
                if tag in name.lower():
                    if self._check_memory(name):
                        return RouteResult(
                            action="recipe",
                            recipe_path=path,
                            recipe_name=name,
                            reason=f"Intent tag match: {tag}",
                        )

        # AGI v2: Route to ToolRegistry for tool-mapped intents
        tool_name = _INTENT_TOOLS.get(intent_result.intent, "")
        if tool_name and self._tool_registry:
            try:
                tools = self._tool_registry.list_tools()
                if any(t.name == tool_name for t in tools):
                    return RouteResult(
                        action="tool",
                        tool_name=tool_name,
                        reason=f"Intent tool match: {tool_name}",
                    )
            except Exception:
                pass

        # AGI v2: Route to evolve-code for refactor/optimize intents
        if intent_result.intent in _EVOLVE_INTENTS:
            return RouteResult(
                action="evolve",
                reason=f"Code evolution route for {intent_result.intent.value}",
            )

        # AGI v2: Smart tool suggestion from goal text
        if self._tool_registry:
            try:
                suggested = self._tool_registry.suggest_tool(intent_result.raw_goal)
                if suggested:
                    return RouteResult(
                        action="tool",
                        tool_name=suggested.name,
                        reason=f"Tool suggestion: {suggested.name}",
                    )
            except Exception:
                pass

        return RouteResult(action="plan", reason="No viable recipe found")

    def _find_recipe_by_name(self, name: str) -> Optional[str]:
        """Find recipe file path by name."""
        recipes = self._scan_recipes()
        # Exact match
        if name in recipes:
            return recipes[name]
        # Partial match
        name_lower = name.lower()
        for rname, rpath in recipes.items():
            if name_lower in rname.lower():
                return rpath
        return None

    def _check_memory(self, recipe_name: str) -> bool:
        """Check if recipe is viable based on memory success rate."""
        if not self.memory:
            return True
        entries = [e for e in self.memory._entries if e.recipe_used == recipe_name]
        if len(entries) < 3:
            return True  # Not enough data
        recent = entries[-10:]
        successes = sum(1 for e in recent if e.status == "success")
        rate = (successes / len(recent)) * 100
        return rate >= self.MIN_SUCCESS_RATE

    def _scan_recipes(self) -> Dict[str, str]:
        """Scan recipes/ directory for .md files. Returns {name: path}."""
        if self._recipe_cache is not None:
            return self._recipe_cache
        recipes: Dict[str, str] = {}
        recipe_dir = Path("recipes")
        if recipe_dir.is_dir():
            for f in recipe_dir.glob("*.md"):
                recipes[f.stem] = str(f)
        self._recipe_cache = recipes
        return recipes


__all__ = [
    "RouteResult",
    "SmartRouter",
]

