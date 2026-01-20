"""
Span lifecycle and status management.
"""
import logging
import time
from typing import Optional

from .models import SpanStatus

logger = logging.getLogger(__name__)

class SpanLifecycle:
    def __init__(self):
        self.status = SpanStatus.CREATED
        self.start_time = time.time()
        self.end_time: Optional[float] = None

    def start(self) -> None:
        """Mark span as running."""
        self.status = SpanStatus.RUNNING
        if self.start_time is None:
            self.start_time = time.time()

    def finish(self, status: SpanStatus = SpanStatus.FINISHED, end_time: Optional[float] = None) -> None:
        """Finish span and record end time."""
        self.status = status
        self.end_time = end_time or time.time()
        duration = self.end_time - self.start_time

        logger.info(
            f"Span finished in {duration:.3f}s with status {status.value}"
        )

    def get_duration(self) -> Optional[float]:
        """Get span duration in seconds."""
        if self.end_time is not None:
            return self.end_time - self.start_time
        return None
