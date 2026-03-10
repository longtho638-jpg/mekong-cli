"""Tests for RecipeTemplate engine — template rendering and registry management.

Covers: RecipeTemplate.render(), variable substitution, required var validation,
TemplateRegistry CRUD, load_from_dir, built-in templates, get_default_registry.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.recipe_template import (
    DEPLOY_TEMPLATE,
    SECURITY_AUDIT_TEMPLATE,
    TEST_TEMPLATE,
    RecipeTemplate,
    StepTemplate,
    TemplateRegistry,
    TemplateVariable,
    get_default_registry,
)


class TestTemplateVariable(unittest.TestCase):
    """TemplateVariable dataclass tests."""

    def test_defaults(self) -> None:
        v = TemplateVariable(name="x", description="desc")
        self.assertEqual(v.default, "")
        self.assertFalse(v.required)

    def test_required_flag(self) -> None:
        v = TemplateVariable(name="x", description="desc", required=True)
        self.assertTrue(v.required)


class TestRecipeTemplateRender(unittest.TestCase):
    """RecipeTemplate.render() tests."""

    def _make_template(self) -> RecipeTemplate:
        return RecipeTemplate(
            name="{{project}} deploy",
            description="Deploy {{project}} to {{env}}",
            version="1.0.0",
            author="test",
            variables={
                "project": TemplateVariable("project", "Project name", default="myapp"),
                "env": TemplateVariable("env", "Target environment", default="staging"),
            },
            template_steps=[
                StepTemplate(
                    order=1,
                    title="Deploy {{project}}",
                    description="Deploying to {{env}}",
                    agent="shell",
                    params={"cmd": "deploy {{project}} --env {{env}}"},
                ),
            ],
        )

    def test_render_with_defaults(self) -> None:
        tmpl = self._make_template()
        recipe = tmpl.render()
        self.assertEqual(recipe.name, "myapp deploy")
        self.assertEqual(recipe.description, "Deploy myapp to staging")
        self.assertEqual(len(recipe.steps), 1)
        self.assertEqual(recipe.steps[0].title, "Deploy myapp")

    def test_render_with_overrides(self) -> None:
        tmpl = self._make_template()
        recipe = tmpl.render({"project": "api", "env": "prod"})
        self.assertEqual(recipe.name, "api deploy")
        self.assertEqual(recipe.steps[0].params["cmd"], "deploy api --env prod")

    def test_render_metadata(self) -> None:
        tmpl = self._make_template()
        recipe = tmpl.render()
        self.assertEqual(recipe.metadata["template"], "{{project}} deploy")
        self.assertEqual(recipe.metadata["version"], "1.0.0")
        self.assertEqual(recipe.metadata["author"], "test")

    def test_required_variable_missing_raises(self) -> None:
        tmpl = RecipeTemplate(
            name="t",
            description="d",
            variables={"api_key": TemplateVariable("api_key", "Key", required=True)},
            template_steps=[],
        )
        with self.assertRaises(ValueError) as ctx:
            tmpl.render()
        self.assertIn("api_key", str(ctx.exception))

    def test_required_variable_provided(self) -> None:
        tmpl = RecipeTemplate(
            name="t",
            description="d",
            variables={"api_key": TemplateVariable("api_key", "Key", required=True)},
            template_steps=[],
        )
        recipe = tmpl.render({"api_key": "secret"})
        self.assertIsNotNone(recipe)

    def test_unknown_placeholder_preserved(self) -> None:
        tmpl = RecipeTemplate(
            name="{{unknown_var}} name",
            description="desc",
            template_steps=[],
        )
        recipe = tmpl.render()
        self.assertEqual(recipe.name, "{{unknown_var}} name")

    def test_extra_provided_vars_accepted(self) -> None:
        tmpl = RecipeTemplate(name="t", description="d", template_steps=[])
        recipe = tmpl.render({"extra": "ignored"})
        self.assertEqual(recipe.name, "t")


class TestTemplateRegistry(unittest.TestCase):
    """TemplateRegistry CRUD tests."""

    def setUp(self) -> None:
        self.registry = TemplateRegistry()
        self.tmpl = RecipeTemplate(name="alpha", description="Alpha template")

    def test_register_and_get(self) -> None:
        self.registry.register(self.tmpl)
        result = self.registry.get("alpha")
        self.assertIs(result, self.tmpl)

    def test_get_missing_raises(self) -> None:
        with self.assertRaises(KeyError) as ctx:
            self.registry.get("nonexistent")
        self.assertIn("nonexistent", str(ctx.exception))

    def test_list_templates_empty(self) -> None:
        self.assertEqual(self.registry.list_templates(), [])

    def test_list_templates_populated(self) -> None:
        self.registry.register(self.tmpl)
        listing = self.registry.list_templates()
        self.assertEqual(len(listing), 1)
        self.assertEqual(listing[0]["name"], "alpha")
        self.assertIn("description", listing[0])

    def test_register_overwrites(self) -> None:
        self.registry.register(self.tmpl)
        new_tmpl = RecipeTemplate(name="alpha", description="Updated")
        self.registry.register(new_tmpl)
        self.assertEqual(self.registry.get("alpha").description, "Updated")

    def test_load_from_dir_nonexistent(self) -> None:
        count = self.registry.load_from_dir("/tmp/does_not_exist_xyz")
        self.assertEqual(count, 0)

    def test_load_from_dir_valid_json(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            data = {
                "name": "json-tmpl",
                "description": "Loaded from JSON",
                "version": "2.0.0",
                "author": "loader",
                "variables": {
                    "x": {"name": "x", "description": "X var", "default": "val"},
                },
                "template_steps": [
                    {"order": 1, "title": "Do {{x}}", "description": "desc", "agent": None, "params": {}},
                ],
            }
            Path(tmpdir, "tmpl.json").write_text(json.dumps(data), encoding="utf-8")
            count = self.registry.load_from_dir(tmpdir)
            self.assertEqual(count, 1)
            loaded = self.registry.get("json-tmpl")
            recipe = loaded.render({"x": "hello"})
            self.assertEqual(recipe.steps[0].title, "Do hello")

    def test_load_from_dir_skips_malformed(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            Path(tmpdir, "bad.json").write_text("not json!!!", encoding="utf-8")
            count = self.registry.load_from_dir(tmpdir)
            self.assertEqual(count, 0)


class TestBuiltinTemplates(unittest.TestCase):
    """Built-in template smoke tests."""

    def test_deploy_template_renders(self) -> None:
        recipe = DEPLOY_TEMPLATE.render({"project_name": "myapi", "branch": "main", "prod_url": "https://api.example.com"})
        self.assertEqual(len(recipe.steps), 3)
        self.assertIn("myapi", recipe.steps[0].title)

    def test_test_template_renders(self) -> None:
        recipe = TEST_TEMPLATE.render({"project_name": "mylib", "test_path": "tests/"})
        self.assertEqual(len(recipe.steps), 2)
        self.assertIn("tests/", recipe.steps[0].params["command"])

    def test_security_audit_renders(self) -> None:
        recipe = SECURITY_AUDIT_TEMPLATE.render({"project_name": "webapp", "src_path": "src/"})
        self.assertEqual(len(recipe.steps), 3)
        self.assertIn("src/", recipe.steps[0].params["command"])

    def test_get_default_registry_has_all(self) -> None:
        registry = get_default_registry()
        names = {t["name"] for t in registry.list_templates()}
        self.assertIn("deploy", names)
        self.assertIn("test", names)
        self.assertIn("security-audit", names)


if __name__ == "__main__":
    unittest.main()
