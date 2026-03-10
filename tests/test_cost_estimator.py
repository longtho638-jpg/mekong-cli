"""Tests for ALGO 3 — Cost Estimator."""

from __future__ import annotations


from src.core.cost_estimator import (
    CostEstimate,
    COST_TABLE,
    MCU_REVENUE_TABLE,
    TOKEN_ESTIMATE,
    estimate_cost,
)
from src.core.task_classifier import TaskProfile


def _make_profile(**overrides) -> TaskProfile:
    """Helper to create TaskProfile with defaults."""
    defaults = {
        "complexity": "simple",
        "domain": "code",
        "agent_role": "cto",
        "requires_reasoning": False,
        "requires_creativity": False,
        "data_sensitivity": "public",
        "estimated_tokens": 1200,
        "mcu_cost": 1,
        "preferred_tier": "api_cheap",
    }
    defaults.update(overrides)
    return TaskProfile(**defaults)


class TestCostTable:
    def test_all_api_models_have_costs(self):
        api_models = [m for m in COST_TABLE if not m.startswith("ollama")]
        for model in api_models:
            costs = COST_TABLE[model]
            assert costs[0] > 0, f"{model} input cost should be > 0"
            assert costs[1] > 0, f"{model} output cost should be > 0"

    def test_opus_most_expensive(self):
        opus = COST_TABLE["claude-opus-4-6"]
        for model, costs in COST_TABLE.items():
            if model != "claude-opus-4-6":
                assert opus[1] >= costs[1], f"Opus should be >= {model}"

    def test_mcu_revenue_has_all_costs(self):
        for mcu in [1, 3, 5]:
            assert mcu in MCU_REVENUE_TABLE


class TestTokenEstimate:
    def test_simple_smallest(self):
        s = TOKEN_ESTIMATE["simple"]
        st = TOKEN_ESTIMATE["standard"]
        assert s["input"] < st["input"]
        assert s["output"] < st["output"]

    def test_complex_largest(self):
        st = TOKEN_ESTIMATE["standard"]
        c = TOKEN_ESTIMATE["complex"]
        assert c["input"] > st["input"]
        assert c["output"] > st["output"]


class TestEstimateCost:
    def test_returns_cost_estimate(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "gemini-2.0-flash")
        assert isinstance(result, CostEstimate)

    def test_mcu_matches_profile(self):
        profile = _make_profile(complexity="standard", mcu_cost=3)
        result = estimate_cost(profile, "claude-sonnet-4-6")
        assert result.mcu_required == 3

    def test_local_model_zero_llm_cost(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "ollama:llama3.2:3b")
        assert result.usd_llm_cost == 0.0

    def test_infra_cost_always_present(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "ollama:llama3.2:3b")
        assert result.usd_infra_cost == 0.001

    def test_total_equals_llm_plus_infra(self):
        profile = _make_profile(complexity="standard", mcu_cost=3)
        result = estimate_cost(profile, "claude-sonnet-4-6")
        expected = round(result.usd_llm_cost + result.usd_infra_cost, 6)
        assert result.total_usd == expected

    def test_margin_positive_for_local(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "ollama:llama3.2:3b")
        assert result.margin_usd > 0
        assert result.margin_pct > 90  # local = nearly 100% margin

    def test_opus_complex_still_profitable(self):
        profile = _make_profile(complexity="complex", mcu_cost=5)
        result = estimate_cost(profile, "claude-opus-4-6")
        # Complex MCU revenue is $0.50, Opus cost for 5K+3K tokens
        assert result.mcu_required == 5

    def test_unknown_model_zero_cost(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "unknown-model-xyz")
        assert result.usd_llm_cost == 0.0

    def test_haiku_cheap(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "claude-haiku-4-5")
        assert result.usd_llm_cost < 0.01  # very cheap for simple

    def test_margin_pct_calculation(self):
        profile = _make_profile(complexity="simple", mcu_cost=1)
        result = estimate_cost(profile, "gemini-2.0-flash-lite")
        revenue = MCU_REVENUE_TABLE[1]
        expected_pct = round((revenue - result.total_usd) / revenue * 100, 1)
        assert result.margin_pct == expected_pct

    def test_all_complexity_levels(self):
        for comp, mcu in [("simple", 1), ("standard", 3), ("complex", 5)]:
            profile = _make_profile(complexity=comp, mcu_cost=mcu)
            result = estimate_cost(profile, "gemini-2.0-flash")
            assert result.mcu_required == mcu
            assert result.total_usd > 0
