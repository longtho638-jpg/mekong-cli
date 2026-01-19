"""
Proposal Module - Presentation Layer
"""

from .entities import Proposal
from .services import ProposalGenerator


class ProposalPresenter:
    @staticmethod
    def format_dashboard(generator: ProposalGenerator, prop: Proposal) -> str:
        """Render ASCII Proposal Preview."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📝 PROPOSAL PREVIEW - {prop.id:<26} ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Client: {prop.client_company[:25]:<25} │ From: {generator.agency_name[:15]:<15} ║",
            f"║  Total Monthly: ${prop.total_monthly:>10,.0f} │ Setup: ${prop.total_setup:>10,.0f} ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║  PROPOSED SERVICES:                                       ║",
        ]

        for s in prop.services:
            lines.append(f"║    📦 {s.name:<25} │ ${s.monthly_price:>10,.0f}/mo ║")

        lines.extend(
            [
                "║                                                           ║",
                "║  [📤 Send Proposal]  [📝 Edit Content]  [🎨 Branding]    ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {generator.agency_name[:40]:<40} - Win Fast!          ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )
        return "\n".join(lines)
