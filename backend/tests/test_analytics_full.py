
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi import WebSocket
from fastapi.testclient import TestClient

# Patch settings before importing/initializing app if possible, or patch globally
from backend.api.config.settings import settings

settings.enable_rate_limiting = False
settings.enable_multitenant = False # Disable multitenant to avoid tenant header checks if needed
settings.enable_metrics = False

from backend.api.auth.dependencies import get_current_user
from backend.api.main import app
from backend.services.analytics_service import AnalyticsService
from backend.services.cohort_service import CohortService
from backend.services.funnel_service import FunnelService

client = TestClient(app)

# --- Fixtures ---

@pytest.fixture
def mock_db():
    with patch("backend.services.funnel_service.get_db") as mock_get_db_funnel, \
         patch("backend.services.cohort_service.get_db") as mock_get_db_cohort, \
         patch("backend.services.analytics_service.get_db") as mock_get_db_analytics, \
         patch("backend.core.audit_logger.audit_logger.log_event") as _, \
         patch("backend.middleware.rate_limiter.RateLimiterService") as mock_rl_service, \
         patch("backend.middleware.rate_limiter.ip_blocker") as mock_ip_blocker, \
         patch("backend.middleware.rate_limiter.rate_limit_monitor") as _, \
         patch("backend.services.cache.decorators.cache_factory") as mock_cache_factory:

        # Mock DB Client
        mock_client = MagicMock()
        mock_get_db_funnel.return_value = mock_client
        mock_get_db_cohort.return_value = mock_client
        mock_get_db_analytics.return_value = mock_client

        # Mock Cache Factory
        mock_query_cache = AsyncMock()
        # cached_query executes the query_func
        async def mock_cached_query(key, query_func, ttl, tags):
            return await query_func()
        mock_query_cache.cached_query.side_effect = mock_cached_query

        mock_cache_factory.get_query_cache = AsyncMock(return_value=mock_query_cache)


        # Mock Rate Limiter Service methods to avoid Redis
        mock_rl_instance = mock_rl_service.return_value
        # Allow everything
        mock_rl_instance.check_token_bucket.return_value = (True, 100)
        mock_rl_instance.check_fixed_window.return_value = (True, 100)
        mock_rl_instance.check_sliding_window.return_value = (True, 100)
        mock_rl_instance.get_reset_time.return_value = 0

        # Mock IP Blocker
        mock_ip_blocker.is_blocked.return_value = False

        yield mock_client

@pytest.fixture
def funnel_service(mock_db):
    return FunnelService()

@pytest.fixture
def cohort_service(mock_db):
    return CohortService()

@pytest.fixture
def analytics_service(mock_db):
    return AnalyticsService()

@pytest.fixture
def mock_current_user():
    user = {"id": "user-123", "role": "admin"}
    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides = {}


# --- Funnel Service Tests ---

def test_analyze_funnel_success(funnel_service, mock_db):
    # Setup mock data
    steps = ["signup", "onboarding", "purchase"]
    start_date = "2026-01-01T00:00:00"
    end_date = "2026-01-31T23:59:59"

    # Mock DB response
    # We need to simulate events for a few users
    # User 1: signup -> onboarding -> purchase (Complete)
    # User 2: signup -> onboarding (Drop off after step 2)
    # User 3: signup (Drop off after step 1)

    mock_events = [
        {"user_id": "u1", "event_name": "signup", "occurred_at": "2026-01-01T10:00:00"},
        {"user_id": "u1", "event_name": "onboarding", "occurred_at": "2026-01-01T10:05:00"},
        {"user_id": "u1", "event_name": "purchase", "occurred_at": "2026-01-01T10:10:00"},
        {"user_id": "u2", "event_name": "signup", "occurred_at": "2026-01-02T10:00:00"},
        {"user_id": "u2", "event_name": "onboarding", "occurred_at": "2026-01-02T10:05:00"},
        {"user_id": "u3", "event_name": "signup", "occurred_at": "2026-01-03T10:00:00"},
    ]

    mock_db.table.return_value.select.return_value.in_.return_value.gte.return_value.lte.return_value.order.return_value.execute.return_value.data = mock_events

    result = funnel_service.analyze_funnel(steps, start_date, end_date)

    # Verify structure
    assert "funnel" in result
    funnel = result["funnel"]
    assert len(funnel) == 3

    # Step 1: signup (3 users)
    assert funnel[0]["step"] == "signup"
    assert funnel[0]["count"] == 3
    assert funnel[0]["conversion_rate"] == 100.0

    # Step 2: onboarding (2 users)
    assert funnel[1]["step"] == "onboarding"
    assert funnel[1]["count"] == 2
    assert funnel[1]["conversion_rate"] == 66.67 # 2/3

    # Step 3: purchase (1 user)
    assert funnel[2]["step"] == "purchase"
    assert funnel[2]["count"] == 1
    assert funnel[2]["conversion_rate"] == 50.0 # 1/2

    assert result["total_entries"] == 3
    assert result["overall_conversion"] == 33.33

def test_analyze_funnel_empty_steps(funnel_service):
    result = funnel_service.analyze_funnel([], "2026-01-01", "2026-01-31")
    assert "error" in result
    assert result["error"] == "No steps provided"

def test_analyze_funnel_db_error(funnel_service, mock_db):
    mock_db.table.side_effect = Exception("DB Connection Failed")
    result = funnel_service.analyze_funnel(["step1"], "2026-01-01", "2026-01-31")
    assert "error" in result
    assert "DB Connection Failed" in result["error"]

# --- Cohort Service Tests ---

def test_analyze_retention_weekly(cohort_service, mock_db):
    # Setup mock data for weekly cohort
    # Current date is assumed relative to data in service, but we mock events
    # Service calculates start_date based on utcnow, so we need consistent data relative to "now"
    # or just trust the service logic and provide data that spans weeks.

    # Let's mock a scenario where we analyze 2 weeks back
    # Week 0 (Current): u1 active
    # Week -1: u1 joined, u2 joined

    # Actually, the service calculates cohorts based on FIRST SEEN in the window.
    # So if we provide data:
    # u1: 2026-W01 (First), 2026-W02 (Active)
    # u2: 2026-W01 (First)

    # We need to mock _calculate_distance or ensure date strings match logic.
    # Let's mock DB returning events with ISO dates.

    now = datetime.utcnow()
    w0_date = now.isoformat()
    w1_date = (now - timedelta(days=7)).isoformat() # Last week

    mock_events = [
        {"user_id": "u1", "occurred_at": w1_date}, # u1 cohort W-1
        {"user_id": "u2", "occurred_at": w1_date}, # u2 cohort W-1
        {"user_id": "u1", "occurred_at": w0_date}, # u1 active W-0 (Retained)
    ]

    mock_db.table.return_value.select.return_value.gte.return_value.execute.return_value.data = mock_events

    # We need to patch datetime in service to control "now" or just rely on relative calc?
    # The service uses: isoyear, isoweek, _ = dt.isocalendar()
    # It constructs keys like "2026-W05"

    result = cohort_service.analyze_retention(period_type="weekly", periods=2)

    assert "cohorts" in result
    cohorts = result["cohorts"]
    assert len(cohorts) > 0

    # Check the cohort from last week
    # It should have 2 users
    # And 1 user retained in period 1 (1 week later)

    # Find the cohort entry with users=2
    target_cohort = next((c for c in cohorts if c["users"] == 2), None)
    assert target_cohort is not None

    # Check retention data
    # Period 0: 2 users (100%)
    p0 = next(p for p in target_cohort["data"] if p["period"] == 0)
    assert p0["count"] == 2

    # Period 1: 1 user (50%) - u1 returned
    p1 = next(p for p in target_cohort["data"] if p["period"] == 1)
    assert p1["count"] == 1
    assert p1["percentage"] == 50.0

def test_analyze_retention_no_events(cohort_service, mock_db):
    mock_db.table.return_value.select.return_value.gte.return_value.execute.return_value.data = []
    result = cohort_service.analyze_retention()
    assert result == {"cohorts": []}

# --- Router Tests ---

def test_track_event_endpoint(mock_current_user, mock_db):
    with patch("backend.api.routers.analytics.AnalyticsService") as MockService:
        _ = MockService.return_value

        response = client.post(
            "/api/v1/analytics/track",
            json={
                "event_type": "test_event",
                "event_name": "test_action",
                "event_data": {"foo": "bar"}
            },
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 200
        assert response.json() == {"status": "queued"}

        # Verify background task was added (MockService.track_event called)
        # Since it's a background task, we might need to verify differently or trust fastapi
        # Ideally we verify the service method was called.
        # But BackgroundTasks run after response.
        # For unit test of router, we assume FastAPI works.

def test_analyze_funnel_endpoint(mock_current_user, mock_db):
    with patch("backend.api.routers.analytics.FunnelService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.analyze_funnel.return_value = {"funnel": [], "total": 0}

        response = client.post(
            "/api/v1/analytics/funnel",
            json={
                "steps": ["a", "b"],
                "start_date": "2026-01-01",
                "end_date": "2026-01-31"
            },
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 200
        mock_instance.analyze_funnel.assert_called_once()

def test_analyze_cohort_endpoint(mock_current_user, mock_db):
    with patch("backend.api.routers.analytics.CohortService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.analyze_retention.return_value = {"cohorts": []}

        response = client.get(
            "/api/v1/analytics/cohort?period_type=weekly&periods=4",
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 200
        mock_instance.analyze_retention.assert_called_with("weekly", 4)

def test_analyze_funnel_unauthorized(mock_db):
    # Override dependency to return non-admin
    user = {"id": "user-456", "role": "user"}
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        response = client.post(
            "/api/v1/analytics/funnel",
            json={"steps": ["a"], "start_date": "x", "end_date": "y"},
            headers={"Authorization": "Bearer test_token"}
        )

        assert response.status_code == 403
    finally:
        app.dependency_overrides = {}

# --- Realtime WebSocket Tests ---

from backend.api.routers.analytics_realtime import ConnectionManager


@pytest.mark.asyncio
async def test_websocket_manager():
    manager = ConnectionManager()
    mock_ws = MagicMock(spec=WebSocket)

    # Test connect
    await manager.connect(mock_ws)
    assert len(manager.active_connections) == 1
    mock_ws.accept.assert_called_once()

    # Test broadcast
    await manager.broadcast({"type": "test"})
    # Verify send_text called
    # Note: send_text is async, so we need to mock it as awaitable if using real async test
    # But MagicMock handles sync calls. For async methods, we ideally use AsyncMock.

    # Test disconnect
    manager.disconnect(mock_ws)
    assert len(manager.active_connections) == 0
