"""
🏰 Moat Engine Logic
====================

The value-accumulation engine of Agency OS.
Calculates how "sticky" the platform has become for the user.
"""

import logging
from pathlib import Path
from typing import Any, Dict, Union

from .dashboard import MoatDashboard
from .definitions import get_default_moats
from .models import Moat
from .persistence import MoatPersistence
from .strategy import MoatStrategy

# Configure logging
logger = logging.getLogger(__name__)


class MoatEngine:
    """
    🏰 Moat Strategy Engine

    The value-accumulation engine of Agency OS.
    Calculates how "sticky" the platform has become for the user.
    """

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/moats"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Sub-components
        self.persistence = MoatPersistence(self.storage_path)
        self.strategy = MoatStrategy()

        # Initialize with default definitions
        self.moats: Dict[str, Moat] = get_default_moats()
        self._load_data()

    def add_data_point(self, category: str, count: int = 1):
        """Updates metrics in the Data Moat."""
        if category in self.moats["data"].metrics:
            self.moats["data"].metrics[category] += count
            self._update_strength("data")
            self._save_data()

    def record_learning(self, success: bool = True):
        """Updates the Learning Moat based on execution outcomes."""
        metrics = self.moats["learning"].metrics
        metrics["patterns"] += 1

        # Exponential moving average for success rate
        alpha = 0.1
        metrics["success_rate"] = (metrics["success_rate"] * (1 - alpha)) + (
            1.0 if success else 0.0
        ) * alpha

        self._update_strength("learning")
        self._save_data()

    def add_workflow(self, count: int = 1):
        """Updates the Workflow Moat."""
        self.moats["workflow"].metrics["custom_workflows"] += count
        self._update_strength("workflow")
        self._save_data()

    def _update_strength(self, moat_id: str):
        """Recalculates 0-100% strength for a specific moat based on its metrics."""
        self.strategy.update_strength(self.moats, moat_id)

    def get_aggregate_strength(self) -> int:
        """Calculates the weighted average strength of all 5 moats."""
        return self.strategy.get_aggregate_strength(self.moats)

    def calculate_switching_cost(self) -> Dict[str, Any]:
        """Estimates the time and financial impact of leaving the Agency OS."""
        return self.strategy.calculate_switching_cost(self.moats)

    def _save_data(self):
        """Persists moat metrics to disk."""
        self.persistence.save(self.moats)

    def _load_data(self):
        """Loads moat metrics from disk."""
        self.persistence.load(self.moats)

    def print_dashboard(self):
        """Renders the Moat Strategy Dashboard."""
        agg = self.get_aggregate_strength()
        costs = self.calculate_switching_cost()
        MoatDashboard.render(self.moats, agg, costs)


# Global Instance
_moat_engine = None


def get_moat_engine() -> MoatEngine:
    """Access the shared moat strategy engine."""
    global _moat_engine
    if _moat_engine is None:
        _moat_engine = MoatEngine()
    return _moat_engine
