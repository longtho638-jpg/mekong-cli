"""
Tests for Franchise Manager system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.franchise.manager import FranchiseManager, Territory


class TestFranchiseManager:
    def test_add_franchisee(self):
        """Test adding franchisees with capacity limits."""
        manager = FranchiseManager()

        # Can Tho has capacity 1
        f1 = manager.add_franchisee("Anh 1", territory=Territory.CAN_THO)
        assert f1 is not None
        assert f1.id == 1

        # Adding second to Can Tho should fail
        f2 = manager.add_franchisee("Anh 2", territory=Territory.CAN_THO)
        assert f2 is None

    def test_record_revenue(self):
        """Test revenue and royalty tracking."""
        manager = FranchiseManager()
        f = manager.add_franchisee("Anh Minh", territory=Territory.HCM)

        royalty = manager.record_revenue(f.id, 10000.0)
        assert royalty == 2000.0  # 20%
        assert f.total_revenue == 10000.0
        assert f.total_royalties == 2000.0

    def test_get_network_stats(self):
        """Test network statistics calculation."""
        manager = FranchiseManager()
        f1 = manager.add_franchisee("F1", territory=Territory.HCM)
        f2 = manager.add_franchisee("F2", territory=Territory.HA_NOI)

        manager.record_revenue(f1.id, 5000)
        manager.record_revenue(f2.id, 3000)

        stats = manager.get_network_stats()
        assert stats["network_size"]["total_partners"] == 2
        assert stats["performance"]["total_network_revenue"] == 8000
        assert stats["performance"]["total_royalties_collected"] == 1600


if __name__ == "__main__":
    pytest.main([__file__])
