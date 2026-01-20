"""
WIN-WIN-WIN validation logic.
"""
import logging
from typing import Dict, List

from .types import WinResult, WinType

logger = logging.getLogger(__name__)


def validate_win3_logic(
    action: str, anh_win: str, agency_win: str, startup_win: str
) -> WinResult:
    """
    Validate WIN-WIN-WIN alignment.

    CRITICAL: Every revenue action MUST benefit all 3 parties.
    """
    violations = []
    wins = {}

    # Check each win
    if not anh_win or anh_win.lower() in ["none", "n/a", ""]:
        violations.append("❌ Anh WIN missing - no owner benefit")
    else:
        wins[WinType.ANH_WIN] = anh_win

    if not agency_win or agency_win.lower() in ["none", "n/a", ""]:
        violations.append("❌ Agency WIN missing - no infrastructure benefit")
    else:
        wins[WinType.AGENCY_WIN] = agency_win

    if not startup_win or startup_win.lower() in ["none", "n/a", ""]:
        violations.append("❌ Startup WIN missing - no client value")
    else:
        wins[WinType.STARTUP_WIN] = startup_win

    is_valid = len(violations) == 0

    if is_valid:
        logger.info(f"✅ WIN-WIN-WIN validated for: {action}")
    else:
        logger.warning(f"⚠️ WIN-WIN-WIN FAILED for: {action}")
        for v in violations:
            logger.warning(f"   {v}")

    return WinResult(is_valid=is_valid, wins=wins, violations=violations)
