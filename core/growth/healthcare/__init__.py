"""
Healthcare Marketing Facade and Dashboard.
"""
import logging

from .engine import HealthcareEngine
from .models import (
    CampaignType,
    ComplianceStatus,
    HealthcareCampaign,
    HealthcareClient,
    HealthcareVertical,
    HIPAAChecklist,
)

logger = logging.getLogger(__name__)

class HealthcareMarketing(HealthcareEngine):
    """
    Healthcare Marketing System.
    Orchestrates HIPAA-compliant marketing campaigns and client management for medical providers.
    """

    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Healthcare Marketing system initialized for {agency_name}")
        self._init_defaults()

    def _init_defaults(self):
        """Seed the system with sample medical clients."""
        try:
            c1 = self.add_client("Smile Dental", HealthcareVertical.DENTAL, 3000.0)
            self.create_hipaa_checklist(c1.id)
        except Exception as e:
            logger.error(f"Demo data error: {e}")

    def format_dashboard(self) -> str:
        """Render the Healthcare Marketing Dashboard."""
        active_c = len(self.clients)
        total_rev = sum(c.monthly_retainer for c in self.clients.values())

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🏥 HEALTHCARE MARKETING DASHBOARD{' ' * 28}║",
            f"║  {active_c} clients │ ${total_rev:,.0f} avg MRR │ {self.agency_name[:20]:<20}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🏥 MEDICAL CLIENTS STATUS                                ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]

        v_icons = { HealthcareVertical.DENTAL: "🦷", HealthcareVertical.MEDICAL: "🏥", HealthcareVertical.WELLNESS: "🧘" }

        for c in list(self.clients.values())[:5]:
            icon = v_icons.get(c.vertical, "🏥")
            s_icon = "🟢" if c.hipaa_status == ComplianceStatus.COMPLIANT else "🟡"
            name_disp = (c.name[:20] + "..") if len(c.name) > 22 else c.name
            lines.append(f"║    {icon} {s_icon} {name_disp:<22} │ ${c.monthly_retainer:>8,.0f}/mo  ║")

        lines.extend(["║                                                           ║", "║  📋 COMPLIANCE TRACKER                                    ║", "║  ───────────────────────────────────────────────────────  ║"])
        for chk in list(self.checklists.values())[:3]:
            done = sum(1 for v in chk.items.values() if v)
            pct = (done / len(chk.items) * 100) if chk.items else 0
            bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
            lines.append(f"║    🛡️ {chk.client_name[:16]:<16} │ {bar} │ {pct:>3.0f}% compliant ║")

        lines.extend([
            "║                                                           ║",
            "║  [🏥 New Client]  [📋 Audit HIPAA]  [📢 Campaigns]        ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Safety!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
