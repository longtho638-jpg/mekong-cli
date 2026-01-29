import asyncio
import json
import time
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.services.webhooks.advanced_service import AdvancedWebhookService
from backend.services.webhooks.rate_limiter import RateLimiter
from backend.services.webhooks.retry_engine import CircuitState, RetryPolicyEngine
from backend.services.webhooks.signature_service import SignatureService
from backend.services.webhooks.transformer_service import WebhookTransformer


# --- Unit Tests: Signature Service ---
def test_hmac_signature():
    secret = "mysecret"
    payload = '{"event": "test"}'
    sig = SignatureService.generate_hmac_signature(payload, secret)
    assert SignatureService.verify_hmac_signature(payload, secret, sig)
    assert not SignatureService.verify_hmac_signature(payload, "wrongsecret", sig)


def test_timestamp_verification():
    now = int(time.time())
    assert SignatureService.verify_timestamp(now)
    assert not SignatureService.verify_timestamp(now - 600)  # 10 mins ago


# --- Unit Tests: Retry Engine ---
def test_backoff_calculation():
    engine = RetryPolicyEngine(MagicMock())
    # 2^0 * 1 = 1 (+/- 25%)
    # attempt 1 in logic is 2^(1-1) = 1
    assert 0.75 <= engine.calculate_backoff(1) <= 1.25
    # attempt 2: 2^1 = 2
    assert 1.5 <= engine.calculate_backoff(2) <= 2.5
    # attempt 3: 2^2 = 4
    assert 3.0 <= engine.calculate_backoff(3) <= 5.0


def test_circuit_breaker():
    mock_redis = MagicMock()
    engine = RetryPolicyEngine(mock_redis)
    config_id = "test_config"

    # Simulate 5 failures
    # record_failure increments counter.
    # incr returns the new value.
    mock_redis.incr.side_effect = [1, 2, 3, 4, 5]

    for _ in range(5):
        engine.record_failure(config_id)

    # Check if OPEN set
    # Expected: set(key, OPEN)
    assert mock_redis.set.call_count >= 1


# --- Unit Tests: Transformer ---
def test_jinja_transformation():
    transformer = WebhookTransformer()
    payload = {"user": {"id": 1, "name": "Alice"}, "action": "created"}
    template = '{"event_type": "{{event.action}}", "user_id": {{event.user.id}}}'

    result = transformer.transform_payload(payload, template)
    assert result["event_type"] == "created"
    assert result["user_id"] == 1


def test_field_filtering():
    transformer = WebhookTransformer()
    payload = {"user": {"password": "secret", "email": "a@b.com"}}
    result = transformer.filter_fields(payload, ["user.password"])
    assert "password" not in result["user"]
    assert "email" in result["user"]


# --- Integration Tests: Advanced Service ---
@pytest.mark.asyncio
async def test_trigger_webhook_flow():
    mock_redis = MagicMock()
    mock_redis.exists.return_value = False  # Idempotency check
    mock_redis.execute_command.return_value = 1  # Rate limit allowed (1=True)

    # Mock Redis GET for Circuit Breaker state
    # First call is rate limiter (lua script via eval/execute_command),
    # but get_circuit_status calls redis.get()
    mock_redis.get.return_value = None  # Default to CLOSED

    # Mock DB
    mock_db = MagicMock()

    # Mock Config
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {
            "id": "conf1",
            "url": "http://example.com",
            "secret": "sec",
            "is_active": True,
            "rate_limit": 100,
        }
    ]

    # Mock Delivery Insert
    mock_db.table.return_value.insert.return_value.execute.return_value.data = [{"id": "del1"}]

    with patch("backend.services.webhooks.advanced_service.get_db", return_value=mock_db):
        service = AdvancedWebhookService(mock_redis)

        # Mock execute_delivery_attempt to avoid actual HTTP call in this test
        service.execute_delivery_attempt = AsyncMock()

        await service.trigger_webhook("conf1", "test.event", {"data": 123})

        service.execute_delivery_attempt.assert_called_once()


@pytest.mark.asyncio
async def test_batch_flushing():
    mock_redis = MagicMock()
    mock_db = MagicMock()

    # Mock Config
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": "conf1", "url": "http://example.com", "secret": "sec", "is_active": True}
    ]

    with patch("backend.services.webhooks.advanced_service.get_db", return_value=mock_db):
        service = AdvancedWebhookService(mock_redis)
        service.trigger_webhook = AsyncMock()

        # Mock Redis Scan and LIndex for stale batch check
        mock_redis.scan.side_effect = [(0, [b"batch:conf1"])]

        # Mock an old event timestamp
        old_time = (datetime.utcnow() - timedelta(seconds=120)).isoformat()
        event = json.dumps({"timestamp": old_time})
        mock_redis.lindex.return_value = event

        # Mock Pipeline for flush
        mock_pipeline = MagicMock()
        mock_redis.pipeline.return_value = mock_pipeline
        mock_pipeline.execute.return_value = [[event]]

        await service.flush_stale_batches(max_wait_seconds=60)

        # Should have called trigger_webhook
        service.trigger_webhook.assert_called_once()
