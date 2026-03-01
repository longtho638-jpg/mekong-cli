"""
Mekong Daemon - Post-Mission Gate

Verifies mission success by running configurable check commands.
"""

import logging
from typing import List, Optional
from .executor import MissionExecutor, MissionResult

logger = logging.getLogger(__name__)


class PostGate:
    """
    Post-mission verification gate.

    Runs a list of verify commands after mission completion.
    All must pass (exit 0) for the gate to pass.

    Args:
        verify_commands: Shell commands to run as checks
        working_dir: Directory to run checks in
    """

    def __init__(
        self,
        verify_commands: Optional[List[str]] = None,
        working_dir: str = ".",
    ) -> None:
        self._commands = verify_commands or []
        self._executor = MissionExecutor(working_dir=working_dir, timeout=120)

    def check(self) -> bool:
        """Run all verify commands. Returns True if all pass."""
        if not self._commands:
            return True

        for cmd in self._commands:
            result = self._executor.run_shell(cmd)
            if not result.success:
                logger.warning("Gate failed: %s (exit %d)", cmd, result.exit_code)
                return False
            logger.debug("Gate passed: %s", cmd)
        return True

    def check_detailed(self) -> List[MissionResult]:
        """Run all verify commands and return detailed results."""
        results = []
        for cmd in self._commands:
            result = self._executor.run_shell(cmd)
            results.append(result)
        return results


__all__ = ["PostGate"]
