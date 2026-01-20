"""
💰 Cashflow Engine - Closed-Loop Revenue Tracking
================================================

Monitors and projects agency revenue against the $1M ARR 2026 milestone.
Provides real-time visibility into growth rates, churn impacts, and
required performance to hit the target.

Features:
- Multi-currency support (VND, USD, THB).
- Automated ARR/MRR calculation.
- Growth trajectory projections.
- Revenue stream breakdown.

Binh Pháp: 💰 Tài (Wealth) - Managing the lifeblood of the agency.

NOTE: This is a facade for backward compatibility.
The actual implementation has been moved to antigravity.core.cashflow_engine package.
"""

from antigravity.core.cashflow_engine import (
    CashflowEngine,
    Revenue,
    RevenueGoal,
    RevenueStream,
    get_cashflow_engine,
)

__all__ = [
    "CashflowEngine",
    "Revenue",
    "RevenueGoal",
    "RevenueStream",
    "get_cashflow_engine",
]
