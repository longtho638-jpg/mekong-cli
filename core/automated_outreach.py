"""
📧 Automated Outreach - Smart Email Campaigns
===============================================

Automate lead nurturing and outreach.
Right message, right time!

Features:
- Email sequences
- Trigger-based sending
- Personalization
- Performance tracking
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class OutreachTrigger(Enum):
    """Outreach triggers."""
    NEW_LEAD = "new_lead"
    WEBSITE_VISIT = "website_visit"
    PROPOSAL_SENT = "proposal_sent"
    NO_RESPONSE = "no_response"
    MEETING_BOOKED = "meeting_booked"


class EmailStatus(Enum):
    """Email status."""
    PENDING = "pending"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    REPLIED = "replied"
    BOUNCED = "bounced"


@dataclass
class OutreachEmail:
    """An outreach email."""
    id: str
    recipient: str
    subject: str
    body: str
    sequence_name: str
    status: EmailStatus = EmailStatus.PENDING
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None


@dataclass
class OutreachSequence:
    """An email sequence."""
    id: str
    name: str
    trigger: OutreachTrigger
    emails_count: int
    delay_days: List[int]
    active: bool = True
    sent_count: int = 0
    reply_rate: float = 0


class AutomatedOutreach:
    """
    Automated Outreach.
    
    Smart email campaigns.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sequences: Dict[str, OutreachSequence] = {}
        self.emails: List[OutreachEmail] = []
        self._load_defaults()
    
    def _load_defaults(self):
        """Load default sequences."""
        defaults = [
            ("Welcome Series", OutreachTrigger.NEW_LEAD, 3, [0, 2, 5]),
            ("Follow-up", OutreachTrigger.NO_RESPONSE, 2, [3, 7]),
            ("Proposal Nurture", OutreachTrigger.PROPOSAL_SENT, 3, [2, 5, 10]),
        ]
        
        for name, trigger, count, delays in defaults:
            seq = OutreachSequence(
                id=f"SEQ-{uuid.uuid4().hex[:6].upper()}",
                name=name,
                trigger=trigger,
                emails_count=count,
                delay_days=delays,
                sent_count=int(50 + len(name) * 5),
                reply_rate=round(0.15 + len(name) * 0.01, 2)
            )
            self.sequences[seq.id] = seq
    
    def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        sequence: OutreachSequence
    ) -> OutreachEmail:
        """Send an outreach email."""
        email = OutreachEmail(
            id=f"OUT-{uuid.uuid4().hex[:6].upper()}",
            recipient=recipient,
            subject=subject,
            body=body,
            sequence_name=sequence.name,
            status=EmailStatus.SENT,
            sent_at=datetime.now()
        )
        
        self.emails.append(email)
        sequence.sent_count += 1
        return email
    
    def get_stats(self) -> Dict[str, Any]:
        """Get outreach statistics."""
        total = len(self.emails)
        opened = sum(1 for e in self.emails if e.status in [EmailStatus.OPENED, EmailStatus.CLICKED, EmailStatus.REPLIED])
        replied = sum(1 for e in self.emails if e.status == EmailStatus.REPLIED)
        
        return {
            "total_sent": total,
            "open_rate": opened / total * 100 if total else 0,
            "reply_rate": replied / total * 100 if total else 0,
            "active_sequences": sum(1 for s in self.sequences.values() if s.active)
        }
    
    def format_dashboard(self) -> str:
        """Format outreach dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 AUTOMATED OUTREACH                                    ║",
            f"║  {stats['total_sent']} sent │ {stats['open_rate']:.0f}% open │ {stats['reply_rate']:.0f}% reply         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE SEQUENCES                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        trigger_icons = {"new_lead": "🆕", "no_response": "⏰", "proposal_sent": "📝", "website_visit": "🌐", "meeting_booked": "📅"}
        
        for seq in self.sequences.values():
            icon = trigger_icons.get(seq.trigger.value, "📧")
            status = "🟢" if seq.active else "⚪"
            lines.append(f"║  {status} {icon} {seq.name:<18} │ {seq.emails_count} emails │ {seq.reply_rate*100:.0f}% reply  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 PERFORMANCE                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📤 Emails Sent:    {stats['total_sent']:>5}                            ║",
            f"║    📬 Open Rate:      {stats['open_rate']:>5.1f}%                           ║",
            f"║    💬 Reply Rate:     {stats['reply_rate']:>5.1f}%                           ║",
            "║                                                           ║",
            "║  📋 RECENT EMAILS                                         ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        status_icons = {"pending": "⏳", "sent": "📤", "opened": "📬", "clicked": "🔗", "replied": "💬", "bounced": "❌"}
        
        for email in self.emails[-3:]:
            icon = status_icons.get(email.status.value, "📧")
            lines.append(f"║    {icon} {email.recipient[:20]:<20} │ {email.subject[:22]:<22}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Sequence]  [📊 Analytics]  [⚙️ Settings]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Nurture at scale!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    outreach = AutomatedOutreach("Saigon Digital Hub")
    
    print("📧 Automated Outreach")
    print("=" * 60)
    print()
    
    # Send some emails
    seq = list(outreach.sequences.values())[0]
    outreach.send_email("john@techcorp.com", "Welcome to our agency!", "Hi John...", seq)
    outreach.send_email("sarah@growth.com", "Quick question", "Hi Sarah...", seq)
    
    # Mark one as opened
    outreach.emails[0].status = EmailStatus.OPENED
    outreach.emails[0].opened_at = datetime.now()
    
    print(outreach.format_dashboard())
