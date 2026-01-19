"""
Tests for Client Magnet system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.client_magnet import ClientMagnet, LeadSource, LeadStatus


class TestClientMagnet:
    def test_add_lead(self):
        """Test adding a lead."""
        magnet = ClientMagnet()
        lead = magnet.add_lead("John Doe", company="ACME", source=LeadSource.WEBSITE)

        assert len(magnet.leads) == 1
        assert lead.name == "John Doe"
        assert lead.status == LeadStatus.NEW

    def test_qualify_lead(self):
        """Test lead qualification logic."""
        magnet = ClientMagnet()
        lead = magnet.add_lead("Jane")

        magnet.qualify_lead(lead, budget=5000, score=80)
        assert lead.budget == 5000
        assert lead.score == 80
        assert lead.is_priority() is True
        assert lead.status == LeadStatus.QUALIFIED

    def test_convert_client(self):
        """Test conversion from lead to client."""
        magnet = ClientMagnet()
        lead = magnet.add_lead("Client Lead")
        magnet.qualify_lead(lead, budget=1000)

        client = magnet.convert_to_client(lead)
        assert len(magnet.clients) == 1
        assert client.name == "Client Lead"
        assert lead.status == LeadStatus.WON

    def test_pipeline_stats(self):
        """Test pipeline value and conversion calculations."""
        magnet = ClientMagnet()

        # Add 3 leads
        l1 = magnet.add_lead("L1")
        magnet.qualify_lead(l1, budget=1000)  # Qualified

        l2 = magnet.add_lead("L2")
        magnet.qualify_lead(l2, budget=2000)
        magnet.convert_to_client(l2)  # Won

        l3 = magnet.add_lead("L3")
        l3.status = LeadStatus.LOST  # Lost

        summary = magnet.get_pipeline_summary()
        assert summary["financials"]["raw_value"] == 1000  # Only L1 is in pipeline
        assert summary["metrics"]["conversion_rate"] == 50.0  # 1 won / (1 won + 1 lost)


if __name__ == "__main__":
    pytest.main([__file__])
