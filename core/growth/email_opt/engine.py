"""
Email Automation Engine logic.
"""
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from .models import EmailSequence, EmailStatus, EmailTemplate, ScheduledEmail, SequenceType

logger = logging.getLogger(__name__)

class EmailAutomationEngine:
    def __init__(self, agency_name: str = "Nova Digital", owner_email: str = "hello@nova.digital"):
        self.agency_name = agency_name
        self.owner_email = owner_email
        self.templates: Dict[str, EmailTemplate] = {}
        self.sequences: Dict[str, EmailSequence] = {}
        self.scheduled: List[ScheduledEmail] = []
        self.stats = {"sent": 0, "opened": 0, "active_sequences": 0}

    def _validate_email(self, email: str) -> bool:
        return bool(re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email))

    def create_template(
        self, name: str, subject: str, body: str, category: SequenceType
    ) -> EmailTemplate:
        """Register a new reusable email template."""
        template = EmailTemplate(
            id=f"TPL-{uuid.uuid4().hex[:6].upper()}",
            name=name, subject=subject, body=body, category=category,
        )
        self.templates[template.id] = template
        return template

    def create_sequence(
        self, name: str, seq_type: SequenceType, emails: List[Dict[str, Any]]
    ) -> EmailSequence:
        """Define a new automated email sequence."""
        seq = EmailSequence(
            id=f"SEQ-{uuid.uuid4().hex[:6].upper()}", name=name, type=seq_type, emails=emails
        )
        self.sequences[seq.id] = seq
        self.stats["active_sequences"] += 1
        return seq

    def enroll_contact(
        self, seq_id: str, email: str, name: str, vars: Optional[Dict] = None
    ) -> bool:
        if seq_id not in self.sequences: return False
        if not self._validate_email(email): return False

        seq = self.sequences[seq_id]
        seq.enrollments += 1

        personalization = {
            "first_name": name.split()[0] if name else "there",
            "agency_name": self.agency_name,
        }
        if vars: personalization.update(vars)

        for cfg in seq.emails:
            scheduled = ScheduledEmail(
                id=f"EM-{uuid.uuid4().hex[:8]}",
                template_id=cfg["template_id"],
                recipient_email=email,
                recipient_name=name,
                personalization=personalization,
                scheduled_for=datetime.now() + timedelta(days=cfg["delay_days"]),
            )
            self.scheduled.append(scheduled)
        return True

    def send_pending(self) -> int:
        now = datetime.now()
        count = 0
        for em in self.scheduled:
            if em.status == EmailStatus.SCHEDULED and em.scheduled_for <= now:
                em.status = EmailStatus.SENT
                em.sent_at = now
                count += 1
                self.stats["sent"] += 1
        return count
