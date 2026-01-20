"""
StatsMixin - Standardized statistics interface for Antigravity engines.

Provides a common pattern for collecting and returning engine telemetry.
Classes using this mixin implement _collect_stats() for their specific metrics.
"""

import time
from abc import abstractmethod
from typing import Dict


class StatsMixin:
    """
    Mixin providing standardized stats interface.

    Classes using this mixin must implement _collect_stats() to provide
    their module-specific statistics. The get_stats() method automatically
    adds common metadata (timestamp, module name).

    Example:
        class MyEngine(StatsMixin):
            def _collect_stats(self) -> Dict[str, object]:
                return {"my_metric": 42}
    """

    @abstractmethod
    def _collect_stats(self) -> Dict[str, object]:
        """Override to provide module-specific stats."""
        ...

    def get_stats(self) -> Dict[str, object]:
        """
        Standard stats interface.

        Returns module-specific stats with common metadata:
        - timestamp: Current Unix timestamp
        - module: Class name of the implementing engine
        """
        base: Dict[str, object] = {
            "timestamp": time.time(),
            "module": self.__class__.__name__,
        }
        base.update(self._collect_stats())
        return base
