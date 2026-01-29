from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytz

from backend.services.notification_orchestrator import (
    Notification,
    NotificationChannel,
    NotificationOrchestrator,
    NotificationPriority,
    UserNotificationPreferences,
)
from backend.services.notification_rate_limiter import NotificationRateLimiter


# Mocks
@pytest.fixture
def mock_db_session():
    session = MagicMock()
    session.execute.return_value.scalar_one_or_none.return_value = None
    session.add = MagicMock()
    session.commit = MagicMock()
    session.refresh = MagicMock()
    return session


@pytest.fixture
def mock_redis_service():
    redis = AsyncMock()
    # Mock get to return None (empty bucket) by default
    redis.get.return_value = None
    redis.set = AsyncMock()
    return redis


@pytest.fixture
def mock_email_service():
    service = AsyncMock()
    service.send_email = AsyncMock()
    return service


@pytest.fixture
def mock_push_service():
    service = AsyncMock()
    service.send = AsyncMock()
    return service


@pytest.fixture
def mock_template_service():
    service = AsyncMock()
    service.render_template.return_value = "<html>Rendered Content</html>"
    return service


@pytest.fixture
def orchestrator(mock_email_service, mock_push_service, mock_template_service, mock_redis_service):
    # Patch the singleton getters where they are used (in the module)
    with (
        patch(
            "backend.services.notification_orchestrator.get_email_service",
            return_value=mock_email_service,
        ),
        patch(
            "backend.services.notification_orchestrator.PushNotificationService",
            return_value=mock_push_service,
        ),
        patch(
            "backend.services.notification_orchestrator.get_template_service",
            return_value=mock_template_service,
        ),
        patch(
            "backend.services.notification_orchestrator.get_notification_rate_limiter"
        ) as mock_get_limiter,
    ):
        # Configure the mock rate limiter
        mock_limiter_instance = MagicMock()
        mock_limiter_instance.check_limit = AsyncMock(return_value=True)  # Default to allowed
        # Ensure redis inside rate limiter is also mocked if accessed
        mock_limiter_instance.redis = mock_redis_service
        mock_get_limiter.return_value = mock_limiter_instance

        orch = NotificationOrchestrator()
        # Explicitly set the rate limiter on the instance to our mock
        orch.rate_limiter = mock_limiter_instance

        return orch


@pytest.mark.asyncio
async def test_send_notification_happy_path(
    orchestrator, mock_db_session, mock_email_service, mock_push_service
):
    # Setup User Preferences
    prefs = UserNotificationPreferences(
        user_id="user-123", email_enabled=True, push_enabled=True, quiet_hours_enabled=False
    )
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = prefs

    # Call
    results = await orchestrator.send_notification(
        db=mock_db_session,
        user_id="user-123",
        type="test_notification",
        title="Hello",
        message="World",
        data={"email": "test@example.com"},
        priority=NotificationPriority.NORMAL,
    )

    # Verify
    assert results["email"] == "sent"
    assert results["push"] == "sent"

    mock_email_service.send_email.assert_called_once()
    mock_push_service.send.assert_called_once()

    # Verify DB interactions
    assert mock_db_session.add.call_count >= 3  # Notification + 2 Deliveries
    mock_db_session.commit.assert_called()


@pytest.mark.asyncio
async def test_quiet_hours_suppression(orchestrator, mock_db_session):
    # Setup Quiet Hours (active)
    prefs = UserNotificationPreferences(
        user_id="user-123",
        quiet_hours_enabled=True,
        quiet_hours_start="00:00",
        quiet_hours_end="23:59",  # Always quiet
    )
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = prefs

    # Call with NORMAL priority
    results = await orchestrator.send_notification(
        db=mock_db_session,
        user_id="user-123",
        type="test_notification",
        title="Shh",
        message="Quiet",
        priority=NotificationPriority.NORMAL,
    )

    assert results["status"] == "skipped"
    assert results["reason"] == "quiet_hours"


@pytest.mark.asyncio
async def test_critical_bypasses_quiet_hours(orchestrator, mock_db_session, mock_push_service):
    # Setup Quiet Hours (active)
    prefs = UserNotificationPreferences(
        user_id="user-123",
        quiet_hours_enabled=True,
        quiet_hours_start="00:00",
        quiet_hours_end="23:59",
        push_enabled=True,
        email_enabled=False,
    )
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = prefs

    # Call with CRITICAL priority
    results = await orchestrator.send_notification(
        db=mock_db_session,
        user_id="user-123",
        type="security_alert",
        title="Alert",
        message="Breach",
        priority=NotificationPriority.CRITICAL,
    )

    # Should send despite quiet hours
    assert "push" in results
    assert results["push"] == "sent"
    mock_push_service.send.assert_called_once()


@pytest.mark.asyncio
async def test_rate_limiting(orchestrator, mock_db_session):
    # Setup Rate Limiter to return False
    orchestrator.rate_limiter.check_limit.return_value = False

    prefs = UserNotificationPreferences(user_id="user-123", email_enabled=True)
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = prefs

    results = await orchestrator.send_notification(
        db=mock_db_session,
        user_id="user-123",
        type="spammy_notification",
        title="Spam",
        message="Eggs",
        data={"email": "test@example.com"},
        channels=[NotificationChannel.EMAIL],
    )

    assert results["email"] == "rate_limited"


@pytest.mark.asyncio
async def test_email_missing_no_lookup(orchestrator, mock_db_session, mock_email_service):
    # Setup Prefs
    prefs = UserNotificationPreferences(user_id="user-123", email_enabled=True)
    mock_db_session.execute.return_value.scalar_one_or_none.return_value = prefs

    # Call without email in data
    results = await orchestrator.send_notification(
        db=mock_db_session,
        user_id="user-123",
        type="info",
        title="Hello",
        message="World",
        data={},  # No email here
    )

    # Since DB lookup is currently disabled/not implemented due to missing SQLAlchemy User model,
    # we expect this to fail gracefully.
    assert results["email"] == "failed_no_email"
    mock_email_service.send_email.assert_not_called()
