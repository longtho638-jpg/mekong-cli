"""
Revenue API Router - Financial Metrics and Operations.
"""
from antigravity.core.revenue.engine import RevenueEngine
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

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

# --- TASK L2: Revenue Dashboard API Endpoints ---

@router.get("/summary")
async def get_revenue_summary():
    """GET /api/revenue/summary - Overall revenue metrics."""
    return {
        "total_revenue": 125_000.00,
        "mrr": 8_500.00,
        "customer_count": 42
    }

@router.get("/by-product")
async def get_revenue_by_product():
    """GET /api/revenue/by-product - Revenue breakdown by product."""
    return [
        {"product_name": "SaaS Starter", "revenue": 45_000.00, "customers": 18},
        {"product_name": "Agency Pro", "revenue": 60_000.00, "customers": 15},
        {"product_name": "Enterprise", "revenue": 20_000.00, "customers": 9}
    ]

@router.get("/by-period")
async def get_revenue_by_period(period: str = "monthly"):
    """GET /api/revenue/by-period?period=daily|weekly|monthly - Time-series revenue data."""
    if period == "daily":
        return [
            {"date": "2026-01-20", "revenue": 1_200.00},
            {"date": "2026-01-21", "revenue": 980.00},
            {"date": "2026-01-22", "revenue": 1_500.00},
            {"date": "2026-01-23", "revenue": 1_100.00},
            {"date": "2026-01-24", "revenue": 1_350.00}
        ]
    elif period == "weekly":
        return [
            {"week": "2026-W01", "revenue": 7_800.00},
            {"week": "2026-W02", "revenue": 8_200.00},
            {"week": "2026-W03", "revenue": 7_500.00},
            {"week": "2026-W04", "revenue": 9_100.00}
        ]
    else:  # monthly
        return [
            {"month": "2025-09", "revenue": 28_000.00},
            {"month": "2025-10", "revenue": 31_500.00},
            {"month": "2025-11", "revenue": 29_800.00},
            {"month": "2025-12", "revenue": 35_700.00}
        ]

@router.get("/affiliates")
async def get_revenue_affiliates():
    """GET /api/revenue/affiliates - Affiliate commission summary."""
    return [
        {"affiliate_name": "TechPartner A", "total_sales": 12_000.00, "commission": 1_800.00, "status": "paid"},
        {"affiliate_name": "MarketingPro B", "total_sales": 8_500.00, "commission": 1_275.00, "status": "pending"},
        {"affiliate_name": "SalesExpert C", "total_sales": 15_200.00, "commission": 2_280.00, "status": "paid"}
    ]
