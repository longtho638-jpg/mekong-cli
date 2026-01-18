"""
Tests for Command Registry.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.registry import get_command_metadata, list_suites, resolve_command


class TestRegistry:
    def test_registry_structure(self):
        """Verify registry categories."""
        suites = list_suites()
        assert "revenue" in suites
        assert "dev" in suites
        assert "strategy" in suites

    def test_get_command_module(self):
        """Test module info retrieval."""
        info = get_command_metadata("revenue", "quote")
        assert info is not None
        assert "money_maker" in info["module"]
        assert info["class"] == "MoneyMaker"

    def test_resolve_shortcut(self):
        """Test shortcut resolution."""
        suite, sub = resolve_command("cook")
        assert suite == "dev"
        assert sub == "cook"

        suite, sub = resolve_command("quote")
        assert suite == "revenue"
        assert sub == "quote"

        suite, sub = resolve_command("invalid")
        assert suite is None


if __name__ == "__main__":
    pytest.main([__file__])
