"""
Registry API - Command resolution and lookup functions.
========================================================

Provides functions for querying and resolving commands from the registry.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

from .commands import COMMAND_REGISTRY, SHORTCUTS

logger = logging.getLogger(__name__)


def get_command_metadata(suite: str, sub: str) -> Optional[Dict[str, Any]]:
    """Retrieves all configuration data for a specific command."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return None
    return suite_data.get("subcommands", {}).get(sub.lower())


def resolve_command(cmd_input: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Normalizes command input. Supports shortcuts or 'suite:sub' format.
    Returns: (suite, subcommand)
    """
    # 1. Check if it's a direct shortcut
    if cmd_input in SHORTCUTS:
        suite, sub = SHORTCUTS[cmd_input].split(":")
        return suite, sub

    # 2. Check if it's suite:sub format
    if ":" in cmd_input:
        parts = cmd_input.split(":")
        return parts[0], parts[1]

    # 3. Check if it's just a suite (default to list subcommands?)
    if cmd_input in COMMAND_REGISTRY:
        return cmd_input, None

    return None, None


def get_agent_for_command(suite: str, sub: str) -> str:
    """Identifies the best agent to lead a specific command."""
    meta = get_command_metadata(suite, sub)
    if meta and "agent" in meta:
        return meta["agent"]

    # Default fallback agents by suite
    fallbacks = {
        "dev": "fullstack-developer",
        "revenue": "money-maker",
        "strategy": "binh-phap-strategist",
        "crm": "client-magnet",
        "content": "content-factory",
    }
    return fallbacks.get(suite, "assistant")


def list_suites() -> List[str]:
    """Returns all available top-level command categories."""
    return sorted(list(COMMAND_REGISTRY.keys()))


def list_subcommands(suite: str) -> List[str]:
    """Returns all available subcommands for a specific category."""
    suite_data = COMMAND_REGISTRY.get(suite.lower())
    if not suite_data:
        return []
    return sorted(list(suite_data.get("subcommands", {}).keys()))


def print_command_map():
    """Visualizes the command hierarchy for the user."""
    print("\n" + "=" * 60)
    print("|" + "AGENCY OS - COMMAND REGISTRY".center(58) + "|")
    print("=" * 60)

    for suite_id in list_suites():
        s = COMMAND_REGISTRY[suite_id]
        print(f"\n  [{s['emoji']}] {suite_id.upper()} - {s['description']}")
        for sub in list_subcommands(suite_id):
            meta = s["subcommands"][sub]
            agent_tag = f"[{meta.get('agent', 'system')}]"
            print(f"     - {sub:<15} {agent_tag}")

    print("\n" + "-" * 60)
    print("  Try using shortcuts: " + ", ".join(list(SHORTCUTS.keys())[:8]) + "...")
    print("=" * 60 + "\n")
