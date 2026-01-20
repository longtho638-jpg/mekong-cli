"""
Callback scheduling and management logic.
"""
import logging
import uuid
from datetime import datetime
from typing import List

from .models import ScheduledCallback

logger = logging.getLogger(__name__)

class CallbackManager:
    def __init__(self):
        self.callbacks: List[ScheduledCallback] = []

    def schedule_callback(
        self, client: str, phone: str, scheduled_time: datetime, reason: str
    ) -> ScheduledCallback:
        """Register a future callback."""
        if scheduled_time < datetime.now():
            logger.warning(f"Scheduling callback in the past for {client}")

        callback = ScheduledCallback(
            id=f"CB-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            phone=phone,
            scheduled_time=scheduled_time,
            reason=reason,
        )
        self.callbacks.append(callback)
        logger.info(f"Callback scheduled: {client} at {scheduled_time.strftime('%H:%M')}")
        return callback

    def complete_callback(self, callback_id: str) -> bool:
        """Mark a specific callback as handled."""
        for cb in self.callbacks:
            if cb.id == callback_id:
                cb.completed = True
                logger.info(f"Callback completed: {cb.client}")
                return True
        return False

    def get_pending_callbacks(self) -> List[ScheduledCallback]:
        """Filter callbacks that haven't been completed yet."""
        return [c for c in self.callbacks if not c.completed]
