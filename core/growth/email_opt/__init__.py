"""
Email Automation Facade and Dashboard.
"""
import logging
from typing import Dict, List

from .engine import EmailAutomationEngine
from .models import EmailSequence, EmailStatus, EmailTemplate, ScheduledEmail, SequenceType

logger = logging.getLogger(__name__)

class EmailAutomation(EmailAutomationEngine):
    """
    Email Automation Engine System.
    Orchestrates templates, sequences, and scheduled deliveries for client nurture.
    """
    def __init__(self, agency_name: str = "Nova Digital", owner_email: str = "hello@nova.digital"):
        super().__init__(agency_name, owner_email)
        logger.info(f"Email Automation initialized for {agency_name}")
        self._load_defaults()

    def _load_defaults(self):
        welcome_tpl = self.create_template(
            "Welcome", "Welcome to {agency_name}! 🎉",
            "Hi {first_name}! Thanks for joining us at {agency_name}.",
            SequenceType.WELCOME,
        )
        self.create_sequence(
            "Onboarding Flow", SequenceType.WELCOME,
            [{"template_id": welcome_tpl.id, "delay_days": 0}],
        )

    def format_dashboard(self) -> str:
        """Render the Email Automation Dashboard."""
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 EMAIL AUTOMATION DASHBOARD{' ' * 31}║",
            f"║  {len(self.templates)} templates │ {len(self.sequences)} sequences │ {self.stats['sent']} total sent{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE SEQUENCES                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        for s in list(self.sequences.values())[:5]:
            lines.append(f"║  🟢 {s.name:<25} │ {len(s.emails)} steps │ {s.enrollments:>3} enrolled  ║")
        lines.extend(["║                                                           ║", "║  📋 UPCOMING DELIVERIES                                   ║", "║  ───────────────────────────────────────────────────────  ║"])
        pending = [e for e in self.scheduled if e.status == EmailStatus.SCHEDULED]
        for e in pending[:3]:
            time_disp = e.scheduled_for.strftime("%Y-%m-%d")
            lines.append(f"║    📅 {time_disp} │ {e.recipient_email:<25} │ {e.id:<10}  ║")
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Seq]  [📋 Templates]  [🔄 Send Now]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Nurture!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
