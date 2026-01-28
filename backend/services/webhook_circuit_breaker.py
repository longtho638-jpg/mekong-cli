"""
Webhook Circuit Breaker Service.
Implements the Circuit Breaker pattern to prevent cascading failures.
"""
import logging
import time
from enum import Enum

import redis

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class WebhookCircuitBreaker:
    """
    State machine for Webhook delivery health.

    States:
    - CLOSED: Normal operation. Errors are counted.
    - OPEN: Failure threshold reached. All requests rejected immediately.
    - HALF_OPEN: Cooldown passed. One request allowed to test connectivity.
    """

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

        # Configuration
        self.failure_threshold = 5
        self.reset_timeout = 30  # seconds (cooldown)
        self.success_threshold = 3 # successes to close circuit from half-open

    def _get_key_state(self, config_id: str) -> str:
        return f"circuit:{config_id}:state"

    def _get_key_failures(self, config_id: str) -> str:
        return f"circuit:{config_id}:failures"

    def _get_key_open_ts(self, config_id: str) -> str:
        return f"circuit:{config_id}:open_ts"

    def _get_key_successes(self, config_id: str) -> str:
        return f"circuit:{config_id}:successes"

    def get_status(self, webhook_config_id: str) -> CircuitState:
        """
        Get current status of the circuit breaker.
        Handles the transition from OPEN to HALF_OPEN based on time.
        """
        key_state = self._get_key_state(webhook_config_id)
        state_str = self.redis.get(key_state)

        if not state_str:
            return CircuitState.CLOSED

        state = CircuitState(state_str.decode('utf-8'))

        if state == CircuitState.OPEN:
            # Check if cooldown has passed
            key_open_ts = self._get_key_open_ts(webhook_config_id)
            open_ts = self.redis.get(key_open_ts)

            if open_ts:
                elapsed = time.time() - float(open_ts)
                if elapsed > self.reset_timeout:
                    # Transition to HALF_OPEN
                    logger.info(f"Circuit {webhook_config_id} cooldown passed. Transitioning OPEN -> HALF_OPEN")
                    self.redis.set(key_state, CircuitState.HALF_OPEN.value)
                    return CircuitState.HALF_OPEN

        return state

    def record_failure(self, webhook_config_id: str):
        """
        Record a failure event.
        If in CLOSED state and threshold reached -> Transition to OPEN.
        If in HALF_OPEN state -> Transition back to OPEN.
        """
        state = self.get_status(webhook_config_id)
        _ = self._get_key_state(webhook_config_id)
        key_failures = self._get_key_failures(webhook_config_id)

        if state == CircuitState.HALF_OPEN:
            # Failed in probe state -> Open immediately
            logger.warning(f"Circuit {webhook_config_id} probe failed. Transitioning HALF_OPEN -> OPEN")
            self._open_circuit(webhook_config_id)
            return

        # Increment failure count
        failures = self.redis.incr(key_failures)
        # Set expire to auto-reset if no more failures happen for a while (2x threshold window)
        self.redis.expire(key_failures, self.reset_timeout * 2)

        if failures >= self.failure_threshold:
            logger.warning(f"Circuit {webhook_config_id} failure threshold ({self.failure_threshold}) reached. Transitioning CLOSED -> OPEN")
            self._open_circuit(webhook_config_id)

    def record_success(self, webhook_config_id: str):
        """
        Record a success event.
        If in HALF_OPEN state and success threshold reached -> Transition to CLOSED.
        If in CLOSED state -> Reset failures.
        """
        state = self.get_status(webhook_config_id)
        _ = self._get_key_state(webhook_config_id)
        key_failures = self._get_key_failures(webhook_config_id)

        if state == CircuitState.HALF_OPEN:
            key_successes = self._get_key_successes(webhook_config_id)
            successes = self.redis.incr(key_successes)

            if successes >= self.success_threshold:
                logger.info(f"Circuit {webhook_config_id} recovered. Transitioning HALF_OPEN -> CLOSED")
                self._close_circuit(webhook_config_id)

        elif state == CircuitState.CLOSED:
            # Reset failure count on success
            self.redis.delete(key_failures)

    def _open_circuit(self, webhook_config_id: str):
        key_state = self._get_key_state(webhook_config_id)
        key_open_ts = self._get_key_open_ts(webhook_config_id)

        pipeline = self.redis.pipeline()
        pipeline.set(key_state, CircuitState.OPEN.value)
        pipeline.set(key_open_ts, time.time())
        pipeline.execute()

    def _close_circuit(self, webhook_config_id: str):
        key_state = self._get_key_state(webhook_config_id)
        key_failures = self._get_key_failures(webhook_config_id)
        key_successes = self._get_key_successes(webhook_config_id)

        pipeline = self.redis.pipeline()
        pipeline.set(key_state, CircuitState.CLOSED.value)
        pipeline.delete(key_failures)
        pipeline.delete(key_successes)
        pipeline.execute()
