"""
🧠 Model Router - Complexity-Based Selection (Proxy Delegated)
Adapts task description to optimal model, delegating quota management to Antigravity Proxy.

Architecture:
Caller → Model Router (this script) → Model Name
Caller → Antigravity Proxy (http://localhost:8080) [Enforces Quotas]
"""

import sys
from typing import Dict, List, Literal

# Model definitions matching Antigravity Proxy capabilities
ModelType = Literal[
    "gemini-2.5-flash-lite", "gemini-3-flash", "gemini-3-pro-high", "claude-opus-4-5-thinking"
]

# Task complexity mapping
TASK_COMPLEXITY: Dict[str, List[str]] = {
    "critical": [
        "security",
        "architecture",
        "payment",
        "billing",
        "authentication",
        "audit",
        "production",
    ],
    "high": ["debugging", "refactoring", "multi-file", "complex", "analysis", "optimize"],
    "medium": ["feature", "component", "api", "test", "update", "verify"],
    "low": ["lint", "format", "docs", "simple", "read", "typo", "check"],
}


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
    source: str = "antigravity",
) -> ModelType:
    """
    Select optimal model based on complexity and retry count.
    Quota enforcement is handled by the Antigravity Proxy.
    """
    complexity = detect_task_complexity(task_description)

    # Escalation on retries
    if retry_count >= 5:
        return "claude-opus-4-5-thinking"
    elif retry_count >= 3:
        return "gemini-3-pro-high"

    # Complexity-based selection
    if complexity == "critical":
        return "claude-opus-4-5-thinking"
    elif complexity == "high":
        return "gemini-3-pro-high"
    elif complexity == "low":
        return "gemini-2.5-flash-lite"
    else:
        return "gemini-3-pro-high"


# CLI interface
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python model_router.py <task_description> [retry_count] [source]")
        print("gemini-3-pro-high")  # Default fallback output
        sys.exit(0)

    task = sys.argv[1]
    retries = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    source = sys.argv[3] if len(sys.argv) > 3 else "antigravity"

    model = select_model(task, retries, source)
    print(model)
