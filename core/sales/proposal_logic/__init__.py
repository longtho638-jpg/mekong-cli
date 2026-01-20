"""
Proposal Generator Facade.
"""
from .engine import ProposalEngine
from .models import ProjectTier, Proposal, ProposalItem, ProposalStatus, ServiceType


class ProposalGenerator(ProposalEngine):
    """
    Smart Proposal Generation System.
    Orchestrates service selection, tier-based pricing adjustments, and professional output formatting.
    """
    def __init__(self, agency_name: str):
        super().__init__()
        self.agency_name = agency_name

    def format_summary(self, p_id: str) -> str:
        """Render ASCII Proposal Summary Dashboard."""
        if p_id not in self.active_proposals: return "Proposal not found."
        p = self.active_proposals[p_id]
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📄 PROPOSAL SUMMARY - {p.id:<27} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {p.client_name[:20]:<20} │ Project: {p.project_name[:20]:<20} ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        for item in p.items:
            lines.append(f"║    • {item.name:<25} │ ${item.price:>10,.0f}          ║")
        lines.extend(["║  " + "─" * 57 + "  ║", f"║  💰 TOTAL INVESTMENT: ${p.total_value:>15,.0f} {' ' * 18}║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)

__all__ = ['ProposalGenerator', 'ServiceType', 'ProjectTier', 'ProposalStatus', 'ProposalItem', 'Proposal']
