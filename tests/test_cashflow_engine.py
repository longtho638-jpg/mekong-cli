"""
Tests for Cashflow Engine system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.cashflow_engine import CashflowEngine, RevenueStream

class TestCashflowEngine:
    
    def test_add_revenue(self, tmp_path):
        """Test adding revenue and ARR calculation."""
        engine = CashflowEngine(storage_path=str(tmp_path))
        
        # Add $1000 recurring
        engine.add_revenue(RevenueStream.SAAS, 1000.0, recurring=True)
        
        # ARR should be 12000
        assert engine.get_total_arr() == 12000.0
        assert engine.get_progress_percent() == 1.2 # 12000 / 1M

    def test_currency_conversion(self, tmp_path):
        """Test VND to USD conversion."""
        engine = CashflowEngine(storage_path=str(tmp_path))
        
        # 25,000 VND should be exactly $1 (new rate in file)
        engine.add_revenue(RevenueStream.AGENCY, 25000.0, currency="VND")
        
        assert engine.revenues[0].amount_usd == 1.0

    def test_required_growth(self, tmp_path):
        """Test growth rate calculation."""
        engine = CashflowEngine(storage_path=str(tmp_path))
        
        # Force a date in the past to simulate current state
        # (Assuming we are in early 2026 for this test logic)
        engine.add_revenue(RevenueStream.SAAS, 500000.0 / 12, recurring=True)
        
        rate = engine.get_required_mrr_growth()
        # If months left is 12 (pre-2026), rate is approx 5.9%
        # If we are in 2026 (Jan), months left is 12, same result.
        assert 5.0 < rate < 10.0

if __name__ == "__main__":
    pytest.main([__file__])
