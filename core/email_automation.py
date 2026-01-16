"""
📧 Email Automation - Nurture Clients on Autopilot
===================================================

Automated email sequences that convert leads into clients.

Features:
- Email sequences (welcome, onboarding, nurture)
- Template library
- Personalization tokens
- Send scheduling
- Open/click tracking
"""

import uuid
import logging
import re
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SequenceType(Enum):
    """Categories for automated email sequences."""
    WELCOME = "welcome"
    ONBOARDING = "onboarding"
    NURTURE = "nurture"
    PROPOSAL_FOLLOW = "proposal_follow"
    REENGAGEMENT = "reengagement"
    UPSELL = "upsell"


class EmailStatus(Enum):
    """Current state of a scheduled or sent email."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"


@dataclass
class EmailTemplate:
    """An email template entity."""
    id: str
    name: str
    subject: str
    body: str
    category: SequenceType
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ScheduledEmail:
    """A single email scheduled for delivery."""
    id: str
    template_id: str
    recipient_email: str
    recipient_name: str
    personalization: Dict[str, str]
    scheduled_for: datetime
    status: EmailStatus = EmailStatus.SCHEDULED
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None


@dataclass
class EmailSequence:
    """An automated workflow of multiple emails."""
    id: str
    name: str
    type: SequenceType
    emails: List[Dict[str, Any]]  # {template_id, delay_days}
    active: bool = True
    enrollments: int = 0


class EmailAutomation:
    """
    Email Automation Engine System.
    
    Orchestrates templates, sequences, and scheduled deliveries for client nurture.
    """
    
    def __init__(self, agency_name: str = "Nova Digital", owner_email: str = "hello@nova.digital"):
        self.agency_name = agency_name
        self.owner_email = owner_email
        self.templates: Dict[str, EmailTemplate] = {}
        self.sequences: Dict[str, EmailSequence] = {}
        self.scheduled: List[ScheduledEmail] = []
        
        self.stats = {"sent": 0, "opened": 0, "active_sequences": 0}
        
        logger.info(f"Email Automation initialized for {agency_name}")
        self._load_defaults()
    
    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email))

    def _load_defaults(self):
        """Seed the system with standard agency templates."""
        welcome_tpl = self.create_template(
            "Welcome", "Welcome to {agency_name}! 🎉", 
            "Hi {first_name}! Thanks for joining us at {agency_name}.", 
            SequenceType.WELCOME
        )
        self.create_sequence(
            "Onboarding Flow", SequenceType.WELCOME, 
            [{"template_id": welcome_tpl.id, "delay_days": 0}]
        )
    
    def create_template(self, name: str, subject: str, body: str, category: SequenceType) -> EmailTemplate:
        """Register a new reusable email template."""
        template = EmailTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name, subject=subject, body=body, category=category
        )
        self.templates[template.id] = template
        logger.debug(f"Template created: {name}")
        return template
    
    def create_sequence(self, name: str, seq_type: SequenceType, emails: List[Dict[str, Any]]) -> EmailSequence:
        """Define a new automated email sequence."""
        seq = EmailSequence(
            id=f"SEQ-{uuid.uuid4().hex[:6].upper()}",
            name=name, type=seq_type, emails=emails
        )
        self.sequences[seq.id] = seq
        self.stats["active_sequences"] += 1
        logger.info(f"Sequence registered: {name} ({len(emails)} emails)")
        return seq
    
    def enroll_contact(self, seq_id: str, email: str, name: str, vars: Optional[Dict] = None) -> bool:
        """Add a contact to an automated email sequence."""
        if seq_id not in self.sequences: return False
        if not self._validate_email(email):
            logger.error(f"Invalid email for enrollment: {email}")
            return False

        seq = self.sequences[seq_id]
        seq.enrollments += 1
        
        personalization = {
            "first_name": name.split()[0] if name else "there",
            "agency_name": self.agency_name
        }
        if vars: personalization.update(vars)
        
        for cfg in seq.emails:
            scheduled = ScheduledEmail(
                id=f"EM-{uuid.uuid4().hex[:8]}",
                template_id=cfg["template_id"],
                recipient_email=email, recipient_name=name,
                personalization=personalization,
                scheduled_for=datetime.now() + timedelta(days=cfg["delay_days"])
            )
            self.scheduled.append(scheduled)
            
        logger.info(f"Enrolled {email} in {seq.name}")
        return True
    
    def send_pending(self) -> int:
        """Simulate sending emails that are due."""
        now = datetime.now()
        count = 0
        for em in self.scheduled:
            if em.status == EmailStatus.SCHEDULED and em.scheduled_for <= now:
                em.status = EmailStatus.SENT
                em.sent_at = now
                count += 1
                self.stats["sent"] += 1
        logger.info(f"Batch sent: {count} emails")
        return count

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
            
        lines.extend([
            "║                                                           ║",
            "║  📋 UPCOMING DELIVERIES                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        pending = [e for e in self.scheduled if e.status == EmailStatus.SCHEDULED]
        for e in pending[:3]:
            time_disp = e.scheduled_for.strftime("%Y-%m-%d")
            lines.append(f"║    📅 {time_disp} │ {e.recipient_email:<25} │ {e.id:<10}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Seq]  [📋 Templates]  [🔄 Send Now]  [⚙️ Setup]  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Nurture!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📧 Initializing Email Automation...")
    print("=" * 60)
    
    try:
        email_system = EmailAutomation("Saigon Digital Hub")
        
        # Enroll sample
        if email_system.sequences:
            sid = list(email_system.sequences.keys())[0]
            email_system.enroll_contact(sid, "test@client.co", "John Doe")
            
        print("\n" + email_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"Automation Error: {e}")
