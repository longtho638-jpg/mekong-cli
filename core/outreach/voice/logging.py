"""
Call logging and reporting logic.
"""
import logging
import re
import uuid
from typing import Any, Dict, List

from .models import CallLog, CallOutcome, CallType

logger = logging.getLogger(__name__)

class CallLogger:
    def __init__(self, agent_name: str = "Assistant"):
        self.agent_name = agent_name
        self.calls: List[CallLog] = []

    def _validate_phone(self, phone: str) -> bool:
        """Simple phone number validation."""
        return bool(re.match(r"^\+?[\d\s\-]{7,20}$", phone))

    def log_call(
        self,
        client: str,
        phone: str,
        call_type: CallType,
        duration_seconds: int,
        outcome: CallOutcome,
        notes: str,
    ) -> CallLog:
        """Record a completed call."""
        if not client:
            raise ValueError("Client name required")
        if not self._validate_phone(phone):
            logger.warning(f"Logging call with questionable phone format: {phone}")

        call = CallLog(
            id=f"CALL-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            call_type=call_type,
            duration_seconds=duration_seconds,
            outcome=outcome,
            notes=notes,
            agent=self.agent_name,
        )
        self.calls.append(call)
        logger.info(f"Call logged: {client} ({call_type.value}) - {outcome.value}")
        return call
