"""
Automated Outreach Facade and Dashboard.
"""
import logging
import uuid
from typing import Any, Dict, List

from .engine import OutreachEngine
from .models import EmailStatus, OutreachEmail, OutreachSequence, OutreachTrigger

logger = logging.getLogger(__name__)

class AutomatedOutreach(OutreachEngine):
    """
    Automated Outreach System.
    Manages lead nurturing and email campaign sequences.
    """
    def __init__(self, agency_name: str):
        super().__init__(agency_name)
        logger.info(f"Automated Outreach initialized for {agency_name}")
        self._load_defaults()

    def _load_defaults(self):
        defaults = [
            ("Welcome Series", OutreachTrigger.NEW_LEAD, 3, [0, 2, 5]),
            ("Follow-up", OutreachTrigger.NO_RESPONSE, 2, [3, 7]),
            ("Proposal Nurture", OutreachTrigger.PROPOSAL_SENT, 3, [2, 5, 10]),
        ]
        for name, trigger, count, delays in defaults:
            seq = OutreachSequence(
                id=f"SEQ-{uuid.uuid4().hex[:6].upper()}",
                name=name, trigger=trigger, emails_count=count, delay_days=delays,
                sent_count=int(50 + len(name) * 5),
                reply_rate=round(0.15 + len(name) * 0.01, 2),
            )
            self.sequences[seq.id] = seq

    def get_stats(self) -> Dict[str, Any]:
        total = len(self.emails)
        engaged = sum(1 for e in self.emails if e.status in [EmailStatus.OPENED, EmailStatus.CLICKED, EmailStatus.REPLIED])
        replied = sum(1 for e in self.emails if e.status == EmailStatus.REPLIED)
        return {
            "total_sent": total,
            "open_rate": (engaged / total * 100) if total else 0.0,
            "reply_rate": (replied / total * 100) if total else 0.0,
            "active_sequences": sum(1 for s in self.sequences.values() if s.active),
        }

    def format_dashboard(self) -> str:
        stats = self.get_stats()
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 AUTOMATED OUTREACH{' ' * 36}║",
            f"║  {stats['total_sent']:>3} sent │ {stats['open_rate']:>3.0f}% open │ {stats['reply_rate']:>3.0f}% reply {' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE SEQUENCES                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        trigger_icons = { OutreachTrigger.NEW_LEAD: "🆕", OutreachTrigger.NO_RESPONSE: "⏰", OutreachTrigger.PROPOSAL_SENT: "📝", OutreachTrigger.WEBSITE_VISIT: "🌐", OutreachTrigger.MEETING_BOOKED: "📅" }
        for seq in self.sequences.values():
            icon = trigger_icons.get(seq.trigger, "📧")
            status = "🟢" if seq.active else "⚪"
            lines.append(f"║  {status} {icon} {seq.name:<18} │ {seq.emails_count} emails │ {seq.reply_rate * 100:>2.0f}% reply  ║")

        lines.extend(["║                                                           ║", "║  📊 PERFORMANCE                                           ║", "║  ───────────────────────────────────────────────────────  ║"])
        lines.append(f"║    📤 Emails Sent:    {stats['total_sent']:>5}                            ║")
        lines.append(f"║    📬 Engagement:     {stats['open_rate']:>5.1f}%                           ║")
        lines.append(f"║    💬 Reply Rate:     {stats['reply_rate']:>5.1f}%                           ║")

        lines.extend(["║                                                           ║", "║  📋 RECENT ACTIVITY                                       ║", "║  ───────────────────────────────────────────────────────  ║"])
        status_icons = { EmailStatus.PENDING: "⏳", EmailStatus.SENT: "📤", EmailStatus.OPENED: "📬", EmailStatus.CLICKED: "🔗", EmailStatus.REPLIED: "💬", EmailStatus.BOUNCED: "❌" }
        for email in self.emails[-3:]:
            icon = status_icons.get(email.status, "📧")
            lines.append(f"║    {icon} {email.recipient[:20]:<20} │ {email.subject[:22]:<22}  ║")

        lines.extend([
            "║                                                           ║",
            "║  [➕ New Sequence]  [📊 Analytics]  [⚙️ Settings]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  Castle {self.agency_name[:40]:<40} - Nurture!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)
