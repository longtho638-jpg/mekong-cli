"""
Security Scanner Module.
"""
import hashlib
import logging
import re
import threading
from typing import Dict, List, Set

from .models import GuardianAction, SecurityThreat, ThreatLevel

logger = logging.getLogger(__name__)


class SecurityScanner:
    """Handles security scanning and threat detection."""

    # Security patterns to detect
    SECURITY_PATTERNS = {
        "sql_injection": r"(?i)(select|insert|update|delete|drop|union).*['\"].*['\"]",
        "xss": r"<script[^>]*>|javascript:|on\w+\s*=",
        "command_injection": r"(?i)(exec|eval|system|popen)\s*\(",
        "path_traversal": r"\.\./|\.\.\\",
        "sensitive_data": r"(?i)(password|secret|api[_-]?key|private[_-]?key)\s*=\s*['\"][^'\"]+['\"]",
        "hardcoded_ip": r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
    }

    def __init__(self):
        self.threats: Dict[str, SecurityThreat] = {}
        self._blocked_patterns: Set[str] = set()
        self._lock = threading.Lock()

        # Compile regex patterns
        self._compiled_patterns = {
            name: re.compile(pattern) for name, pattern in self.SECURITY_PATTERNS.items()
        }

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
        with self._lock:
            threats = list(self.threats.values())
        if level:
            threats = [t for t in threats if t.level == level]
        return sorted(threats, key=lambda t: t.level.value)
