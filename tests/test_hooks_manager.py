"""
Tests for Hooks Manager.
"""

import os
import sys
from pathlib import Path

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.hook_executor import execute_hook
from antigravity.core.hook_registry import HOOKS, Hook
from antigravity.core.hooks_manager import HooksManager


class TestHooksManager:
    def test_hook_structure(self):
        """Verify hook structure."""
        for trigger, hook_list in HOOKS.items():
            for hook in hook_list:
                assert isinstance(hook, Hook)
                # hook.file is a Path object in the refactored version
                assert hook.file.as_posix().startswith(".claude/hooks/")
                assert hook.category in ["revenue", "code", "research", "session", "subagent"]

    def test_hooks_for_suite(self):
        """Test hooks retrieval for suites."""
        manager = HooksManager()

        # Revenue suite should have win3 gate
        rev_hooks = manager.get_hooks_for_suite("revenue")
        assert any(h.name == "win-win-win-gate" for h in rev_hooks)

        # Dev suite should have privacy block
        dev_hooks = manager.get_hooks_for_suite("dev")
        assert any(h.name == "privacy-block" for h in dev_hooks)

    def test_privacy_block(self):
        """Test privacy hook logic."""
        # Should block sensitive data (using a long enough key to match regex)
        context = {"code": "api_key = 'sk-abcdefghijklmnopqrstuvwxyz012345'"}
        result = execute_hook(
            Hook("privacy-block", Path("mock.js"), "pre", "code", blocking=True), context
        )
        assert result["passed"] is False
        assert "Sensitive data" in result["output"]

        # Should pass safe data
        safe_context = {"code": "print('hello')"}
        result = execute_hook(
            Hook("privacy-block", Path("mock.js"), "pre", "code", blocking=True), safe_context
        )
        assert result["passed"] is True

    def test_win3_gate(self):
        """Test win-win-win validation."""
        manager = HooksManager()

        # Invalid deal
        bad_deal = {
            "anh": {"equity": True},
            "agency": {"cash": True},
            "client": {},  # Missing wins
        }
        result = manager.run_win3_gate(bad_deal)
        assert result["valid"] is False

        # Valid deal
        good_deal = {
            "anh": {"equity": True, "cash": True},
            "agency": {"moat": True, "retainer": True},
            "client": {"value": True, "growth": True},
        }
        result = manager.run_win3_gate(good_deal)
        assert result["valid"] is True


if __name__ == "__main__":
    pytest.main([__file__])
