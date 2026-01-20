"""
Registry Discovery - Command resolution and normalization.
"""
from typing import Optional, Tuple

from .store import COMMAND_REGISTRY, SHORTCUTS


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

    # 3. Check if it's just a suite
    if cmd_input in COMMAND_REGISTRY:
        return cmd_input, None

    return None, None
