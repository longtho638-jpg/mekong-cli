"""
Unit Tests for AnalyticsQueries

Test suite for AnalyticsQueries class in src/db/queries/analytics_queries.py
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from src.db.queries.analytics_queries import AnalyticsQueries


class TestAnalyticsQueries:
    """Tests for AnalyticsQueries class."""

    @pytest.fixture
    def mock_db(self):
        """Create mock database connection."""
        mock_db = MagicMock()
        mock_db.fetch_all = AsyncMock()
        return mock_db

    @pytest.fixture
    def queries(self, mock_db):
        """Create AnalyticsQueries instance with mock DB."""
        return AnalyticsQueries(mock_db)

    # ========== get_daily_usage Tests ==========

    async def test_get_daily_usage_returns_correct_format(self, queries, mock_db):
        """Test get_daily_usage() returns correct format."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"date": "2025-01-01", "calls": 100, "unique_licenses": 5},
            {"date": "2025-01-02", "calls": 150, "unique_licenses": 7},
        ]

        # Act
        result = await queries.get_daily_usage("2025-01-01", "2025-01-31")

        # Assert
        assert len(result) == 2
        assert result[0]["date"] == "2025-01-01"
        assert result[0]["calls"] == 100
        assert result[0]["unique_licenses"] == 5

    async def test_get_daily_usage_calls_query_correctly(self, queries, mock_db):
        """Test get_daily_usage() executes correct SQL query."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        await queries.get_daily_usage("2025-01-01", "2025-01-31")

        # Assert
        mock_db.fetch_all.assert_called_once()
        call_args = mock_db.fetch_all.call_args
        query = call_args[0][0]
        assert "usage_records" in query
        assert "date_trunc" not in query  # Not weekly/monthly

    async def test_get_daily_usage_handles_empty_results(self, queries, mock_db):
        """Test get_daily_usage() handles empty results."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        result = await queries.get_daily_usage("2025-01-01", "2025-01-31")

        # Assert
        assert result == []

    # ========== get_weekly_usage Tests ==========

    async def test_get_weekly_usage_returns_12_weeks(self, queries, mock_db):
        """Test get_weekly_usage() returns data for 12 weeks."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"week_start": "2025-01-06", "calls": 500, "unique_licenses": 15},
            {"week_start": "2025-01-13", "calls": 600, "unique_licenses": 18},
        ]

        # Act
        result = await queries.get_weekly_usage()

        # Assert
        assert len(result) <= 12  # Max 12 weeks
        assert "week_start" in result[0]
        assert "calls" in result[0]
        assert "unique_licenses" in result[0]

    async def test_get_weekly_usage_correct_query(self, queries, mock_db):
        """Test get_weekly_usage() executes correct SQL query."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        await queries.get_weekly_usage()

        # Assert
        mock_db.fetch_all.assert_called_once()
        query = mock_db.fetch_all.call_args[0][0]
        assert "week_start" in query
        assert "12 weeks" in query

    # ========== get_monthly_usage Tests ==========

    async def test_get_monthly_usage_returns_12_months(self, queries, mock_db):
        """Test get_monthly_usage() returns data for 12 months."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"month": "2025-01-01", "calls": 2000, "unique_licenses": 50},
            {"month": "2025-02-01", "calls": 2500, "unique_licenses": 60},
        ]

        # Act
        result = await queries.get_monthly_usage()

        # Assert
        assert len(result) <= 12  # Max 12 months
        assert "month" in result[0]
        assert "calls" in result[0]
        assert "unique_licenses" in result[0]

    async def test_get_monthly_usage_correct_query(self, queries, mock_db):
        """Test get_monthly_usage() executes correct SQL query."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        await queries.get_monthly_usage()

        # Assert
        mock_db.fetch_all.assert_called_once()
        query = mock_db.fetch_all.call_args[0][0]
        assert "month" in query
        assert "12 months" in query

    # ========== get_active_licenses Tests ==========

    async def test_get_active_licenses_returns_license_data(self, queries, mock_db):
        """Test get_active_licenses() returns license data."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {
                "license_key": "abc123",
                "tier": "pro",
                "email": "test@example.com",
                "status": "active",
                "created_at": "2025-01-01",
                "total_commands": 1000,
                "last_active": "2025-02-01",
            },
        ]

        # Act
        result = await queries.get_active_licenses()

        # Assert
        assert len(result) == 1
        assert result[0]["license_key"] == "abc123"
        assert result[0]["tier"] == "pro"
        assert result[0]["total_commands"] == 1000

    async def test_get_active_licenses_filters_active_only(self, queries, mock_db):
        """Test get_active_licenses() filters for active status."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        await queries.get_active_licenses()

        # Assert
        query = mock_db.fetch_all.call_args[0][0]
        assert "status = 'active'" in query

    # ========== get_top_endpoints Tests ==========

    async def test_get_top_endpoints_returns_sorted_list(self, queries, mock_db):
        """Test get_top_endpoints() returns sorted list."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"endpoint": "/api/search", "calls": 500, "avg_duration": 150.5},
            {"endpoint": "/api/generate", "calls": 300, "avg_duration": 200.2},
        ]

        # Act
        result = await queries.get_top_endpoints(limit=10)

        # Assert
        assert len(result) == 2
        assert result[0]["endpoint"] == "/api/search"
        assert result[0]["calls"] == 500

    async def test_get_top_endpoints_limit_parameter(self, queries, mock_db):
        """Test get_top_endpoints() respects limit parameter."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        await queries.get_top_endpoints(limit=5)

        # Assert
        query = mock_db.fetch_all.call_args[0][0]
        assert "$1" in query  # Parameterized query

    async def test_get_top_endpoints_fallback_on_error(self, queries, mock_db):
        """Test get_top_endpoints() returns empty list on error."""
        # Arrange
        mock_db.fetch_all.side_effect = Exception("Table not found")

        # Act
        result = await queries.get_top_endpoints(limit=10)

        # Assert
        assert result == []

    # ========== get_revenue_summary Tests ==========

    async def test_get_revenue_summary_calculates_mrr(self, queries, mock_db):
        """Test get_revenue_summary() calculates MRR correctly."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"tier": "pro", "count": 10, "active_count": 8},
            {"tier": "growth", "count": 5, "active_count": 4},
        ]

        # Act
        result = await queries.get_revenue_summary()

        # Assert
        assert "total_mrr" in result
        assert "by_tier" in result
        # pro: 8 * 199 = 1592, growth: 4 * 79 = 316, total = 1908
        assert result["total_mrr"] == 1908
        assert result["active_subscriptions"] == 12

    async def test_get_revenue_summary_handle_unknown_tier(self, queries, mock_db):
        """Test get_revenue_summary() handles unknown tier with 0 price."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"tier": "unknown_tier", "count": 2, "active_count": 1},
        ]

        # Act
        result = await queries.get_revenue_summary()

        # Assert
        assert result["total_mrr"] == 0

    # ========== get_license_tier_distribution Tests ==========

    async def test_get_license_tier_distribution_groups_by_tier(self, queries, mock_db):
        """Test get_license_tier_distribution() groups by tier."""
        # Arrange
        mock_db.fetch_all.return_value = [
            {"tier": "pro", "status": "active", "count": 5},
            {"tier": "pro", "status": "expired", "count": 2},
            {"tier": "growth", "status": "active", "count": 3},
        ]

        # Act
        result = await queries.get_license_tier_distribution()

        # Assert
        assert "total" in result
        assert "by_tier" in result
        assert "by_status" in result
        assert result["total"] == 10
        assert result["by_tier"]["pro"] == 7
        assert result["by_tier"]["growth"] == 3

    async def test_get_license_tier_distribution_empty_results(self, queries, mock_db):
        """Test get_license_tier_distribution() handles empty results."""
        # Arrange
        mock_db.fetch_all.return_value = []

        # Act
        result = await queries.get_license_tier_distribution()

        # Assert
        assert result["total"] == 0
        assert result["by_tier"] == {}
        assert result["by_status"] == {}


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
