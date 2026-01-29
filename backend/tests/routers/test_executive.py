"""
Test Executive Router
=====================

Tests for the executive dashboard API endpoints.
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

# Set dummy env vars
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "dummy_key"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

# Mock Redis ConnectionPool BEFORE importing app
# We need to patch redis.asyncio.ConnectionPool because that's what backend.core.infrastructure.redis uses
with patch("redis.asyncio.ConnectionPool.from_url") as mock_pool_from_url, \
     patch("redis.asyncio.Redis") as mock_redis_cls:

    # Configure mocks
    mock_pool = MagicMock()
    mock_pool_from_url.return_value = mock_pool

    mock_redis_instance = AsyncMock()
    # Ensure get method is an AsyncMock that returns None
    mock_redis_instance.get = AsyncMock(return_value=None)
    mock_redis_instance.setex = AsyncMock(return_value=True)
    mock_redis_cls.return_value = mock_redis_instance


    # Also mock sync redis if used anywhere
    with patch("redis.ConnectionPool.from_url"), patch("redis.Redis"):

        # Disable rate limiting settings BEFORE importing app
        from backend.api.config.settings import settings
        settings.enable_rate_limiting = False

        from fastapi.testclient import TestClient

        from backend.api.main import app
        from backend.api.routers.executive import get_revenue_service

# Mock RevenueService
mock_revenue_service = Mock()
mock_revenue_service.get_revenue_stats.return_value = {
    "mrr": 10000.0,
    "arr": 120000.0,
    "customer_churn_rate": 2.5,
    "revenue_churn_rate": 1.0,
    "avg_ltv": 500.0,
    "active_subscribers": 100,
    "new_subscribers": 10,
    "churned_subscribers": 2,
    "free_users": 50,
    "pro_users": 40,
    "enterprise_users": 10
}
mock_revenue_service.get_revenue_trend.return_value = [
    {"snapshot_date": "2023-01-01", "mrr": 9000.0, "active_subscribers": 90},
    {"snapshot_date": "2023-01-02", "mrr": 10000.0, "active_subscribers": 100}
]

@pytest.fixture
def client():
    # Override dependency
    app.dependency_overrides[get_revenue_service] = lambda: mock_revenue_service

    with TestClient(app) as c:
        yield c

    # Cleanup
    app.dependency_overrides = {}

@pytest.fixture
def mock_crm():
    with patch("backend.api.routers.executive._get_crm_metrics") as mock:
        mock.return_value = {
            "new_leads": 15,
            "active_pipeline": 50000.0
        }
        yield mock

@pytest.fixture(autouse=True)
def mock_rate_limiter():
    """
    Mock RateLimiterService to prevent Redis calls during request handling.
    Even though we mocked Redis connection, we also want to avoid the logic execution.
    """
    with patch("backend.services.rate_limiter_service.RateLimiterService") as MockService:
        instance = MockService.return_value
        instance.check_sliding_window = AsyncMock(return_value=(True, 100))
        instance.check_token_bucket = AsyncMock(return_value=(True, 100))
        instance.check_fixed_window = AsyncMock(return_value=(True, 100))
        instance.get_reset_time = AsyncMock(return_value=1234567890)
        yield instance

@pytest.fixture(autouse=True)
def mock_middleware():
    """Bypass MultiTenantMiddleware to avoid context issues during tests."""
    with patch("backend.api.middleware.multitenant_logic.middleware.MultiTenantMiddleware.dispatch") as mock_dispatch:
        # Define async side effect
        async def dispatch(request, call_next):
            return await call_next(request)
        mock_dispatch.side_effect = dispatch
        yield mock_dispatch

def test_get_executive_dashboard(client, mock_crm, mock_rate_limiter, mock_middleware):
    """Test fetching executive dashboard metrics."""
    # We must ensure RateLimitMiddleware doesn't block us or fail
    response = client.get("/executive/dashboard?tenant_id=test_tenant")

    assert response.status_code == 200
    data = response.json()

    # Financials
    assert data["mrr"] == 10000.0
    assert data["arr"] == 120000.0
    assert data["burn_rate"] > 0
    assert data["runway_months"] > 0

    # Growth
    assert data["new_leads_this_month"] == 15
    assert data["active_deals_value"] == 50000.0

    # Retention
    assert data["churn_rate"] == 2.5
    assert data["active_subscribers"] == 100

    # Alerts
    assert isinstance(data["alerts"], list)

def test_download_executive_report(client, mock_crm, mock_rate_limiter, mock_middleware):
    """Test PDF report generation endpoint."""
    with patch("backend.services.pdf_generator.pdf_generator.generate_executive_report") as mock_pdf:
        mock_pdf.return_value = b"%PDF-1.4 mock pdf content"

        response = client.get("/executive/report/pdf?tenant_id=test_tenant&days=30")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]
        assert response.content == b"%PDF-1.4 mock pdf content"

        mock_pdf.assert_called_once()
