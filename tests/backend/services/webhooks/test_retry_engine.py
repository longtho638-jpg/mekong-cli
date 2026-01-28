from unittest.mock import MagicMock

import pytest

from backend.services.webhooks.retry_engine import CircuitState, RetryPolicyEngine


@pytest.fixture
def mock_redis():
    return MagicMock()

@pytest.fixture
def engine(mock_redis):
    return RetryPolicyEngine(mock_redis)

class TestRetryPolicyEngine:

    def test_calculate_backoff(self, engine):
        # Test exponential growth
        # Attempt 1: 1 * 2^0 = 1
        # Attempt 2: 1 * 2^1 = 2
        # Attempt 3: 1 * 2^2 = 4

        # Since there is jitter (+/- 25%), we check ranges

        delay_1 = engine.calculate_backoff(1, base_delay=1.0)
        assert 0.75 <= delay_1 <= 1.25

        delay_2 = engine.calculate_backoff(2, base_delay=1.0)
        assert 1.5 <= delay_2 <= 2.5

        delay_3 = engine.calculate_backoff(3, base_delay=1.0)
        assert 3.0 <= delay_3 <= 5.0

    def test_calculate_backoff_max(self, engine):
        # delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
        # then jitter is added.

        # If max_delay is 10.
        # delay = 10.
        # jitter = 10 * 0.25 * random (-1 to 1) -> -2.5 to 2.5.
        # total = 7.5 to 12.5.
        delay = engine.calculate_backoff(100, base_delay=1.0, max_delay=10.0)
        assert 7.5 <= delay <= 12.5

    def test_get_circuit_status_default(self, engine, mock_redis):
        mock_redis.get.return_value = None
        state = engine.get_circuit_status("conf_1")
        assert state == CircuitState.CLOSED

    def test_record_failure_open_circuit(self, engine, mock_redis):
        webhook_id = "conf_1"
        engine.failure_threshold = 3

        # 1st failure
        mock_redis.incr.return_value = 1
        engine.record_failure(webhook_id)
        mock_redis.set.assert_not_called()

        # 3rd failure
        mock_redis.incr.return_value = 3
        engine.record_failure(webhook_id)

        # Should open circuit
        mock_redis.set.assert_any_call(f"circuit:{webhook_id}:state", CircuitState.OPEN.value)

    def test_record_success_recovery(self, engine, mock_redis):
        webhook_id = "conf_1"

        # Setup as HALF_OPEN
        mock_redis.get.return_value = CircuitState.HALF_OPEN.value.encode('utf-8')

        engine.record_success(webhook_id)

        # Should close circuit and delete failures
        mock_redis.set.assert_called_with(f"circuit:{webhook_id}:state", CircuitState.CLOSED.value)
        mock_redis.delete.assert_called_with(f"circuit:{webhook_id}:failures")
