"""
Tests for Revenue Engine system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.revenue_engine import RevenueEngine
from antigravity.core.models.invoice import InvoiceStatus

class TestRevenueEngine:

    def test_invoice_lifecycle(self):
        """Test creating and paying an invoice."""
        engine = RevenueEngine()
        inv = engine.create_invoice("Client A", 1000.0)

        assert inv.client_name == "Client A"
        assert inv.status == InvoiceStatus.DRAFT

        engine.send_invoice(inv)
        assert inv.status == InvoiceStatus.SENT

        engine.mark_paid(inv)
        assert inv.status == InvoiceStatus.PAID
        assert engine.get_mrr() == 1000.0

    def test_arr_calculation(self):
        """Test annual revenue projection."""
        engine = RevenueEngine()
        # $2000 paid this month
        inv = engine.create_invoice("Client B", 2000.0)
        engine.mark_paid(inv)

        # MRR = 2000, ARR = 24000
        assert engine.get_arr() == 24000.0

    def test_goal_tracking(self):
        """Test $1M goal calculations."""
        engine = RevenueEngine()
        inv = engine.create_invoice("Big Client", 50000.0) # $50K recurring
        engine.mark_paid(inv)

        # MRR = 50K, ARR = 600K
        summary = engine.get_goal_summary()
        assert summary["progress_percent"] == 60.0 # 600K / 1M
        assert summary["gap_usd"] == 400000.0

if __name__ == "__main__":
    pytest.main([__file__])
