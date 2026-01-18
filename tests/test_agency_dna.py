"""
Tests for Agency DNA system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.agency_dna import AgencyDNA, Service, Tone


class TestAgencyDNA:
    def test_service_initialization(self):
        """Test service auto-conversion."""
        s = Service("Web Dev", "Build site", 1000.0)
        assert s.price_vnd == 25000000  # New rate 25,000

    def test_agency_dna_tagline(self):
        """Test tagline generation for different tones."""
        dna = AgencyDNA(name="Mekong AI", niche="Gạo", tone=Tone.MIEN_TAY)
        assert "miền Tây" in dna.get_tagline()

        dna.tone = Tone.MIEN_BAC
        assert "Thủ đô" in dna.get_tagline()

    def test_add_service(self):
        """Test adding services to DNA."""
        dna = AgencyDNA()
        dna.add_service("SEO", "Rank higher", 500.0)
        assert len(dna.services) == 1
        assert dna.services[0].name == "SEO"

    def test_to_dict(self):
        """Test dictionary export."""
        dna = AgencyDNA(name="Test Agency")
        data = dna.to_dict()
        assert data["identity"]["name"] == "Test Agency"
        assert "tagline" in data["identity"]


if __name__ == "__main__":
    pytest.main([__file__])
