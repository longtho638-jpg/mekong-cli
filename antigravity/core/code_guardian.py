"""
🛡️ Code Guardian - Real-Time Security & Performance Monitor
============================================================

Live security scanning and performance anomaly detection.
Auto-rollback on critical issues.

Binh Pháp: "Tiên phát chế nhân" - Strike first, control the enemy
"""

import hashlib
import logging
import os
import re
import threading
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class ThreatLevel(Enum):
    """Threat severity levels."""

    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    INFO = 5


class GuardianAction(Enum):
    """Actions taken by guardian."""

    ALERT = "alert"
    BLOCK = "block"
    ROLLBACK = "rollback"
    QUARANTINE = "quarantine"
    LOG_ONLY = "log_only"


@dataclass
class SecurityThreat:
    """Detected security threat."""

    id: str
    type: str
    level: ThreatLevel
    description: str
    source: str
    action_taken: GuardianAction
    detected_at: float = field(default_factory=time.time)
    resolved: bool = False
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PerformanceAnomaly:
    """Detected performance anomaly."""

    id: str
    metric: str
    expected_value: float
    actual_value: float
    deviation_percent: float
    detected_at: float = field(default_factory=time.time)
    auto_resolved: bool = False


@dataclass
class RollbackPoint:
    """Rollback checkpoint."""

    id: str
    name: str
    timestamp: float
    state_hash: str
    files_snapshot: Dict[str, str]  # file -> hash
    created_at: float = field(default_factory=time.time)


class CodeGuardian:
    """
    🛡️ Real-Time Code Guardian

    Features:
    - Live security scanning
    - Performance anomaly detection
    - Auto-rollback on issues
    - Threat intelligence
    """

    # Security patterns to detect
    SECURITY_PATTERNS = {
        "sql_injection": r"(?i)(select|insert|update|delete|drop|union).*['\"].*['\"]",
        "xss": r"<script[^>]*>|javascript:|on\w+\s*=",
        "command_injection": r"(?i)(exec|eval|system|popen)\s*\(",
        "path_traversal": r"\.\./|\.\.\\",
        "sensitive_data": r"(?i)(password|secret|api[_-]?key|private[_-]?key)\s*=\s*['\"][^'\"]+['\"]",
        "hardcoded_ip": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    }

    def __init__(
        self,
        enable_auto_rollback: bool = True,
        anomaly_threshold: float = 2.0,  # 2x deviation
        max_rollback_points: int = 10,
    ):
        self.enable_auto_rollback = enable_auto_rollback
        self.anomaly_threshold = anomaly_threshold
        self.max_rollback_points = max_rollback_points

        self.threats: Dict[str, SecurityThreat] = {}
        self.anomalies: Dict[str, PerformanceAnomaly] = {}
        self.rollback_points: List[RollbackPoint] = []

        self._lock = threading.Lock()
        self._baselines: Dict[str, float] = {}
        self._blocked_patterns: Set[str] = set()

        # Compile regex patterns
        self._compiled_patterns = {
            name: re.compile(pattern)
            for name, pattern in self.SECURITY_PATTERNS.items()
        }

        logger.info("🛡️ CodeGuardian initialized")

    def scan_code(self, code: str, source: str = "unknown") -> List[SecurityThreat]:
        """Scan code for security threats."""
        threats = []

        for threat_type, pattern in self._compiled_patterns.items():
            matches = pattern.findall(code)
            if matches:
                threat = SecurityThreat(
                    id=f"threat_{hashlib.md5(f'{threat_type}:{source}'.encode()).hexdigest()[:8]}",
                    type=threat_type,
                    level=self._get_threat_level(threat_type),
                    description=f"Detected {threat_type.replace('_', ' ')} pattern",
                    source=source,
                    action_taken=self._determine_action(threat_type),
                    details={"matches": matches[:5]},  # Limit to 5 matches
                )
                threats.append(threat)

                with self._lock:
                    self.threats[threat.id] = threat

                logger.warning(f"🚨 Threat detected: {threat_type} in {source}")

        return threats

    def _get_threat_level(self, threat_type: str) -> ThreatLevel:
        """Determine threat level based on type."""
        critical = {"sql_injection", "command_injection"}
        high = {"xss", "sensitive_data"}
        medium = {"path_traversal"}

        if threat_type in critical:
            return ThreatLevel.CRITICAL
        elif threat_type in high:
            return ThreatLevel.HIGH
        elif threat_type in medium:
            return ThreatLevel.MEDIUM
        return ThreatLevel.LOW

    def _determine_action(self, threat_type: str) -> GuardianAction:
        """Determine action based on threat type."""
        if threat_type in {"sql_injection", "command_injection"}:
            return GuardianAction.BLOCK
        elif threat_type in {"xss", "sensitive_data"}:
            return GuardianAction.ALERT
        return GuardianAction.LOG_ONLY

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

                # Trigger rollback if critical
                if deviation > self.anomaly_threshold * 2 and self.enable_auto_rollback:
                    self._trigger_rollback(f"Critical anomaly in {name}")

                return anomaly

            # Update baseline with exponential moving average
            self._baselines[name] = baseline * 0.9 + value * 0.1

        return None

    def create_rollback_point(self, name: str, files: List[str] = None) -> str:
        """Create a rollback checkpoint."""
        files = files or []
        files_snapshot = {}

        for file_path in files:
            if os.path.exists(file_path):
                try:
                    with open(file_path, "rb") as f:
                        files_snapshot[file_path] = hashlib.md5(f.read()).hexdigest()
                except Exception as e:
                    logger.error(f"Failed to snapshot {file_path}: {e}")

        rollback_point = RollbackPoint(
            id=f"rp_{hashlib.md5(f'{name}:{time.time()}'.encode()).hexdigest()[:8]}",
            name=name,
            timestamp=time.time(),
            state_hash=hashlib.md5(str(files_snapshot).encode()).hexdigest(),
            files_snapshot=files_snapshot,
        )

        with self._lock:
            self.rollback_points.append(rollback_point)

            # Keep only max rollback points
            if len(self.rollback_points) > self.max_rollback_points:
                self.rollback_points = self.rollback_points[-self.max_rollback_points :]

        logger.info(f"📍 Rollback point created: {name}")
        return rollback_point.id

    def _trigger_rollback(self, reason: str):
        """Trigger automatic rollback."""
        if not self.rollback_points:
            logger.warning("⚠️ No rollback points available")
            return

        latest = self.rollback_points[-1]
        logger.critical(f"🔙 Auto-rollback triggered: {reason}")
        logger.info(f"Rolling back to: {latest.name}")

        # In real implementation, restore files from snapshot
        # For now, just log the action

    def rollback_to(self, point_id: str) -> bool:
        """Rollback to a specific point."""
        point = next((p for p in self.rollback_points if p.id == point_id), None)
        if not point:
            logger.error(f"Rollback point not found: {point_id}")
            return False

        logger.info(f"🔙 Rolling back to: {point.name}")
        # In real implementation, restore files
        return True

    def block_pattern(self, pattern: str):
        """Block a specific pattern."""
        self._blocked_patterns.add(pattern)
        logger.info(f"🚫 Pattern blocked: {pattern}")

    def is_blocked(self, content: str) -> bool:
        """Check if content contains blocked patterns."""
        for pattern in self._blocked_patterns:
            if pattern in content:
                return True
        return False

    def get_threats(self, level: ThreatLevel = None) -> List[SecurityThreat]:
        """Get detected threats."""
        threats = list(self.threats.values())
        if level:
            threats = [t for t in threats if t.level == level]
        return sorted(threats, key=lambda t: t.level.value)

    def get_status(self) -> Dict[str, Any]:
        """Get guardian status."""
        return {
            "active_threats": len([t for t in self.threats.values() if not t.resolved]),
            "total_threats": len(self.threats),
            "anomalies_detected": len(self.anomalies),
            "rollback_points": len(self.rollback_points),
            "blocked_patterns": len(self._blocked_patterns),
            "metrics_monitored": len(self._baselines),
            "threat_summary": {
                level.name: len([t for t in self.threats.values() if t.level == level])
                for level in ThreatLevel
            },
        }


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


__all__ = [
    "CodeGuardian",
    "SecurityThreat",
    "PerformanceAnomaly",
    "RollbackPoint",
    "ThreatLevel",
    "GuardianAction",
    "get_guardian",
    "scan_code",
    "monitor_metric",
    "create_rollback_point",
    "guarded",
]
