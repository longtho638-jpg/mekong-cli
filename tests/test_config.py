"""
Tests for Core Config.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.config import Currency, DealTier, get_tier_pricing, usd_to_vnd


class TestConfig:
    def test_currency_enums(self):
        """Verify supported currencies."""
        assert Currency.USD.value == "USD"
        assert Currency.VND.value == "VND"

    def test_pricing_tiers(self):
        """Verify tier pricing retrieval."""
        warrior = get_tier_pricing(DealTier.WARRIOR)
        assert warrior["retainer_usd"] == 2000

        tuong_quan = get_tier_pricing(DealTier.TUONG_QUAN)
        assert tuong_quan["retainer_usd"] == 0

    def test_conversion_helpers(self):
        """Verify currency conversion helpers."""
        # Check current rate in file (25000)
        assert usd_to_vnd(1.0) == 25000


if __name__ == "__main__":
    pytest.main([__file__])
