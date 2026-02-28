"""
Mekong CLI - Recipe Generator

Generates recipes from successful execution history and goal patterns.
Auto-generated recipes saved to recipes/auto/.
"""

import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .event_bus import EventType, get_event_bus
from .memory import MemoryEntry


RECIPE_TEMPLATE = """# {name}
> {description}

## Steps

{steps}

## Metadata
- Generated: {timestamp}
- Source: {source}
- Tags: auto-generated
"""


@dataclass
class GeneratedRecipe:
    """A generated recipe with metadata."""

    name: str
    content: str
    source: str = ""  # "successful_run" | "goal_pattern" | "llm"
    valid: bool = False


class RecipeGenerator:
    """Generates recipes from execution history and goal patterns."""

    AUTO_DIR: str = "recipes/auto"

    def __init__(self, llm_client: Optional[Any] = None) -> None:
        """
        Initialize generator.

        Args:
            llm_client: Optional LLM client for advanced recipe generation
        """
        self.llm_client = llm_client

    def from_successful_run(self, entry: MemoryEntry) -> GeneratedRecipe:
        """Generate a recipe from a successful memory entry."""
        name = self._slugify(entry.goal)
        steps = f"### Step 1: Execute\n{entry.goal}"
        if entry.recipe_used:
            steps = f"### Step 1: Run recipe\n{entry.recipe_used}"

        content = RECIPE_TEMPLATE.format(
            name=entry.goal.title(),
            description=f"Auto-generated from successful run of: {entry.goal}",
            steps=steps,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            source="successful_run",
        )

        valid, _ = self.validate_recipe(content)
        return GeneratedRecipe(
            name=name, content=content, source="successful_run", valid=valid,
        )

    def from_goal_pattern(
        self, goal: str, steps: Optional[List[str]] = None,
    ) -> GeneratedRecipe:
        """Generate a recipe from a goal pattern with optional steps."""
        name = self._slugify(goal)

        if steps:
            step_text = "\n\n".join(
                f"### Step {i+1}: {s}" for i, s in enumerate(steps)
            )
        elif self.llm_client and hasattr(self.llm_client, "generate"):
            step_text = self._generate_via_llm(goal)
        else:
            step_text = f"### Step 1: Execute\n{goal}"

        content = RECIPE_TEMPLATE.format(
            name=goal.title(),
            description=f"Auto-generated recipe for: {goal}",
            steps=step_text,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            source="goal_pattern" if steps else "llm",
        )

        valid, _ = self.validate_recipe(content)
        source = "goal_pattern" if steps else ("llm" if self.llm_client else "goal_pattern")
        return GeneratedRecipe(
            name=name, content=content, source=source, valid=valid,
        )

    def validate_recipe(self, recipe_md: str) -> Tuple[bool, List[str]]:
        """Validate recipe markdown by attempting to parse it."""
        errors: List[str] = []
        try:
            from .parser import RecipeParser
            parser = RecipeParser()
            recipe = parser.parse_string(recipe_md, name="validation")
            if not recipe.steps:
                errors.append("No steps found in recipe")
            if not recipe.name:
                errors.append("Missing recipe name")
        except Exception as e:
            errors.append(f"Parse error: {e}")

        return (len(errors) == 0, errors)

    def save_recipe(self, recipe: GeneratedRecipe) -> str:
        """Save recipe to recipes/auto/ and emit event."""
        auto_dir = Path(self.AUTO_DIR)
        auto_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{recipe.name}.md"
        path = auto_dir / filename
        path.write_text(recipe.content)

        bus = get_event_bus()
        if bus:
            bus.emit(EventType.RECIPE_GENERATED, {
                "name": recipe.name,
                "path": str(path),
                "source": recipe.source,
            })

        return str(path)

    def list_auto_recipes(self) -> List[Dict[str, str]]:
        """List all auto-generated recipes."""
        auto_dir = Path(self.AUTO_DIR)
        if not auto_dir.is_dir():
            return []

        recipes: List[Dict[str, str]] = []
        for f in sorted(auto_dir.glob("*.md")):
            recipes.append({"name": f.stem, "path": str(f)})
        return recipes

    def _slugify(self, name: str) -> str:
        """Convert name to URL-safe slug."""
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_]+", "-", slug)
        slug = re.sub(r"-+", "-", slug)
        return slug.strip("-")[:60]

    def _generate_via_llm(self, goal: str) -> str:
        """Use LLM to generate recipe steps."""
        prompt = (
            f"Generate a recipe with numbered steps for this goal: \"{goal}\"\n"
            f"Format each step as: ### Step N: Title\nDescription\n"
            f"Keep it to 2-4 steps. Reply with ONLY the steps."
        )
        try:
            response = self.llm_client.generate(prompt).strip()
            return response if response else f"### Step 1: Execute\n{goal}"
        except Exception:
            return f"### Step 1: Execute\n{goal}"


__all__ = [
    "RecipeGenerator",
    "GeneratedRecipe",
    "RECIPE_TEMPLATE",
]
