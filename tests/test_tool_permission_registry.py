"""Tests for Tool Permission Registry — claude-code permission model."""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.tool_permission_registry import (
    PermissionMode,
    ToolPermissionRegistry,
    ToolRisk,
    ToolSpec,
)


class TestToolPermissionRegistry:
    def test_default_tools_registered(self):
        """Default tools are registered on init."""
        reg = ToolPermissionRegistry()
        tools = reg.list_all()
        names = [t.name for t in tools]
        assert "file_read" in names
        assert "shell_exec" in names
        assert "git_push" in names

    def test_default_mode_read_write_allowed(self):
        """DEFAULT mode allows read_only and write tools."""
        reg = ToolPermissionRegistry(PermissionMode.DEFAULT)
        assert reg.check_permission("file_read") is True
        assert reg.check_permission("file_write") is True
        assert reg.check_permission("shell_exec") is False
        assert reg.check_permission("git_push") is False

    def test_plan_mode_read_only(self):
        """PLAN mode only allows read_only tools."""
        reg = ToolPermissionRegistry(PermissionMode.PLAN)
        assert reg.check_permission("file_read") is True
        assert reg.check_permission("grep") is True
        assert reg.check_permission("file_write") is False
        assert reg.check_permission("shell_exec") is False

    def test_bypass_mode_all_allowed(self):
        """BYPASS mode allows all tools."""
        reg = ToolPermissionRegistry(PermissionMode.BYPASS)
        assert reg.check_permission("file_read") is True
        assert reg.check_permission("git_push") is True
        assert reg.check_permission("deploy") is True

    def test_accept_edits_mode(self):
        """ACCEPT_EDITS mode allows read + write, blocks execute+."""
        reg = ToolPermissionRegistry(PermissionMode.ACCEPT_EDITS)
        assert reg.check_permission("file_read") is True
        assert reg.check_permission("file_edit") is True
        assert reg.check_permission("shell_exec") is False
        assert reg.check_permission("deploy") is False

    def test_blocked_agent(self):
        """Blocked agents cannot use tools."""
        reg = ToolPermissionRegistry(PermissionMode.BYPASS)
        reg.register(ToolSpec(
            "dangerous_tool", ToolRisk.DESTRUCTIVE,
            blocked_agents={"untrusted-agent"},
        ))
        assert reg.check_permission("dangerous_tool", "untrusted-agent") is False
        assert reg.check_permission("dangerous_tool", "trusted-agent") is True

    def test_allowed_agents_whitelist(self):
        """Only whitelisted agents can use restricted tools."""
        reg = ToolPermissionRegistry(PermissionMode.BYPASS)
        reg.register(ToolSpec(
            "admin_tool", ToolRisk.WRITE,
            allowed_agents={"admin-agent"},
        ))
        assert reg.check_permission("admin_tool", "admin-agent") is True
        assert reg.check_permission("admin_tool", "random-agent") is False

    def test_unknown_tool_denied(self):
        """Unknown tools are denied by default."""
        reg = ToolPermissionRegistry()
        assert reg.check_permission("nonexistent_tool") is False

    def test_get_allowed_tools(self):
        """get_allowed_tools returns correct list for mode."""
        reg = ToolPermissionRegistry(PermissionMode.PLAN)
        allowed = reg.get_allowed_tools()
        assert "file_read" in allowed
        assert "shell_exec" not in allowed
