"""
📊 Rate Governor
===============

Rate limiting for resource protection.
"""

import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class RateGovernor:
    """Rate limiter for resource protection."""

    resource: str
    max_requests: int = 100
    window_seconds: int = 60
    current_count: int = 0
    window_start: datetime = field(default_factory=datetime.now)
    _lock: threading.Lock = field(default_factory=threading.Lock, init=False, repr=False)

    def check_rate(self) -> bool:
        """Check if request is within rate limit."""
        with self._lock:
            now = datetime.now()
            elapsed = (now - self.window_start).seconds

            # Reset window if expired
            if elapsed >= self.window_seconds:
                self.window_start = now
                self.current_count = 0

            if self.current_count >= self.max_requests:
                logger.warning(f"Rate limit exceeded for {self.resource}")
                return False

            self.current_count += 1
            return True
