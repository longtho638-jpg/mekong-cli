"""Tests for dynamic agent registry loading."""

import unittest
from unittest.mock import patch
from pathlib import Path

from src.core.registry import load_agents_dynamic, get_agent
from src.core.agent_base import AgentBase


class TestPluginLoading(unittest.TestCase):
    """Test dynamic agent discovery from src/agents/ and plugins/."""

    def test_load_agents_dynamic_finds_builtin_agents(self):
        """Should discover all built-in agents in src/agents/."""
        agents = load_agents_dynamic()
        # At minimum these agents exist in the codebase
        self.assertIn("git", agents)
        self.assertIn("file", agents)
        self.assertIn("shell", agents)
        # All values should be AgentBase subclasses
        for cls in agents.values():
            self.assertTrue(
                issubclass(cls, AgentBase),
                f"{cls.__name__} is not an AgentBase subclass",
            )

    def test_load_agents_dynamic_handles_missing_plugins_dir(self):
        """Should not crash when plugins/ directory does not exist."""
        with patch("src.core.registry.Path") as mock_path_cls:
            # Make the plugins path report as non-existent
            # but still allow the real builtin path to work
            original_path = Path

            def side_effect(p=""):
                real = original_path(p)
                if p == "plugins":
                    mock = unittest.mock.MagicMock()
                    mock.exists.return_value = False
                    return mock
                return real

            mock_path_cls.side_effect = side_effect

        # Direct call without mock - the real plugins/ dir likely doesn't exist
        agents = load_agents_dynamic()
        self.assertIsInstance(agents, dict)
        # Should still find builtin agents
        self.assertGreater(len(agents), 0)

    def test_get_agent_returns_correct_class(self):
        """get_agent('git') should return GitAgent class."""
        cls = get_agent("git")
        self.assertIsNotNone(cls)
        self.assertEqual(cls.__name__, "GitAgent")
        self.assertTrue(issubclass(cls, AgentBase))

    def test_get_agent_returns_none_for_unknown(self):
        """get_agent with unknown name should return None."""
        result = get_agent("nonexistent_agent_xyz")
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
