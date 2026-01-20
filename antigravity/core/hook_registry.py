"""
Hook Registry - Hook Definitions and Registration
==================================================

Contains hook dataclass and static registries for trigger mapping.

Usage:
    from antigravity.core.hook_registry import Hook, HOOKS, SUITE_TRIGGERS
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

# Base path for hooks
HOOKS_BASE_DIR = Path(".claude/hooks")


@dataclass
class Hook:
    """
    Single hook definition.

    Attributes:
        name: Unique identifier for the hook
        file: Relative path to the hook script (e.g., .cjs or .py)
        trigger: When it runs (pre/post)
        category: Domain category (revenue, code, research, session)
        blocking: If True, failure halts the entire workflow
    """

    name: str
    file: Path
    trigger: str
    category: str
    blocking: bool = True


# Hook Registry - Maps trigger_point -> List[Hook]
HOOKS: Dict[str, List[Hook]] = {
    "pre_revenue": [
        Hook(
            "win-win-win-gate",
            HOOKS_BASE_DIR / "win-win-win-gate.cjs",
            "pre",
            "revenue",
            blocking=True,
        ),
    ],
    "pre_code": [
        Hook(
            "dev-rules-reminder",
            HOOKS_BASE_DIR / "dev-rules-reminder.cjs",
            "pre",
            "code",
            blocking=False,
        ),
        Hook("privacy-block", HOOKS_BASE_DIR / "privacy-block.cjs", "pre", "code", blocking=True),
    ],
    "pre_research": [
        Hook("scout-block", HOOKS_BASE_DIR / "scout-block.cjs", "pre", "research", blocking=False),
    ],
    "session_start": [
        Hook("session-init", HOOKS_BASE_DIR / "session-init.cjs", "pre", "session", blocking=False),
    ],
    "spawn_subagent": [
        Hook(
            "subagent-init", HOOKS_BASE_DIR / "subagent-init.cjs", "pre", "subagent", blocking=False
        ),
    ],
}


# Suite -> Hook trigger mapping
SUITE_TRIGGERS: Dict[str, List[str]] = {
    "revenue": ["pre_revenue"],
    "dev": ["pre_code"],
    "fix": ["pre_code"],
    "design": ["pre_code"],
    "content": [],
    "docs": [],
    "git": [],
    "strategy": [],
    "crm": ["pre_revenue"],
    "analytics": [],
    "agency": ["pre_revenue"],
    "startup": ["pre_revenue"],
}


def get_hooks_for_trigger(trigger: str) -> List[Hook]:
    """Get hooks registered for a specific trigger point."""
    return HOOKS.get(trigger, [])


def get_triggers_for_suite(suite: str) -> List[str]:
    """Get trigger points for a command suite."""
    return SUITE_TRIGGERS.get(suite, [])
