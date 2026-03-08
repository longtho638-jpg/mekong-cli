"""
Rate Limit Client — KV-based Rate Limiting

Enforces rate limits from RaaS Gateway with exponential backoff.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Optional

import requests


@dataclass
class RateLimitStatus:
    """Rate limit status."""

    allowed: bool
    remaining: int
    limit: int
    reset_in: int  # seconds


class RateLimitClient:
    """
    Rate Limit Client with exponential backoff.

    Parses X-RateLimit-* headers from gateway responses.
    """

    DEFAULT_LIMIT = 100  # requests per minute
    MAX_RETRIES = 3
    BASE_DELAY = 1.0  # seconds

    def __init__(self):
        """Initialize rate limit client."""
        self._remaining = self.DEFAULT_LIMIT
        self._limit = self.DEFAULT_LIMIT
        self._reset_in = 60
        self._retry_count = 0
        self._last_retry: Optional[float] = None

    def can_proceed(self) -> bool:
        """Check if request can proceed."""
        if self._remaining > 0:
            return True
        # Wait for reset
        if self._last_retry and time.time() - self._last_retry < self._reset_in:
            return False
        return True

    def handle_429(self, response: requests.Response) -> None:
        """
        Handle 429 rate limit response.

        Implements exponential backoff with jitter.
        """
        self._retry_count += 1
        self._last_retry = time.time()

        # Parse retry-after header
        retry_after = response.headers.get("Retry-After")
        if retry_after:
            self._reset_in = int(retry_after)
        else:
            # Exponential backoff: 1s, 2s, 4s, ...
            delay = self.BASE_DELAY * (2 ** (self._retry_count - 1))
            self._reset_in = min(delay, 60)  # Cap at 60s

        # Parse rate limit headers
        limit = response.headers.get("X-RateLimit-Limit")
        remaining = response.headers.get("X-RateLimit-Remaining")

        if limit:
            self._limit = int(limit) if limit != "unlimited" else self.DEFAULT_LIMIT
        if remaining:
            self._remaining = int(remaining) if remaining != "unlimited" else 0

    def update_from_headers(self, headers: dict[str, str]) -> None:
        """Update rate limit state from response headers."""
        limit = headers.get("X-RateLimit-Limit")
        remaining = headers.get("X-RateLimit-Remaining")
        reset = headers.get("X-RateLimit-Reset")

        if limit and limit != "unlimited":
            self._limit = int(limit)
        if remaining and remaining != "unlimited":
            self._remaining = int(remaining)
        if reset:
            self._reset_in = int(reset)

    def wait_for_reset(self) -> None:
        """Wait for rate limit to reset."""
        if self._reset_in > 0:
            time.sleep(min(self._reset_in, 5))  # Wait max 5s
        self._retry_count = 0
        self._remaining = self._limit

    def get_status(self) -> RateLimitStatus:
        """Get current rate limit status."""
        return RateLimitStatus(
            allowed=self._remaining > 0,
            remaining=self._remaining,
            limit=self._limit,
            reset_in=self._reset_in,
        )

    def reset(self) -> None:
        """Reset rate limit state."""
        self._remaining = self.DEFAULT_LIMIT
        self._limit = self.DEFAULT_LIMIT
        self._reset_in = 60
        self._retry_count = 0
        self._last_retry = None
