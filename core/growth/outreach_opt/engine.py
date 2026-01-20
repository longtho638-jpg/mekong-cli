"""
Automated Outreach Engine logic.
"""
import logging
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from .models import EmailStatus, OutreachEmail, OutreachSequence, OutreachTrigger

logger = logging.getLogger(__name__)

class OutreachEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.sequences: Dict[str, OutreachSequence] = {}
        self.emails: List[OutreachEmail] = []

    def _validate_email(self, email: str) -> bool:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    def send_email(
        self, recipient: str, subject: str, body: str, sequence: OutreachSequence
    ) -> OutreachEmail:
        if not self._validate_email(recipient):
            raise ValueError(f"Invalid email: {recipient}")
        if not subject or not body:
            raise ValueError("Subject and body cannot be empty")

        email = OutreachEmail(
            id=f"OUT-{uuid.uuid4().hex[:6].upper()}",
            recipient=recipient, subject=subject, body=body,
            sequence_name=sequence.name, status=EmailStatus.SENT,
            sent_at=datetime.now(),
        )
        self.emails.append(email)
        sequence.sent_count += 1
        logger.info(f"Email sent to {recipient} via {sequence.name}")
        return email
