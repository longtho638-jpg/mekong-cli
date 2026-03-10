"""Mekong CLI - Recipe Registry.

Manages discovery and metadata of available recipes.
Also provides dynamic agent discovery from src/agents/ and plugins/.
"""

from __future__ import annotations

import importlib
import inspect
from dataclasses import dataclass
from pathlib import Path

from rich.console import Console

from .agent_base import AgentBase
from .parser import Recipe, RecipeParser


@dataclass
class RegistryIndex:
    """Index entry for a recipe."""

    name: str
    description: str
    path: Path
    author: str = "Unknown"
    version: str = "0.1.0"
    tags: list[str] | None = None

class RecipeRegistry:
    """Manages the collection of available recipes."""

    def __init__(self, recipes_dir: Path = Path("recipes")) -> None:
        self.recipes_dir = recipes_dir
        self.parser = RecipeParser()
        self.console = Console()

    def scan(self) -> list[RegistryIndex]:
        """Scan recipes directory and return index of all valid recipes."""
        if not self.recipes_dir.exists():
            return []

        index = []
        for recipe_file in self.recipes_dir.glob("*.md"):
            try:
                recipe = self.parser.parse(recipe_file)

                # Extract metadata safely
                meta = recipe.metadata

                # Prefer description from metadata, fallback to body description
                description = meta.get("description", recipe.description) or "No description provided"

                entry = RegistryIndex(
                    name=recipe.name,
                    description=description,
                    path=recipe_file,
                    author=meta.get("author", "Unknown"),
                    version=meta.get("version", "0.1.0"),
                    tags=meta.get("tags", "").split(",") if meta.get("tags") else [],
                )
                index.append(entry)
            except (ValueError, KeyError, OSError):
                # Skip invalid recipes silently
                continue

        return sorted(index, key=lambda x: x.name)

    def search(self, query: str) -> list[RegistryIndex]:
        """Search recipes by name, description or tags."""
        all_recipes = self.scan()
        query = query.lower()

        results = []
        for recipe in all_recipes:
            # Check name and description
            if query in recipe.name.lower() or query in recipe.description.lower():
                results.append(recipe)
                continue

            # Check tags
            if any(query in tag.lower().strip() for tag in (recipe.tags or [])):
                results.append(recipe)

        return results

    def get_recipe(self, name: str) -> Recipe | None:
        """Get full parsed recipe by name or filename."""
        # Try exact filename match first
        path = self.recipes_dir / name
        if path.exists():
            return self.parser.parse(path)

        path = self.recipes_dir / f"{name}.md"
        if path.exists():
            return self.parser.parse(path)

        # Search by internal name
        all_recipes = self.scan()
        for entry in all_recipes:
            if entry.name == name:
                return self.parser.parse(entry.path)

        return None


def _scan_directory_for_agents(
    directory: Path, package_prefix: str,
) -> dict[str, type[AgentBase]]:
    """Scan a directory for Python files containing AgentBase subclasses.

    Args:
        directory: Directory to scan
        package_prefix: Python import prefix (e.g. 'src.agents')

    Returns:
        Dict mapping agent name to class

    """
    agents: dict[str, type[AgentBase]] = {}

    if not directory.exists() or not directory.is_dir():
        return agents

    for py_file in directory.glob("*.py"):
        if py_file.name.startswith("_"):
            continue

        module_name = f"{package_prefix}.{py_file.stem}"
        try:
            module = importlib.import_module(module_name)
        except (ImportError, ModuleNotFoundError):
            continue

        for _, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, AgentBase) and obj is not AgentBase:
                # Derive short name: "GitAgent" -> "git", "LeadHunter" -> "leadhunter"
                cls_name = obj.__name__
                short = cls_name.replace("Agent", "").lower()
                agents[short] = obj

    return agents


def load_agents_dynamic() -> dict[str, type[AgentBase]]:
    """Dynamically discover agent classes from src/agents/ and plugins/.

    Returns:
        Dict mapping lowercase agent name to class

    """
    agents: dict[str, type[AgentBase]] = {}

    # Scan built-in agents
    builtin_dir = Path(__file__).resolve().parent.parent / "agents"
    agents.update(_scan_directory_for_agents(builtin_dir, "src.agents"))

    # Scan plugin agents (optional directory at project root)
    plugins_dir = Path("plugins")
    if plugins_dir.exists():
        # Ensure plugins is importable
        import sys

        plugins_abs = str(plugins_dir.resolve().parent)
        if plugins_abs not in sys.path:
            sys.path.insert(0, plugins_abs)
        agents.update(_scan_directory_for_agents(plugins_dir, "plugins"))

    return agents


def get_agent(name: str) -> type[AgentBase] | None:
    """Look up an agent class by short name.

    Args:
        name: Agent short name (e.g. 'git', 'file', 'shell')

    Returns:
        Agent class or None if not found

    """
    registry = load_agents_dynamic()
    return registry.get(name.lower())
