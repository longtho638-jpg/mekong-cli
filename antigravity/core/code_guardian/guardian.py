"""
🛡️ Code Guardian Logic
======================

Live security scanning and performance anomaly detection.
Auto-rollback on critical issues.
"""

import logging
import time
from typing import Any, Callable, Dict, List, Optional

from .models import (
    PerformanceAnomaly,
    SecurityThreat,
    ThreatLevel,
)
from .monitor import PerformanceMonitor
from .rollback import RollbackManager
from .scanner import SecurityScanner

logger = logging.getLogger(__name__)


class CodeGuardian:
    """
    🛡️ Real-Time Code Guardian

    Features:
    - Live security scanning
    - Performance anomaly detection
    - Auto-rollback on issues
    - Threat intelligence
    """

    def __init__(
        self,
        enable_auto_rollback: bool = True,
        anomaly_threshold: float = 2.0,  # 2x deviation
        max_rollback_points: int = 10,
    ):
        self.enable_auto_rollback = enable_auto_rollback

        # Initialize components
        self.scanner = SecurityScanner()
        self.monitor = PerformanceMonitor(anomaly_threshold=anomaly_threshold)
        self.rollback_manager = RollbackManager(max_points=max_rollback_points)

        logger.info("🛡️ CodeGuardian initialized")

    def scan_code(self, code: str, source: str = "unknown") -> List[SecurityThreat]:
        """Scan code for security threats."""
        return self.scanner.scan_code(code, source)

    def monitor_metric(self, name: str, value: float) -> Optional[PerformanceAnomaly]:
        """Monitor a metric for anomalies."""
        anomaly = self.monitor.monitor_metric(name, value)

        if anomaly:
            # Trigger rollback if critical
            if anomaly.deviation_percent > (self.monitor.anomaly_threshold * 2 * 100) and self.enable_auto_rollback:
                self._trigger_rollback(f"Critical anomaly in {name}")

        return anomaly

    def create_rollback_point(self, name: str, files: List[str] = None) -> str:
        """Create a rollback checkpoint."""
        return self.rollback_manager.create_point(name, files)

    def _trigger_rollback(self, reason: str):
        """Trigger automatic rollback."""
        latest = self.rollback_manager.get_latest_point()

        if not latest:
            logger.warning("⚠️ No rollback points available")
            return

        logger.critical(f"🔙 Auto-rollback triggered: {reason}")

        # Perform rollback
        self.rollback_manager.rollback_to(latest.id)

    def rollback_to(self, point_id: str) -> bool:
        """Rollback to a specific point."""
        return self.rollback_manager.rollback_to(point_id)

    def block_pattern(self, pattern: str):
        """Block a specific pattern."""
        self.scanner.block_pattern(pattern)

    def is_blocked(self, content: str) -> bool:
        """Check if content contains blocked patterns."""
        return self.scanner.is_blocked(content)

    def get_threats(self, level: ThreatLevel = None) -> List[SecurityThreat]:
        """Get detected threats."""
        return self.scanner.get_threats(level)

    def get_status(self) -> Dict[str, Any]:
        """Get guardian status."""
        # Aggregate status from components
        threats = self.scanner.get_threats()

        return {
            "active_threats": len([t for t in threats if not t.resolved]),
            "total_threats": len(threats),
            "anomalies_detected": self.monitor.get_anomalies_count(),
            "rollback_points": self.rollback_manager.get_points_count(),
            "blocked_patterns": len(self.scanner._blocked_patterns),
            "metrics_monitored": self.monitor.get_metrics_count(),
            "threat_summary": {
                level.name: len([t for t in threats if t.level == level])
                for level in ThreatLevel
            },
        }

    # Expose rollback points for testing/inspection if needed
    @property
    def rollback_points(self):
        return self.rollback_manager.rollback_points


# Global instance
_guardian: Optional[CodeGuardian] = None


def get_guardian() -> CodeGuardian:
    """Get global code guardian instance."""
    global _guardian
    if _guardian is None:
        _guardian = CodeGuardian()
    return _guardian


# Convenience functions
def scan_code(code: str, source: str = "unknown") -> List[SecurityThreat]:
    """Scan code for security threats."""
    return get_guardian().scan_code(code, source)


def monitor_metric(name: str, value: float) -> Optional[PerformanceAnomaly]:
    """Monitor a metric for anomalies."""
    return get_guardian().monitor_metric(name, value)


def create_rollback_point(name: str, files: List[str] = None) -> str:
    """Create a rollback checkpoint."""
    return get_guardian().create_rollback_point(name, files)


# Decorator for protected functions
def guarded(name: str = None):
    """Decorator to protect a function with guardian."""

    def decorator(func: Callable):
        func_name = name or func.__name__

        def wrapper(*args, **kwargs):
            guardian = get_guardian()
            start = time.time()

            try:
                result = func(*args, **kwargs)

                # Monitor execution time
                execution_time = time.time() - start
                guardian.monitor_metric(f"{func_name}_execution_time", execution_time)

                return result
            except Exception as e:
                logger.error(f"🛡️ Guardian caught error in {func_name}: {e}")
                raise

        return wrapper

    return decorator
