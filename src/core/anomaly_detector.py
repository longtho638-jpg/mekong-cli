"""Mekong CLI - Usage Anomaly Detection.

Statistical anomaly detection for usage patterns using Z-score analysis.
Detects spikes, drops, and pattern breaks in 7-day rolling baselines.
"""

from __future__ import annotations

import json
import logging
import math
import time
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class AnomalyType(str, Enum):
    """Types of usage anomalies."""

    SPIKE = "spike"  # Sudden increase (>3σ above mean)
    DROP = "drop"  # Sudden decrease (>3σ below mean)
    PATTERN_BREAK = "pattern_break"  # Behavioral pattern change


class AnomalyCategory(str, Enum):
    """Categories of metrics being monitored."""

    API_CALLS = "api_calls"
    AGENT_SPAWNS = "agent_spawns"
    MODEL_USAGE = "model_usage"
    LLM_CALLS = "llm_calls"
    TOKEN_USAGE = "token_usage"


@dataclass
class BaselineStats:
    """Statistical baseline for a metric over 7-day window."""

    metric: str
    mean: float = 0.0
    std_dev: float = 0.0
    sample_count: int = 0
    window_days: int = 7
    last_updated: float = field(default_factory=time.time)
    samples: list[float] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "metric": self.metric,
            "mean": self.mean,
            "std_dev": self.std_dev,
            "sample_count": self.sample_count,
            "window_days": self.window_days,
            "last_updated": self.last_updated,
            "samples": self.samples,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> BaselineStats:
        """Deserialize from dictionary."""
        return cls(
            metric=data.get("metric", ""),
            mean=data.get("mean", 0.0),
            std_dev=data.get("std_dev", 0.0),
            sample_count=data.get("sample_count", 0),
            window_days=data.get("window_days", 7),
            last_updated=data.get("last_updated", time.time()),
            samples=data.get("samples", []),
        )


@dataclass
class Anomaly:
    """Detected usage anomaly."""

    anomaly_type: AnomalyType
    category: AnomalyCategory
    metric: str
    current_value: float
    baseline_mean: float
    baseline_std_dev: float
    z_score: float
    severity: str  # "low", "medium", "high", "critical"
    timestamp: float = field(default_factory=time.time)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary for event emission."""
        return {
            "anomaly_type": self.anomaly_type.value,
            "category": self.category.value,
            "metric": self.metric,
            "current_value": self.current_value,
            "baseline_mean": self.baseline_mean,
            "baseline_std_dev": self.baseline_std_dev,
            "z_score": round(self.z_score, 2),
            "severity": self.severity,
            "timestamp": self.timestamp,
            "details": self.details,
        }

    def to_event_data(self) -> dict[str, Any]:
        """Format for usage:anomaly_detected event."""
        return {
            "type": self.anomaly_type.value,
            "category": self.category.value,
            "metric": self.metric,
            "current": self.current_value,
            "baseline_mean": round(self.baseline_mean, 2),
            "baseline_std": round(self.baseline_std_dev, 2),
            "z_score": round(self.z_score, 2),
            "severity": self.severity,
            "message": self._generate_message(),
        }

    def _generate_message(self) -> str:
        """Generate human-readable anomaly message."""
        type_desc = {
            AnomalyType.SPIKE: "Sudden increase detected",
            AnomalyType.DROP: "Sudden drop detected",
            AnomalyType.PATTERN_BREAK: "Pattern change detected",
        }
        return (
            f"{type_desc.get(self.anomaly_type, 'Anomaly')}: "
            f"{self.metric} = {self.current_value:.2f} "
            f"(baseline: {self.baseline_mean:.2f} ± {self.baseline_std_dev:.2f}, "
            f"z-score: {self.z_score:.2f})"
        )


class UsageAnomalyDetector:
    """Statistical anomaly detection for usage metrics.

    Uses rolling 7-day baseline calculation with Z-score detection.
    An anomaly is flagged when |z-score| > 3.0 (>3 standard deviations).

    Usage:
        detector = UsageAnomalyDetector()
        detector.record_metric("api_calls", 150)
        anomaly = detector.detect_anomaly("api_calls", 500)
        if anomaly:
            event_bus.emit(EventType.USAGE_ANOMALY_DETECTED, anomaly.to_event_data())
    """

    Z_SCORE_THRESHOLD = 3.0  # |z| > 3σ = anomaly
    MIN_SAMPLES = 3  # Minimum samples before detection works
    BASELINE_FILE = ".mekong/usage_baseline.json"
    MAX_SAMPLES = 168  # Max samples per metric (24 samples/day * 7 days)

    def __init__(self, baseline_file: str | None = None) -> None:
        """Initialize detector with baseline storage.

        Args:
            baseline_file: Path to baseline JSON file.
                          Defaults to .mekong/usage_baseline.json

        """
        self._baselines: dict[str, BaselineStats] = {}
        self._baseline_file = Path(baseline_file) if baseline_file else Path(self.BASELINE_FILE)
        self._load_baselines()

    def _load_baselines(self) -> None:
        """Load persisted baselines from disk."""
        if not self._baseline_file.exists():
            return

        try:
            data = json.loads(self._baseline_file.read_text())
            for metric, baseline_data in data.get("baselines", {}).items():
                self._baselines[metric] = BaselineStats.from_dict(baseline_data)
            logger.debug(f"Loaded {len(self._baselines)} baselines from {self._baseline_file}")
        except (json.JSONDecodeError, KeyError) as e:
            logger.warning(f"Failed to load baselines: {e}")

    def _save_baselines(self) -> None:
        """Persist baselines to disk."""
        self._baseline_file.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "version": 1,
            "last_updated": time.time(),
            "baselines": {
                metric: baseline.to_dict()
                for metric, baseline in self._baselines.items()
            },
        }
        self._baseline_file.write_text(json.dumps(data, indent=2))

    def record_metric(
        self,
        category: AnomalyCategory | str,
        metric: str,
        value: float,
    ) -> None:
        """Record a metric value and update rolling baseline.

        Args:
            category: Metric category (api_calls, agent_spawns, etc.)
            metric: Specific metric name (e.g., "hourly_calls", "daily_spawns")
            value: Current metric value

        """
        # Normalize category to string value
        category_str = category.value if isinstance(category, AnomalyCategory) else str(category)
        key = f"{category_str}:{metric}"
        timestamp = time.time()

        if key not in self._baselines:
            self._baselines[key] = BaselineStats(
                metric=key,
                window_days=7,
                last_updated=timestamp,
            )

        baseline = self._baselines[key]
        baseline.samples.append(value)

        # Trim to max samples (rolling window)
        if len(baseline.samples) > self.MAX_SAMPLES:
            baseline.samples = baseline.samples[-self.MAX_SAMPLES:]

        baseline.sample_count = len(baseline.samples)
        baseline.last_updated = timestamp

        # Recalculate statistics
        self._recalculate_stats(baseline)

        # Persist periodically (every 10 records)
        if baseline.sample_count % 10 == 0:
            self._save_baselines()

    def _recalculate_stats(self, baseline: BaselineStats) -> None:
        """Recalculate mean and standard deviation for baseline."""
        samples = baseline.samples
        if not samples:
            baseline.mean = 0.0
            baseline.std_dev = 0.0
            return

        n = len(samples)
        baseline.mean = sum(samples) / n

        if n < 2:
            baseline.std_dev = 0.0
            return

        # Sample standard deviation
        variance = sum((x - baseline.mean) ** 2 for x in samples) / (n - 1)
        baseline.std_dev = math.sqrt(variance)

    def detect_anomaly(
        self,
        category: AnomalyCategory | str,
        metric: str,
        current_value: float,
    ) -> Anomaly | None:
        """Detect if current value is anomalous compared to baseline.

        Args:
            category: Metric category
            metric: Specific metric name
            current_value: Current observed value

        Returns:
            Anomaly object if detected, None otherwise

        """
        # Normalize category to string value
        category_str = category.value if isinstance(category, AnomalyCategory) else str(category)
        key = f"{category_str}:{metric}"
        baseline = self._baselines.get(key)

        if baseline is None or baseline.sample_count < self.MIN_SAMPLES:
            return None

        # Calculate Z-score
        z_score = self._calculate_z_score(current_value, baseline.mean, baseline.std_dev)

        if abs(z_score) < self.Z_SCORE_THRESHOLD:
            return None

        # Determine anomaly type and severity
        anomaly_type = self._determine_anomaly_type(z_score)
        severity = self._calculate_severity(abs(z_score))

        # Normalize category for Anomaly object
        norm_category = category if isinstance(category, AnomalyCategory) else AnomalyCategory(category_str)

        anomaly = Anomaly(
            anomaly_type=anomaly_type,
            category=norm_category,
            metric=key,
            current_value=current_value,
            baseline_mean=baseline.mean,
            baseline_std_dev=baseline.std_dev,
            z_score=z_score,
            severity=severity,
            details={
                "sample_count": baseline.sample_count,
                "window_days": baseline.window_days,
            },
        )

        logger.info(f"Anomaly detected: {anomaly._generate_message()}")
        return anomaly

    def _calculate_z_score(
        self,
        value: float,
        mean: float,
        std_dev: float,
    ) -> float:
        """Calculate Z-score for a value against baseline.

        Z-score = (value - mean) / std_dev

        Returns:
            float: Number of standard deviations from mean

        """
        if std_dev == 0:
            return 0.0
        return (value - mean) / std_dev

    def _determine_anomaly_type(self, z_score: float) -> AnomalyType:
        """Determine anomaly type from Z-score."""
        if z_score > 0:
            return AnomalyType.SPIKE
        elif z_score < 0:
            return AnomalyType.DROP
        return AnomalyType.PATTERN_BREAK

    def _calculate_severity(self, abs_z_score: float) -> str:
        """Calculate severity level from absolute Z-score."""
        if abs_z_score >= 5.0:
            return "critical"
        elif abs_z_score >= 4.0:
            return "high"
        elif abs_z_score >= 3.5:
            return "medium"
        return "low"

    def get_baseline(self, category: str, metric: str) -> BaselineStats | None:
        """Get current baseline stats for a metric."""
        # Normalize category to string value
        category_str = category if isinstance(category, str) else category.value
        key = f"{category_str}:{metric}"
        return self._baselines.get(key)

    def get_all_baselines(self) -> dict[str, BaselineStats]:
        """Get all tracked baselines."""
        return self._baselines.copy()

    def reset_baseline(self, category: str, metric: str) -> None:
        """Reset baseline for a specific metric."""
        category_str = category if isinstance(category, str) else category.value
        key = f"{category_str}:{metric}"
        if key in self._baselines:
            del self._baselines[key]
            self._save_baselines()

    def reset_all_baselines(self) -> None:
        """Reset all baselines (useful for testing)."""
        self._baselines.clear()
        if self._baseline_file.exists():
            self._baseline_file.unlink()


# Singleton instance
_detector: UsageAnomalyDetector | None = None


def get_detector(baseline_file: str | None = None) -> UsageAnomalyDetector:
    """Get or create the singleton anomaly detector."""
    global _detector
    if _detector is None:
        _detector = UsageAnomalyDetector(baseline_file)
    return _detector


def reset_detector() -> None:
    """Reset singleton detector (for testing)."""
    global _detector
    _detector = None


__all__ = [
    "Anomaly",
    "AnomalyCategory",
    "AnomalyType",
    "BaselineStats",
    "UsageAnomalyDetector",
    "get_detector",
    "reset_detector",
]
