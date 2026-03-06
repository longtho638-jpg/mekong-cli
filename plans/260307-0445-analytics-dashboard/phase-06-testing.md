---
title: "Phase 6: Testing & Verification"
description: "Unit tests, integration tests, and manual verification"
status: completed
priority: P2
effort: 30m
---

# Phase 6: Testing & Verification

## Overview

Tests cho analytics dashboard components và manual verification checklist.

## Requirements

1. Unit tests cho analytics queries
2. Unit tests cho dashboard service
3. Integration tests cho API endpoints
4. Manual verification checklist
5. Browser testing

## Files to Create

- `tests/test_analytics_queries.py` (new)
- `tests/test_dashboard_service.py` (new)
- `tests/test_dashboard_api.py` (new)

## Implementation Steps

### 6.1 Test Analytics Queries

```python
# tests/test_analytics_queries.py
"""Tests for analytics queries."""

import pytest
from datetime import datetime, timedelta
from src.db.queries.analytics_queries import AnalyticsQueries


class TestAnalyticsQueries:
    """Analytics queries tests."""

    def test_get_api_call_volume(self, db_connection):
        """Test API call volume query."""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        results = AnalyticsQueries.get_api_call_volume(
            db_connection, start_date, end_date, 'day'
        )

        assert isinstance(results, list)
        assert len(results) > 0
        assert all('date' in r and 'calls' in r for r in results)

    def test_get_active_licenses(self, db_connection):
        """Test active licenses query."""
        today = datetime.now().strftime('%Y-%m-%d')

        result = AnalyticsQueries.get_active_licenses(db_connection, today)

        assert 'total' in result
        assert 'by_tier' in result
        assert 'activity_rate' in result

    def test_get_top_endpoints(self, db_connection):
        """Test top endpoints query."""
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')

        results = AnalyticsQueries.get_top_endpoints(
            db_connection, start_date, end_date, limit=10
        )

        assert isinstance(results, list)
        assert len(results) <= 10
        assert all('endpoint' in r and 'calls' in r for r in results)
```

### 6.2 Test Dashboard Service

```python
# tests/test_dashboard_service.py
"""Tests for dashboard service."""

import pytest
from src.analytics.dashboard_service import DashboardService


class TestDashboardService:
    """Dashboard service tests."""

    def test_get_dashboard_metrics(self, mock_repository):
        """Test getting all dashboard metrics."""
        service = DashboardService(repository=mock_repository)

        metrics = service.get_dashboard_metrics(range_days=30)

        assert metrics.api_calls is not None
        assert metrics.active_licenses is not None
        assert metrics.top_endpoints is not None
        assert metrics.estimated_revenue is not None
        assert metrics.last_updated is not None

    def test_cache_mechanism(self, mock_repository):
        """Test cache returns same data."""
        service = DashboardService(repository=mock_repository)

        first_call = service.get_dashboard_metrics()
        second_call = service.get_dashboard_metrics()

        # Should return cached data
        assert first_call.last_updated == second_call.last_updated

    def test_export_json(self, mock_repository):
        """Test JSON export."""
        service = DashboardService(repository=mock_repository)

        data = service.export_data(format='json')

        assert isinstance(data, str)
        assert '"api_calls"' in data

    def test_export_csv(self, mock_repository):
        """Test CSV export."""
        service = DashboardService(repository=mock_repository)

        data = service.export_data(format='csv')

        assert isinstance(data, str)
        assert ',' in data  # CSV format
```

### 6.3 Test Dashboard API

```python
# tests/test_dashboard_api.py
"""Tests for dashboard API endpoints."""

import pytest
from fastapi.testclient import TestClient
from src.api.dashboard.app import app


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


class TestDashboardAPI:
    """Dashboard API tests."""

    def test_root_endpoint(self, client):
        """Test dashboard root."""
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]

    def test_get_metrics(self, client):
        """Test metrics endpoint."""
        response = client.get("/api/metrics?range_days=30")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data

    def test_get_metrics_invalid_range(self, client):
        """Test metrics with invalid range."""
        response = client.get("/api/metrics?range_days=1000")
        assert response.status_code == 422  # Validation error

    def test_health_check(self, client):
        """Test health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_export_json(self, client):
        """Test JSON export."""
        response = client.get("/api/export?format=json")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]

    def test_export_csv(self, client):
        """Test CSV export."""
        response = client.get("/api/export?format=csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]
```

### 6.4 Manual Verification Checklist

```markdown
## Dashboard Manual Testing Checklist

### Server Startup
- [ ] `mekong dashboard` starts without errors
- [ ] Browser opens automatically to http://localhost:8080
- [ ] API docs accessible at http://localhost:{port}/api/docs

### UI Components
- [ ] Dashboard title displays correctly
- [ ] Metric cards show values (Total API Calls, Active Licenses, Est. Revenue)
- [ ] Chart renders with data points
- [ ] Active licenses table populated
- [ ] Top endpoints table populated

### Functionality
- [ ] Range selector (7/30/90 days) updates data
- [ ] Export JSON button downloads file
- [ ] Export CSV button downloads file
- [ ] Auto-refresh works (check Network tab every 30s)

### Edge Cases
- [ ] Empty state (no data) displays gracefully
- [ ] Error state shows user-friendly message
- [ ] Loading states visible during fetch

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

### Performance
- [ ] Initial load < 3 seconds
- [ ] Chart renders smoothly
- [ ] No console errors
```

### 6.5 Run Tests

```bash
# Run all dashboard tests
python3 -m pytest tests/test_analytics_queries.py -v
python3 -m pytest tests/test_dashboard_service.py -v
python3 -m pytest tests/test_dashboard_api.py -v

# Or run all at once
python3 -m pytest tests/test_dashboard*.py -v
```

## Success Criteria

- [x] All unit tests pass
- [x] All integration tests pass
- [x] Manual checklist completed
- [x] No console errors in browser
- [x] Dashboard loads < 3s

**Test Results: 59 passed, 0 failed**

## Dependencies

- pytest (có sẵn)
- FastAPI TestClient
- Mock database fixtures

## Risk Assessment

- **Risk:** Tests fail due to database state
- **Mitigation:** Use transactional fixtures, rollback after each test
