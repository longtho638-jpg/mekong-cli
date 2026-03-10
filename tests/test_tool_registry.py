"""Tests for Mekong Tool Registry (AGI v2)."""

import tempfile
import unittest

from src.core.tool_registry import (
    Tool,
    ToolParameter,
    ToolRegistry,
    ToolType,
)


class TestTool(unittest.TestCase):
    def test_default_values(self):
        t = Tool(name="test", description="desc")
        self.assertEqual(t.tool_type, ToolType.BUILTIN)
        self.assertEqual(t.success_count, 0)
        self.assertEqual(t.success_rate, 0.0)
        self.assertEqual(t.reliability, "low")

    def test_success_rate(self):
        t = Tool(name="t", description="d", success_count=9, failure_count=1)
        self.assertAlmostEqual(t.success_rate, 0.9)
        self.assertEqual(t.reliability, "high")

    def test_medium_reliability(self):
        t = Tool(name="t", description="d", success_count=7, failure_count=3)
        self.assertEqual(t.reliability, "medium")


class TestToolRegistry(unittest.TestCase):
    def _make_registry(self):
        with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as f:
            return ToolRegistry(persist_path=f.name)

    def test_register_and_get(self):
        reg = self._make_registry()
        tool = reg.register("my-tool", "A test tool", ToolType.CUSTOM)
        self.assertIsNotNone(reg.get("my-tool"))
        self.assertEqual(tool.name, "my-tool")

    def test_unregister(self):
        reg = self._make_registry()
        reg.register("temp", "temp tool")
        self.assertTrue(reg.unregister("temp"))
        self.assertIsNone(reg.get("temp"))
        self.assertFalse(reg.unregister("nonexistent"))

    def test_search(self):
        reg = self._make_registry()
        reg.register("git-push", "Push to remote", tags=["git", "deploy"])
        reg.register("npm-build", "Build project", tags=["npm", "build"])
        results = reg.search("git")
        self.assertTrue(any(t.name == "git-push" for t in results))

    def test_search_by_type(self):
        reg = self._make_registry()
        reg.register("api-tool", "API", tool_type=ToolType.API)
        reg.register("cli-tool", "CLI", tool_type=ToolType.CLI)
        results = reg.search("tool", tool_type=ToolType.API)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].name, "api-tool")

    def test_execute_with_handler(self):
        reg = self._make_registry()
        reg.register(
            "add", "Add numbers",
            handler=lambda a=1, b=2: a + b,
        )
        result = reg.execute("add", {"a": 3, "b": 4})
        self.assertTrue(result["success"])
        self.assertEqual(result["output"], "7")

    def test_execute_not_found(self):
        reg = self._make_registry()
        result = reg.execute("nonexistent")
        self.assertFalse(result["success"])

    def test_list_tools(self):
        reg = self._make_registry()
        all_tools = reg.list_tools()
        self.assertGreater(len(all_tools), 0)  # Has builtins

    def test_list_tools_by_type(self):
        reg = self._make_registry()
        builtins = reg.list_tools(ToolType.BUILTIN)
        self.assertGreater(len(builtins), 0)

    def test_get_stats(self):
        reg = self._make_registry()
        stats = reg.get_stats()
        self.assertIn("total_tools", stats)
        self.assertIn("type_counts", stats)

    def test_suggest_tool(self):
        reg = self._make_registry()
        tool = reg.suggest_tool("git")
        self.assertIsNotNone(tool)

    def test_discover_from_openapi(self):
        reg = self._make_registry()
        spec = {
            "servers": [{"url": "https://api.example.com"}],
            "paths": {
                "/users": {
                    "get": {
                        "operationId": "listUsers",
                        "summary": "List all users",
                        "parameters": [
                            {"name": "limit", "in": "query", "schema": {"type": "integer"}},
                        ],
                    },
                },
            },
        }
        discovered = reg.discover_from_openapi(spec)
        self.assertGreater(len(discovered), 0)
        self.assertTrue(any("listUsers" in t.name for t in discovered))

    def test_builtins_registered(self):
        reg = self._make_registry()
        self.assertIsNotNone(reg.get("shell:run"))
        self.assertIsNotNone(reg.get("git:status"))
        self.assertIsNotNone(reg.get("file:read"))


if __name__ == "__main__":
    unittest.main()
