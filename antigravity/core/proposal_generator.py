"""
📄 ProposalGenerator - Professional Proposal Builder
===================================================

Automates the creation of high-impact strategic proposals based on the
13-Chapter Binh Pháp framework. Ensures all documents are professionally
formatted and reflect the Agency OS core values.

Features:
- Markdown-based Templating: Ready for PDF export.
- WIN-WIN-WIN Alignment: Visualizes value for all parties.
- Localized Messaging: Vietnamese-first executive summaries.
- Persistence: Tracks all generated proposals.

Binh Pháp: 📄 Kế (Strategy) - Creating the map before the march.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.proposal_generator package.
"""

from antigravity.core.proposal_generator import (
    PROPOSAL_TEMPLATE,
    Proposal,
    ProposalGenerator,
)

__all__ = ["ProposalGenerator", "Proposal", "PROPOSAL_TEMPLATE"]
