"""
Tests for VC Metrics system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.vc.metrics import VCMetrics, FundingStage

class TestVCMetrics:
    
    def test_initialization(self):
        """Test metrics initialization."""
        metrics = VCMetrics(mrr=10000, total_customers=100)
        assert metrics.arr == 120000
        assert metrics.arpu == 100.0

    def test_ltv_cac_ratio(self):
        """Test LTV/CAC ratio calculation."""
        metrics = VCMetrics(ltv=3000, cac=500)
        assert metrics.ltv_cac_ratio() == 6.0
        
        # Zero CAC
        metrics.cac = 0
        assert metrics.ltv_cac_ratio() == 0.0

    def test_rule_of_40(self):
        """Test Rule of 40 calculation."""
        metrics = VCMetrics(growth_rate=25, net_margin=20)
        assert metrics.rule_of_40() == 45.0

    def test_readiness_score(self):
        """Test VC readiness score calculation."""
        # Perfect Pre-Seed
        metrics = VCMetrics(
            mrr=5000, 
            growth_rate=20, 
            ltv=2000, 
            cac=1000, 
            net_margin=25,
            nrr=115,
            stage=FundingStage.PRE_SEED
        )
        # MRR: 30, Growth: 25, LTV/CAC: 25, Rule40: 10, NRR: 10 = 100
        assert metrics.readiness_score() == 100
        
        # Poor Seed
        metrics.stage = FundingStage.SEED # Target MRR 25K
        metrics.mrr = 5000
        score = metrics.readiness_score()
        assert score < 100
        assert score >= 30 # still gets partial for 5K/25K * 30

    def test_stage_recommendation(self):
        """Test funding stage recommendation."""
        metrics = VCMetrics(mrr=5000)
        assert metrics.get_stage_recommendation() == FundingStage.PRE_SEED
        
        metrics.mrr = 150000
        assert metrics.get_stage_recommendation() == FundingStage.SERIES_A

if __name__ == "__main__":
    pytest.main([__file__])
