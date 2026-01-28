from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from backend.models.notification import UserNotificationPreferences
from backend.services.notification_orchestrator import NotificationChannel, NotificationOrchestrator


@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.fixture
def mock_email_service():
    service = AsyncMock()
    service.send_email = AsyncMock(return_value={"status": "sent"})
    return service

@pytest.fixture
def mock_push_service():
    service = AsyncMock()
    service.send = AsyncMock(return_value={"success": 1})
    return service

@pytest.fixture
def mock_template_service():
    service = MagicMock()
    service.render_template = MagicMock(return_value="<html>Rendered</html>")
    return service

@pytest.mark.asyncio
async def test_orchestrator_sends_email_if_enabled(mock_db, mock_email_service, mock_push_service, mock_template_service):
    # Setup
    orchestrator = NotificationOrchestrator()
    orchestrator.email_service = mock_email_service
    orchestrator.push_service = mock_push_service
    orchestrator.template_service = mock_template_service

    # Mock user preferences
    prefs = UserNotificationPreferences(email_enabled=True, push_enabled=False)
    orchestrator._get_user_preferences = MagicMock(return_value=prefs)
    orchestrator._create_db_notification = MagicMock(return_value="notif-123")
    orchestrator._log_delivery = MagicMock()

    # Act
    results = await orchestrator.send_notification(
        db=mock_db,
        user_id="user-123",
        type="test",
        title="Test",
        message="Hello",
        data={"email": "test@example.com"}
    )

    # Assert
    assert results["email"] == "sent"
    # When using default resolution, disabled channels are excluded from the list, so they are not in results
    assert "push" not in results
    mock_email_service.send_email.assert_called_once()
    mock_push_service.send.assert_not_called()

@pytest.mark.asyncio
async def test_orchestrator_sends_push_if_enabled(mock_db, mock_email_service, mock_push_service, mock_template_service):
    # Setup
    orchestrator = NotificationOrchestrator()
    orchestrator.email_service = mock_email_service
    orchestrator.push_service = mock_push_service

    # Mock user preferences
    prefs = UserNotificationPreferences(email_enabled=False, push_enabled=True)
    orchestrator._get_user_preferences = MagicMock(return_value=prefs)
    orchestrator._create_db_notification = MagicMock(return_value="notif-123")
    orchestrator._log_delivery = MagicMock()

    # Act
    results = await orchestrator.send_notification(
        db=mock_db,
        user_id="user-123",
        type="test",
        title="Test",
        message="Hello",
        data={}
    )

    # Assert
    assert results["push"] == "sent"
    # When using default resolution, disabled channels are excluded from the list
    assert "email" not in results
    mock_push_service.send.assert_called_once()
    mock_email_service.send_email.assert_not_called()
