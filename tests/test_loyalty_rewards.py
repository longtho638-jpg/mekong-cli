"""
Tests for Loyalty Rewards system.
"""

import sys
import os
import pytest
from datetime import datetime, timedelta

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.loyalty_rewards import LoyaltyProgram

class TestLoyaltyRewards:
    
    def test_tier_progression(self, tmp_path):
        """Test tier assignment based on tenure."""
        program = LoyaltyProgram(storage_path=str(tmp_path))
        
        # New agent -> Bronze
        assert program.get_current_tier().name == "Bronze Agent"
        
        # 1 year tenure -> Silver (using 366 days to be safe)
        one_year_ago = datetime.now() - timedelta(days=366)
        program.register(one_year_ago)
        assert program.get_current_tier().name == "Silver Agent"
        assert program.get_current_tier().discount_rate == 0.05

    def test_savings_calculation(self, tmp_path):
        """Test discount application to revenue."""
        program = LoyaltyProgram(storage_path=str(tmp_path))
        
        # Force Gold Tier (2 years)
        two_years_ago = datetime.now() - timedelta(days=731)
        program.register(two_years_ago)
        
        program.record_transaction(10000.0)
        # Gold has 10% discount
        assert program.calculate_savings() == 1000.0

    def test_next_tier_info(self, tmp_path):
        """Test next tier tracking."""
        program = LoyaltyProgram(storage_path=str(tmp_path))
        program.register(datetime.now()) # New
        
        next_tier = program.get_next_tier()
        assert next_tier.name == "Silver Agent"
        # Current tenure is 0 months, Silver needs 12.
        assert next_tier.min_months - program.get_tenure_months() == 12

if __name__ == "__main__":
    pytest.main([__file__])
