"""
🪝 Hooks Manager - Pre/Post Execution Hooks

Orchestrates hooks that run before and after agent actions.
Integrates with win-win-win-gate, privacy-block, etc.

Usage:
    from antigravity.core.hooks_manager import HooksManager
    hooks = HooksManager()
    hooks.run_pre_hooks("revenue", context)
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from pathlib import Path
import subprocess
import json


@dataclass
class Hook:
    """Single hook definition."""
    name: str
    file: str
    trigger: str  # pre, post
    category: str  # revenue, code, research, session
    blocking: bool = True  # If True, failure blocks execution


# Hook Registry
HOOKS: Dict[str, List[Hook]] = {
    "pre_revenue": [
        Hook("win-win-win-gate", ".claude/hooks/win-win-win-gate.cjs", "pre", "revenue", blocking=True),
    ],
    "pre_code": [
        Hook("dev-rules-reminder", ".claude/hooks/dev-rules-reminder.cjs", "pre", "code", blocking=False),
        Hook("privacy-block", ".claude/hooks/privacy-block.cjs", "pre", "code", blocking=True),
    ],
    "pre_research": [
        Hook("scout-block", ".claude/hooks/scout-block.cjs", "pre", "research", blocking=False),
    ],
    "session_start": [
        Hook("session-init", ".claude/hooks/session-init.cjs", "pre", "session", blocking=False),
    ],
    "spawn_subagent": [
        Hook("subagent-init", ".claude/hooks/subagent-init.cjs", "pre", "subagent", blocking=False),
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
    
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.enabled = True
        self.results: List[Dict] = []
    
    def run_pre_hooks(self, suite: str, context: Dict[str, Any] = None) -> bool:
        """
        Run pre-execution hooks for a suite.
        
        Returns True if all blocking hooks pass.
        """
        triggers = SUITE_TRIGGERS.get(suite, [])
        
        for trigger in triggers:
            hooks = HOOKS.get(trigger, [])
            for hook in hooks:
                result = self._run_hook(hook, context)
                self.results.append(result)
                
                if hook.blocking and not result["passed"]:
                    print(f"❌ Hook blocked: {hook.name}")
                    return False
        
        return True
    
    def run_win3_gate(self, deal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run WIN-WIN-WIN validation gate.
        """
        result = {
            "valid": True,
            "scores": {},
            "message": "WIN-WIN-WIN validated"
        }
        
        # Check each party
        parties = ["anh", "agency", "client"]
        for party in parties:
            party_data = deal.get(party, {})
            score = sum(1 for v in party_data.values() if v)
            passed = score >= 2
            result["scores"][party] = {"score": score, "passed": passed}
            if not passed:
                result["valid"] = False
        
        if not result["valid"]:
            result["message"] = "⚠️ WIN-WIN-WIN alignment needed"
        
        return result
    
    def _run_hook(self, hook: Hook, context: Dict = None) -> Dict:
        """Run a single hook."""
        hook_path = self.base_path / hook.file
        
        result = {
            "hook": hook.name,
            "passed": True,
            "output": "",
            "error": None
        }
        
        # For JS hooks, we simulate the check
        # In real impl, would run: node hook_path --context json
        if hook.name == "win-win-win-gate" and context:
            win3_result = self.run_win3_gate(context.get("deal", {}))
            result["passed"] = win3_result["valid"]
            result["output"] = win3_result["message"]
        elif hook.name == "privacy-block":
            # Check for sensitive data
            if context:
                text = str(context)
                if any(x in text.lower() for x in ["password", "secret", "api_key"]):
                    result["passed"] = False
                    result["output"] = "🔒 Sensitive data detected"
        else:
            # Default: pass
            result["passed"] = True
        
        return result
    
    def get_hooks_for_suite(self, suite: str) -> List[Hook]:
        """Get all hooks that will run for a suite."""
        triggers = SUITE_TRIGGERS.get(suite, [])
        hooks = []
        for trigger in triggers:
            hooks.extend(HOOKS.get(trigger, []))
        return hooks
    
    def print_hooks_status(self):
        """Print hooks status."""
        print("\n🪝 HOOKS STATUS")
        print("═" * 50)
        
        total_hooks = sum(len(h) for h in HOOKS.values())
        print(f"   Total Hooks: {total_hooks}")
        print(f"   Enabled: {'Yes' if self.enabled else 'No'}")
        print()
        
        print("📋 HOOKS BY TRIGGER:")
        for trigger, hooks in HOOKS.items():
            print(f"   {trigger}: {[h.name for h in hooks]}")
        
        print("═" * 50)


def validate_deal(deal: Dict) -> bool:
    """Quick deal validation."""
    manager = HooksManager()
    result = manager.run_win3_gate(deal)
    return result["valid"]
