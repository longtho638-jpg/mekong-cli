"""
Tests for Data Moat system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.platform.data_moat import DataMoat, InsightType

class TestDataMoat:
    
    def test_record_success(self):
        """Test recording success data."""
        moat = DataMoat()
        moat.record_success("rice-trading", "video", 95, 500.0)
        
        assert len(moat.success_data) == 1
        assert moat.success_data[0]["niche"] == "rice-trading"
        assert moat.success_data[0]["score"] == 95
        
        # Check benchmark update
        benchmark = moat.get_benchmark("rice-trading")
        assert benchmark is not None
        assert benchmark.sample_size == 1
        assert "video" in benchmark.top_content_types

    def test_add_insight(self):
        """Test adding insights."""
        moat = DataMoat()
        insight = moat.add_insight(
            InsightType.MARKET_TREND,
            "fish-seafood",
            "Rising demand in Can Tho",
            {"volume": 1000}
        )
        
        assert insight.id == 1
        assert insight.title == "Rising demand in Can Tho"
        assert len(moat.insights) == 1

    def test_get_best_practices(self):
        """Test best practices generation."""
        moat = DataMoat()
        moat.record_success("niche1", "fb", 90)
        moat.record_success("niche1", "fb", 80)
        moat.record_success("niche1", "tiktok", 60)
        
        practices = moat.get_best_practices("niche1")
        assert len(practices) == 2
        assert practices[0]["content_type"] == "fb"
        assert practices[0]["avg_score"] == 85.0
        
    def test_get_moat_strength(self):
        """Test moat strength calculation."""
        moat = DataMoat()
        
        # Empty moat
        strength = moat.get_moat_strength()
        assert strength["strength_score"] == 0
        
        # Add some data
        for i in range(50):
            moat.record_success("niche", "content", 80)
            
        strength = moat.get_moat_strength()
        assert strength["strength_score"] == 60 # 50 (points) + 10 (1 niche)
        assert "FORT" in strength["defensibility"]

if __name__ == "__main__":
    pytest.main([__file__])
