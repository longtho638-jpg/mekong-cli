"""
Retry Strategy Service.
Handles exponential backoff calculations with jitter.
"""
import logging
import random

logger = logging.getLogger(__name__)

class RetryStrategy:
    """
    Implements exponential backoff with jitter strategy.

    Principles:
    - Base delay: 1s
    - Multiplier: 2 (Binary exponential)
    - Jitter: +/- 20% to prevent thundering herd
    - Max delay: 64s
    """

    def __init__(self, base_delay: float = 1.0, max_delay: float = 64.0, jitter_factor: float = 0.2):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.jitter_factor = jitter_factor

    def calculate_backoff(self, attempt: int) -> float:
        """
        Calculate wait time for the next retry attempt.

        Args:
            attempt (int): The number of the current attempt (1-based index).

        Returns:
            float: Delay in seconds.
        """
        if attempt < 1:
            return 0.0

        # Exponential backoff: base * 2^(attempt-1)
        # Attempt 1: 1s
        # Attempt 2: 2s
        # Attempt 3: 4s
        # ...
        delay = min(self.base_delay * (2 ** (attempt - 1)), self.max_delay)

        # Add jitter
        # Random value between -jitter_factor and +jitter_factor
        jitter_range = delay * self.jitter_factor
        jitter = random.uniform(-jitter_range, jitter_range)

        total_delay = max(0.0, delay + jitter)

        return total_delay
