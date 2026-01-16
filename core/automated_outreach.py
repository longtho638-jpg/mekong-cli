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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
    """An outreach email entity."""
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
    """An email sequence configuration."""
    id: str
    name: str
    trigger: OutreachTrigger
    emails_count: int
    delay_days: List[int]
    active: bool = True
    sent_count: int = 0
    reply_rate: float = 0.0


class AutomatedOutreach:
    """
    Automated Outreach System.
    
    Manages lead nurturing and email campaign sequences.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sequences: Dict[str, OutreachSequence] = {}
        self.emails: List[OutreachEmail] = []
        logger.info(f"Automated Outreach initialized for {agency_name}")
        self._load_defaults()
    
    def _validate_email(self, email: str) -> bool:
        """Simple regex validation for email."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    def _load_defaults(self):
        """Load default sequences for initial setup."""
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
        """
        Simulate sending an outreach email.
        """
        if not self._validate_email(recipient):
            logger.error(f"Invalid recipient email: {recipient}")
            raise ValueError(f"Invalid email: {recipient}")

        if not subject or not body:
            raise ValueError("Subject and body cannot be empty")

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
        logger.info(f"Email sent to {recipient} via {sequence.name}")
        return email
    
    def get_stats(self) -> Dict[str, Any]:
        """Calculate performance statistics."""
        total = len(self.emails)
        engaged = sum(1 for e in self.emails if e.status in [EmailStatus.OPENED, EmailStatus.CLICKED, EmailStatus.REPLIED])
        replied = sum(1 for e in self.emails if e.status == EmailStatus.REPLIED)
        
        return {
            "total_sent": total,
            "open_rate": (engaged / total * 100) if total else 0.0,
            "reply_rate": (replied / total * 100) if total else 0.0,
            "active_sequences": sum(1 for s in self.sequences.values() if s.active)
        }
    
    def format_dashboard(self) -> str:
        """Render Outreach Dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📧 AUTOMATED OUTREACH{' ' * 36}║",
            f"║  {stats['total_sent']:>3} sent │ {stats['open_rate']:>3.0f}% open │ {stats['reply_rate']:>3.0f}% reply {' ' * 18}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE SEQUENCES                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        trigger_icons = {
            OutreachTrigger.NEW_LEAD: "🆕", 
            OutreachTrigger.NO_RESPONSE: "⏰", 
            OutreachTrigger.PROPOSAL_SENT: "📝", 
            OutreachTrigger.WEBSITE_VISIT: "🌐", 
            OutreachTrigger.MEETING_BOOKED: "📅"
        }
        
        for seq in self.sequences.values():
            icon = trigger_icons.get(seq.trigger, "📧")
            status = "🟢" if seq.active else "⚪"
            lines.append(f"║  {status} {icon} {seq.name:<18} │ {seq.emails_count} emails │ {seq.reply_rate*100:>2.0f}% reply  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 PERFORMANCE                                           ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📤 Emails Sent:    {stats['total_sent']:>5}                            ║",
            f"║    📬 Engagement:     {stats['open_rate']:>5.1f}%                           ║",
            f"║    💬 Reply Rate:     {stats['reply_rate']:>5.1f}%                           ║",
            "║                                                           ║",
            "║  📋 RECENT ACTIVITY                                       ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        status_icons = {
            EmailStatus.PENDING: "⏳", 
            EmailStatus.SENT: "📤", 
            EmailStatus.OPENED: "📬", 
            EmailStatus.CLICKED: "🔗", 
            EmailStatus.REPLIED: "💬", 
            EmailStatus.BOUNCED: "❌"
        }
        
        for email in self.emails[-3:]:
            icon = status_icons.get(email.status, "📧")
            recipient_display = (email.recipient[:18] + '..') if len(email.recipient) > 20 else email.recipient
            subject_display = (email.subject[:20] + '..') if len(email.subject) > 22 else email.subject
            lines.append(f"║    {icon} {recipient_display:<20} │ {subject_display:<22}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Sequence]  [📊 Analytics]  [⚙️ Settings]         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Nurture!             ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📧 Initializing Automated Outreach...")
    print("=" * 60)
    
    try:
        outreach = AutomatedOutreach("Saigon Digital Hub")
        
        # Send some emails
        seq = list(outreach.sequences.values())[0]
        outreach.send_email("john@techcorp.com", "Welcome to our agency!", "Hi John...", seq)
        outreach.send_email("sarah@growth.com", "Quick question", "Hi Sarah...", seq)
        
        # Mark one as opened
        if outreach.emails:
            outreach.emails[0].status = EmailStatus.OPENED
            outreach.emails[0].opened_at = datetime.now()
        
        print("\n" + outreach.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
