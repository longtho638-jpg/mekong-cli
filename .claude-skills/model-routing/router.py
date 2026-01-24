#!/usr/bin/env python3
"""
🧠 CC CLI Model Router - Quota-Based Auto Selection

Integration with CC CLI settings.json to auto-select optimal model.
Based on opus_quota_strategy.md

Usage:
  python router.py "task description" [--record]
  python router.py --status
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal

# Paths
QUOTA_TRACKER = Path.home() / ".gemini" / "quota_tracker.json"

# Model types
ModelType = Literal["gemini-3-flash-lite", "gemini-3-flash", "gemini-3-pro-high", "claude-opus-4.5"]

# CC CLI model identifiers (with thinking mode)
MODEL_IDS = {
    "gemini-3-flash-lite": "gemini-2.5-flash-lite[1m]",
    "gemini-3-flash": "gemini-3-flash[1m]",
    "gemini-3-pro-high": "gemini-3-pro-high[1m]",
    "claude-opus-4.5": "claude-opus-4-5-thinking",
}

# Quota config (per 5h cycle)
CYCLE_HOURS = 5
QUOTA = {
    "opus": {"per_cycle": 15, "cc_cli_cycle": 30},
    "pro": {"per_cycle": 100},
    "flash": {"per_cycle": float("inf")},
}

# Task complexity keywords
COMPLEXITY = {
    "critical": ["security", "payment", "auth", "vulnerability", "production"],
    "high": ["architecture", "design", "debugging", "refactoring", "multi-file"],
    "medium": ["feature", "component", "api", "test", "integration"],
    "low": ["lint", "format", "docs", "simple", "read", "typo"],
}


def load_state() -> dict:
    """Load quota state from tracker file."""
    if QUOTA_TRACKER.exists():
        with open(QUOTA_TRACKER) as f:
            state = json.load(f)
            return _check_resets(state)
    return _fresh_state()


def _fresh_state() -> dict:
    now = datetime.now().isoformat()
    return {
        "cycle_start": now,
        "opus_used": 0,
        "pro_used": 0,
        "flash_used": 0,
    }


def _check_resets(state: dict) -> dict:
    """Reset counters if cycle expired."""
    now = datetime.now()
    cycle_start = datetime.fromisoformat(state.get("cycle_start", now.isoformat()))

    if now - cycle_start >= timedelta(hours=CYCLE_HOURS):
        return _fresh_state()
    return state


def save_state(state: dict) -> None:
    """Save quota state."""
    QUOTA_TRACKER.parent.mkdir(parents=True, exist_ok=True)
    with open(QUOTA_TRACKER, "w") as f:
        json.dump(state, f, indent=2)


def detect_complexity(task: str) -> str:
    """Detect task complexity from description."""
    task_lower = task.lower()
    for level, keywords in COMPLEXITY.items():
        if any(kw in task_lower for kw in keywords):
            return level
    return "medium"


def select_model(task: str, retry: int = 0, source: str = "cc_cli") -> tuple[ModelType, str]:
    """
    Select optimal model based on task and quota.

    Returns: (model_type, cc_cli_model_id)
    """
    state = load_state()
    complexity = detect_complexity(task)

    # Opus budget check
    opus_limit = QUOTA["opus"]["cc_cli_cycle"] if source == "cc_cli" else QUOTA["opus"]["per_cycle"]
    opus_remaining = opus_limit - state.get("opus_used", 0)
    pro_remaining = QUOTA["pro"]["per_cycle"] - state.get("pro_used", 0)

    # Retry escalation
    if retry >= 5 and opus_remaining > 0:
        return "claude-opus-4.5", MODEL_IDS["claude-opus-4.5"]
    if retry >= 3 and pro_remaining > 0:
        return "gemini-3-pro-high", MODEL_IDS["gemini-3-pro-high"]

    # Complexity-based selection
    if complexity == "critical" and opus_remaining > 0:
        return "claude-opus-4.5", MODEL_IDS["claude-opus-4.5"]
    if complexity in ["critical", "high"] and pro_remaining > 0:
        return "gemini-3-pro-high", MODEL_IDS["gemini-3-pro-high"]
    if complexity == "low":
        return "gemini-3-flash-lite", MODEL_IDS["gemini-3-flash-lite"]

    return "gemini-3-flash", MODEL_IDS["gemini-3-flash"]


def record_usage(model: ModelType) -> None:
    """Record model usage."""
    state = load_state()

    if model == "claude-opus-4.5":
        state["opus_used"] = state.get("opus_used", 0) + 1
    elif model == "gemini-3-pro-high":
        state["pro_used"] = state.get("pro_used", 0) + 1
    else:
        state["flash_used"] = state.get("flash_used", 0) + 1

    save_state(state)


def get_status() -> dict:
    """Get current quota status."""
    state = load_state()
    opus_limit = QUOTA["opus"]["cc_cli_cycle"]

    return {
        "cycle_start": state.get("cycle_start"),
        "opus": {
            "used": state.get("opus_used", 0),
            "limit": opus_limit,
            "remaining": opus_limit - state.get("opus_used", 0),
        },
        "pro": {
            "used": state.get("pro_used", 0),
            "limit": QUOTA["pro"]["per_cycle"],
        },
        "flash": {
            "used": state.get("flash_used", 0),
        },
    }


def main():
    if len(sys.argv) < 2 or sys.argv[1] == "--status":
        print("📊 Quota Status:")
        print(json.dumps(get_status(), indent=2))
        return

    task = sys.argv[1]
    retry = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 0

    model, model_id = select_model(task, retry)
    complexity = detect_complexity(task)

    print(f"🎯 Task: '{task[:50]}...' → Complexity: {complexity}")
    print(f"✨ Model: {model}")
    print(f"🔧 CC CLI ID: {model_id}")

    if "--record" in sys.argv:
        record_usage(model)
        print(f"📝 Recorded usage for {model}")


if __name__ == "__main__":
    main()
