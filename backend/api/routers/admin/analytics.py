from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.api.security.rbac import require_viewer
from backend.api.services.admin_service import AdminService

router = APIRouter(prefix="/analytics", tags=["admin-analytics"])

def get_admin_service() -> AdminService:
    return AdminService()

@router.get("/overview", dependencies=[Depends(require_viewer)])
async def get_analytics_overview(
    period: str = Query("30d", description="Time period (24h, 7d, 30d, 90d)"),
    service: AdminService = Depends(get_admin_service)
) -> Dict[str, Any]:
    """Get analytics overview metrics."""
    # Placeholder for actual analytics implementation
    return {
        "mrr": 12500,
        "mrr_growth": 12.5,
        "active_users": 1240,
        "active_users_growth": 5.2,
        "api_requests": 1500000,
        "api_requests_growth": 25.0,
        "success_rate": 99.95,
        "period": period
    }

@router.get("/revenue", dependencies=[Depends(require_viewer)])
async def get_revenue_metrics(
    period: str = Query("30d", description="Time period"),
    service: AdminService = Depends(get_admin_service)
) -> Dict[str, Any]:
    """Get revenue analytics."""
    return {
        "revenue_chart": [
            {"date": "2024-01-01", "amount": 1000},
            {"date": "2024-01-02", "amount": 1200},
            {"date": "2024-01-03", "amount": 1100},
        ],
        "plans_breakdown": {
            "starter": 40,
            "pro": 40,
            "enterprise": 20
        }
    }
