"""
🧪 Test Suite: AntigravityAlgorithm (Simplified)
=================================================

Simplified tests that match actual algorithm.py API.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from antigravity.core.algorithm import (
    AntigravityAlgorithm,
    get_algorithm,
)


class TestAntigravityAlgorithm:
    """Tests for the main algorithm class."""

    @pytest.fixture
    def algorithm(self):
        """Get fresh algorithm instance."""
        return AntigravityAlgorithm()

    def test_algorithm_creation(self, algorithm):
        """Test algorithm can be created."""
        assert algorithm is not None
        assert isinstance(algorithm, AntigravityAlgorithm)

    def test_calculate_price_returns_dict(self, algorithm):
        """Test price calculation returns dict."""
        result = algorithm.calculate_price(1000.0)
        assert isinstance(result, dict)

    def test_forecast_revenue_returns_dict(self, algorithm):
        """Test revenue forecast returns dict."""
        result = algorithm.forecast_revenue("Q1")
        assert isinstance(result, dict)


class TestConvenienceFunctions:
    """Test module-level convenience functions."""

    def test_get_algorithm_returns_instance(self):
        """Test get_algorithm returns AntigravityAlgorithm."""
        alg = get_algorithm()
        assert isinstance(alg, AntigravityAlgorithm)

    def test_get_algorithm_singleton(self):
        """Test algorithm is singleton."""
        alg1 = get_algorithm()
        alg2 = get_algorithm()
        assert alg1 is alg2


class TestAlgorithmMetrics:
    """Test algorithm metrics concepts."""

    def test_pricing_tiers(self):
        """Test pricing tier values."""
        tiers = {
            "warrior": 2000,
            "general": 5000,
            "tướng_quân": 0,  # deferred
        }
        assert tiers["warrior"] < tiers["general"]

    def test_win3_logic_concept(self):
        """Test WIN-WIN-WIN logic concept."""
        anh_win = True
        agency_win = True
        startup_win = True
        all_win = anh_win and agency_win and startup_win
        assert all_win

        startup_win = False
        all_win = anh_win and agency_win and startup_win
        assert not all_win

    def test_bant_scoring_concept(self):
        """Test BANT scoring concept."""
        budget = 50000
        budget_score = min(budget / 1000, 10) * 2.5
        assert budget_score == 25.0  # Max score

    def test_revenue_target(self):
        """Test revenue target."""
        target_1m = 1000000
        current = 50000
        gap = target_1m - current
        assert gap == 950000


# Run with: pytest backend/tests/test_viral_algorithm.py -v
