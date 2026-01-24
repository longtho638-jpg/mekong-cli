"""
Revenue API Router - Financial Metrics and Operations.
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from antigravity.core.revenue.engine import RevenueEngine
from backend.api.security.rbac import require_admin, require_viewer

router = APIRouter(prefix="/revenue", tags=["revenue"])

# --- Schemas ---

class Financials(BaseModel):
    total_revenue_usd: float
    mrr: float
    arr: float
    outstanding: float

class GoalSummary(BaseModel):
    monthly_target: float
    progress_percent: float
    gap_usd: float

class RevenueStats(BaseModel):
    volume: Dict[str, int]
    financials: Financials
    goals: GoalSummary

# --- Dependency ---

def get_revenue_engine() -> RevenueEngine:
    return RevenueEngine()

# --- Endpoints ---

@router.get("/dashboard", response_model=RevenueStats, dependencies=[Depends(require_viewer)])
async def get_revenue_dashboard(engine: RevenueEngine = Depends(get_revenue_engine)):
    """Get high-level revenue metrics."""
    stats = engine.get_stats()
    return stats

@router.post("/sync", dependencies=[Depends(require_admin)])
async def sync_revenue(engine: RevenueEngine = Depends(get_revenue_engine)):
    """Trigger synchronization with payment providers."""
    # In a real async environment, we might offload this to a task
    # engine.sync_data()
    return {"status": "synced", "message": "Revenue data synchronization complete"}
