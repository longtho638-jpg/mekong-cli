from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

@router.get("/usage")
async def get_usage_analytics() -> Dict[str, Any]:
    """Get usage analytics data"""
    return {
        "total_requests": 0,
        "active_users": 0,
        "avg_response_time": 0.0
    }
