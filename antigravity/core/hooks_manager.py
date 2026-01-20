"""
🪝 Hooks Manager - Pre/Post Execution Hooks
===========================================

Orchestrates hooks that run before and after agent actions.
Integrates governance gates (WIN-WIN-WIN), security checks (Privacy Block),
and workflow automation.

Usage:
    from antigravity.core.hooks_manager import HooksManager

    hooks = HooksManager()
    if not hooks.run_pre_hooks("revenue", context):
        print("Aborted by hook")
"""

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Union

from antigravity.core.types import HookResultDict, Win3ResultDict, HookContextDict, DealContextDict

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


# Hook Registry
# Maps trigger_point -> List[Hook]
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


# Suite → Hook trigger mapping
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


class HooksManager:
    """
    🪝 Hooks Manager

    Orchestrates pre/post execution hooks for all agent actions.
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
        triggers = SUITE_TRIGGERS.get(suite, [])

        for trigger in triggers:
            hooks = HOOKS.get(trigger, [])
            for hook in hooks:
                result = self._run_hook(hook, context)
                self.results.append(result)

                if hook.blocking and not result["passed"]:
                    print(f"❌ Hook blocked execution: {hook.name}")
                    print(f"   Reason: {result.get('output', 'Unknown error')}")
                    return False

        return True

    def run_win3_gate(self, deal: DealContextDict) -> Win3ResultDict:
        """
        Run WIN-WIN-WIN validation gate (Python Implementation).
        Validates that all 3 parties (Anh, Agency, Client) have sufficient wins.
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
            result["message"] = "⚠️ WIN-WIN-WIN alignment failed. Each party needs at least 2 wins."

        return result

    def _run_hook(self, hook: Hook, context: Optional[HookContextDict] = None) -> HookResultDict:
        """
        Run a single hook.
        Currently simulates JS hooks with Python logic for performance.
        """
        # Ensure hook file path is resolved relative to project root
        self.base_path / hook.file

        result: HookResultDict = {"hook": hook.name, "passed": True, "output": "", "error": None}

        # Simulated Hook Execution
        # In a full Node.js environment, we would subprocess.run(['node', hook_path])
        try:
            if hook.name == "win-win-win-gate":
                if context and "deal" in context:
                    win3_result = self.run_win3_gate(context.get("deal", {}))
                    result["passed"] = win3_result["valid"]
                    result["output"] = win3_result["message"]
                else:
                    # Pass if no deal context provided (or fail safe?)
                    result["passed"] = True
                    result["output"] = "Skipped (No deal context)"

            elif hook.name == "privacy-block":
                # Check for sensitive data patterns
                if context:
                    text_dump = json.dumps(context, default=str).lower()

                    # Simple regex patterns for secrets
                    patterns = [
                        r"sk-[a-zA-Z0-9]{20,}",  # OpenAI style keys
                        r"ghp_[a-zA-Z0-9]{20,}",  # GitHub tokens
                        r"password\s*[:=]\s*['\"][^'\"]+['\"]",  # Simple password fields
                    ]

                    for pattern in patterns:
                        if re.search(pattern, text_dump):
                            result["passed"] = False
                            result["output"] = "🔒 Sensitive data detected (API Key or Password)"
                            break

            # Other hooks are currently pass-through placeholders
            else:
                result["passed"] = True

        except Exception as e:
            result["passed"] = False
            result["error"] = str(e)
            result["output"] = f"Hook execution failed: {e}"

        return result

    def get_hooks_for_suite(self, suite: str) -> List[Hook]:
        """Get all hooks that will run for a specific suite."""
        triggers = SUITE_TRIGGERS.get(suite, [])
        hooks = []
        for trigger in triggers:
            hooks.extend(HOOKS.get(trigger, []))
        return hooks

    def print_hooks_status(self):
        """Print detailed hooks status."""
        print("\n🪝 HOOKS STATUS")
        print("═" * 50)

        total_hooks = sum(len(h) for h in HOOKS.values())
        print(f"   Total Hooks: {total_hooks}")
        print(f"   Enabled: {'Yes' if self.enabled else 'No'}")
        print()

        print("📋 HOOKS BY TRIGGER:")
        for trigger, hooks in HOOKS.items():
            print(f"   {trigger}:")
            for h in hooks:
                status = "🛑 Blocking" if h.blocking else "ℹ️ Info"
                print(f"      • {h.name:<20} [{status}]")

        print("═" * 50)


def validate_deal(deal: Dict) -> bool:
    """Quick helper for deal validation."""
    manager = HooksManager()
    result = manager.run_win3_gate(deal)
    return result["valid"]
