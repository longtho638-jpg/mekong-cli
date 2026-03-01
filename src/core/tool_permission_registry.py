"""
Mekong CLI - Tool Permission Registry

Claude-code inspired permission model: tools are classified by risk level
and require explicit grants before execution. Integrates with Governance
layer for audit trail.

Patterns from anthropics/claude-code:
- Tool categories: read-only, write, destructive
- Permission modes: default, plan, bypass
- Allowlist/blocklist per agent
"""

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class ToolRisk(str, Enum):
    """Risk classification for tools."""

    READ_ONLY = "read_only"      # No side effects (file read, search, grep)
    WRITE = "write"              # Creates/modifies files
    EXECUTE = "execute"          # Runs shell commands
    DESTRUCTIVE = "destructive"  # Deletes, force-pushes, drops


class PermissionMode(str, Enum):
    """Execution permission modes (inspired by claude-code)."""

    DEFAULT = "default"          # Ask for write+ tools
    PLAN = "plan"                # Read-only tools only, no execution
    BYPASS = "bypass"            # Skip all permission checks (--dangerously-skip)
    ACCEPT_EDITS = "accept_edits"  # Auto-approve file edits, ask for execute+


@dataclass
class ToolSpec:
    """Specification for a registered tool."""

    name: str
    risk: ToolRisk
    description: str = ""
    allowed_agents: Set[str] = field(default_factory=lambda: {"*"})
    blocked_agents: Set[str] = field(default_factory=set)


class ToolPermissionRegistry:
    """Manages tool access permissions per agent and permission mode."""

    def __init__(self, mode: PermissionMode = PermissionMode.DEFAULT) -> None:
        self.mode = mode
        self._tools: Dict[str, ToolSpec] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        """Register built-in tool definitions."""
        defaults = [
            ToolSpec("file_read", ToolRisk.READ_ONLY, "Read file contents"),
            ToolSpec("file_search", ToolRisk.READ_ONLY, "Search files by pattern"),
            ToolSpec("grep", ToolRisk.READ_ONLY, "Search file contents"),
            ToolSpec("file_write", ToolRisk.WRITE, "Create or overwrite files"),
            ToolSpec("file_edit", ToolRisk.WRITE, "Edit existing files"),
            ToolSpec("shell_exec", ToolRisk.EXECUTE, "Execute shell commands"),
            ToolSpec("git_push", ToolRisk.DESTRUCTIVE, "Push to remote repository"),
            ToolSpec("git_reset", ToolRisk.DESTRUCTIVE, "Reset git state"),
            ToolSpec("deploy", ToolRisk.DESTRUCTIVE, "Deploy to production"),
        ]
        for tool in defaults:
            self._tools[tool.name] = tool

    def register(self, tool: ToolSpec) -> None:
        """Register a new tool specification."""
        self._tools[tool.name] = tool
        logger.debug(f"Registered tool: {tool.name} (risk={tool.risk.value})")

    def check_permission(
        self,
        tool_name: str,
        agent_name: str = "*",
    ) -> bool:
        """Check if a tool is allowed for an agent under current permission mode.

        Args:
            tool_name: Name of the tool to check.
            agent_name: Agent requesting access.

        Returns:
            True if permitted, False if blocked.
        """
        tool = self._tools.get(tool_name)
        if not tool:
            logger.warning(f"Unknown tool: {tool_name} — denying by default")
            return False

        # Agent-level blocks always win
        if agent_name in tool.blocked_agents:
            return False

        # Agent-level allows (wildcard or explicit)
        if "*" not in tool.allowed_agents and agent_name not in tool.allowed_agents:
            return False

        # Mode-based restrictions
        if self.mode == PermissionMode.PLAN:
            return tool.risk == ToolRisk.READ_ONLY

        if self.mode == PermissionMode.BYPASS:
            return True

        if self.mode == PermissionMode.ACCEPT_EDITS:
            return tool.risk in (ToolRisk.READ_ONLY, ToolRisk.WRITE)

        # DEFAULT mode: read_only and write auto-approved, execute+ needs review
        return tool.risk in (ToolRisk.READ_ONLY, ToolRisk.WRITE)

    def get_allowed_tools(self, agent_name: str = "*") -> List[str]:
        """List all tools available to an agent under current mode."""
        return [
            name for name in self._tools
            if self.check_permission(name, agent_name)
        ]

    def get_tool_spec(self, tool_name: str) -> Optional[ToolSpec]:
        """Get specification for a tool."""
        return self._tools.get(tool_name)

    def list_all(self) -> List[ToolSpec]:
        """List all registered tools."""
        return list(self._tools.values())
