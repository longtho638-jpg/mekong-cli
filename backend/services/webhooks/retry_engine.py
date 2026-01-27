"""
Retry Policy Engine.
Handles exponential backoff calculations and Circuit Breaker pattern.
"""
import logging
import random
import time
from enum import Enum
from typing import Any, Dict, Tuple

import redis

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class RetryPolicyEngine:
    """
    Engine for calculating retries and managing circuit breakers.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

        # Circuit Breaker Defaults
        self.failure_threshold = 5
        self.reset_timeout = 60 # seconds

    def calculate_backoff(self, attempt: int, base_delay: float = 1.0, max_delay: float = 300.0) -> float:
        """
        Calculate exponential backoff with jitter.
        """
        # Exponential backoff: 2^attempt * base_delay
        # attempt starts at 1
        delay = min(base_delay * (2 ** (attempt - 1)), max_delay)

        # Add jitter: +/- 25%
        jitter_factor = 0.25
        jitter = delay * jitter_factor * (random.random() * 2 - 1)

        total_delay = max(0, delay + jitter)
        return total_delay

    def get_circuit_status(self, webhook_config_id: str) -> CircuitState:
        """
        Get current status of the circuit breaker for a webhook.
        """
        key_state = f"circuit:{webhook_config_id}:state"

        # Default CLOSED
        state_str = self.redis.get(key_state)
        if not state_str:
            return CircuitState.CLOSED

        state = CircuitState(state_str.decode('utf-8'))

        if state == CircuitState.OPEN:
            # Check if cooldown has passed
            key_open_ts = f"circuit:{webhook_config_id}:open_ts"
            open_ts = self.redis.get(key_open_ts)

            if open_ts:
                elapsed = time.time() - float(open_ts)
                if elapsed > self.reset_timeout:
                    # Transition to HALF_OPEN
                    self.redis.set(key_state, CircuitState.HALF_OPEN.value)
                    return CircuitState.HALF_OPEN

        return state

    def record_failure(self, webhook_config_id: str):
        """
        Record a failure and potentially open the circuit.
        """
        key_failures = f"circuit:{webhook_config_id}:failures"
        key_state = f"circuit:{webhook_config_id}:state"

        # Increment failure count
        failures = self.redis.incr(key_failures)
        self.redis.expire(key_failures, self.reset_timeout * 2) # Auto-reset failures if inactive

        if failures >= self.failure_threshold:
            # Open Circuit
            self.redis.set(key_state, CircuitState.OPEN.value)
            self.redis.set(f"circuit:{webhook_config_id}:open_ts", time.time())
            logger.warning(f"Circuit Breaker OPEN for webhook {webhook_config_id} after {failures} failures")

    def record_success(self, webhook_config_id: str):
        """
        Record a success. If HALF_OPEN, close the circuit.
        If CLOSED, reset failure count.
        """
        key_state = f"circuit:{webhook_config_id}:state"
        key_failures = f"circuit:{webhook_config_id}:failures"

        state = self.get_circuit_status(webhook_config_id)

        if state == CircuitState.HALF_OPEN:
            # Success in HALF_OPEN -> Close Circuit
            self.redis.set(key_state, CircuitState.CLOSED.value)
            self.redis.delete(key_failures)
            logger.info(f"Circuit Breaker CLOSED for webhook {webhook_config_id} (recovered)")

        elif state == CircuitState.CLOSED:
            # Just reset failures
            self.redis.delete(key_failures)
