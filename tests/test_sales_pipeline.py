"""
Tests for Sales Pipeline system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.sales_pipeline import SalesPipeline
from antigravity.core.models.deal import DealStage
from antigravity.core.config import DealTier

class TestSalesPipeline:
    
    def test_deal_lifecycle(self):
        """Test creating and advancing a deal."""
        pipeline = SalesPipeline()
        deal = pipeline.create_deal("VN Startup", "Anh founder", tier=DealTier.WARRIOR)
        
        assert deal.startup_name == "VN Startup"
        assert deal.stage == DealStage.LEAD
        
        pipeline.advance_stage(deal.id, DealStage.DISCOVERY)
        assert deal.stage == DealStage.DISCOVERY
        
        pipeline.close_deal(deal.id, won=True)
        assert deal.stage == DealStage.CLOSED_WON
        assert deal.is_won() is True

    def test_pipeline_stats(self):
        """Test pipeline aggregation."""
        pipeline = SalesPipeline()
        d1 = pipeline.create_deal("S1", tier=DealTier.WARRIOR)
        d2 = pipeline.create_deal("S2", tier=DealTier.GENERAL)
        
        pipeline.close_deal(d1.id, won=True) # Won
        
        stats = pipeline.get_stats()
        assert stats["total_deals"] == 2
        assert stats["won_deals"] == 1
        assert stats["active_deals"] == 1 # d2 is active

if __name__ == "__main__":
    pytest.main([__file__])
