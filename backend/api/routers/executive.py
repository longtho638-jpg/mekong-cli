"""
Executive API Router
====================

Aggregates high-level metrics for C-suite dashboards.
Combines data from Revenue, CRM, and Operations.
"""

import logging
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel

from backend.api.routers.crm import _get_crm
from backend.api.security.rbac import require_admin
from backend.api.services.revenue_service import RevenueService
from backend.services.pdf_generator import pdf_generator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/executive", tags=["executive"])

# --- Schemas ---

class StrategicAlert(BaseModel):
    severity: str  # critical, warning, info
    message: str
    category: str  # finance, growth, retention

class ExecutiveDashboard(BaseModel):
    """Aggregated C-suite metrics."""
    # Financials
    mrr: float
    arr: float
    burn_rate: float
    runway_months: float

    # Growth
    new_leads_this_month: int
    active_deals_value: float

    # Retention
    churn_rate: float
    active_subscribers: int

    # Insights
    alerts: List[StrategicAlert]

# --- Dependencies ---

def get_revenue_service():
    return RevenueService()

# --- Helpers ---

def _calculate_burn_rate(tenant_id: str) -> float:
    """
    Calculate estimated monthly burn rate.
    TODO: Connect to Accounting/Expenses service.
    For now, return a placeholder or estimate.
    """
    # Placeholder: $10k fixed + $50 per user estimate
    return 15000.0

def _calculate_runway(cash_balance: float, burn_rate: float) -> float:
    """Calculate runway in months."""
    if burn_rate <= 0:
        return 99.0
    return cash_balance / burn_rate

def _get_crm_metrics() -> Dict[str, Any]:
    """Get summarized CRM metrics."""
    crm = _get_crm()
    if not crm:
        return {"new_leads": 0, "active_pipeline": 0.0}

    # Calculate new leads (this month) - Mocking timestamp check for now as CRM simple
    # Assuming leads are contacts with status 'lead'
    new_leads = len([c for c in crm.contacts.values() if getattr(c, 'created_at', None)])

    # Calculate active pipeline value
    active_pipeline = sum(
        d.value for d in crm.deals.values()
        if d.stage.value not in ['closed_won', 'closed_lost']
    )

    return {
        "new_leads": new_leads,
        "active_pipeline": float(active_pipeline)
    }

# --- Endpoints ---

@router.get("/dashboard", response_model=ExecutiveDashboard)
async def get_executive_dashboard(
    tenant_id: Optional[str] = Query(None),
    revenue_service: RevenueService = Depends(get_revenue_service),
    # user: dict = Depends(require_admin) # TODO: Re-enable after RBAC fix
):
    """
    Get aggregated executive metrics.
    """
    # 1. Revenue Metrics
    rev_stats = revenue_service.get_revenue_stats(tenant_id)

    # 2. CRM Metrics
    crm_stats = _get_crm_metrics()

    # 3. Burn & Runway (Estimated)
    burn_rate = _calculate_burn_rate(tenant_id or "default")
    # TODO: Get real cash balance from Bank/Stripe
    cash_balance = 150000.0
    runway = _calculate_runway(cash_balance, burn_rate)

    # 4. Generate Alerts
    alerts = []

    # Financial Alerts
    if runway < 3:
        alerts.append(StrategicAlert(
            severity="critical",
            message=f"Low Runway: {runway:.1f} months remaining.",
            category="finance"
        ))
    elif runway < 6:
        alerts.append(StrategicAlert(
            severity="warning",
            message=f"Moderate Runway: {runway:.1f} months remaining.",
            category="finance"
        ))

    # Growth Alerts
    if rev_stats['mrr'] > 0 and rev_stats['customer_churn_rate'] > 5.0:
        alerts.append(StrategicAlert(
            severity="warning",
            message=f"High Churn Rate: {rev_stats['customer_churn_rate']:.1f}%",
            category="retention"
        ))

    return ExecutiveDashboard(
        mrr=rev_stats['mrr'],
        arr=rev_stats['arr'],
        burn_rate=burn_rate,
        runway_months=runway,
        new_leads_this_month=crm_stats['new_leads'],
        active_deals_value=crm_stats['active_pipeline'],
        churn_rate=rev_stats['customer_churn_rate'],
        active_subscribers=rev_stats['active_subscribers'],
        alerts=alerts
    )

@router.get("/report/pdf")
async def download_executive_report(
    tenant_id: Optional[str] = Query(None),
    days: int = Query(30),
    revenue_service: RevenueService = Depends(get_revenue_service),
    # user: dict = Depends(require_admin)
):
    """
    Generate and download the Executive Summary PDF.
    """
    # Gather data
    rev_stats = revenue_service.get_revenue_stats(tenant_id)
    trends = revenue_service.get_revenue_trend(tenant_id, days)

    # Synthesize insights for PDF
    insights = []
    if rev_stats['customer_churn_rate'] > 5.0:
        insights.append(f"CRITICAL: Churn rate is {rev_stats['customer_churn_rate']}%, exceeding 5% threshold.")
    if rev_stats['mrr'] > 0:
        growth = ((trends[-1]['mrr'] - trends[0]['mrr']) / trends[0]['mrr']) * 100 if trends and trends[0]['mrr'] > 0 else 0
        insights.append(f"Revenue Growth: MRR changed by {growth:.1f}% over the last {days} days.")

    start_date = (date.today() - timedelta(days=days)).isoformat()
    end_date = date.today().isoformat()

    # Generate PDF
    pdf_bytes = pdf_generator.generate_executive_report(
        metrics=rev_stats,
        trends=trends,
        insights=insights,
        start_date=start_date,
        end_date=end_date
    )

    filename = f"executive_report_{end_date}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
