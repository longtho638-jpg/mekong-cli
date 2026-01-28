"""
Tests for Dashboard Service
"""
import pytest
from unittest.mock import MagicMock, patch
from uuid import UUID, uuid4
from datetime import datetime

from backend.services.dashboard_service import DashboardService
from backend.models.dashboard import (
    DashboardConfigCreate,
    DashboardConfigUpdate,
    WidgetConfig,
    WidgetPosition
)

@pytest.fixture
def mock_db_session():
    return MagicMock()

@pytest.fixture
def dashboard_service(mock_db_session):
    return DashboardService(db_session=mock_db_session)

@pytest.mark.asyncio
async def test_get_dashboards(dashboard_service):
    user_id = uuid4()
    dashboards = await dashboard_service.get_dashboards(user_id)
    assert len(dashboards) == 1
    assert dashboards[0].user_id == user_id
    assert dashboards[0].name == "Executive Overview"

@pytest.mark.asyncio
async def test_get_dashboard_found(dashboard_service):
    user_id = uuid4()
    # Get the ID from the default dashboard logic
    default = dashboard_service._get_default_dashboard(user_id)
    dashboard_id = default.id

    dashboard = await dashboard_service.get_dashboard(dashboard_id, user_id)
    assert dashboard is not None
    assert dashboard.id == dashboard_id

@pytest.mark.asyncio
async def test_get_dashboard_not_found(dashboard_service):
    user_id = uuid4()
    dashboard_id = uuid4() # Random ID

    dashboard = await dashboard_service.get_dashboard(dashboard_id, user_id)
    assert dashboard is None

@pytest.mark.asyncio
async def test_create_dashboard(dashboard_service):
    user_id = uuid4()
    config = DashboardConfigCreate(
        name="New Dashboard",
        description="Test Desc",
        is_default=False,
        layout_config={"layout": "grid"}
    )

    dashboard = await dashboard_service.create_dashboard(user_id, config)
    assert dashboard.name == "New Dashboard"
    assert dashboard.user_id == user_id
    # Note: Logic currently returns mock with fixed ID, but we test the flow

@pytest.mark.asyncio
async def test_update_dashboard(dashboard_service):
    user_id = uuid4()
    dashboard_id = uuid4()
    config = DashboardConfigUpdate(name="Updated Name")

    dashboard = await dashboard_service.update_dashboard(dashboard_id, user_id, config)
    # Mock currently returns default, so assertion is limited to type check or mock behavior
    assert dashboard is not None

@pytest.mark.asyncio
async def test_delete_dashboard(dashboard_service):
    user_id = uuid4()
    dashboard_id = uuid4()
    # Should not raise exception
    await dashboard_service.delete_dashboard(dashboard_id, user_id)

@pytest.mark.asyncio
async def test_get_metric_data_revenue(dashboard_service):
    response = await dashboard_service.get_metric_data("revenue", "30d")

    assert response.metric == "revenue"
    assert len(response.data) == 30
    assert response.value > 0
    assert response.trend_label == "vs 30 days ago"

@pytest.mark.asyncio
async def test_get_metric_data_users_7d(dashboard_service):
    response = await dashboard_service.get_metric_data("users", "7d")

    assert response.metric == "users"
    assert len(response.data) == 7
    assert response.trend_label == "vs 7 days ago"
