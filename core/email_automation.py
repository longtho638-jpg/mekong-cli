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

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import uuid


class SequenceType(Enum):
    """Types of email sequences."""
    WELCOME = "welcome"
    ONBOARDING = "onboarding"
    NURTURE = "nurture"
    PROPOSAL_FOLLOW = "proposal_follow"
    REENGAGEMENT = "reengagement"
    UPSELL = "upsell"


class EmailStatus(Enum):
    """Email send status."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    SENT = "sent"
    OPENED = "opened"
    CLICKED = "clicked"
    BOUNCED = "bounced"


@dataclass
class EmailTemplate:
    """An email template."""
    id: str
    name: str
    subject: str
    body: str
    category: SequenceType
    created_at: datetime


@dataclass
class ScheduledEmail:
    """A scheduled email."""
    id: str
    template_id: str
    recipient_email: str
    recipient_name: str
    personalization: Dict[str, str]
    scheduled_for: datetime
    status: EmailStatus
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None


@dataclass
class EmailSequence:
    """An automated email sequence."""
    id: str
    name: str
    type: SequenceType
    emails: List[Dict[str, Any]]  # List of {template_id, delay_days}
    active: bool = True
    enrollments: int = 0


class EmailAutomation:
    """
    Email Automation Engine.
    
    Automate your client communication:
    - Welcome sequences
    - Onboarding flows
    - Nurture campaigns
    - Proposal follow-ups
    - Re-engagement sequences
    """
    
    def __init__(self, agency_name: str = "Nova Digital", owner_email: str = "hello@nova.digital"):
        self.agency_name = agency_name
        self.owner_email = owner_email
        
        # Data stores
        self.templates: Dict[str, EmailTemplate] = {}
        self.sequences: Dict[str, EmailSequence] = {}
        self.scheduled: List[ScheduledEmail] = []
        
        # Stats
        self.stats = {
            "emails_sent": 0,
            "emails_opened": 0,
            "emails_clicked": 0,
            "sequences_active": 0
        }
        
        # Load default templates
        self._load_default_templates()
        self._create_default_sequences()
    
    def _load_default_templates(self):
        """Load default email templates."""
        templates = [
            # Welcome sequence
            {
                "name": "Welcome Email",
                "subject": "Welcome to {agency_name}! 🎉",
                "body": """Hi {first_name}!

Welcome to {agency_name}! We're thrilled to have you on board.

I'm {owner_name}, and I'll be personally overseeing your success.

Here's what happens next:
1. You'll receive a detailed questionnaire to understand your goals
2. We'll schedule a kickoff call within 48 hours
3. Your project will officially begin!

If you have any questions, just reply to this email.

Excited to work together!

{owner_name}
{agency_name}""",
                "category": SequenceType.WELCOME
            },
            {
                "name": "Getting Started Guide",
                "subject": "Your Getting Started Guide 📋",
                "body": """Hi {first_name}!

I wanted to share some resources to help you get the most out of our partnership.

📚 RESOURCES:
• Client Portal: {portal_link}
• Project Timeline: {timeline_link}
• Communication Guidelines: We respond within 24 hours

💡 PRO TIP: The client portal is your best friend. Check it regularly for updates!

Questions? Just reply!

{owner_name}""",
                "category": SequenceType.ONBOARDING
            },
            # Nurture sequence
            {
                "name": "Value Email",
                "subject": "Quick tip to boost your {service_type} results",
                "body": """Hi {first_name}!

I came across something that could really help your business and wanted to share:

{tip_content}

This simple change has helped our clients see {benefit_stat} improvements.

Want us to implement this for you? Just reply "Yes" and we'll add it to your project at no extra cost.

{owner_name}""",
                "category": SequenceType.NURTURE
            },
            # Proposal follow-up
            {
                "name": "Proposal Check-in",
                "subject": "Quick question about your proposal",
                "body": """Hi {first_name}!

I wanted to check in on the proposal I sent for {project_name}.

I know you're busy, so I'll keep this short:

✅ Any questions I can answer?
✅ Need any adjustments to the scope?
✅ Ready to get started?

The proposal is valid until {valid_until}, so no rush - but I'd love to lock in your spot!

Just reply with any questions.

{owner_name}""",
                "category": SequenceType.PROPOSAL_FOLLOW
            },
            {
                "name": "Proposal Final Notice",
                "subject": "Your proposal expires tomorrow ⏰",
                "body": """Hi {first_name}!

Just a heads up - your proposal for {project_name} expires tomorrow ({valid_until}).

If you're still interested, I'd hate for you to miss out on the special pricing.

Ready to move forward? Reply "Yes" and I'll send over the contract.

Need more time? Let me know and I can extend the deadline.

{owner_name}""",
                "category": SequenceType.PROPOSAL_FOLLOW
            },
            # Re-engagement
            {
                "name": "Miss You Email",
                "subject": "We miss you, {first_name}! 👋",
                "body": """Hi {first_name}!

It's been a while since we last worked together, and I wanted to reach out.

I've been thinking about {company_name} and some new strategies that could really move the needle for you.

Would you be open to a quick 15-minute call to explore some ideas?

No pitch, just honest strategy talk.

Reply "Yes" and I'll send you my calendar link.

Hope to reconnect soon!

{owner_name}""",
                "category": SequenceType.REENGAGEMENT
            },
            # Upsell
            {
                "name": "Upsell Opportunity",
                "subject": "A thought about {current_project}...",
                "body": """Hi {first_name}!

While working on {current_project}, I noticed an opportunity that could really amplify your results.

{upsell_pitch}

I've prepared a quick proposal - it would integrate seamlessly with what we're already doing.

Interested in learning more? Reply and I'll send over the details.

{owner_name}""",
                "category": SequenceType.UPSELL
            }
        ]
        
        for t in templates:
            template = EmailTemplate(
                id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
                name=t["name"],
                subject=t["subject"],
                body=t["body"],
                category=t["category"],
                created_at=datetime.now()
            )
            self.templates[template.id] = template
    
    def _create_default_sequences(self):
        """Create default sequences."""
        # Welcome sequence
        welcome_templates = [t for t in self.templates.values() if t.category == SequenceType.WELCOME]
        onboarding_templates = [t for t in self.templates.values() if t.category == SequenceType.ONBOARDING]
        
        if welcome_templates and onboarding_templates:
            self.create_sequence(
                name="New Client Welcome",
                seq_type=SequenceType.WELCOME,
                emails=[
                    {"template_id": welcome_templates[0].id, "delay_days": 0},
                    {"template_id": onboarding_templates[0].id, "delay_days": 1}
                ]
            )
        
        # Proposal follow-up
        proposal_templates = [t for t in self.templates.values() if t.category == SequenceType.PROPOSAL_FOLLOW]
        if len(proposal_templates) >= 2:
            self.create_sequence(
                name="Proposal Follow-Up",
                seq_type=SequenceType.PROPOSAL_FOLLOW,
                emails=[
                    {"template_id": proposal_templates[0].id, "delay_days": 3},
                    {"template_id": proposal_templates[1].id, "delay_days": 6}
                ]
            )
    
    def create_template(
        self,
        name: str,
        subject: str,
        body: str,
        category: SequenceType
    ) -> EmailTemplate:
        """Create a new email template."""
        template = EmailTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            subject=subject,
            body=body,
            category=category,
            created_at=datetime.now()
        )
        self.templates[template.id] = template
        return template
    
    def create_sequence(
        self,
        name: str,
        seq_type: SequenceType,
        emails: List[Dict[str, Any]]
    ) -> EmailSequence:
        """Create an email sequence."""
        sequence = EmailSequence(
            id=f"SEQ-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            type=seq_type,
            emails=emails,
            active=True
        )
        self.sequences[sequence.id] = sequence
        self.stats["sequences_active"] += 1
        return sequence
    
    def enroll_contact(
        self,
        sequence_id: str,
        email: str,
        name: str,
        personalization: Dict[str, str] = None
    ) -> List[ScheduledEmail]:
        """Enroll a contact in a sequence."""
        if sequence_id not in self.sequences:
            return []
        
        sequence = self.sequences[sequence_id]
        sequence.enrollments += 1
        
        scheduled_emails = []
        now = datetime.now()
        
        # Default personalization
        default_vars = {
            "first_name": name.split()[0] if name else "there",
            "agency_name": self.agency_name,
            "owner_name": "Alex",
            "portal_link": "https://portal.novadigital.co",
            "timeline_link": "https://portal.novadigital.co/timeline"
        }
        
        if personalization:
            default_vars.update(personalization)
        
        for email_config in sequence.emails:
            template_id = email_config["template_id"]
            delay_days = email_config["delay_days"]
            
            scheduled = ScheduledEmail(
                id=f"EMAIL-{uuid.uuid4().hex[:8]}",
                template_id=template_id,
                recipient_email=email,
                recipient_name=name,
                personalization=default_vars,
                scheduled_for=now + timedelta(days=delay_days),
                status=EmailStatus.SCHEDULED
            )
            self.scheduled.append(scheduled)
            scheduled_emails.append(scheduled)
        
        return scheduled_emails
    
    def render_email(self, template_id: str, personalization: Dict[str, str]) -> Dict[str, str]:
        """Render an email with personalization tokens."""
        if template_id not in self.templates:
            return {"error": "Template not found"}
        
        template = self.templates[template_id]
        
        subject = template.subject
        body = template.body
        
        for key, value in personalization.items():
            subject = subject.replace(f"{{{key}}}", str(value))
            body = body.replace(f"{{{key}}}", str(value))
        
        return {
            "subject": subject,
            "body": body,
            "from": self.owner_email
        }
    
    def send_scheduled(self) -> int:
        """Send all due scheduled emails."""
        now = datetime.now()
        sent_count = 0
        
        for email in self.scheduled:
            if email.status == EmailStatus.SCHEDULED and email.scheduled_for <= now:
                # In production, actually send via SMTP/API
                email.status = EmailStatus.SENT
                email.sent_at = now
                sent_count += 1
                self.stats["emails_sent"] += 1
        
        return sent_count
    
    def get_sequence_stats(self, sequence_id: str) -> Dict[str, Any]:
        """Get stats for a sequence."""
        if sequence_id not in self.sequences:
            return {"error": "Sequence not found"}
        
        sequence = self.sequences[sequence_id]
        sequence_emails = [
            e for e in self.scheduled 
            if e.template_id in [em["template_id"] for em in sequence.emails]
        ]
        
        sent = sum(1 for e in sequence_emails if e.status in [EmailStatus.SENT, EmailStatus.OPENED, EmailStatus.CLICKED])
        opened = sum(1 for e in sequence_emails if e.status in [EmailStatus.OPENED, EmailStatus.CLICKED])
        clicked = sum(1 for e in sequence_emails if e.status == EmailStatus.CLICKED)
        
        return {
            "sequence_id": sequence_id,
            "name": sequence.name,
            "enrollments": sequence.enrollments,
            "emails_sent": sent,
            "open_rate": (opened / max(1, sent)) * 100,
            "click_rate": (clicked / max(1, sent)) * 100
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get overall email stats."""
        return {
            **self.stats,
            "templates_count": len(self.templates),
            "sequences_count": len(self.sequences),
            "scheduled_count": len([e for e in self.scheduled if e.status == EmailStatus.SCHEDULED]),
            "open_rate": (self.stats["emails_opened"] / max(1, self.stats["emails_sent"])) * 100,
            "click_rate": (self.stats["emails_clicked"] / max(1, self.stats["emails_sent"])) * 100
        }


# Example usage
if __name__ == "__main__":
    # Initialize automation
    email = EmailAutomation(agency_name="Nova Digital")
    
    print("📧 Email Automation Initialized!")
    print(f"   Agency: {email.agency_name}")
    print(f"   Templates: {len(email.templates)}")
    print(f"   Sequences: {len(email.sequences)}")
    print()
    
    # List templates
    print("📋 Email Templates:")
    for t in list(email.templates.values())[:5]:
        print(f"   • {t.name} ({t.category.value})")
    print()
    
    # List sequences
    print("🔄 Active Sequences:")
    for s in email.sequences.values():
        print(f"   • {s.name}: {len(s.emails)} emails")
    print()
    
    # Enroll a contact
    welcome_seq = list(email.sequences.values())[0]
    scheduled = email.enroll_contact(
        sequence_id=welcome_seq.id,
        email="john@example.com",
        name="John Smith",
        personalization={
            "company_name": "Acme Corp",
            "project_name": "Website Redesign"
        }
    )
    print(f"✅ Contact Enrolled: john@example.com")
    print(f"   Scheduled Emails: {len(scheduled)}")
    for e in scheduled:
        print(f"   • {e.scheduled_for.strftime('%Y-%m-%d')} - {e.status.value}")
    print()
    
    # Preview an email
    template = list(email.templates.values())[0]
    rendered = email.render_email(template.id, {
        "first_name": "John",
        "agency_name": "Nova Digital",
        "owner_name": "Alex"
    })
    print("📨 Email Preview:")
    print(f"   Subject: {rendered['subject']}")
    print(f"   Body: {rendered['body'][:200]}...")
    print()
    
    # Stats
    stats = email.get_stats()
    print("📊 Statistics:")
    print(f"   Templates: {stats['templates_count']}")
    print(f"   Sequences: {stats['sequences_count']}")
    print(f"   Scheduled: {stats['scheduled_count']}")
