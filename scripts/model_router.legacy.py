"""
🧠 Model Router - Quota-Based Auto Selection
Based on opus_quota_strategy.md

Architecture:
Antigravity Proxy → Model Router → quota_tracker.json
                                 ├── Check cycle position
                                 ├── Check daily budget
                                 └── Select optimal model
"""

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Literal, TypedDict

# Paths
QUOTA_TRACKER_PATH = Path.home() / ".gemini" / "quota_tracker.json"

# Model definitions
ModelType = Literal["gemini-3-flash-lite", "gemini-3-flash", "gemini-3-pro-high", "claude-opus-4.5"]

# Quota limits per 5h cycle (from opus_quota_strategy.md)
CYCLE_DURATION_HOURS = 5
DAILY_CYCLES = 24 / CYCLE_DURATION_HOURS  # ~4.8

QUOTA_LIMITS = {
    "claude-opus-4.5": {
        "per_cycle": 15,  # Antigravity
        "cc_cli_per_cycle": 30,  # CC CLI delegation
        "daily_reserve": 24,
    },
    "gemini-3-pro-high": {
        "per_cycle": 100,  # Higher limit
        "daily_reserve": 50,
    },
    "gemini-3-flash": {
        "per_cycle": 500,  # Very high
        "daily_reserve": 100,
    },
    "gemini-3-flash-lite": {
        "per_cycle": float("inf"),  # Unlimited
        "daily_reserve": 0,
    },
}

# Task complexity mapping
TASK_COMPLEXITY = {
    "critical": ["security", "architecture", "payment", "billing", "authentication"],
    "high": ["debugging", "refactoring", "multi-file", "complex"],
    "medium": ["feature", "component", "api", "test"],
    "low": ["lint", "format", "docs", "simple", "read"],
}


class QuotaState(TypedDict):
    cycle_start: str
    daily_start: str
    opus_used_cycle: int
    opus_used_daily: int
    pro_used_cycle: int
    pro_used_daily: int
    flash_used_cycle: int
    flash_used_daily: int


def load_quota_state() -> QuotaState:
    """Load quota state from tracker file."""
    if QUOTA_TRACKER_PATH.exists():
        with open(QUOTA_TRACKER_PATH) as f:
            state = json.load(f)
            # Check if cycle/day has reset
            return _check_resets(state)
    return _create_fresh_state()


def _create_fresh_state() -> QuotaState:
    """Create a fresh quota state."""
    now = datetime.now().isoformat()
    return {
        "cycle_start": now,
        "daily_start": now,
        "opus_used_cycle": 0,
        "opus_used_daily": 0,
        "pro_used_cycle": 0,
        "pro_used_daily": 0,
        "flash_used_cycle": 0,
        "flash_used_daily": 0,
    }


def _check_resets(state: QuotaState) -> QuotaState:
    """Check and reset quotas if cycle/day has passed."""
    now = datetime.now()

    # Check cycle reset (5 hours)
    cycle_start = datetime.fromisoformat(state["cycle_start"])
    if now - cycle_start >= timedelta(hours=CYCLE_DURATION_HOURS):
        state["cycle_start"] = now.isoformat()
        state["opus_used_cycle"] = 0
        state["pro_used_cycle"] = 0
        state["flash_used_cycle"] = 0

    # Check daily reset
    daily_start = datetime.fromisoformat(state["daily_start"])
    if now.date() > daily_start.date():
        state["daily_start"] = now.isoformat()
        state["opus_used_daily"] = 0
        state["pro_used_daily"] = 0
        state["flash_used_daily"] = 0

    return state


def save_quota_state(state: QuotaState) -> None:
    """Save quota state to tracker file."""
    QUOTA_TRACKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(QUOTA_TRACKER_PATH, "w") as f:
        json.dump(state, f, indent=2)


def detect_task_complexity(task_description: str) -> str:
    """Detect task complexity from description."""
    task_lower = task_description.lower()

    for complexity, keywords in TASK_COMPLEXITY.items():
        if any(kw in task_lower for kw in keywords):
            return complexity

    return "medium"  # Default


def select_model(
    task_description: str,
    retry_count: int = 0,
    source: str = "antigravity",  # "antigravity" or "cc_cli"
) -> ModelType:
    """
    Select optimal model based on:
    1. Task complexity
    2. Current quota state
    3. Retry escalation

    Returns the selected model name.
    """
    state = load_quota_state()
    complexity = detect_task_complexity(task_description)

    # Opus limits based on source
    opus_limit = (
        QUOTA_LIMITS["claude-opus-4.5"]["cc_cli_per_cycle"]
        if source == "cc_cli"
        else QUOTA_LIMITS["claude-opus-4.5"]["per_cycle"]
    )
    opus_remaining = opus_limit - state["opus_used_cycle"]
    pro_remaining = QUOTA_LIMITS["gemini-3-pro-high"]["per_cycle"] - state["pro_used_cycle"]

    # Escalation on retries
    if retry_count >= 5 and opus_remaining > 0:
        return "claude-opus-4.5"
    elif retry_count >= 3 and pro_remaining > 0:
        return "gemini-3-pro-high"

    # Complexity-based selection
    if complexity == "critical" and opus_remaining > 0:
        return "claude-opus-4.5"
    elif complexity in ["critical", "high"] and pro_remaining > 0:
        return "gemini-3-pro-high"
    elif complexity == "low":
        return "gemini-3-flash-lite"
    else:
        return "gemini-3-flash"


def record_usage(model: ModelType) -> None:
    """Record model usage in quota tracker."""
    state = load_quota_state()

    if model == "claude-opus-4.5":
        state["opus_used_cycle"] += 1
        state["opus_used_daily"] += 1
    elif model == "gemini-3-pro-high":
        state["pro_used_cycle"] += 1
        state["pro_used_daily"] += 1
    else:
        state["flash_used_cycle"] += 1
        state["flash_used_daily"] += 1

    save_quota_state(state)


def get_quota_summary() -> dict:
    """Get current quota summary for monitoring."""
    state = load_quota_state()

    opus_limit = QUOTA_LIMITS["claude-opus-4.5"]["per_cycle"]
    pro_limit = QUOTA_LIMITS["gemini-3-pro-high"]["per_cycle"]

    return {
        "opus": {
            "used_cycle": state["opus_used_cycle"],
            "limit_cycle": opus_limit,
            "remaining_cycle": opus_limit - state["opus_used_cycle"],
            "used_daily": state["opus_used_daily"],
            "utilization_pct": round(state["opus_used_cycle"] / opus_limit * 100, 1),
        },
        "pro": {
            "used_cycle": state["pro_used_cycle"],
            "limit_cycle": pro_limit,
            "remaining_cycle": pro_limit - state["pro_used_cycle"],
            "used_daily": state["pro_used_daily"],
        },
        "flash": {
            "used_cycle": state["flash_used_cycle"],
            "used_daily": state["flash_used_daily"],
        },
        "cycle_info": {
            "start": state["cycle_start"],
            "duration_hours": CYCLE_DURATION_HOURS,
        },
    }


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python model_router.py <task_description> [retry_count] [source]")
        print("\nCurrent quota summary:")
        summary = get_quota_summary()
        print(json.dumps(summary, indent=2))
        sys.exit(0)

    task = sys.argv[1]
    retries = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    source = sys.argv[3] if len(sys.argv) > 3 else "antigravity"

    model = select_model(task, retries, source)
    print(f"Selected model: {model}")

    # Record if actually used (pass --record flag)
    if "--record" in sys.argv:
        record_usage(model)
        print(f"Recorded usage for {model}")


# =============================================================================
# 🔄 AUTO RETRY WITH MODEL ESCALATION
# =============================================================================

import functools
from typing import Any, Callable

MAX_RETRIES = 5
RETRY_DELAYS = [1, 2, 4, 8, 16]  # Exponential backoff in seconds


def auto_retry(func: Callable) -> Callable:
    """
    Decorator for auto-retry with model escalation.
    Usage: @auto_retry
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        task_desc = kwargs.get("task_description", args[0] if args else "unknown")
        source = kwargs.get("source", "antigravity")

        for attempt in range(MAX_RETRIES + 1):
            try:
                # Select model with retry count for escalation
                model = select_model(task_desc, retry_count=attempt, source=source)

                if attempt > 0:
                    print(f"🔄 Retry {attempt}/{MAX_RETRIES} - Escalated to: {model}")
                    time.sleep(RETRY_DELAYS[min(attempt - 1, len(RETRY_DELAYS) - 1)])

                # Execute with selected model
                kwargs["model"] = model
                result = func(*args, **kwargs)

                # Record successful usage
                record_usage(model)
                return result

            except Exception as e:
                print(f"❌ Attempt {attempt + 1} failed: {e}")

                if attempt >= MAX_RETRIES:
                    print(f"💀 Max retries ({MAX_RETRIES}) exceeded. Giving up.")
                    raise

        return None

    return wrapper


def execute_with_retry(
    task_description: str, execute_fn: Callable[..., Any], source: str = "antigravity", **kwargs
) -> Any:
    """
    Execute a function with auto-retry and model escalation.

    Args:
        task_description: Description of the task
        execute_fn: Function to execute (receives 'model' as kwarg)
        source: "antigravity" or "cc_cli"
        **kwargs: Additional arguments for execute_fn

    Returns:
        Result from execute_fn

    Example:
        result = execute_with_retry(
            "Fix security vulnerability",
            lambda model: call_api(model, prompt),
            source="cc_cli"
        )
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            model = select_model(task_description, retry_count=attempt, source=source)

            if attempt > 0:
                delay = RETRY_DELAYS[min(attempt - 1, len(RETRY_DELAYS) - 1)]
                print(f"🔄 Retry {attempt}/{MAX_RETRIES} → {model} (wait {delay}s)")
                time.sleep(delay)
            else:
                print(f"🎯 Selected: {model}")

            result = execute_fn(model=model, **kwargs)
            record_usage(model)
            print(f"✅ Success with {model}")
            return result

        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {type(e).__name__}: {e}")

            if attempt >= MAX_RETRIES:
                print(f"💀 Max retries exceeded. Last model: {model}")
                raise

    return None


def get_retry_status() -> dict:
    """Get retry configuration status."""
    return {
        "max_retries": MAX_RETRIES,
        "delays_seconds": RETRY_DELAYS,
        "escalation_path": [
            "gemini-3-flash-lite",
            "gemini-3-flash",
            "gemini-3-pro-high",
            "claude-opus-4.5 (retry 5+)",
        ],
    }
