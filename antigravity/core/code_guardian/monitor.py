"""
Performance Monitor Module.
"""
import logging
import threading
import time
from typing import Dict, Optional

from .models import PerformanceAnomaly

logger = logging.getLogger(__name__)


class PerformanceMonitor:
    """Handles performance monitoring and anomaly detection."""

    def __init__(self, anomaly_threshold: float = 2.0):
        self.anomaly_threshold = anomaly_threshold
        self.anomalies: Dict[str, PerformanceAnomaly] = {}
        self._baselines: Dict[str, float] = {}
        self._lock = threading.Lock()

    def monitor_metric(self, name: str, value: float) -> Optional[PerformanceAnomaly]:
        """Monitor a metric for anomalies."""
        with self._lock:
            if name not in self._baselines:
                self._baselines[name] = value
                return None

            baseline = self._baselines[name]
            if baseline == 0:
                return None

            deviation = abs(value - baseline) / baseline

            if deviation > self.anomaly_threshold:
                anomaly = PerformanceAnomaly(
                    id=f"anomaly_{name}_{int(time.time())}",
                    metric=name,
                    expected_value=baseline,
                    actual_value=value,
                    deviation_percent=deviation * 100,
                )
                self.anomalies[anomaly.id] = anomaly

                logger.warning(
                    f"📊 Performance anomaly: {name} is {deviation:.1%} off baseline"
                )

                return anomaly

            # Update baseline with exponential moving average
            self._baselines[name] = baseline * 0.9 + value * 0.1

        return None

    def get_anomalies_count(self) -> int:
        """Get count of detected anomalies."""
        with self._lock:
            return len(self.anomalies)

    def get_metrics_count(self) -> int:
        """Get count of monitored metrics."""
        with self._lock:
            return len(self._baselines)
