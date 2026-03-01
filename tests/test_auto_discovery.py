"""Tests for Auto-Discovery Engine (Netdata-inspired project detection)."""

import pytest
from pathlib import Path
from src.core.auto_discovery import (
    AutoDiscovery,
    DiscoveredProject,
    ProjectSignal,
    DEFAULT_SIGNALS,
    RECIPE_MAP,
)


class TestAutoDiscovery:
    """Test project auto-discovery from filesystem signals."""

    def test_discover_python_project(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("[tool.poetry]")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        assert len(results) >= 1
        assert results[0].project_type == "python"
        assert results[0].confidence >= 0.9

    def test_discover_node_project(self, tmp_path):
        (tmp_path / "package.json").write_text('{"name":"test"}')
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        types = [r.project_type for r in results]
        assert "node" in types

    def test_discover_nextjs_project(self, tmp_path):
        (tmp_path / "next.config.js").write_text("module.exports = {}")
        (tmp_path / "package.json").write_text('{}')
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        types = [r.project_type for r in results]
        assert "nextjs" in types

    def test_discover_empty_dir(self, tmp_path):
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        assert results == []

    def test_discover_multiple_signals_boost_confidence(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("")
        (tmp_path / "setup.py").write_text("")
        (tmp_path / "requirements.txt").write_text("")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        python_result = next(r for r in results if r.project_type == "python")
        assert python_result.confidence > 0.9
        assert len(python_result.signals) >= 3

    def test_discover_sorted_by_confidence(self, tmp_path):
        (tmp_path / "Cargo.toml").write_text("")  # 0.95
        (tmp_path / "requirements.txt").write_text("")  # 0.7
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        assert results[0].confidence >= results[-1].confidence

    def test_discover_docker(self, tmp_path):
        (tmp_path / "Dockerfile").write_text("FROM python:3.11")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        types = [r.project_type for r in results]
        assert "docker" in types

    def test_discover_cloudflare_worker(self, tmp_path):
        (tmp_path / "wrangler.toml").write_text("")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        types = [r.project_type for r in results]
        assert "cloudflare-worker" in types

    def test_suggested_recipes_for_python(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        python_r = next(r for r in results if r.project_type == "python")
        assert "test-pytest" in python_r.suggested_recipes

    def test_root_dir_recorded(self, tmp_path):
        (tmp_path / "go.mod").write_text("")
        ad = AutoDiscovery()
        results = ad.discover(str(tmp_path))
        assert results[0].root_dir == str(tmp_path)


class TestSuggestRecipe:
    """Test recipe suggestion based on goal + project type."""

    def test_suggest_test_recipe(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("")
        ad = AutoDiscovery()
        recipe = ad.suggest_recipe("run tests", str(tmp_path))
        assert recipe == "test-pytest"

    def test_suggest_lint_recipe(self, tmp_path):
        (tmp_path / "package.json").write_text("{}")
        ad = AutoDiscovery()
        recipe = ad.suggest_recipe("lint the code", str(tmp_path))
        assert recipe == "lint-eslint"

    def test_suggest_build_recipe(self, tmp_path):
        (tmp_path / "Cargo.toml").write_text("")
        ad = AutoDiscovery()
        recipe = ad.suggest_recipe("build project", str(tmp_path))
        assert recipe == "build-cargo"

    def test_suggest_default_when_no_keyword_match(self, tmp_path):
        (tmp_path / "pyproject.toml").write_text("")
        ad = AutoDiscovery()
        recipe = ad.suggest_recipe("do something random", str(tmp_path))
        # Should return first recipe for python
        assert recipe == "lint-python"

    def test_suggest_none_for_empty_dir(self, tmp_path):
        ad = AutoDiscovery()
        assert ad.suggest_recipe("test", str(tmp_path)) is None


class TestCustomSignals:
    """Test adding custom signals and recipe mappings."""

    def test_add_custom_signal(self, tmp_path):
        (tmp_path / "gleam.toml").write_text("")
        ad = AutoDiscovery()
        ad.add_signal(ProjectSignal("gleam.toml", "gleam", 0.95, "Gleam project"))
        ad.add_recipe_mapping("gleam", ["build-gleam", "test-gleam"])
        results = ad.discover(str(tmp_path))
        assert any(r.project_type == "gleam" for r in results)

    def test_add_recipe_mapping(self):
        ad = AutoDiscovery()
        ad.add_recipe_mapping("python", ["deploy-python"])
        assert "deploy-python" in ad._recipe_map["python"]


class TestDefaultConstants:
    """Test default signals and recipe map coverage."""

    def test_default_signals_not_empty(self):
        assert len(DEFAULT_SIGNALS) >= 10

    def test_recipe_map_covers_main_types(self):
        for ptype in ["python", "node", "typescript", "rust", "go"]:
            assert ptype in RECIPE_MAP
            assert len(RECIPE_MAP[ptype]) >= 2
