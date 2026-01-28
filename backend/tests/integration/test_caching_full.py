import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app
from backend.services.cache import CacheFactory


@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_redis_infrastructure():
    # Mock Async Redis for CacheFactory (used by @cache decorator)
    mock_async_redis = AsyncMock()
    mock_async_redis.get.return_value = None  # Cache miss by default
    mock_async_redis.set.return_value = True
    mock_async_redis.exists.return_value = False
    mock_async_redis.scan.return_value = (0, [])

    # Mock Sync Redis for Legacy Services (LandingPageService, AdminService)
    mock_sync_redis = MagicMock()
    mock_sync_redis.get.return_value = None
    mock_sync_redis.keys.return_value = []
    # Mock scan_iter to return empty list to avoid iteration errors
    mock_sync_redis.scan_iter.return_value = []

    # Patch the Async Redis factory
    with patch("backend.services.cache.CacheFactory.get_redis", new_callable=AsyncMock) as mock_get_redis:
        mock_get_redis.return_value = mock_async_redis

        # Patch the Sync Redis connections in services
        # We need to patch where they are instantiated
        with patch("backend.services.landing_page_service.redis.from_url", return_value=mock_sync_redis), \
             patch("backend.api.services.admin_service.redis.from_url", return_value=mock_sync_redis):

            yield {
                "async_redis": mock_async_redis,
                "sync_redis": mock_sync_redis
            }

def test_dashboard_metrics_caching(client, mock_redis_infrastructure):
    """Test that the @cache decorator works on API endpoints"""
    mock_async_redis = mock_redis_infrastructure["async_redis"]

    # Mock the DashboardService.get_metric_data
    with patch("backend.services.dashboard_service.DashboardService.get_metric_data") as mock_get_data:
        mock_get_data.return_value = {
            "metric": "revenue",
            "value": 1000,
            "trend": 5.0,
            "trend_label": "vs 30 days ago",
            "data": []
        }

        # 1. First Call - Cache Miss (mock_async_redis.get returns None)
        response = client.get("/api/dashboard/data/revenue")
        assert response.status_code == 200
        assert response.json()["value"] == 1000
        assert mock_get_data.call_count == 1

        # Verify set was called to cache the result
        # The key should contain the function name or prefix
        assert mock_async_redis.set.called
        call_args = mock_async_redis.set.call_args
        assert call_args is not None
        # Check if key starts with expected prefix
        assert call_args[0][0].startswith("dashboard_metrics:") or "dashboard" in call_args[0][0]

def test_landing_page_invalidation(mock_redis_infrastructure):
    """Test that Service methods invalidate cache using SyncCacheInvalidator"""
    _ = mock_redis_infrastructure["sync_redis"]

    from backend.models.landing_page import LandingPage, LandingPageCreate, LandingPageUpdate
    from backend.services.landing_page_service import LandingPageService

    mock_db = MagicMock()
    service = LandingPageService(mock_db)

    # Mock DB returns
    mock_db.query.return_value.filter.return_value.first.return_value = LandingPage(id=1, title="Page 1", slug="page-1")

    # We patch the invalidator methods to verify they are called
    # This ensures the service logic is correct regardless of the underlying Redis implementation
    with patch.object(service.invalidator, 'invalidate_pattern') as mock_inv_pattern, \
         patch.object(service.invalidator, 'invalidate_key') as mock_inv_key:

        # Create -> Should invalidate list:*
        service.create_landing_page(LandingPageCreate(title="New", slug="new", content_json={}, seo_metadata={}, template_id="1"))
        mock_inv_pattern.assert_called_with("list:*")

        # Update -> Should invalidate detail:1 and list:*
        mock_inv_pattern.reset_mock()
        service.update_landing_page(1, LandingPageUpdate(title="Updated"))
        mock_inv_key.assert_called_with("detail:1")
        mock_inv_pattern.assert_called_with("list:*")

        # Delete -> Should invalidate detail:1 and list:*
        mock_inv_pattern.reset_mock()
        mock_inv_key.reset_mock()
        service.delete_landing_page(1)
        mock_inv_key.assert_called_with("detail:1")
        mock_inv_pattern.assert_called_with("list:*")
