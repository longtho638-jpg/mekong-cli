import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.api.routers.webhooks.models import DeliveryStatus, WebhookProvider
from backend.models.webhooks import WebhookConfig, WebhookDelivery
from backend.services.webhook_queue import WebhookQueueService
from backend.services.webhook_sender import WebhookSenderService

# Mock data
MOCK_SECRET = "whsec_test123"
MOCK_PAYLOAD = {"id": "evt_123", "type": "payment.success"}


@pytest.fixture
def mock_db_session():
    session = MagicMock()
    return session


@pytest.fixture
def sender_service(mock_db_session):
    service = WebhookSenderService()
    # Mock _get_db to return our mock session
    service._get_db = MagicMock(return_value=mock_db_session)
    return service


@pytest.fixture
def queue_service():
    service = WebhookQueueService()
    service._client = MagicMock()  # Mock Redis client
    return service


def test_signature_generation(sender_service):
    """Test HMAC SHA256 signature generation."""
    timestamp = 1234567890
    payload_str = json.dumps(MOCK_PAYLOAD)

    signature = sender_service.generate_signature(payload_str, MOCK_SECRET, timestamp)

    assert signature.startswith(f"t={timestamp},v1=")

    # Verify manually
    to_sign = f"{timestamp}.{payload_str}"
    expected_sig = hmac.new(MOCK_SECRET.encode(), to_sign.encode(), hashlib.sha256).hexdigest()

    assert signature == f"t={timestamp},v1={expected_sig}"


@pytest.mark.asyncio
async def test_webhook_trigger_subscription_logic(sender_service, mock_db_session):
    """Test that webhooks are triggered only for subscribed events."""

    # Mock DB response for endpoints
    # WebhookConfig objects
    ep1 = WebhookConfig(
        id="ep_1", url="http://test.com/1", secret="s1", event_types=["payment.*"], is_active=True
    )
    ep2 = WebhookConfig(
        id="ep_2",
        url="http://test.com/2",
        secret="s2",
        event_types=["user.created"],
        is_active=True,
    )
    ep3 = WebhookConfig(
        id="ep_3", url="http://test.com/3", secret="s3", event_types=["*"], is_active=True
    )

    mock_endpoints = [ep1, ep2, ep3]

    # Mock db.query().filter().all()
    mock_db_session.query.return_value.filter.return_value.all.return_value = mock_endpoints

    sender_service.schedule_delivery = AsyncMock()

    # Trigger 'payment.success'
    await sender_service.trigger_webhooks("payment.success", MOCK_PAYLOAD, db=mock_db_session)

    # Should match ep_1 (wildcard) and ep_3 (global wildcard)
    # Should NOT match ep_2
    assert sender_service.schedule_delivery.call_count == 2

    # Check arguments
    calls = sender_service.schedule_delivery.call_args_list
    endpoint_ids = [c[0][0].id for c in calls]
    assert "ep_1" in endpoint_ids
    assert "ep_3" in endpoint_ids
    assert "ep_2" not in endpoint_ids


@pytest.mark.asyncio
async def test_retry_logic_scheduling(sender_service, mock_db_session):
    """Test that failed delivery schedules a retry."""

    delivery = WebhookDelivery(
        id="del_1",
        webhook_config_id="ep_1",
        event_type="test",
        payload=MOCK_PAYLOAD,
        attempt_count=0,
        status=DeliveryStatus.PENDING.value,
    )
    _ = WebhookConfig(id="ep_1", url="http://test.com/1", secret="s1")

    # Mock aiohttp to fail
    with patch("aiohttp.ClientSession.post") as mock_post:
        mock_post.side_effect = Exception("Connection refused")

        # We call _execute_delivery directly or via schedule, but here we test _update_delivery_status via _execute_delivery logic
        # Or better, just call _update_delivery_status directly
        await sender_service._update_delivery_status(
            delivery, False, 0, "Connection refused", mock_db_session
        )

        # Check DB commit
        mock_db_session.commit.assert_called()

        assert delivery.status == DeliveryStatus.PENDING.value
        assert delivery.attempt_count == 1
        assert delivery.next_retry_at is not None

        # Verify backoff (should be ~2 seconds for 1st retry if base is 2)
        # We can't easily check exact time, but we can check it's in future


@pytest.mark.asyncio
async def test_dlq_on_max_retries(sender_service, mock_db_session):
    """Test that max retries leads to DLQ."""

    delivery = WebhookDelivery(
        id="del_1",
        webhook_config_id="ep_1",
        event_type="test",
        payload=MOCK_PAYLOAD,
        attempt_count=sender_service.max_retries,  # Already at max effectively if we increment
    )
    # If attempt_count is max_retries (3), next attempt makes it 4 -> fail
    # Actually logic is: current_attempts = delivery.attempt_count + 1
    # if current_attempts < max_retries (3): retry
    # else: fail
    # So if attempt_count is 2, next is 3. 3 is not < 3. Fail.
    # Wait, max_retries=3 means: Try 1, Retry 1 (2 total), Retry 2 (3 total).
    # If I set attempt_count = 2, next is 3. 3 < 3 is False. So it fails.

    delivery.attempt_count = 2

    sender_service._send_to_dlq = AsyncMock()

    await sender_service._update_delivery_status(
        delivery, False, 500, "Server Error", mock_db_session
    )

    assert delivery.status == DeliveryStatus.FAILED.value
    # Should call DLQ
    sender_service._send_to_dlq.assert_called_once()
    mock_db_session.commit.assert_called()


def test_queue_operations(queue_service):
    """Test enqueue and dequeue logic."""
    queue_service.enqueue("evt_1")
    queue_service._client.lpush.assert_called_with("webhook:queue", "evt_1")

    queue_service._client.brpop.return_value = ("webhook:queue", "evt_1")
    item = queue_service.dequeue()
    assert item == "evt_1"

    # Test metrics
    queue_service._client.llen.return_value = 5
    metrics = queue_service.get_metrics()
    assert metrics["queue_depth"] == 5
