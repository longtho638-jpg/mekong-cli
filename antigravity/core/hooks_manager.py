"""
Hooks Manager - Pre/Post Execution Hooks
=========================================

Orchestrates hooks that run before and after agent actions.
Integrates governance gates (WIN-WIN-WIN), security checks (Privacy Block),
and workflow automation.

Usage:
    from antigravity.core.hooks_manager import HooksManager

    hooks = HooksManager()
    if not hooks.run_pre_hooks("revenue", context):
        logger.warning("Aborted by hook")
"""

import logging
from antigravity.core.hook_executor import execute_hook, run_win3_gate
from antigravity.core.hook_registry import (
    HOOKS,
    SUITE_TRIGGERS,
    Hook,
    get_hooks_for_trigger,
    get_triggers_for_suite,
)
from antigravity.core.types import DealContextDict, HookContextDict, HookResultDict, Win3ResultDict
from pathlib import Path
from typing import Dict, List, Optional, Union

logger = logging.getLogger(__name__)


class HooksManager:
    """
    Hooks Manager - Orchestrates pre/post execution hooks for all agent actions.
    """

    def __init__(self, base_path: Union[str, Path] = "."):
        self.base_path = Path(base_path)
        self.enabled = True
        self.results: List[HookResultDict] = []

    def run_pre_hooks(self, suite: str, context: Optional[HookContextDict] = None) -> bool:
        """
        Run pre-execution hooks for a suite.

        Args:
            suite: The command suite being executed (e.g., 'revenue')
            context: Data context to pass to hooks

        Returns:
            True if all blocking hooks pass, False otherwise.
        """
        triggers = get_triggers_for_suite(suite)

        for trigger in triggers:
            hooks = get_hooks_for_trigger(trigger)
            for hook in hooks:
                result = execute_hook(hook, context, self.base_path)
                self.results.append(result)

                if hook.blocking and not result["passed"]:
                    logger.warning(f"[BLOCKED] Hook blocked execution: {hook.name}")
                    logger.warning(f"   Reason: {result.get('output', 'Unknown error')}")
                    return False

        return True

    def run_win3_gate(self, deal: DealContextDict) -> Win3ResultDict:
        """
        Run WIN-WIN-WIN validation gate.
        Validates that all 3 parties (Anh, Agency, Client) have sufficient wins.
        """
        return run_win3_gate(deal)

    def get_hooks_for_suite(self, suite: str) -> List[Hook]:
        """Get all hooks that will run for a specific suite."""
        triggers = get_triggers_for_suite(suite)
        hooks = []
        for trigger in triggers:
            hooks.extend(get_hooks_for_trigger(trigger))
        return hooks

    def print_hooks_status(self):
        """Print detailed hooks status."""
        logger.info("[HOOKS STATUS]")
        logger.info("=" * 50)

        total_hooks = sum(len(h) for h in HOOKS.values())
        logger.info(f"   Total Hooks: {total_hooks}")
        logger.info(f"   Enabled: {'Yes' if self.enabled else 'No'}")
        logger.info("")

        logger.info("[HOOKS BY TRIGGER]:")
        for trigger, hooks in HOOKS.items():
            logger.info(f"   {trigger}:")
            for h in hooks:
                status = "[Blocking]" if h.blocking else "[Info]"
                logger.info(f"      - {h.name:<20} {status}")

        logger.info("=" * 50)


def validate_deal(deal: Dict) -> bool:
    """Quick helper for deal validation."""
    result = run_win3_gate(deal)
    return result["valid"]
