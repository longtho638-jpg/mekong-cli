"""
📄 Proposal Persistence Logic
"""
import logging
from pathlib import Path

from .models import Proposal

# Configure logging
logger = logging.getLogger(__name__)


class ProposalPersistence:
    """Handles storage and export of proposals."""

    def save_to_file(self, proposal: Proposal, output_dir: str = "proposals") -> Path:
        """Exports the proposal to a Markdown file."""
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        slug = proposal.client_name.lower().replace(" ", "_")
        filename = f"proposal_{proposal.id:03d}_{slug}.md"
        full_path = out_path / filename

        full_path.write_text(proposal.markdown_content, encoding="utf-8")
        return full_path
