"""
💰 Cashflow Engine Module
=========================

Monitors and projects agency revenue against the $1M ARR 2026 milestone.
Provides real-time visibility into growth rates, churn impacts, and
required performance to hit the target.
"""

from .engine import CashflowEngine, get_cashflow_engine
from .models import Revenue, RevenueGoal, RevenueStream

__all__ = [
    "CashflowEngine",
    "get_cashflow_engine",
    "Revenue",
    "RevenueGoal",
    "RevenueStream",
]
