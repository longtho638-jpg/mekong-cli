import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .connector import QuotaConnector
from .enums import StatusFormat, ThresholdLevel
from .formatter import QuotaFormatter
from .mock_data import MockQuotaGenerator
from .models import QuotaModel, QuotaPool
from .parser import QuotaParser


class QuotaEngine:
    """
    Main quota monitoring engine.

    Refactored modular version.

    Supports:
    - Local process detection (reads from Antigravity client)
    - Remote API fetching (optional, requires authorization)
    """

    DEFAULT_WARNING_THRESHOLD = 30
    DEFAULT_CRITICAL_THRESHOLD = 10

    def __init__(
        self,
        warning_threshold: int = DEFAULT_WARNING_THRESHOLD,
        critical_threshold: int = DEFAULT_CRITICAL_THRESHOLD,
        cache_dir: Optional[Path] = None,
    ):
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.cache_dir = cache_dir or Path.home() / ".mekong" / "quota_cache"
        self._models: List[QuotaModel] = []
        self._pools: Dict[str, QuotaPool] = {}
        self._last_fetch: Optional[datetime] = None

        # Components
        self._connector = QuotaConnector()

    def get_local_quota(self) -> List[QuotaModel]:
        """
        Detect quota from local Antigravity Language Server process.
        """
        models = []

        # Try to get real data
        quota_data = self._connector.get_real_quota_data()

        if quota_data:
            models = QuotaParser.parse_quota_data(quota_data)

        # Fallback to mock data
        if not models:
            models = MockQuotaGenerator.get_mock_quota()

        self._models = models
        self._last_fetch = datetime.now()
        return models

    def get_current_status(self) -> Dict[str, Any]:
        """
        Get comprehensive quota status.

        Returns:
            Dict with models, pools, alerts, and formatted status.
        """
        if not self._models or self._is_cache_stale():
            self.get_local_quota()

        # Group models by pool
        pools: Dict[str, QuotaPool] = {}
        ungrouped: List[QuotaModel] = []

        for model in self._models:
            if model.pool_id:
                if model.pool_id not in pools:
                    pools[model.pool_id] = QuotaPool(
                        pool_id=model.pool_id,
                        pool_name=model.pool_id.replace("-", " ").title(),
                    )
                pools[model.pool_id].models.append(model)
            else:
                ungrouped.append(model)

        # Find models needing alerts
        warnings = [m for m in self._models if m.threshold_level == ThresholdLevel.WARNING]
        criticals = [m for m in self._models if m.threshold_level == ThresholdLevel.CRITICAL]

        # Find lowest quota model for status bar
        lowest = min(self._models, key=lambda m: m.remaining_percent) if self._models else None

        return {
            "models": [self._model_to_dict(m) for m in self._models],
            "pools": {k: self._pool_to_dict(v) for k, v in pools.items()},
            "ungrouped": [self._model_to_dict(m) for m in ungrouped],
            "alerts": {
                "warnings": [m.model_name for m in warnings],
                "criticals": [m.model_name for m in criticals],
            },
            "status_bar": lowest.format_status(StatusFormat.FULL) if lowest else "No data",
            "last_fetch": self._last_fetch.isoformat() if self._last_fetch else None,
        }

    def format_cli_output(self, format_type: str = "full") -> str:
        """
        Format quota status for CLI output.
        Delegates to QuotaFormatter.
        """
        status = self.get_current_status()
        return QuotaFormatter.format_cli_output(status, format_type)

    def _is_cache_stale(self, max_age_seconds: int = 120) -> bool:
        """Check if cached data is stale."""
        if not self._last_fetch:
            return True
        age = (datetime.now() - self._last_fetch).total_seconds()
        return age > max_age_seconds

    def _read_local_quota_file(self) -> Optional[Dict[str, Any]]:
        """Read quota from local cache file if exists."""
        # Kept for compatibility, though usually managed by cache logic
        cache_file = self.cache_dir / "current_quota.json"
        if cache_file.exists():
            try:
                with open(cache_file, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, OSError):
                pass
        return None

    def _model_to_dict(self, model: QuotaModel) -> Dict[str, Any]:
        """Convert QuotaModel to dictionary."""
        return {
            "id": model.model_id,
            "name": model.model_name,
            "remaining_percent": model.remaining_percent,
            "threshold_level": model.threshold_level.value,
            "countdown": model.countdown,
            "reset_time": model.reset_time_str,
            "status_emoji": model._get_status_emoji(),
            "status_full": model.format_status(StatusFormat.FULL),
            "pool_id": model.pool_id,
            "capabilities": model.capabilities,
            "context_window": model.context_window,
        }

    def _pool_to_dict(self, pool: QuotaPool) -> Dict[str, Any]:
        """Convert QuotaPool to dictionary."""
        return {
            "id": pool.pool_id,
            "name": pool.pool_name,
            "aggregate_remaining": pool.aggregate_remaining,
            "model_count": len(pool.models),
            "lowest_model": pool.lowest_model.model_name if pool.lowest_model else None,
        }
