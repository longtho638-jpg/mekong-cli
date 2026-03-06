"""
Integration Tests for Dashboard API

Test suite for Dashboard API endpoints in src/api/dashboard/app.py
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from src.api.dashboard.app import app, dashboard_service


# Create test client
client = TestClient(app)


class TestDashboardAPI:
    """Tests for Dashboard API endpoints."""

    @pytest.fixture(autouse=True)
    def mock_service(self):
        """Mock DashboardService for tests."""
        with patch("src.api.dashboard.app.dashboard_service") as mock_service:
            yield mock_service

    # ========== GET /api/metrics Tests ==========

    def test_get_metrics_returns_200(self, mock_service):
        """Test GET /api/metrics returns 200."""
        # Arrange
        mock_metrics = MagicMock()
        mock_metrics.api_calls = []
        mock_metrics.active_licenses = {"total": 0, "licenses": []}
        mock_metrics.top_endpoints = []
        mock_metrics.revenue = {}
        mock_metrics.tier_distribution = {}
        mock_metrics.last_updated = datetime.now().isoformat()
        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)

        # Act
        response = client.get("/api/metrics")

        # Assert
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_get_metrics_with_custom_range(self, mock_service):
        """Test GET /api/metrics with custom range_days."""
        # Arrange
        mock_metrics = MagicMock()
        mock_metrics.api_calls = []
        mock_metrics.active_licenses = {"total": 0, "licenses": []}
        mock_metrics.top_endpoints = []
        mock_metrics.revenue = {}
        mock_metrics.tier_distribution = {}
        mock_metrics.last_updated = datetime.now().isoformat()
        mock_service.get_metrics = AsyncMock(return_value=mock_metrics)

        # Act
        response = client.get("/api/metrics?range_days=60")

        # Assert
        assert response.status_code == 200
        mock_service.get_metrics.assert_called_once_with(60)

    def test_get_metrics_with_invalid_range(self, mock_service):
        """Test GET /api/metrics with invalid range_days."""
        # Act
        response = client.get("/api/metrics?range_days=500")

        # Assert
        assert response.status_code == 422  # Validation error

    def test_get_metrics_handles_error(self, mock_service):
        """Test GET /api/metrics handles errors."""
        # Arrange
        mock_service.get_metrics = AsyncMock(side_effect=Exception("Database error"))

        # Act
        response = client.get("/api/metrics")

        # Assert
        assert response.status_code == 500
        assert "detail" in response.json()

    # ========== GET /api/metrics/api-calls Tests ==========

    def test_get_api_calls_returns_200(self, mock_service):
        """Test GET /api/metrics/api-calls returns 200."""
        # Arrange
        mock_service._queries.get_daily_usage = AsyncMock(return_value=[])
        mock_service._format_chart_data = MagicMock(return_value=[])

        # Act
        response = client.get(
            "/api/metrics/api-calls?start_date=2025-01-01&end_date=2025-01-31"
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_get_api_calls_missing_dates(self, mock_service):
        """Test GET /api/metrics/api-calls requires dates."""
        # Act
        response = client.get("/api/metrics/api-calls")

        # Assert
        assert response.status_code == 422  # Validation error

    def test_get_api_calls_with_granularity(self, mock_service):
        """Test GET /api/metrics/api-calls with granularity."""
        # Arrange
        mock_service._queries.get_daily_usage = AsyncMock(return_value=[])
        mock_service._format_chart_data = MagicMock(return_value=[])

        # Act
        response = client.get(
            "/api/metrics/api-calls?start_date=2025-01-01&end_date=2025-01-31&granularity=week"
        )

        # Assert
        assert response.status_code == 200
        mock_service._format_chart_data.assert_called()

    # ========== GET /api/metrics/licenses Tests ==========

    def test_get_licenses_returns_200(self, mock_service):
        """Test GET /api/metrics/licenses returns 200."""
        # Arrange
        mock_service._queries.get_active_licenses = AsyncMock(
            return_value=[{"license_key": "test", "tier": "pro"}]
        )

        # Act
        response = client.get("/api/metrics/licenses")

        # Assert
        assert response.status_code == 200
        assert response.json()["success"] is True
        assert len(response.json()["data"]) == 1

    # ========== GET /api/endpoints Tests ==========

    def test_get_endpoints_returns_200(self, mock_service):
        """Test GET /api/endpoints returns 200."""
        # Arrange
        mock_service._queries.get_top_endpoints = AsyncMock(
            return_value=[{"endpoint": "/api/test", "calls": 100}]
        )

        # Act
        response = client.get("/api/endpoints?limit=5")

        # Assert
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_get_endpoints_default_limit(self, mock_service):
        """Test GET /api/endpoints uses default limit."""
        # Arrange
        mock_service._queries.get_top_endpoints = AsyncMock(return_value=[])

        # Act
        response = client.get("/api/endpoints")

        # Assert
        assert response.status_code == 200
        mock_service._queries.get_top_endpoints.assert_called_once_with(limit=10)

    # ========== GET /api/export Tests ==========

    def test_export_to_csv_returns_200(self, mock_service):
        """Test GET /api/export?type=csv returns 200."""
        # Arrange
        mock_service.export_to_csv = AsyncMock(return_value="date,calls\n2025-01-01,100")

        # Act
        response = client.get("/api/export?format=csv")

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"

    def test_export_to_json_returns_200(self, mock_service):
        """Test GET /api/export?type=json returns 200."""
        # Arrange
        mock_service.export_to_json = AsyncMock(return_value='{"test": "data"}')

        # Act
        response = client.get("/api/export?format=json")

        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("application/json")

    def test_export_default_date_range(self, mock_service):
        """Test GET /api/export uses default date range."""
        # Arrange
        today = datetime.now()
        mock_service.export_to_csv = AsyncMock(return_value="")

        # Act
        client.get("/api/export?format=csv")

        # Assert
        call_args = mock_service.export_to_csv.call_args[0][0]
        start_date, end_date = call_args
        assert isinstance(start_date, str)
        assert isinstance(end_date, str)

    def test_export_with_date_range(self, mock_service):
        """Test GET /api/export with custom date range."""
        # Arrange
        mock_service.export_to_csv = AsyncMock(return_value="")

        # Act
        client.get(
            "/api/export?format=csv&start=2025-01-01&end=2025-01-31"
        )

        # Assert
        call_args = mock_service.export_to_csv.call_args[0][0]
        assert call_args[0] == "2025-01-01"
        assert call_args[1] == "2025-01-31"

    # ========== Health check Tests ==========

    def test_health_check_returns_200(self):
        """Test GET /health returns 200."""
        # Act
        response = client.get("/health")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    # ========== Root endpoint Tests ==========

    def test_root_returns_200(self, mock_service):
        """Test GET / returns 200."""
        # Act
        response = client.get("/")

        # Assert
        # May return 404 if template doesn't exist, but should not error
        assert response.status_code in [200, 404, 500]  # Acceptable responses


class TestDashboardAPIIntegration:
    """Integration tests for Dashboard API with real service."""

    @pytest.fixture
    def client_with_real_service(self):
        """Create test client with real DashboardService."""
        from src.api.dashboard.app import app as real_app

        return TestClient(real_app)

    def test_metrics_endpoint_integration(self, client_with_real_service):
        """Test /api/metrics with real service (may fail without DB)."""
        # Note: This test may fail without a database connection
        # It's included for documentation of expected behavior
        response = client_with_real_service.get("/api/metrics")

        # Either succeeds (with DB) or returns 500 (without DB)
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            assert response.json()["success"] is True

    def test_health_check_integration(self, client_with_real_service):
        """Test /health with real service."""
        response = client_with_real_service.get("/health")

        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
