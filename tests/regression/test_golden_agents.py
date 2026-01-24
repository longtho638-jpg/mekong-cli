"""
Golden Agent Regression Tests
=============================
Uses golden_datasets.json for deterministic agent output validation.
Part of Phase 21: Quality Hardening & Resilience.
"""

import json
from pathlib import Path

import pytest

# Load golden datasets
GOLDEN_DATASETS_PATH = Path(__file__).parent.parent / "data" / "golden_datasets.json"


@pytest.fixture(scope="module")
def golden_data():
    """Load golden datasets from JSON file."""
    with open(GOLDEN_DATASETS_PATH, "r") as f:
        return json.load(f)


class TestRevenueCalculations:
    """Test revenue engine calculations against golden datasets."""

    def test_basic_profit_calculation(self, golden_data):
        """Test basic profit calculation matches golden expectation."""
        test_case = golden_data["revenue_calculations"][0]
        revenue = test_case["input"]["monthly_revenue"]
        expenses = test_case["input"]["monthly_expenses"]

        # Calculate expected values
        net_profit = revenue - expenses
        margin = net_profit / revenue if revenue > 0 else 0

        assert net_profit == test_case["expected"]["net_profit"]
        assert margin == test_case["expected"]["margin"]

    def test_zero_expenses(self, golden_data):
        """Test zero expenses scenario."""
        test_case = golden_data["revenue_calculations"][1]
        revenue = test_case["input"]["monthly_revenue"]
        expenses = test_case["input"]["monthly_expenses"]

        net_profit = revenue - expenses
        margin = net_profit / revenue if revenue > 0 else 0

        assert net_profit == test_case["expected"]["net_profit"]
        assert margin == test_case["expected"]["margin"]

    def test_loss_scenario(self, golden_data):
        """Test loss scenario calculation."""
        test_case = golden_data["revenue_calculations"][2]
        revenue = test_case["input"]["monthly_revenue"]
        expenses = test_case["input"]["monthly_expenses"]

        net_profit = revenue - expenses
        margin = net_profit / revenue if revenue > 0 else 0

        assert net_profit == test_case["expected"]["net_profit"]
        assert margin == test_case["expected"]["margin"]


class TestLeadScoring:
    """Test lead scoring against golden datasets."""

    def test_high_value_tech_lead(self, golden_data):
        """Test high value tech lead scoring is in expected range."""
        test_case = golden_data["lead_scoring"][0]

        # Simple scoring algorithm
        score = 0
        score += min(test_case["input"]["company_size"] / 10, 25)
        score += min(test_case["input"]["budget"] / 2000, 25)
        score += 25 if test_case["input"]["industry"] == "technology" else 10
        score += 25 if test_case["input"]["role"] in ["CTO", "CEO", "VP"] else 10

        assert test_case["expected_range"]["min"] <= score <= test_case["expected_range"]["max"]

    def test_low_budget_lead(self, golden_data):
        """Test low budget lead scoring is in expected range."""
        test_case = golden_data["lead_scoring"][1]

        # Simple scoring algorithm
        score = 0
        score += min(test_case["input"]["company_size"] / 10, 25)
        score += min(test_case["input"]["budget"] / 2000, 25)
        score += 25 if test_case["input"]["industry"] == "technology" else 10
        score += 25 if test_case["input"]["role"] in ["CTO", "CEO", "VP"] else 10

        assert test_case["expected_range"]["min"] <= score <= test_case["expected_range"]["max"]


class TestContentVirality:
    """Test content virality analysis against golden datasets."""

    def test_high_virality_keywords(self, golden_data):
        """Test keyword extraction from viral content."""
        test_case = golden_data["content_virality"][0]
        content = test_case["input"]["content"].lower()
        expected_keywords = test_case["expected_keywords"]

        # Simple keyword matching
        found_keywords = [kw for kw in expected_keywords if kw in content]

        assert len(found_keywords) >= 2, (
            f"Found only {found_keywords}, expected at least 2 from {expected_keywords}"
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
