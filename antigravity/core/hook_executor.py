"""
Hook Executor - Hook Execution Logic
=====================================

Handles the actual execution of hooks including WIN-WIN-WIN validation
and privacy checks.

Usage:
    from antigravity.core.hook_executor import execute_hook, run_win3_gate
"""

import json
import re
from antigravity.core.hook_registry import Hook
from antigravity.core.types import DealContextDict, HookContextDict, HookResultDict, Win3ResultDict
from pathlib import Path
from typing import Optional

# Sensitive data patterns for privacy checks
SENSITIVE_PATTERNS = [
    r"sk-[a-zA-Z0-9]{20,}",  # OpenAI style keys
    r"ghp_[a-zA-Z0-9]{20,}",  # GitHub tokens
    r"password\s*[:=]\s*['\"][^'\"]+['\"]",  # Simple password fields
]


def run_win3_gate(deal: DealContextDict) -> Win3ResultDict:
    """
    Run WIN-WIN-WIN validation gate.
    Validates that all 3 parties (Anh, Agency, Client) have sufficient wins.

    Args:
        deal: Deal context with party win data

    Returns:
        Validation result with scores per party
    """
    result: Win3ResultDict = {"valid": True, "scores": {}, "message": "WIN-WIN-WIN validated"}

    # Check each party
    parties = ["anh", "agency", "client"]
    for party in parties:
        party_data = deal.get(party, {})
        # Score is count of truthy values in the party's dict
        score = sum(1 for v in party_data.values() if v)
        passed = score >= 2  # Threshold: at least 2 wins per party
        result["scores"][party] = {"score": score, "passed": passed}

        if not passed:
            result["valid"] = False

    if not result["valid"]:
        result["message"] = "WIN-WIN-WIN alignment failed. Each party needs at least 2 wins."

    return result


def check_privacy_block(context: Optional[HookContextDict]) -> tuple[bool, str]:
    """
    Check for sensitive data in context.

    Args:
        context: Data context to scan

    Returns:
        Tuple of (passed, message)
    """
    if not context:
        return True, ""

    text_dump = json.dumps(context, default=str).lower()

    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, text_dump):
            return False, "Sensitive data detected (API Key or Password)"

    return True, ""


def execute_hook(
    hook: Hook,
    context: Optional[HookContextDict] = None,
    base_path: Optional[Path] = None
) -> HookResultDict:
    """
    Execute a single hook.
    Currently simulates JS hooks with Python logic for performance.

    Args:
        hook: Hook definition to execute
        context: Data context to pass to hook
        base_path: Base path for resolving hook files

    Returns:
        Hook execution result
    """
    result: HookResultDict = {"hook": hook.name, "passed": True, "output": "", "error": None}

    try:
        if hook.name == "win-win-win-gate":
            if context and "deal" in context:
                win3_result = run_win3_gate(context.get("deal", {}))
                result["passed"] = win3_result["valid"]
                result["output"] = win3_result["message"]
            else:
                result["passed"] = True
                result["output"] = "Skipped (No deal context)"

        elif hook.name == "privacy-block":
            passed, message = check_privacy_block(context)
            result["passed"] = passed
            if not passed:
                result["output"] = f"[BLOCKED] {message}"

        # Other hooks are pass-through placeholders
        else:
            result["passed"] = True

    except Exception as e:
        result["passed"] = False
        result["error"] = str(e)
        result["output"] = f"Hook execution failed: {e}"

    return result
