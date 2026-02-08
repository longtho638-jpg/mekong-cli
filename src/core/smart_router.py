"""
Mekong CLI - Smart Router

Memory-aware intent-to-recipe routing.
Maps NLU results to the best recipe or action.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

from .nlu import Intent, IntentResult
from .memory import MemoryStore


@dataclass
class RouteResult:
    """Result of smart routing."""

    action: str  # "recipe" | "direct" | "plan"
    recipe_path: str = ""
    recipe_name: str = ""
    reason: str = ""


# Default intent-to-recipe-tag mapping
_INTENT_TAGS: Dict[Intent, str] = {
    Intent.DEPLOY: "deploy",
    Intent.AUDIT: "audit",
    Intent.CREATE: "create",
    Intent.FIX: "fix",
    Intent.STATUS: "status",
    Intent.SCHEDULE: "schedule",
}


class SmartRouter:
    """Memory-aware intent-to-recipe router."""

    MIN_SUCCESS_RATE: float = 30.0

    def __init__(self, memory_store: Optional[MemoryStore] = None) -> None:
        """
        Initialize router.

        Args:
            memory_store: Optional MemoryStore for viability checks
        """
        self.memory = memory_store
        self._recipe_cache: Optional[Dict[str, str]] = None

    def route(self, intent_result: IntentResult) -> RouteResult:
        """
        Route an intent to the best recipe or action.

        Priority: exact recipe match > intent tag match > fallback to plan.

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
