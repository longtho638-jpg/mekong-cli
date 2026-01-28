"""
Tests for Analytics Service
"""
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from backend.services.analytics_service import AnalyticsService


@pytest.fixture
def mock_db():
    with patch("backend.services.analytics_service.get_db") as mock_get_db:
        db_instance = MagicMock()
        mock_get_db.return_value = db_instance
        yield db_instance

def test_track_event_success(mock_db):
    service = AnalyticsService()

    # Mock chain: table().insert().execute()
    mock_insert = MagicMock()
    mock_execute = MagicMock()
    mock_execute.data = [{"id": "evt_123", "event_name": "test_event"}]

    mock_db.table.return_value = mock_insert
    mock_insert.insert.return_value = mock_execute
    mock_execute.execute.return_value = mock_execute

    result = service.track_event(
        user_id="user_123",
        event_type="test",
        event_category="core",
        event_name="test_action",
        event_data={"foo": "bar"}
    )

    assert result["id"] == "evt_123"
    mock_db.table.assert_called_with("usage_events")
    mock_insert.insert.assert_called_once()

    # Verify payload
    call_args = mock_insert.insert.call_args[0][0]
    assert call_args["user_id"] == "user_123"
    assert call_args["event_name"] == "test_action"

def test_track_event_failure(mock_db):
    service = AnalyticsService()

    # Mock exception
    mock_db.table.side_effect = Exception("DB Error")

    result = service.track_event("user_123", "test", "core", "fail")
    assert result == {}

def test_get_user_stats(mock_db):
    service = AnalyticsService()

    # Mock chain: table().select().eq().gte().execute()
    mock_query = MagicMock()
    mock_query.data = [
        {"event_type": "api_call", "event_category": "billing"},
        {"event_type": "api_call", "event_category": "core"},
        {"event_type": "login", "event_category": "auth"}
    ]

    mock_db.table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value = mock_query

    stats = service.get_user_stats("user_123")

    assert stats["total_events"] == 3
    assert stats["events_by_type"]["api_call"] == 2
    assert stats["events_by_type"]["login"] == 1
    assert stats["events_by_category"]["billing"] == 1

def test_get_daily_metrics(mock_db):
    service = AnalyticsService()

    mock_query = MagicMock()
    mock_query.data = [{"date": "2026-01-28", "active_users": 100}]

    # Chain: table().select().gte().order().execute()
    mock_db.table.return_value.select.return_value.gte.return_value.order.return_value.execute.return_value = mock_query

    metrics = service.get_daily_metrics(30)
    assert len(metrics) == 1
    assert metrics[0]["active_users"] == 100
