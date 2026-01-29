import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from backend.models.dashboard import (
    DashboardConfig,
    DashboardConfigCreate,
    DashboardConfigUpdate,
    DashboardWidget,
    DashboardWidgetCreate,
    MetricDataPoint,
    MetricResponse,
    WidgetConfig,
    WidgetPosition,
)

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, db_session=None):
        self.db = db_session
        # In a real app, inject repositories here

    async def get_dashboards(self, user_id: UUID) -> List[DashboardConfig]:
        # TODO: Implement DB query
        # For now, return a mock default dashboard if none exists
        return [self._get_default_dashboard(user_id)]

    async def get_dashboard(self, dashboard_id: UUID, user_id: UUID) -> Optional[DashboardConfig]:
        # TODO: Implement DB query
        default = self._get_default_dashboard(user_id)
        if default.id == dashboard_id:
            return default
        return None

    async def create_dashboard(
        self, user_id: UUID, config: DashboardConfigCreate
    ) -> DashboardConfig:
        # TODO: Implement DB insert
        return DashboardConfig(
            id=UUID("00000000-0000-0000-0000-000000000000"),  # Mock ID
            user_id=user_id,
            name=config.name,
            description=config.description,
            is_default=config.is_default,
            layout_config=config.layout_config,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            widgets=[],
        )

    async def update_dashboard(
        self, dashboard_id: UUID, user_id: UUID, config: DashboardConfigUpdate
    ) -> DashboardConfig:
        # TODO: Implement DB update
        return self._get_default_dashboard(user_id)  # Mock return

    async def delete_dashboard(self, dashboard_id: UUID, user_id: UUID):
        # TODO: Implement DB delete
        pass

    async def get_metric_data(
        self, metric: str, date_range: str, segment: Optional[str] = None
    ) -> MetricResponse:
        """
        Aggregate data for a specific metric.
        This would typically query a time-series DB, Analytics table, or cache.
        """
        # Mock logic for demonstration
        now = datetime.now()
        data_points = []

        # Generate some mock trend data
        base_value = 1000
        if metric == "revenue":
            base_value = 50000
        elif metric == "users":
            base_value = 1500

        days = 30
        if date_range == "7d":
            days = 7
        elif date_range == "90d":
            days = 90

        current_value = 0

        for i in range(days):
            date = now - timedelta(days=days - i)
            # Add some randomness
            import random

            daily_val = (
                base_value * (0.8 + random.random() * 0.4) * (1 + i / days * 0.2)
            )  # Upward trend
            data_points.append(
                MetricDataPoint(timestamp=date, value=daily_val, label=date.strftime("%Y-%m-%d"))
            )
            current_value = daily_val

        # Calculate KPI
        previous_value = data_points[0].value if data_points else 0
        trend = (
            ((current_value - previous_value) / previous_value * 100) if previous_value > 0 else 0
        )

        return MetricResponse(
            metric=metric,
            value=round(current_value, 2),
            trend=round(trend, 1),
            trend_label=f"vs {days} days ago",
            data=data_points,
        )

    def _get_default_dashboard(self, user_id: UUID) -> DashboardConfig:
        """Mock default dashboard for testing/fallback"""
        return DashboardConfig(
            id=UUID("11111111-1111-1111-1111-111111111111"),
            user_id=user_id,
            name="Executive Overview",
            description="Default system dashboard",
            is_default=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            widgets=[
                DashboardWidget(
                    id=UUID("22222222-2222-2222-2222-222222222222"),
                    dashboard_id=UUID("11111111-1111-1111-1111-111111111111"),
                    widget_type="kpi",
                    created_at=datetime.now(),
                    position=WidgetPosition(x=0, y=0, w=3, h=2),
                    config=WidgetConfig(
                        title="Total Revenue", metric="revenue", refresh_interval=60
                    ),
                ),
                DashboardWidget(
                    id=UUID("33333333-3333-3333-3333-333333333333"),
                    dashboard_id=UUID("11111111-1111-1111-1111-111111111111"),
                    widget_type="chart",
                    created_at=datetime.now(),
                    position=WidgetPosition(x=0, y=2, w=6, h=4),
                    config=WidgetConfig(
                        title="Revenue Trend",
                        metric="revenue",
                        chart_type="area",
                        refresh_interval=300,
                    ),
                ),
            ],
        )
