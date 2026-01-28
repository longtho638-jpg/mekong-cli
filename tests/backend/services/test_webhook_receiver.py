from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from backend.api.routers.webhooks.models import WebhookProvider, WebhookStatus
from backend.models.webhooks import WebhookEvent
from backend.services.webhook_receiver import WebhookReceiverService


@pytest.fixture
def mock_db_session():
    return MagicMock()

@pytest.fixture
def receiver_service():
    return WebhookReceiverService()

@pytest.mark.asyncio
async def test_receive_event_new(receiver_service, mock_db_session):
    # Setup
    provider = WebhookProvider.STRIPE
    event_id = "evt_test_123"
    event_type = "payment.succeeded"
    payload = {"amount": 100}

    # Mock DB query returning None (no duplicate)
    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value.first.return_value = None

    # Mock add/commit
    mock_db_session.add = MagicMock()
    mock_db_session.commit = MagicMock()
    mock_db_session.refresh = MagicMock()

    # Execute
    result = await receiver_service.receive_event(
        provider=provider,
        event_id=event_id,
        event_type=event_type,
        payload=payload,
        db=mock_db_session
    )

    # Verify
    assert result["event_id"] == event_id
    assert result["status"] == WebhookStatus.PENDING.value
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()

@pytest.mark.asyncio
async def test_receive_event_duplicate(receiver_service, mock_db_session):
    # Setup
    provider = WebhookProvider.STRIPE
    event_id = "evt_test_123"

    # Mock existing event
    existing_event = WebhookEvent(
        id="uuid-1",
        provider=provider.value,
        event_id=event_id,
        event_type="payment.succeeded",
        payload={},
        status=WebhookStatus.PROCESSED.value,
        created_at=datetime.utcnow()
    )

    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value.first.return_value = existing_event

    # Execute
    result = await receiver_service.receive_event(
        provider=provider,
        event_id=event_id,
        event_type="payment.succeeded",
        payload={},
        db=mock_db_session
    )

    # Verify
    assert result["id"] == "uuid-1"
    assert result["status"] == WebhookStatus.PROCESSED.value
    mock_db_session.add.assert_not_called()

@pytest.mark.asyncio
async def test_update_status(receiver_service, mock_db_session):
    # Setup
    event_id = "uuid-123"
    status = WebhookStatus.PROCESSED

    mock_event = MagicMock(spec=WebhookEvent)
    mock_query = mock_db_session.query.return_value
    mock_query.filter.return_value.first.return_value = mock_event

    # Execute
    await receiver_service.update_status(event_id, status, db=mock_db_session)

    # Verify
    assert mock_event.status == status.value
    assert mock_event.processed_at is not None
    mock_db_session.commit.assert_called_once()
