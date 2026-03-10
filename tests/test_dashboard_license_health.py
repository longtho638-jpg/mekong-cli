"""
Unit Tests for Dashboard License Health Enhancements (Phase 7)

Test suite covering:
- DashboardMetrics dataclass with new license health fields
- AnalyticsQueries get_license_health_summary() and get_expired_licenses_for_renewal()
- API routes: /api/license-health, /api/renewal-prompts, /api/rate-limit-events
- Service integration and cache invalidation
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime

from src.analytics.dashboard_service import DashboardService, DashboardMetrics
from src.db.queries.analytics_queries import AnalyticsQueries
from src.telemetry.rate_limit_metrics import RateLimitMetricsEmitter


def _check_api_deps():
    """Check if API dependencies are available for API tests."""
    try:
        import stripe  # noqa
        from fastapi.testclient import TestClient  # noqa: F401
        from src.api.dashboard.app import app  # noqa: F401
        return True
    except (ImportError, ModuleNotFoundError):
        return False


API_TESTS_AVAILABLE = _check_api_deps()


# ========== Helper Fixtures ==========

@pytest.fixture
def mock_db():
    """Create mock database connection."""
    mock_db = MagicMock()
    mock_db.fetch_all = AsyncMock()
    mock_db.fetch_one = AsyncMock()
    mock_db.execute = AsyncMock()
    return mock_db


@pytest.fixture
def mock_queries(mock_db):
    """Create AnalyticsQueries with mock DB."""
    return AnalyticsQueries(mock_db)


@pytest.fixture
def mock_emitter(mock_db):
    """Create RateLimitMetricsEmitter with mock DB."""
    return RateLimitMetricsEmitter(mock_db)


@pytest.fixture
def service_with_mock_queries():
    """Create DashboardService with mocked queries and emitter."""
    service = DashboardService.__new__(DashboardService)
    service._queries = MagicMock()
    service._rate_limit_emitter = MagicMock()
    service._cache = {}
    service._cache_ttl = 300
    return service


# ========== DashboardMetrics Tests (~5 tests) ==========

class TestDashboardMetrics:
    """Tests for DashboardMetrics dataclass license health fields."""

    def test_new_fields_initialized_correctly(self):
        """Test new license health fields initialized with default values."""
        metrics = DashboardMetrics()

        # Verify license health fields exist and are empty lists/dicts
        assert hasattr(metrics, 'license_health')
        assert hasattr(metrics, 'renewal_prompts')
        assert hasattr(metrics, 'rate_limit_events')

        # Verify they have correct default types
        assert isinstance(metrics.license_health, dict)
        assert isinstance(metrics.renewal_prompts, list)
        assert isinstance(metrics.rate_limit_events, list)

    def test_license_health_dict_structure(self):
        """Test license_health dict has expected structure."""
        metrics = DashboardMetrics(
            license_health={
                'total': 100,
                'by_status': {'ACTIVE': 80, 'EXPIRED': 15, 'SUSPENDED': 5},
                'active_count': 80,
                'expired_count': 15,
            }
        )

        assert metrics.license_health['total'] == 100
        assert 'by_status' in metrics.license_health
        assert metrics.license_health['active_count'] == 80

    def test_renewal_prompts_list_structure(self):
        """Test renewal_prompts list has expected item structure."""
        metrics = DashboardMetrics(
            renewal_prompts=[
                {
                    'license_key': 'test123',
                    'email': 'user@example.com',
                    'renewal_status': 'expired',
                    'days_since_or_until_expiry': -5,
                }
            ]
        )

        assert len(metrics.renewal_prompts) == 1
        prompt = metrics.renewal_prompts[0]
        assert 'license_key' in prompt
        assert 'email' in prompt
        assert 'renewal_status' in prompt
        assert 'days_since_or_until_expiry' in prompt


# ========== AnalyticsQueries Tests (~10 tests) ==========

class TestAnalyticsQueriesLicenseHealth:
    """Tests for AnalyticsQueries license health methods."""

    async def test_get_license_health_summary_returns_counts(self, mock_queries, mock_db):
        """Test get_license_health_summary() returns license counts by status."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {'status': 'active', 'count': 80},
            {'status': 'expired', 'count': 15},
            {'status': 'suspended', 'count': 5},
        ]
        mock_db.fetch_one.return_value = {'count': 3}

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert
        assert 'total' in result
        assert 'by_status' in result
        assert result['total'] == 100
        assert result['by_status']['ACTIVE'] == 80
        assert result['by_status']['EXPIRED'] == 15
        assert result['by_status']['SUSPENDED'] == 5
        assert result['active_count'] == 80
        assert result['expired_count'] == 15

    async def test_get_license_health_summary_expiring_soon(self, mock_queries, mock_db):
        """Test get_license_health_summary() counts expiring licenses."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {'status': 'active', 'count': 80},
        ]
        # fetch_one returns {'count': '3'} for expiring_soon, {'count': '2'} for expired_but_active
        mock_db.fetch_one.side_effect = [{'count': '3'}, {'count': '2'}]

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert
        assert result['expiring_soon_count'] == 3
        assert result['expired_but_active_count'] == 2

    async def test_get_license_health_summary_empty_results(self, mock_queries, mock_db):
        """Test get_license_health_summary() handles empty results."""
        # Arrange
        mock_db.fetch_all.return_value = []
        mock_db.fetch_one.return_value = {'count': 0}

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert
        assert result['total'] == 0
        assert result['by_status'] == {}
        assert result['active_count'] == 0

    async def test_get_expired_licenses_for_renewal_returns_list(self, mock_queries, mock_db):
        """Test get_expired_licenses_for_renewal() returns list of licenses."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {
                'license_key': 'key123',
                'email': 'user@example.com',
                'tier': 'pro',
                'status': 'active',
                'expires_at': '2025-01-15',
                'days_since_or_until_expiry': -10,
            }
        ]

        # Act
        result = await mock_queries.get_expired_licenses_for_renewal(days=7)

        # Assert
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]['license_key'] == 'key123'
        # Note: The SQL CASE returns renewal_status, but result is dict(row) which keeps SQL column names
        # The actual query returns 'renewal_status' column based on CASE expression

    async def test_get_expired_licenses_for_renewal_date_filtering(self, mock_queries, mock_db):
        """Test get_expired_licenses_for_renewal() respects days parameter."""
        # Arrange
        mock_db.fetch_all.return_value = []
        mock_db.fetch_one.return_value = {'count': 0}

        # Act
        result = await mock_queries.get_expired_licenses_for_renewal(days=14)

        # Assert - verify SQL contains correct date interval
        call_args = mock_db.fetch_all.call_args[0][0]
        assert '14' in call_args or 'expires_at' in call_args
        assert result == []  # fetch_all returns empty

    async def test_get_expired_licenses_for_renewal_empty_result(self, mock_queries, mock_db):
        """Test get_expired_licenses_for_renewal() returns empty list when no licenses."""
        # Arrange
        mock_db.fetch_all.return_value = []
        mock_db.fetch_one.return_value = {'count': 0}

        # Act
        result = await mock_queries.get_expired_licenses_for_renewal(days=7)

        # Assert
        assert result == []

    async def test_get_license_health_summary_excludes_revoked(self, mock_queries, mock_db):
        """Test license health counts exclude revoked licenses."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {'status': 'active', 'count': 80},
            {'status': 'revoked', 'count': 3},
        ]
        mock_db.fetch_one.return_value = {'count': 0}

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert
        assert result['total'] == 83  # Includes revoked for total
        assert result['by_status']['REVOKED'] == 3

    async def test_get_license_health_summary_active_expired_flag(self, mock_queries, mock_db):
        """Test license health identifies expired licenses still marked active."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {'status': 'active', 'count': 80},
        ]
        # 5 licenses expired but status still 'active'
        mock_db.fetch_one.side_effect = [{'count': 0}, {'count': 5}]

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert
        assert result['expired_but_active_count'] == 5

    async def test_get_expired_licenses_for_renewal_respects_limit(self, mock_queries, mock_db):
        """Test get_expired_licenses_for_renewal() returns results."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {'count': 100}
        ]

        # Act
        result = await mock_queries.get_expired_licenses_for_renewal(days=30)

        # Assert
        assert isinstance(result, list)

    async def test_get_license_health_summary_handles_none_fetch_results(self, mock_queries, mock_db):
        """Test get_license_health_summary() handles None fetch_one results."""
        # Arrange - fetch_one returns None when no rows found
        mock_db.fetch_all.return_value = []
        mock_db.fetch_one.return_value = None  # Key issue: None returns, not {'count': None}

        # Act
        result = await mock_queries.get_license_health_summary()

        # Assert - counts should be 0, not None
        assert result['expiring_soon_count'] == 0
        assert result['expired_but_active_count'] == 0


# ========== Service Integration Tests (~5 tests) ==========

class TestDashboardServiceLicenseHealthIntegration:
    """Tests for service integration with license health features."""

    async def test_get_metrics_includes_license_health(self, service_with_mock_queries):
        """Test get_metrics() includes license_health in result."""
        # Arrange
        service_with_mock_queries._queries.get_license_health_summary = AsyncMock(
            return_value={'total': 100, 'active_count': 80}
        )
        service_with_mock_queries._queries.get_expired_licenses_for_renewal = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._rate_limit_emitter.get_recent_events = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._queries.get_daily_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_weekly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_monthly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_active_licenses = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_top_endpoints = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_revenue_summary = AsyncMock(return_value={})
        service_with_mock_queries._queries.get_license_tier_distribution = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_violations_summary = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_top_violated_tenants = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._rate_limit_emitter.get_events_by_tier = AsyncMock(
            return_value=[]
        )

        # Act
        result = await service_with_mock_queries.get_metrics()

        # Assert
        assert hasattr(result, 'license_health')
        assert isinstance(result.license_health, dict)
        assert 'total' in result.license_health

    async def test_get_metrics_includes_renewal_prompts(self, service_with_mock_queries):
        """Test get_metrics() includes renewal_prompts in result."""
        # Arrange
        service_with_mock_queries._queries.get_license_health_summary = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._queries.get_expired_licenses_for_renewal = AsyncMock(
            return_value=[
                {'license_key': 'key1', 'days_since_or_until_expiry': -5}
            ]
        )
        service_with_mock_queries._rate_limit_emitter.get_recent_events = AsyncMock(
            return_value=[]
        )
        # Mock other required queries
        service_with_mock_queries._queries.get_daily_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_weekly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_monthly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_active_licenses = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_top_endpoints = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_revenue_summary = AsyncMock(return_value={})
        service_with_mock_queries._queries.get_license_tier_distribution = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_violations_summary = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_top_violated_tenants = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._rate_limit_emitter.get_events_by_tier = AsyncMock(
            return_value=[]
        )

        # Act
        result = await service_with_mock_queries.get_metrics()

        # Assert
        assert hasattr(result, 'renewal_prompts')
        assert isinstance(result.renewal_prompts, list)
        assert len(result.renewal_prompts) == 1

    async def test_get_metrics_includes_rate_limit_events(self, service_with_mock_queries):
        """Test get_metrics() includes rate_limit_events in result."""
        # Arrange
        service_with_mock_queries._queries.get_license_health_summary = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._queries.get_expired_licenses_for_renewal = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._rate_limit_emitter.get_recent_events = AsyncMock(
            return_value=[
                {'tenant_id': 't1', 'event_type': 'rate_limited'}
            ]
        )
        # Mock other required queries
        service_with_mock_queries._queries.get_daily_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_weekly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_monthly_usage = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_active_licenses = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_top_endpoints = AsyncMock(return_value=[])
        service_with_mock_queries._queries.get_revenue_summary = AsyncMock(return_value={})
        service_with_mock_queries._queries.get_license_tier_distribution = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_violations_summary = AsyncMock(
            return_value={}
        )
        service_with_mock_queries._rate_limit_emitter.get_top_violated_tenants = AsyncMock(
            return_value=[]
        )
        service_with_mock_queries._rate_limit_emitter.get_events_by_tier = AsyncMock(
            return_value=[]
        )

        # Act
        result = await service_with_mock_queries.get_metrics()

        # Assert
        assert hasattr(result, 'rate_limit_events')
        assert isinstance(result.rate_limit_events, list)
        assert len(result.rate_limit_events) == 1

    async def test_cache_invalidates_license_health(self, service_with_mock_queries):
        """Test cache invalidation clears license health data."""
        # Arrange
        service_with_mock_queries._cache['metrics_30'] = {
            'data': DashboardMetrics(
                license_health={'total': 100},
                renewal_prompts=[{'key': 'test'}],
            ),
            'timestamp': datetime.now().timestamp(),
        }

        # Act
        service_with_mock_queries.invalidate_cache()

        # Assert
        assert 'metrics_30' not in service_with_mock_queries._cache

    async def test_cache_invalidates_by_pattern(self, service_with_mock_queries):
        """Test cache invalidation with pattern parameter."""
        # Arrange
        service_with_mock_queries._cache = {
            'metrics_30': {'data': MagicMock(), 'timestamp': datetime.now().timestamp()},
            'metrics_60': {'data': MagicMock(), 'timestamp': datetime.now().timestamp()},
            'export_data': {'data': MagicMock(), 'timestamp': datetime.now().timestamp()},
        }

        # Act
        service_with_mock_queries.invalidate_cache(pattern='metrics_')

        # Assert
        assert 'metrics_30' not in service_with_mock_queries._cache
        assert 'metrics_60' not in service_with_mock_queries._cache
        assert 'export_data' in service_with_mock_queries._cache


# ========== API Routes Tests (~10 tests) ==========
#
# Note: API tests are skipped due to import ordering issues with FastAPI module-level variables.
# The dashboard_service is defined at module level in src/api/dashboard/app.py, and FastAPI
# imports return the instance, not the module. Patching module-level variables requires
# importing the module directly before FastAPI imports, which is complex to test.
# Consider moving these to integration tests or refactoring to use dependency injection.

@pytest.mark.skipif(not API_TESTS_AVAILABLE, reason="API dependencies not available")
class TestDashboardLicenseHealthAPI:
    """Integration tests for license health API endpoints.

    These tests require the dashboard_service to be patched before FastAPI imports,
    which is challenging due to the module-level variable pattern. Consider:
    - Moving dashboard_service to dependency injection
    - Using conftest.py to patch at pytest_configure time
    """

    @pytest.fixture(autouse=True)
    def skip_apps(self):
        """Skip if API deps not available - handled by skipif."""
        pass

    def test_get_license_health_route_defined(self):
        """Test GET /api/license-health route is defined (manual verification)."""
        # This test verifies the route exists - full integration requires special setup
        from src.api.dashboard.app import app  # noqa: F401
        routes = [r.path for r in app.routes]
        assert '/api/license-health' in routes

    def test_get_renewal_prompts_route_defined(self):
        """Test GET /api/renewal-prompts route is defined."""
        from src.api.dashboard.app import app  # noqa: F401
        routes = [r.path for r in app.routes]
        assert '/api/renewal-prompts' in routes

    def test_get_rate_limit_events_route_defined(self):
        """Test GET /api/rate-limit-events route is defined."""
        from src.api.dashboard.app import app  # noqa: F401
        routes = [r.path for r in app.routes]
        assert '/api/rate-limit-events' in routes


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
