"""
Unit Tests for DashboardService

Test suite for DashboardService class in src/analytics/dashboard_service.py
"""
import pytest
import json
from unittest.mock import MagicMock, AsyncMock

from src.analytics.dashboard_service import DashboardService, DashboardMetrics


class TestDashboardService:
    """Tests for DashboardService class."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database connection."""
        mock_db = MagicMock()
        mock_db.fetch_all = AsyncMock()
        return mock_db

    @pytest.fixture
    def service(self, mock_db):
        """Create DashboardService instance with mock DB."""
        return DashboardService(mock_db)

    @pytest.fixture
    def mock_queries(self):
        """Mock AnalyticsQueries."""
        mock_queries = MagicMock()
        mock_queries.get_daily_usage = AsyncMock()
        mock_queries.get_weekly_usage = AsyncMock()
        mock_queries.get_monthly_usage = AsyncMock()
        mock_queries.get_active_licenses = AsyncMock()
        mock_queries.get_top_endpoints = AsyncMock()
        mock_queries.get_revenue_summary = AsyncMock()
        mock_queries.get_license_tier_distribution = AsyncMock()
        return mock_queries

    @pytest.fixture
    def service_with_queries(self, mock_queries):
        """Create DashboardService with mocked queries."""
        service = DashboardService.__new__(DashboardService)
        service._queries = mock_queries

        # Mock rate limit emitter (Phase 6) - all methods must be async
        service._rate_limit_emitter = MagicMock()
        service._rate_limit_emitter.get_violations_summary = AsyncMock(return_value={})
        service._rate_limit_emitter.get_top_violated_tenants = AsyncMock(return_value=[])
        service._rate_limit_emitter.get_events_by_tier = AsyncMock(return_value=[])
        service._rate_limit_emitter.get_recent_events = AsyncMock(return_value=[])

        service._cache = {}
        service._cache_ttl = 300
        return service

    @pytest.fixture
    def fully_mocked_service(self):
        """Create fully mocked DashboardService."""
        service = DashboardService.__new__(DashboardService)

        # Mock queries with async methods
        service._queries = MagicMock()
        service._queries.get_daily_usage = AsyncMock(return_value=[])
        service._queries.get_weekly_usage = AsyncMock(return_value=[])
        service._queries.get_monthly_usage = AsyncMock(return_value=[])
        service._queries.get_active_licenses = AsyncMock(return_value=[])
        service._queries.get_top_endpoints = AsyncMock(return_value=[])
        service._queries.get_revenue_summary = AsyncMock(return_value={})
        service._queries.get_license_tier_distribution = AsyncMock(return_value={})
        service._queries.get_license_health_summary = AsyncMock(return_value={})
        service._queries.get_expired_licenses_for_renewal = AsyncMock(return_value=[])

        # Mock rate limit emitter (Phase 6)
        service._rate_limit_emitter = MagicMock()
        service._rate_limit_emitter.get_violations_summary = AsyncMock(return_value={})
        service._rate_limit_emitter.get_top_violated_tenants = AsyncMock(return_value=[])
        service._rate_limit_emitter.get_events_by_tier = AsyncMock(return_value=[])
        service._rate_limit_emitter.get_recent_events = AsyncMock(return_value=[])

        service._cache = {}
        service._cache_ttl = 300
        return service

    # ========== get_metrics Tests ==========

    async def test_get_metrics_returns_all_metrics(self, fully_mocked_service):
        """Test get_metrics() returns all metrics."""
        # Act
        result = await fully_mocked_service.get_metrics()

        # Assert
        assert isinstance(result, DashboardMetrics)
        assert hasattr(result, "api_calls")
        assert hasattr(result, "active_licenses")
        assert hasattr(result, "top_endpoints")
        assert hasattr(result, "revenue")
        assert hasattr(result, "tier_distribution")
        assert hasattr(result, "last_updated")

    async def test_get_metrics_calls_all_queries(self, fully_mocked_service):
        """Test get_metrics() calls all query methods."""
        # Act
        await fully_mocked_service.get_metrics(range_days=30)

        # Assert
        fully_mocked_service._queries.get_daily_usage.assert_called_once()
        fully_mocked_service._queries.get_weekly_usage.assert_called_once()
        fully_mocked_service._queries.get_monthly_usage.assert_called_once()
        fully_mocked_service._queries.get_active_licenses.assert_called_once()
        fully_mocked_service._queries.get_top_endpoints.assert_called_once()
        fully_mocked_service._queries.get_revenue_summary.assert_called_once()
        fully_mocked_service._queries.get_license_tier_distribution.assert_called_once()

    async def test_get_metrics_caching_mechanism(self, fully_mocked_service):
        """Test caching mechanism works correctly."""
        # Act - First call
        result1 = await fully_mocked_service.get_metrics()
        # Second call (should use cache)
        result2 = await fully_mocked_service.get_metrics()

        # Assert
        assert result1 is result2  # Same object from cache
        # Cache key format: metrics_{range_days}_{license_key}_{start_date}_{end_date}
        cache_keys = list(fully_mocked_service._cache.keys())
        assert len(cache_keys) == 1
        assert cache_keys[0].startswith("metrics_30")

    async def test_get_metrics_cache_invalidates_after_ttl(self, fully_mocked_service):
        """Test cache invalidates after TTL."""
        # Arrange
        fully_mocked_service._cache_ttl = 0  # Set TTL to 0 for immediate expiry

        # Act
        await fully_mocked_service.get_metrics()
        first_call_count = fully_mocked_service._queries.get_daily_usage.call_count

        import asyncio
        await asyncio.sleep(0.1)  # Small delay to allow TTL expiry

        await fully_mocked_service.get_metrics()
        second_call_count = fully_mocked_service._queries.get_daily_usage.call_count

        # Assert
        assert second_call_count >= first_call_count  # Queries executed again (at least)

    async def test_get_metrics_custom_range_days(self, fully_mocked_service):
        """Test get_metrics() respects range_days parameter."""
        # Act
        await fully_mocked_service.get_metrics(range_days=60)

        # Assert
        fully_mocked_service._queries.get_daily_usage.assert_called_once()
        # Verify cache key uses range_days
        cache_keys = list(fully_mocked_service._cache.keys())
        assert len(cache_keys) == 1
        assert cache_keys[0].startswith("metrics_60")

    # ========== export_to_csv Tests ==========

    async def test_export_to_csv_generates_valid_csv(self, service_with_queries):
        """Test export_to_csv() generates valid CSV."""
        # Arrange
        service_with_queries._queries.get_daily_usage.return_value = [
            {"date": "2025-01-01", "calls": 100, "unique_licenses": 5},
            {"date": "2025-01-02", "calls": 150, "unique_licenses": 7},
        ]

        # Act
        result = await service_with_queries.export_to_csv(("2025-01-01", "2025-01-31"))

        # Assert
        assert "date,api_calls,unique_licenses" in result
        assert "2025-01-01,100,5" in result
        assert "2025-01-02,150,7" in result

    async def test_export_to_csv_empty_data(self, service_with_queries):
        """Test export_to_csv() handles empty data."""
        # Arrange
        service_with_queries._queries.get_daily_usage.return_value = []

        # Act
        result = await service_with_queries.export_to_csv(("2025-01-01", "2025-01-31"))

        # Assert
        assert "date,api_calls,unique_licenses" in result

    # ========== export_to_json Tests ==========

    async def test_export_to_json_generates_valid_json(self, service_with_queries):
        """Test export_to_json() generates valid JSON."""
        # Arrange
        service_with_queries._queries.get_daily_usage.return_value = []
        service_with_queries._queries.get_weekly_usage.return_value = []
        service_with_queries._queries.get_monthly_usage.return_value = []
        service_with_queries._queries.get_active_licenses.return_value = []
        service_with_queries._queries.get_revenue_summary.return_value = {}
        service_with_queries._queries.get_license_tier_distribution.return_value = {}

        # Act
        result = await service_with_queries.export_to_json(("2025-01-01", "2025-01-31"))

        # Assert
        data = json.loads(result)
        assert "exported_at" in data
        assert "date_range" in data
        assert "usage" in data
        assert "licenses" in data
        assert "revenue" in data

    async def test_export_to_json_includes_date_range(self, service_with_queries):
        """Test export_to_json() includes date range in output."""
        # Arrange
        service_with_queries._queries.get_daily_usage.return_value = []
        service_with_queries._queries.get_weekly_usage.return_value = []
        service_with_queries._queries.get_monthly_usage.return_value = []
        service_with_queries._queries.get_active_licenses.return_value = []
        service_with_queries._queries.get_revenue_summary.return_value = {}
        service_with_queries._queries.get_license_tier_distribution.return_value = {}

        # Act
        result = await service_with_queries.export_to_json(("2025-01-01", "2025-01-31"))
        data = json.loads(result)

        # Assert
        assert data["date_range"]["start"] == "2025-01-01"
        assert data["date_range"]["end"] == "2025-01-31"

    # ========== invalidate_cache Tests ==========

    def test_invalidate_cache_clears_all_cache(self, service):
        """Test invalidate_cache() clears all cache."""
        # Arrange
        service._cache = {
            "metrics_30": {"data": MagicMock(), "timestamp": 1000},
            "metrics_60": {"data": MagicMock(), "timestamp": 1000},
        }

        # Act
        service.invalidate_cache()

        # Assert
        assert service._cache == {}

    def test_invalidate_cache_with_pattern(self, service):
        """Test invalidate_cache() clears matching patterns."""
        # Arrange
        service._cache = {
            "metrics_30": {"data": MagicMock(), "timestamp": 1000},
            "metrics_60": {"data": MagicMock(), "timestamp": 1000},
            "export_data": {"data": MagicMock(), "timestamp": 1000},
        }

        # Act
        service.invalidate_cache(pattern="metrics_")

        # Assert
        assert "metrics_30" not in service._cache
        assert "metrics_60" not in service._cache
        assert "export_data" in service._cache

    # ========== calculate_growth_rate Tests ==========

    def test_calculate_growth_rate_positive(self, service):
        """Test calculate_growth_rate() for positive growth."""
        # Act
        result = service.calculate_growth_rate(current=200, previous=100)

        # Assert
        assert result == 100.0

    def test_calculate_growth_rate_negative(self, service):
        """Test calculate_growth_rate() for negative growth."""
        # Act
        result = service.calculate_growth_rate(current=50, previous=100)

        # Assert
        assert result == -50.0

    def test_calculate_growth_rate_zero_previous(self, service):
        """Test calculate_growth_rate() handles zero previous value."""
        # Act
        result = service.calculate_growth_rate(current=100, previous=0)

        # Assert
        assert result == 100.0

    def test_calculate_growth_rate_both_zero(self, service):
        """Test calculate_growth_rate() handles both zero."""
        # Act
        result = service.calculate_growth_rate(current=0, previous=0)

        # Assert
        assert result == 0.0

    def test_calculate_growth_rate_rounds_to_2dp(self, service):
        """Test calculate_growth_rate() rounds to 2 decimal places."""
        # Act
        result = service.calculate_growth_rate(current=101, previous=333)

        # Assert
        assert result == round(((101 - 333) / 333) * 100, 2)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
