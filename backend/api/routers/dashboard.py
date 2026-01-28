"""
📊 Dashboard API Router - Serves live data for Admin Dashboard
==============================================================

Endpoints:
- GET /api/dashboard/configs - List dashboards
- GET /api/dashboard/data/{metric} - Get metric data
- GET /api/dashboard/legacy/* - Legacy endpoints
"""

import json
import logging

# Legacy imports
from pathlib import Path
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.models.dashboard import (
    DashboardConfig,
    DashboardConfigCreate,
    DashboardConfigUpdate,
    MetricResponse,
)
from backend.services.cache.decorators import cache
from backend.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)

# Config for legacy
MEKONG_DIR = Path.home() / ".mekong"

# Dependency
def get_dashboard_service():
    return DashboardService()

# --- New Endpoints ---

@router.get("/configs", response_model=List[DashboardConfig])
async def list_dashboards(
    user_id: Optional[UUID] = None, # In real app, get from auth context
    service: DashboardService = Depends(get_dashboard_service)
):
    """List user's saved dashboards."""
    # Mock user_id if not provided (for dev)
    uid = user_id or uuid4()
    return await service.get_dashboards(uid)

@router.post("/configs", response_model=DashboardConfig)
async def create_dashboard(
    config: DashboardConfigCreate,
    user_id: Optional[UUID] = None,
    service: DashboardService = Depends(get_dashboard_service)
):
    """Create a new dashboard configuration."""
    uid = user_id or uuid4()
    return await service.create_dashboard(uid, config)

@router.get("/configs/{dashboard_id}", response_model=DashboardConfig)
async def get_dashboard(
    dashboard_id: UUID,
    user_id: Optional[UUID] = None,
    service: DashboardService = Depends(get_dashboard_service)
):
    """Get a specific dashboard."""
    uid = user_id or uuid4()
    dashboard = await service.get_dashboard(dashboard_id, uid)
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return dashboard

@router.put("/configs/{dashboard_id}", response_model=DashboardConfig)
async def update_dashboard(
    dashboard_id: UUID,
    config: DashboardConfigUpdate,
    user_id: Optional[UUID] = None,
    service: DashboardService = Depends(get_dashboard_service)
):
    """Update a dashboard."""
    uid = user_id or uuid4()
    return await service.update_dashboard(dashboard_id, uid, config)

@router.get("/data/{metric}", response_model=MetricResponse)
@cache(
    ttl=300,
    prefix="dashboard",
    key_func=lambda metric, date_range="30d", segment=None, **kwargs: f"metrics:{metric}:{date_range}:{segment}",
    tags=["dashboard"]
)
async def get_metric_data(
    metric: str,
    date_range: str = Query("30d", regex="^(today|7d|30d|90d|ytd|custom)$"),
    segment: Optional[str] = None,
    service: DashboardService = Depends(get_dashboard_service)
):
    """Get aggregated data for a specific metric."""
    return await service.get_metric_data(metric, date_range, segment)


# --- Legacy Endpoints (Maintained for compatibility) ---

class RevenueMetrics(BaseModel):
    mrr: float = 0.0
    arr: float = 0.0
    pending_invoices: float = 0.0
    paid_invoices: float = 0.0
    goal: float = 200000.0
    progress_percent: float = 0.0

def load_json_file(filename: str) -> List[dict]:
    filepath = MEKONG_DIR / filename
    if filepath.exists():
        try:
            with open(filepath) as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

@router.get("/revenue", response_model=RevenueMetrics)
@cache(
    ttl=600,
    prefix="dashboard:legacy",
    tags=["dashboard"]
)
async def get_revenue():
    """Get revenue metrics from invoices (Legacy)."""
    invoices = load_json_file("invoices.json")
    pending = sum(i.get("amount", 0) for i in invoices if i.get("status") == "pending")
    paid = sum(i.get("amount", 0) for i in invoices if i.get("status") == "paid")
    goal = 200000.0
    progress = (paid / goal * 100) if goal > 0 else 0
    return RevenueMetrics(
        mrr=paid / 12 if paid > 0 else 0,
        arr=paid,
        pending_invoices=pending,
        paid_invoices=paid,
        goal=goal,
        progress_percent=round(progress, 1),
    )
