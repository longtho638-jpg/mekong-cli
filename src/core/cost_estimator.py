"""ALGO 3 — Cost Estimator.

Estimates LLM cost and margin for a task before execution.
"""

from __future__ import annotations

from dataclasses import dataclass

from src.core.task_classifier import TaskProfile


@dataclass
class CostEstimate:
    """Cost breakdown for a task execution."""

    mcu_required: int
    usd_llm_cost: float
    usd_infra_cost: float
    total_usd: float
    margin_usd: float
    margin_pct: float


# $/MTok (input, output) — ollama = free
COST_TABLE: dict[str, tuple[float, float]] = {
    "claude-opus-4-6": (15.0, 75.0),
    "claude-sonnet-4-6": (3.0, 15.0),
    "claude-haiku-4-5": (0.25, 1.25),
    "gemini-2.0-flash": (0.075, 0.30),
    "gemini-2.0-flash-lite": (0.02, 0.08),
    "gemini-2.0-pro": (1.25, 5.0),
    "gpt-4o": (5.0, 15.0),
    "gpt-4o-mini": (0.15, 0.60),
}

# MCU → USD revenue (blended across tiers)
MCU_REVENUE_TABLE: dict[int, float] = {
    1: 0.049,
    3: 0.045,
    5: 0.50,
}

INFRA_COST_PER_TASK = 0.001

TOKEN_ESTIMATE: dict[str, dict[str, int]] = {
    "simple": {"input": 800, "output": 400},
    "standard": {"input": 2000, "output": 1500},
    "complex": {"input": 5000, "output": 3000},
}


def estimate_cost(profile: TaskProfile, model_id: str) -> CostEstimate:
    """Estimate the cost of executing a task with a given model.

    Args:
        profile: Classified task profile.
        model_id: Selected model identifier.

    Returns:
        CostEstimate with full cost breakdown.
    """
    tokens = TOKEN_ESTIMATE.get(profile.complexity, TOKEN_ESTIMATE["standard"])

    # LLM cost — local models are free
    if model_id.startswith("ollama:"):
        cost_in, cost_out = 0.0, 0.0
    else:
        cost_in, cost_out = COST_TABLE.get(model_id, (0.0, 0.0))

    usd_llm = (
        tokens["input"] / 1_000_000 * cost_in
        + tokens["output"] / 1_000_000 * cost_out
    )

    # Revenue from MCU
    revenue = MCU_REVENUE_TABLE.get(profile.mcu_cost, 0.049)

    # Margin
    total = usd_llm + INFRA_COST_PER_TASK
    margin = revenue - total
    margin_pct = round(margin / revenue * 100, 1) if revenue > 0 else 100.0

    return CostEstimate(
        mcu_required=profile.mcu_cost,
        usd_llm_cost=round(usd_llm, 6),
        usd_infra_cost=INFRA_COST_PER_TASK,
        total_usd=round(total, 6),
        margin_usd=round(margin, 6),
        margin_pct=margin_pct,
    )
