"""
Tests for Proposal Generator system.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.money_maker import MoneyMaker, ServiceTier
from antigravity.core.proposal_generator import ProposalGenerator


class TestProposalGenerator:
    def test_generate_proposal(self):
        """Test full proposal generation from quote."""
        mm = MoneyMaker()
        quote = mm.generate_quote("Test Corp", [1, 3, 5], ServiceTier.WARRIOR)

        pg = ProposalGenerator()
        proposal = pg.generate_proposal(quote, "John Doe")

        assert proposal.client_name == "Test Corp"
        assert proposal.client_contact == "John Doe"
        # Strategic Proposal: Test Corp
        assert "Strategic Proposal: Test Corp" in proposal.markdown_content
        assert "Kế Hoạch" in proposal.markdown_content
        assert "Mưu Công" in proposal.markdown_content

    def test_quick_proposal(self):
        """Test one-step proposal generation."""
        pg = ProposalGenerator()
        proposal = pg.quick_launch("Quick Corp", "Jane", [1, 2], ServiceTier.GENERAL)

        assert proposal.client_name == "Quick Corp"
        assert "Tác Chiến" in proposal.markdown_content
        assert "GENERAL" in proposal.markdown_content

    def test_save_proposal(self, tmp_path):
        """Test saving proposal to file."""
        pg = ProposalGenerator()
        proposal = pg.quick_launch("Save Corp", "Alice", [1], ServiceTier.WARRIOR)

        # save_to_file uses Path and returns Path
        out_dir = str(tmp_path)
        path = pg.save_to_file(proposal, out_dir)

        assert path.exists()
        content = path.read_text()
        assert "Strategic Proposal: Save Corp" in content


if __name__ == "__main__":
    pytest.main([__file__])
