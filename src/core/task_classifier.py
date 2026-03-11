"""ALGO 1 — Task Classifier.

Classifies incoming goals into TaskProfile for routing decisions.
The Brain of the Hybrid LLM Router.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass
class TaskProfile:
    """Classification result for a goal."""

    complexity: Literal["simple", "standard", "complex"]
    domain: Literal["code", "creative", "ops", "analysis", "sales", "support"]
    agent_role: Literal["cto", "cmo", "coo", "cfo", "cs", "sales", "editor", "data"]
    requires_reasoning: bool
    requires_creativity: bool
    data_sensitivity: Literal["public", "internal", "sensitive"]
    estimated_tokens: int
    mcu_cost: int
    preferred_tier: Literal["local", "api_cheap", "api_mid", "api_best"]


# Domain signal keywords
DOMAIN_SIGNALS: dict[str, list[str]] = {
    "code": [
        "code", "implement", "fix", "deploy", "bug", "api", "function",
        "class", "test", "refactor", "build", "script", "database",
    ],
    "creative": [
        "write", "content", "blog", "email", "copy", "post", "announce",
        "marketing", "social", "newsletter", "landing", "write",
    ],
    "ops": [
        "monitor", "check", "status", "health", "backup", "cron",
        "alert", "restart", "log", "metrics", "uptime",
    ],
    "analysis": [
        "report", "analyze", "chart", "revenue", "usage", "trend",
        "summary", "dashboard", "insight", "data", "stats",
    ],
    "sales": [
        "upsell", "churn", "follow-up", "lead", "convert", "offer",
        "trial", "upgrade", "retention", "email sequence",
    ],
    "support": [
        "ticket", "user report", "error message", "help", "faq",
        "refund", "complaint", "confused", "error",
    ],
}

DOMAIN_TO_AGENT: dict[str, str] = {
    "code": "cto",
    "creative": "cmo",
    "ops": "coo",
    "analysis": "data",
    "sales": "sales",
    "support": "cs",
}

SENSITIVITY_KEYWORDS = {
    "sensitive": [
        "password", "secret", "key", "token", "private", "confidential",
    ],
    "internal": [
        "customer", "user data", "tenant", "billing",
    ],
}

MCU_MAP = {"simple": 1, "standard": 3, "complex": 5}

TOKEN_ESTIMATE = {
    "simple": {"input": 800, "output": 400},
    "standard": {"input": 2000, "output": 1500},
    "complex": {"input": 5000, "output": 3000},
}


def _count_signals(goal_lower: str, keywords: list[str]) -> int:
    """Count how many signal keywords appear in the goal."""
    return sum(1 for kw in keywords if kw in goal_lower)


def _detect_domain(goal_lower: str) -> str:
    """Step 1: Detect domain from goal keywords."""
    scores = {
        domain: _count_signals(goal_lower, keywords)
        for domain, keywords in DOMAIN_SIGNALS.items()
    }
    best = max(scores, key=scores.get)  # type: ignore[arg-type]
    if scores[best] == 0:
        return "code"  # default
    return best


def _assign_agent(goal_lower: str, domain: str) -> str:
    """Step 2: Assign agent role with override rules."""
    agent = DOMAIN_TO_AGENT.get(domain, "cto")

    # Override rules
    if any(kw in goal_lower for kw in ["changelog", "docs", "tutorial"]):
        agent = "editor"
    if any(kw in goal_lower for kw in ["revenue", "polar", "invoice"]):
        agent = "cfo"
    if "marketing" in goal_lower and "email" in goal_lower:
        agent = "cmo"

    return agent


def _score_complexity(goal_lower: str, domain: str) -> str:
    """Step 3: Score complexity from goal signals."""
    score = 0
    word_count = len(goal_lower.split())

    # Word count heuristic
    if word_count < 15:
        score += 1
    elif word_count <= 40:
        score += 2
    else:
        score += 3

    # File scope signals
    if any(kw in goal_lower for kw in ["file", "module", "system", "architecture"]):
        score += 2
    if any(kw in goal_lower for kw in ["multiple", "several", "all"]):
        score += 1

    # Domain weight
    if domain == "code":
        score += 2
    elif domain == "ops":
        score -= 1
    elif domain == "analysis":
        score += 1

    # Map score → complexity
    if score <= 2:
        return "simple"
    elif score <= 4:
        return "standard"
    return "complex"


def _detect_reasoning(goal_lower: str, domain: str, complexity: str) -> bool:
    """Step 4: Determine if task requires reasoning."""
    if domain in ("code", "sales"):
        return True
    if complexity == "complex":
        return True
    reasoning_kws = ["design", "architecture", "strategy", "why"]
    return any(kw in goal_lower for kw in reasoning_kws)


def _detect_creativity(goal_lower: str, domain: str) -> bool:
    """Step 4: Determine if task requires creativity."""
    if domain in ("creative", "sales"):
        return True
    creativity_kws = ["engaging", "compelling", "creative", "catchy"]
    return any(kw in goal_lower for kw in creativity_kws)


def _detect_sensitivity(goal_lower: str) -> str:
    """Step 5: Detect data sensitivity level."""
    for kw in SENSITIVITY_KEYWORDS["sensitive"]:
        if kw in goal_lower:
            return "sensitive"
    for kw in SENSITIVITY_KEYWORDS["internal"]:
        if kw in goal_lower:
            return "internal"
    return "public"


def _determine_tier(
    complexity: str,
    data_sensitivity: str,
    requires_reasoning: bool,
) -> str:
    """Determine preferred model tier."""
    if data_sensitivity == "sensitive":
        return "local"
    if complexity == "simple" and not requires_reasoning:
        return "api_cheap"
    if complexity == "standard":
        return "api_mid"
    return "api_best"


def classify_task(goal: str, context: dict | None = None) -> TaskProfile:
    """Classify a goal into a TaskProfile.

    Args:
        goal: Natural language goal string.
        context: Optional context dict (tenant_id, history, etc.).

    Returns:
        TaskProfile with all routing information.
    """
    goal_lower = goal.lower()

    domain = _detect_domain(goal_lower)
    agent_role = _assign_agent(goal_lower, domain)
    complexity = _score_complexity(goal_lower, domain)
    requires_reasoning = _detect_reasoning(goal_lower, domain, complexity)
    requires_creativity = _detect_creativity(goal_lower, domain)
    data_sensitivity = _detect_sensitivity(goal_lower)
    mcu_cost = MCU_MAP[complexity]
    tokens = TOKEN_ESTIMATE[complexity]
    estimated_tokens = tokens["input"] + tokens["output"]
    preferred_tier = _determine_tier(complexity, data_sensitivity, requires_reasoning)

    return TaskProfile(
        complexity=complexity,
        domain=domain,
        agent_role=agent_role,
        requires_reasoning=requires_reasoning,
        requires_creativity=requires_creativity,
        data_sensitivity=data_sensitivity,
        estimated_tokens=estimated_tokens,
        mcu_cost=mcu_cost,
        preferred_tier=preferred_tier,
    )
