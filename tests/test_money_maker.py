"""
Tests for Money Maker system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.money_maker import MoneyMaker, ServiceTier

class TestMoneyMaker:

    def test_generate_quote(self):
        """Test quote generation with Binh Phap chapters."""
        mm = MoneyMaker()
        # Chapters 1 (Kế Hoạch) and 3 (Mưu Công)
        quote = mm.generate_quote("Test Corp", [1, 3], ServiceTier.WARRIOR)

        assert quote.client_name == "Test Corp"
        assert len(quote.services) == 2
        # Kế Hoạch ($5K) + Mưu Công ($8K) = $13K
        assert quote.one_time_total == 13000.0
        # Warrior retainer is $2K
        assert quote.monthly_retainer == 2000.0

    def test_validate_win3(self):
        """Test WIN-WIN-WIN validation logic."""
        mm = MoneyMaker()
        # Empty quote (no value)
        bad_quote = mm.generate_quote("Bad", [], ServiceTier.WARRIOR)
        # Force 0 equity for bad quote
        bad_quote.equity_percent = 0
        bad_quote.monthly_retainer = 0

        result = mm.validate_win3(bad_quote)
        assert result.is_valid is False
        assert result.score < 65

    def test_auto_qualify(self):
        """Test BANT scoring for leads."""
        mm = MoneyMaker()
        # budget=10000 -> 35, auth=90 -> 18, need=80 -> 20, timeline=70 -> 14. Total = 87
        score, action, tier = mm.auto_qualify_lead(budget=10000, authority=90, need=80, urgency=70)

        assert score >= 85
        assert "CRITICAL" in action
        assert tier == ServiceTier.GENERAL

if __name__ == "__main__":
    pytest.main([__file__])
