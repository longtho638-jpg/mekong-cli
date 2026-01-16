"""
Tests for Moat Engine system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.moat_engine import MoatEngine

class TestMoatEngine:
    
    def test_moat_initialization(self):
        """Verify 5 immortal moats are present."""
        engine = MoatEngine()
        assert len(engine.moats) == 5
        assert "data" in engine.moats
        assert "learning" in engine.moats

    def test_data_point_builds_strength(self, tmp_path):
        """Test that adding data increases moat strength."""
        engine = MoatEngine(storage_path=str(tmp_path))
        engine.moats["data"].strength
        
        # Add 100 projects
        engine.add_data_point("projects", 100)
        
        # New logic: min(100, total/5). 100/5 = 20.
        assert engine.moats["data"].strength == 20
        assert engine.moats["data"].metrics["projects"] == 100

    def test_switching_cost_calculation(self, tmp_path):
        """Test the logic behind switching costs."""
        engine = MoatEngine(storage_path=str(tmp_path))
        
        # Build up some moats
        engine.add_data_point("projects", 50) # 50 * 3 = 150 hours
        engine.add_workflow(1) # 1 * 10 = 10 hours
        
        costs = engine.calculate_switching_cost()
        assert costs["hours"] == 160
        assert costs["financial_usd"] == 16000
        assert "ĐAU ĐỚN" in costs["verdict"]

if __name__ == "__main__":
    pytest.main([__file__])
