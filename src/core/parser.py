"""Mekong CLI - Recipe Parser.

Reads Markdown recipe files and converts them to Task lists.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class RecipeStep:
    """Single step in a recipe."""

    order: int
    title: str
    description: str
    agent: str | None = None
    params: dict[str, Any] = field(default_factory=dict)
    dependencies: list[int] = field(default_factory=list)


@dataclass
class Recipe:
    """Parsed recipe from Markdown file."""

    name: str
    description: str
    steps: list[RecipeStep] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    display: str = ""

    @property
    def is_one_button(self) -> bool:
        """Check if this recipe should appear as a one-button action."""
        return self.display == "one-button"


class RecipeParser:
    """Parse Markdown recipe files into structured Recipe objects.

    Recipe format:
    ---
    name: Recipe Name
    agent: LeadHunter
    ---

    # Recipe Title

    Description here.

    ## Step 1: First Step

    Step description.

    ## Step 2: Second Step

    Another step.
    """

    def __init__(self) -> None:
        """Initialize RecipeParser with compiled regex patterns for headers and frontmatter."""
        self.header_pattern = re.compile(r"^##\s+Step\s+(\d+):\s*(.+)$", re.MULTILINE)
        self.frontmatter_pattern = re.compile(r"^---\n(.*?)\n---", re.DOTALL)

    def parse_frontmatter(self, content: str) -> dict[str, str]:
        """Extract YAML frontmatter."""
        match = self.frontmatter_pattern.match(content)
        if not match:
            return {}

        metadata = {}
        for line in match.group(1).strip().split("\n"):
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip()

        return metadata

    def parse_steps(self, content: str) -> list[RecipeStep]:
        """Extract steps from recipe content."""
        steps = []

        # Split by step headers
        parts = self.header_pattern.split(content)

        # parts[0] is content before first step
        # parts[1::3] are step numbers
        # parts[2::3] are step titles
        # parts[3::3] are step contents

        for i in range(1, len(parts), 3):
            if i + 2 < len(parts):
                order = int(parts[i])
                title = parts[i + 1].strip()
                description = parts[i + 2].strip()

                steps.append(RecipeStep(order=order, title=title, description=description))

        return steps

    def parse(self, filepath: Path) -> Recipe:
        """Parse a recipe file.

        Args:
            filepath: Path to the .md recipe file

        Returns:
            Parsed Recipe object

        """
        if not filepath.exists():
            msg = f"Recipe not found: {filepath}"
            raise FileNotFoundError(msg)

        content = filepath.read_text(encoding="utf-8")

        # Parse frontmatter
        metadata = self.parse_frontmatter(content)

        # Remove frontmatter from content
        clean_content = self.frontmatter_pattern.sub("", content).strip()

        # Get title from first H1
        title_match = re.search(r"^#\s+(.+)$", clean_content, re.MULTILINE)
        title = title_match.group(1) if title_match else filepath.stem

        # Get description (content between title and first step)
        # We use [^\n]+ for title to avoid matching newlines even if DOTALL was used (though we control flags)
        desc_match = re.search(
            r"^#\s+[^\n]+\n+(.*?)(?=^##|\Z)", clean_content, re.MULTILINE | re.DOTALL,
        )
        description = desc_match.group(1).strip() if desc_match else ""

        # Parse steps
        steps = self.parse_steps(clean_content)

        return Recipe(
            name=metadata.get("name", title),
            description=description,
            steps=steps,
            metadata=metadata,
            display=metadata.get("display", ""),
        )

    def parse_string(self, content: str, name: str = "inline") -> Recipe:
        """Parse recipe from string content."""
        metadata = self.parse_frontmatter(content)
        clean_content = self.frontmatter_pattern.sub("", content).strip()
        steps = self.parse_steps(clean_content)

        return Recipe(
            name=metadata.get("name", name),
            description="",
            steps=steps,
            metadata=metadata,
            display=metadata.get("display", ""),
        )


# Export
__all__ = ["Recipe", "RecipeParser", "RecipeStep"]
