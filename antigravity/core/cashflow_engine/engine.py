"""
💰 Cashflow Engine Logic
========================

Monitors and projects agency revenue against the $1M ARR 2026 milestone.
Provides real-time visibility into growth rates, churn impacts, and
required performance to hit the target.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union

from .analytics import CashflowAnalytics
from .dashboard import print_cashflow_dashboard
from .models import EXCHANGE_RATES, Revenue, RevenueGoal, RevenueStream
from .persistence import CashflowPersistence

# Configure logging
logger = logging.getLogger(__name__)


class CashflowEngine:
    """
    💰 Cashflow Management System

    The financial cockpit for the solo unicorn journey.
    """

    def __init__(self, storage_path: str = ".antigravity/cashflow"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Sub-components
        self.persistence = CashflowPersistence(self.storage_path)
        self.analytics = CashflowAnalytics()

        self.revenues: List[Revenue] = []
        self._load_data()

    @property
    def goals(self) -> Dict[RevenueStream, RevenueGoal]:
        """Expose goals from analytics for dashboard compatibility."""
        return self.analytics.goals

    def add_revenue(
        self,
        stream: Union[RevenueStream, str],
        amount: float,
        currency: str = "USD",
        recurring: bool = False,
        client: Optional[str] = None,
        description: str = "",
    ) -> Revenue:
        """Adds a revenue entry and updates the dashboard state."""
        # Normalize stream type
        if isinstance(stream, str):
            try:
                stream = RevenueStream(stream.lower())
            except ValueError:
                stream = RevenueStream.AGENCY

        # Handle Currency Conversion
        rate = EXCHANGE_RATES.get(currency.upper(), 1.0)
        usd_val = amount / rate

        entry = Revenue(
            id=f"rev_{datetime.now().strftime('%y%m%d%H%M%S')}_{len(self.revenues)}",
            stream=stream,
            amount_usd=usd_val,
            amount_original=amount,
            currency=currency.upper(),
            date=datetime.now(),
            recurring=recurring,
            client=client,
            description=description,
        )

        self.revenues.append(entry)
        self._recalculate_progress()
        self._save_data()

        logger.info(f"Revenue recorded: ${usd_val:,.2f} via {stream.value}")
        return entry

    def _recalculate_progress(self):
        """Re-evaluates current ARR across all streams."""
        self.analytics.recalculate_progress(self.revenues)

    def get_total_arr(self) -> float:
        """Returns the aggregate ARR across all streams."""
        return self.analytics.get_total_arr()

    def get_progress_percent(self) -> float:
        """Returns overall progress percentage toward $1M."""
        return self.analytics.get_progress_percent()

    def get_required_mrr_growth(self) -> float:
        """
        Calculates the required monthly growth rate to hit $1M by end of 2026.
        """
        return self.analytics.get_required_mrr_growth()

    def _save_data(self):
        """Persists revenue state to JSON."""
        self.persistence.save(self.revenues)

    def _load_data(self):
        """Loads revenue state from disk."""
        self.revenues = self.persistence.load()
        self._recalculate_progress()

    def print_dashboard(self) -> None:
        """Renders the comprehensive $1M Goal Dashboard."""
        print_cashflow_dashboard(self)


# Global Instance
_engine = None


def get_cashflow_engine() -> CashflowEngine:
    """Access the shared cashflow tracking engine."""
    global _engine
    if _engine is None:
        _engine = CashflowEngine()
    return _engine
