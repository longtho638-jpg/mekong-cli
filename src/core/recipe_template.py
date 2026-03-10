"""Mekong CLI - Recipe Template Engine.

Pre-built automation recipe templates with variable substitution.
Templates render into executable Recipe objects.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .parser import Recipe, RecipeStep


@dataclass
class TemplateVariable:
    """Variable definition for a recipe template."""

    name: str
    description: str
    default: str = ""
    required: bool = False


@dataclass
class StepTemplate:
    """A single step template with placeholder support."""

    order: int
    title: str
    description: str
    agent: str | None = None
    params: dict[str, Any] = field(default_factory=dict)


@dataclass
class RecipeTemplate:
    """Reusable recipe template with variable placeholders.

    Variables use {{variable_name}} syntax in titles, descriptions, and params.
    """

    name: str
    description: str
    version: str = "1.0.0"
    author: str = ""
    template_steps: list[StepTemplate] = field(default_factory=list)
    variables: dict[str, TemplateVariable] = field(default_factory=dict)

    def render(self, variables: dict[str, str] | None = None) -> Recipe:
        """Render template into an executable Recipe.

        Args:
            variables: Variable values to substitute. Defaults override apply.

        Returns:
            Rendered Recipe ready for execution.

        Raises:
            ValueError: If a required variable is missing.

        """
        merged = self._merge_variables(variables or {})
        steps = [self._render_step(s, merged) for s in self.template_steps]
        return Recipe(
            name=self._substitute(self.name, merged),
            description=self._substitute(self.description, merged),
            steps=steps,
            metadata={"template": self.name, "version": self.version, "author": self.author},
        )

    def _merge_variables(self, provided: dict[str, str]) -> dict[str, str]:
        """Merge provided values with defaults; validate required vars."""
        merged: dict[str, str] = {}
        for var_name, var_def in self.variables.items():
            if var_name in provided:
                merged[var_name] = provided[var_name]
            elif var_def.default:
                merged[var_name] = var_def.default
            elif var_def.required:
                msg = f"Required variable '{var_name}' not provided"
                raise ValueError(msg)
        for k, v in provided.items():
            if k not in merged:
                merged[k] = v
        return merged

    def _render_step(self, step: StepTemplate, variables: dict[str, str]) -> RecipeStep:
        """Render a single step template with variable substitution."""
        rendered_params = {
            k: self._substitute(str(v), variables) for k, v in step.params.items()
        }
        return RecipeStep(
            order=step.order,
            title=self._substitute(step.title, variables),
            description=self._substitute(step.description, variables),
            agent=step.agent,
            params=rendered_params,
        )

    @staticmethod
    def _substitute(text: str, variables: dict[str, str]) -> str:
        """Replace {{var}} placeholders with values."""
        def replacer(match: re.Match) -> str:  # type: ignore[type-arg]
            key = match.group(1).strip()
            return variables.get(key, match.group(0))
        return re.sub(r"\{\{([^}]+)\}\}", replacer, text)


class TemplateRegistry:
    """Manages the catalog of available recipe templates."""

    def __init__(self) -> None:
        """Initialize empty registry."""
        self._templates: dict[str, RecipeTemplate] = {}

    def register(self, template: RecipeTemplate) -> None:
        """Add a template to the registry."""
        self._templates[template.name] = template

    def get(self, name: str) -> RecipeTemplate:
        """Get template by name.

        Raises:
            KeyError: If template not found.

        """
        if name not in self._templates:
            available = ", ".join(self._templates) or "none"
            msg = f"Template '{name}' not found. Available: {available}"
            raise KeyError(msg)
        return self._templates[name]

    def list_templates(self) -> list[dict[str, str]]:
        """List all registered templates with metadata."""
        return [
            {
                "name": t.name,
                "description": t.description,
                "version": t.version,
                "author": t.author,
            }
            for t in self._templates.values()
        ]

    def load_from_dir(self, path: str | Path) -> int:
        """Load template files (.json) from a directory.

        Args:
            path: Directory containing template JSON files.

        Returns:
            Number of templates loaded.

        """
        dir_path = Path(path)
        if not dir_path.is_dir():
            return 0

        count = 0
        for file in sorted(dir_path.glob("*.json")):
            try:
                template = self._load_json(file)
                self.register(template)
                count += 1
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        return count

    @staticmethod
    def _load_json(file: Path) -> RecipeTemplate:
        """Parse a JSON template file into RecipeTemplate."""
        data = json.loads(file.read_text(encoding="utf-8"))
        variables = {
            k: TemplateVariable(**v) for k, v in data.get("variables", {}).items()
        }
        steps = [StepTemplate(**s) for s in data.get("template_steps", [])]
        return RecipeTemplate(
            name=data["name"],
            description=data["description"],
            version=data.get("version", "1.0.0"),
            author=data.get("author", ""),
            template_steps=steps,
            variables=variables,
        )


# --- Built-in templates ---

DEPLOY_TEMPLATE = RecipeTemplate(
    name="deploy",
    description="Git push and verify CI for {{project_name}}",
    version="1.0.0",
    author="mekong",
    variables={
        "project_name": TemplateVariable("project_name", "Project name", default="project"),
        "branch": TemplateVariable("branch", "Git branch to push", default="main"),
        "prod_url": TemplateVariable("prod_url", "Production URL to verify", default=""),
    },
    template_steps=[
        StepTemplate(
            order=1,
            title="Push {{project_name}} to {{branch}}",
            description="git push origin {{branch}}",
            agent="git",
            params={"command": "push", "branch": "{{branch}}"},
        ),
        StepTemplate(
            order=2,
            title="Check CI status",
            description="gh run list -L 1 --json status,conclusion",
            agent="shell",
            params={"command": "gh run list -L 1 --json status,conclusion -q '.[0]'"},
        ),
        StepTemplate(
            order=3,
            title="Verify production HTTP",
            description="curl -sI {{prod_url}} | head -3",
            agent="shell",
            params={"command": "curl -sI {{prod_url}} | head -3"},
        ),
    ],
)

TEST_TEMPLATE = RecipeTemplate(
    name="test",
    description="Run tests and check coverage for {{project_name}}",
    version="1.0.0",
    author="mekong",
    variables={
        "project_name": TemplateVariable("project_name", "Project name", default="project"),
        "test_path": TemplateVariable("test_path", "Test directory or file", default="tests/"),
    },
    template_steps=[
        StepTemplate(
            order=1,
            title="Run test suite for {{project_name}}",
            description="python3 -m pytest {{test_path}} -v --tb=short",
            agent="shell",
            params={"command": "python3 -m pytest {{test_path}} -v --tb=short"},
        ),
        StepTemplate(
            order=2,
            title="Check coverage",
            description="python3 -m pytest {{test_path}} --cov=src --cov-report=term-missing",
            agent="shell",
            params={"command": "python3 -m pytest {{test_path}} --cov=src --cov-report=term-missing"},
        ),
    ],
)

SECURITY_AUDIT_TEMPLATE = RecipeTemplate(
    name="security-audit",
    description="Scan code for security issues in {{project_name}}",
    version="1.0.0",
    author="mekong",
    variables={
        "project_name": TemplateVariable("project_name", "Project name", default="project"),
        "src_path": TemplateVariable("src_path", "Source directory to scan", default="src/"),
    },
    template_steps=[
        StepTemplate(
            order=1,
            title="Check for secrets in {{src_path}}",
            description="Scan for hardcoded credentials",
            agent="shell",
            params={"command": "grep -r 'API_KEY\\|SECRET\\|PASSWORD' {{src_path}} || echo 'Clean'"},
        ),
        StepTemplate(
            order=2,
            title="Check for any types",
            description="Count unsafe TypeScript any types",
            agent="shell",
            params={"command": "grep -r ': any' {{src_path}} | wc -l"},
        ),
        StepTemplate(
            order=3,
            title="Run dependency audit",
            description="Check for vulnerable dependencies",
            agent="shell",
            params={"command": "npm audit --audit-level=high 2>/dev/null || echo 'No auditor found'"},
        ),
    ],
)


def get_default_registry() -> TemplateRegistry:
    """Build and return a registry with all built-in templates."""
    registry = TemplateRegistry()
    registry.register(DEPLOY_TEMPLATE)
    registry.register(TEST_TEMPLATE)
    registry.register(SECURITY_AUDIT_TEMPLATE)
    return registry


__all__ = [
    "DEPLOY_TEMPLATE",
    "SECURITY_AUDIT_TEMPLATE",
    "StepTemplate",
    "TemplateRegistry",
    "TemplateVariable",
    "TEST_TEMPLATE",
    "RecipeTemplate",
    "get_default_registry",
]
