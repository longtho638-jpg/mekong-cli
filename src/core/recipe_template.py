"""Mekong CLI v3.1 - Recipe Template Generator.

Generates plugin templates for community developers.
Supports agent, provider, hook, and recipe plugin types.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

PluginType = Literal["agent", "provider", "hook", "recipe"]

TEMPLATES = {
    "agent": '''"""Mekong Plugin - {name}.

{description}
"""

from __future__ import annotations

from typing import Any


class {class_name}:
    """{name} agent implementation."""

    def __init__(self, config: dict | None = None) -> None:
        self.config = config or {}
        self.name = "{name}"

    def execute(self, goal: str, context: dict | None = None) -> dict[str, Any]:
        """Execute the agent task.

        Args:
            goal: Task description
            context: Optional context data

        Returns:
            dict with 'success', 'output', and optional 'error' keys
        """
        try:
            # TODO: Implement agent logic here
            result = {{
                "success": True,
                "output": f"Executed: {{goal}}",
            }}
        except Exception as e:
            result = {{
                "success": False,
                "error": str(e),
            }}
        return result


def register(registry: Any) -> None:
    """Register this agent with the Mekong registry.

    Args:
        registry: AgentRegistry instance
    """
    registry.register("{name}", {class_name})


__all__ = ["{class_name}", "register"]
''',

    "provider": '''"""Mekong Plugin - {name} Provider.

{description}
"""

from __future__ import annotations

from typing import Any


class {class_name}:
    """{name} LLM provider implementation."""

    def __init__(self, api_key: str, base_url: str | None = None) -> None:
        self.api_key = api_key
        self.base_url = base_url
        self.name = "{name}"

    def generate(self, prompt: str, **kwargs: Any) -> str:
        """Generate text from prompt.

        Args:
            prompt: Input prompt
            **kwargs: Additional generation params

        Returns:
            Generated text response
        """
        # TODO: Implement provider API call here
        return f"Response from {{self.name}}: {{prompt[:50]}}..."

    def stream(self, prompt: str, **kwargs: Any):
        """Stream generation results.

        Yields:
            Text chunks as they are generated
        """
        # TODO: Implement streaming if supported
        yield self.generate(prompt, **kwargs)


def register(registry: Any) -> None:
    """Register this provider with Mekong.

    Args:
        registry: ProviderRegistry instance
    """
    registry.register("{name}", {class_name})


__all__ = ["{class_name}", "register"]
''',

    "hook": '''"""Mekong Plugin - {name} Hook.

{description}
"""

from __future__ import annotations

from typing import Any


class {class_name}:
    """{name} hook for lifecycle events."""

    def __init__(self, config: dict | None = None) -> None:
        self.config = config or {}
        self.name = "{name}"

    def on_plan(self, plan: dict) -> dict:
        """Called after plan generation.

        Args:
            plan: Generated plan dict

        Returns:
            Modified plan (or same if no changes)
        """
        # TODO: Implement hook logic
        return plan

    def on_execute(self, step: dict) -> dict:
        """Called before step execution.

        Args:
            step: Step dict to execute

        Returns:
            Modified step (or same)
        """
        return step

    def on_verify(self, result: dict) -> dict:
        """Called after verification.

        Args:
            result: Verification result

        Returns:
            Modified result (or same)
        """
        return result


def register(registry: Any) -> None:
    """Register this hook with Mekong.

    Args:
        registry: HookRegistry instance
    """
    registry.register("{name}", {class_name})


__all__ = ["{class_name}", "register"]
''',

    "recipe": '''"""Mekong Recipe - {name}.

{description}
"""

from __future__ import annotations

RECIPE = {{
    "name": "{name}",
    "description": "{description}",
    "version": "1.0.0",
    "steps": [
        {{
            "id": 1,
            "title": "Step 1: Setup",
            "action": "shell",
            "command": "echo 'Setting up...'",
            "verify": {{
                "exit_code": 0,
            }},
        }},
        # TODO: Add more steps
    ],
    "rollback": [
        # TODO: Add rollback steps
    ],
}}


def get_recipe() -> dict:
    """Return the recipe definition."""
    return RECIPE


def register(registry: Any) -> None:
    """Register this recipe with Mekong.

    Args:
        registry: RecipeRegistry instance
    """
    registry.register("{name}", get_recipe)


__all__ = ["RECIPE", "get_recipe", "register"]
''',
}

README_TEMPLATE = """# {name}

{description}

## Installation

```bash
pip install {package_name}
```

## Usage

```python
from mekong import Mekong

mekong = Mekong()
# Use your plugin here
```

## Development

```bash
pip install -e .
pytest
```

## License

MIT
"""

SETUP_PY_TEMPLATE = '''"""Setup script for {package_name}."""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

setup(
    name="{package_name}",
    version="0.1.0",
    author="{author}",
    description="{description}",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
    entry_points={{
        "mekong.{plugin_type}s": [
            "{name} = {module_name}:{class_name}",
        ],
    }},
)
'''

TEST_TEMPLATE = '''"""Tests for {name} plugin."""

import pytest


class Test{class_name}:
    """Test suite for {class_name}."""

    def setup_method(self) -> None:
        """Setup test fixtures."""
        # TODO: Setup your test fixture
        pass

    def test_execute_success(self) -> None:
        """Test successful execution."""
        # TODO: Implement test
        assert True

    def test_execute_with_context(self) -> None:
        """Test execution with context."""
        # TODO: Implement test
        assert True

    def test_error_handling(self) -> None:
        """Test error scenarios."""
        # TODO: Implement test
        assert True


def test_register() -> None:
    """Test plugin registration."""
    # TODO: Implement registration test
    assert True
'''


class RecipeTemplate:
    """Generates plugin templates for Mekong ecosystem.

    Usage:
        generator = RecipeTemplate()
        generator.generate_plugin_template("agent", "my-agent", "My Agent")
    """

    def __init__(self) -> None:
        self._templates = TEMPLATES

    def generate_plugin_template(
        self,
        plugin_type: PluginType,
        plugin_name: str,
        description: str = "",
        output_dir: Path | str | None = None,
    ) -> Path:
        """Generate plugin skeleton .py file.

        Args:
            plugin_type: One of 'agent', 'provider', 'hook', 'recipe'
            plugin_name: Plugin name (kebab-case recommended)
            description: Plugin description
            output_dir: Output directory (default: current dir)

        Returns:
            Path to generated file
        """
        if plugin_type not in self._templates:
            raise ValueError(f"Unknown plugin type: {plugin_type}")

        class_name = self._to_class_name(plugin_name)
        template = self._templates[plugin_type].format(
            name=plugin_name,
            class_name=class_name,
            description=description or f"{class_name} plugin for Mekong CLI",
        )

        output_path = self._get_output_path(output_dir) / f"{plugin_name}.py"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(template, encoding="utf-8")

        return output_path

    def generate_readme_template(
        self,
        plugin_name: str,
        description: str = "",
        author: str = "",
        output_dir: Path | str | None = None,
    ) -> Path:
        """Generate README.md for plugin."""
        output_path = self._get_output_path(output_dir) / "README.md"
        content = README_TEMPLATE.format(
            name=plugin_name,
            description=description or f"{plugin_name} plugin for Mekong CLI",
            package_name=self._to_package_name(plugin_name),
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        return output_path

    def generate_setup_py_template(
        self,
        plugin_name: str,
        plugin_type: PluginType,
        description: str = "",
        author: str = "",
        output_dir: Path | str | None = None,
    ) -> Path:
        """Generate setup.py for PyPI distribution."""
        output_path = self._get_output_path(output_dir) / "setup.py"
        module_name = plugin_name.replace("-", "_")
        class_name = self._to_class_name(plugin_name)
        content = SETUP_PY_TEMPLATE.format(
            package_name=self._to_package_name(plugin_name),
            plugin_type=plugin_type,
            name=plugin_name,
            module_name=module_name,
            class_name=class_name,
            description=description or f"{plugin_name} plugin",
            author=author or "Your Name",
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        return output_path

    def generate_test_template(
        self,
        plugin_name: str,
        output_dir: Path | str | None = None,
    ) -> Path:
        """Generate test skeleton for plugin."""
        output_path = self._get_output_path(output_dir) / f"test_{plugin_name.replace('-', '_')}.py"
        class_name = self._to_class_name(plugin_name)
        content = TEST_TEMPLATE.format(
            name=plugin_name,
            class_name=class_name,
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(content, encoding="utf-8")
        return output_path

    def generate_full_plugin(
        self,
        plugin_type: PluginType,
        plugin_name: str,
        description: str = "",
        author: str = "",
        output_dir: Path | str | None = None,
    ) -> list[Path]:
        """Generate complete plugin package with all files.

        Returns:
            List of generated file paths
        """
        plugin_dir = self._get_output_path(output_dir)
        generated = []

        # Main plugin file
        generated.append(
            self.generate_plugin_template(plugin_type, plugin_name, description, plugin_dir)
        )

        # README
        generated.append(
            self.generate_readme_template(plugin_name, description, author, plugin_dir)
        )

        # setup.py
        generated.append(
            self.generate_setup_py_template(
                plugin_name, plugin_type, description, author, plugin_dir
            )
        )

        # Tests
        test_dir = plugin_dir / "tests"
        generated.append(
            self.generate_test_template(plugin_name, test_dir)
        )

        return generated

    @staticmethod
    def _to_class_name(name: str) -> str:
        """Convert kebab-case to PascalCase."""
        return "".join(part.capitalize() for part in name.replace("_", "-").split("-"))

    @staticmethod
    def _to_package_name(name: str) -> str:
        """Convert to valid package name."""
        return name.replace("_", "-").lower()

    @staticmethod
    def _get_output_path(output_dir: Path | str | None) -> Path:
        """Resolve output directory."""
        if output_dir is None:
            return Path.cwd()
        return Path(output_dir)


__all__ = ["RecipeTemplate", "PluginType"]
