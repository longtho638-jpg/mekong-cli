"""
Command Registry Package
========================

Central routing table for Agency OS. Maps CLI commands to their
backing Python modules, classes, and the ideal AI agents for execution.

Key Hierarchies:
- Suites: Logical groupings of business functions (Revenue, Dev, Strategy).
- Subcommands: Specific tasks within a suite.
- Shortcuts: One-word aliases for common operations.

Binh Phap: Phap (Process) - Maintaining the chain of command.
"""

from .api import (
    get_agent_for_command,
    get_command_metadata,
    list_subcommands,
    list_suites,
    print_command_map,
    resolve_command,
)
from .commands import COMMAND_REGISTRY, SHORTCUTS

__all__ = [
    # Data
    "COMMAND_REGISTRY",
    "SHORTCUTS",
    # API functions
    "get_command_metadata",
    "resolve_command",
    "get_agent_for_command",
    "list_suites",
    "list_subcommands",
    "print_command_map",
]
