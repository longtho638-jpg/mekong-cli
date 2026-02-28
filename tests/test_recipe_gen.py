"""
Tests for RecipeGenerator — auto-recipe generation from execution history.

Covers: from_successful_run, from_goal_pattern, validate_recipe,
save_recipe, list_auto_recipes, slugify, GeneratedRecipe dataclass.
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.recipe_gen import RecipeGenerator, GeneratedRecipe
from src.core.memory import MemoryEntry
from src.core.event_bus import EventBus, EventType


class TestGeneratedRecipeDataclass(unittest.TestCase):
    """Tests for the GeneratedRecipe dataclass."""

    def test_fields_populated(self):
        """GeneratedRecipe should store all fields."""
        r = GeneratedRecipe(name="test", content="# Test", source="llm", valid=True)
        self.assertEqual(r.name, "test")
        self.assertEqual(r.content, "# Test")
        self.assertEqual(r.source, "llm")
        self.assertTrue(r.valid)

    def test_default_valid_is_false(self):
        """valid should default to False."""
        r = GeneratedRecipe(name="x", content="y", source="z")
        self.assertFalse(r.valid)


class TestRecipeGeneratorFromRun(unittest.TestCase):
    """Tests for from_successful_run()."""

    def test_generates_recipe_from_entry(self):
        """Should generate a recipe from a MemoryEntry."""
        gen = RecipeGenerator()
        entry = MemoryEntry(goal="deploy app", status="success")
        recipe = gen.from_successful_run(entry)
        self.assertIsInstance(recipe, GeneratedRecipe)
        self.assertEqual(recipe.source, "successful_run")
        self.assertIn("deploy app", recipe.content.lower())

    def test_recipe_name_is_slugified(self):
        """Name should be slugified from goal."""
        gen = RecipeGenerator()
        entry = MemoryEntry(goal="Build Docker Image", status="success")
        recipe = gen.from_successful_run(entry)
        self.assertEqual(recipe.name, "build-docker-image")

    def test_entry_with_recipe_used(self):
        """If entry used a recipe, step should reference it."""
        gen = RecipeGenerator()
        entry = MemoryEntry(
            goal="deploy", status="success", recipe_used="deploy-fast"
        )
        recipe = gen.from_successful_run(entry)
        self.assertIn("deploy-fast", recipe.content)


class TestRecipeGeneratorFromPattern(unittest.TestCase):
    """Tests for from_goal_pattern()."""

    def test_with_explicit_steps(self):
        """Should create multi-step recipe from provided steps."""
        gen = RecipeGenerator()
        recipe = gen.from_goal_pattern(
            "setup project", steps=["init repo", "install deps", "configure"]
        )
        self.assertIn("Step 1", recipe.content)
        self.assertIn("Step 2", recipe.content)
        self.assertIn("Step 3", recipe.content)
        self.assertEqual(recipe.source, "goal_pattern")

    def test_no_steps_no_llm(self):
        """Without steps or LLM, should create single-step recipe."""
        gen = RecipeGenerator(llm_client=None)
        recipe = gen.from_goal_pattern("run tests")
        self.assertIn("Step 1", recipe.content)
        self.assertEqual(recipe.source, "goal_pattern")

    def test_with_llm_client(self):
        """Should use LLM when available and no steps provided."""
        mock_llm = MagicMock()
        mock_llm.generate.return_value = "### Step 1: First\nDo first\n### Step 2: Second\nDo second"
        gen = RecipeGenerator(llm_client=mock_llm)
        recipe = gen.from_goal_pattern("complex task")
        self.assertEqual(recipe.source, "llm")
        mock_llm.generate.assert_called_once()


class TestRecipeGeneratorValidation(unittest.TestCase):
    """Tests for validate_recipe()."""

    def test_valid_recipe(self):
        """A well-formed recipe should validate."""
        gen = RecipeGenerator()
        md = (
            "# Test Recipe\n\nA test recipe.\n\n"
            "## Step 1: Do something\n\necho hello\n"
        )
        valid, errors = gen.validate_recipe(md)
        self.assertTrue(valid)
        self.assertEqual(errors, [])

    def test_invalid_recipe_no_steps(self):
        """A recipe with no steps should fail validation."""
        gen = RecipeGenerator()
        md = "# Just a title\n\nNo steps here.\n"
        valid, errors = gen.validate_recipe(md)
        self.assertFalse(valid)
        self.assertTrue(len(errors) > 0)


class TestRecipeGeneratorSave(unittest.TestCase):
    """Tests for save_recipe() and list_auto_recipes()."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.gen = RecipeGenerator()
        self.gen.AUTO_DIR = os.path.join(self.tmpdir, "auto")

    def test_save_creates_file(self):
        """save_recipe should create a .md file."""
        recipe = GeneratedRecipe(
            name="test-save", content="# Test\n\nDesc.\n\n## Step 1: Run\n\necho hi\n",
            source="test", valid=True,
        )
        path = self.gen.save_recipe(recipe)
        self.assertTrue(os.path.exists(path))
        self.assertTrue(path.endswith("test-save.md"))

    def test_auto_dir_created(self):
        """save_recipe should create the auto directory."""
        recipe = GeneratedRecipe(
            name="dir-test", content="# X", source="test", valid=True,
        )
        self.gen.save_recipe(recipe)
        self.assertTrue(os.path.isdir(self.gen.AUTO_DIR))

    def test_save_emits_event(self):
        """save_recipe should emit RECIPE_GENERATED."""
        bus = EventBus()
        received = []
        bus.subscribe(EventType.RECIPE_GENERATED, lambda e: received.append(e))

        with patch("src.core.recipe_gen.get_event_bus", return_value=bus):
            recipe = GeneratedRecipe(
                name="evt-test", content="# E", source="test", valid=True,
            )
            self.gen.save_recipe(recipe)

        self.assertEqual(len(received), 1)
        self.assertEqual(received[0].data["name"], "evt-test")

    def test_list_auto_recipes_empty(self):
        """list_auto_recipes should return [] when no recipes exist."""
        recipes = self.gen.list_auto_recipes()
        self.assertEqual(recipes, [])

    def test_list_auto_recipes_with_files(self):
        """list_auto_recipes should return saved recipes."""
        recipe = GeneratedRecipe(
            name="listed", content="# L", source="test", valid=True,
        )
        self.gen.save_recipe(recipe)
        recipes = self.gen.list_auto_recipes()
        self.assertEqual(len(recipes), 1)
        self.assertEqual(recipes[0]["name"], "listed")


class TestSlugify(unittest.TestCase):
    """Tests for the _slugify helper."""

    def test_basic_slugify(self):
        """Should convert spaces to hyphens and lowercase."""
        gen = RecipeGenerator()
        self.assertEqual(gen._slugify("Deploy App"), "deploy-app")

    def test_special_chars_removed(self):
        """Should remove special characters."""
        gen = RecipeGenerator()
        self.assertEqual(gen._slugify("Hello! World?"), "hello-world")

    def test_long_name_truncated(self):
        """Should truncate to 60 chars."""
        gen = RecipeGenerator()
        slug = gen._slugify("a" * 100)
        self.assertLessEqual(len(slug), 60)


if __name__ == "__main__":
    unittest.main()
