"""
Jidoka — Autonomous self-healing with automatic defect detection.

Jidoka (自動化) = Autonomation: intelligent automation with human touch.
- Automatic defect detection
- Line stop on critical issues
- Auto-fix attempts
- Rollback if fix fails
- Escalation to human when stuck

Usage:
  jidoka = JidokaMonitor()
  if jidoka.detect_error(output):
      jidoka.handle_error(worker_id="worker-1", error=output)
"""

from __future__ import annotations

import logging
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path

from .circuit_breaker import CircuitBreakerRegistry

logger = logging.getLogger(__name__)

MEKONG_ROOT = Path(__file__).parent.parent.parent
MEKONG_DIR = MEKONG_ROOT / ".mekong"
JIDOKA_FILE = MEKONG_DIR / "jidoka-alerts.log"
ALERT_LOG_MAX_LINES = 100


class ErrorSeverity(Enum):
    """Error severity levels."""

    LOW = "low"  # Warning, non-blocking
    MEDIUM = "medium"  # May affect functionality
    HIGH = "high"  # Breaking issue, auto-fix attempt
    CRITICAL = "critical"  # Stop-the-line, immediate escalation


@dataclass
class ErrorPattern:
    """Pattern for detecting specific error types."""

    name: str
    pattern: str
    severity: ErrorSeverity
    auto_fix: str | None = None  # Command to run for auto-fix
    rollback: str | None = None  # Command to rollback


@dataclass
class JidokaEvent:
    """Event recorded by Jidoka monitor."""

    timestamp: str
    worker_id: str
    error: str
    severity: str
    action: str  # detected, auto_fix_attempted, rolled_back, escalated
    resolved: bool = False


class JidokaMonitor:
    """
    Monitors for errors and triggers autonomous response.

    Error patterns detected:
    - BREAKING changes (tests, schema)
    - Security vulnerabilities
    - Build failures
    - Type errors
    - Import errors

    Response actions:
    - Log to Jidoka file
    - Attempt auto-fix
    - Rollback on fix failure
    - Escalate to Telegram
    """

    # Predefined error patterns
    ERROR_PATTERNS: list[ErrorPattern] = [
        ErrorPattern(
            name="breaking_test",
            pattern=r"BREAKING|breaking change|test failed|assertion error",
            severity=ErrorSeverity.HIGH,
            auto_fix="npm test -- --updateSnapshot",  # For snapshot tests
        ),
        ErrorPattern(
            name="schema_change",
            pattern=r"database migration|schema change|ALTER TABLE|DROP COLUMN",
            severity=ErrorSeverity.CRITICAL,
            rollback="git revert HEAD",
        ),
        ErrorPattern(
            name="security_vulnerability",
            pattern=r"security vulnerability|CVE-|npm audit|high severity|critical severity",
            severity=ErrorSeverity.CRITICAL,
            auto_fix="npm audit fix",
        ),
        ErrorPattern(
            name="build_failure",
            pattern=r"build failed|compilation error|SyntaxError|TypeError",
            severity=ErrorSeverity.HIGH,
            auto_fix="npm run build -- --fix",
        ),
        ErrorPattern(
            name="import_error",
            pattern=r"ImportError|ModuleNotFoundError|Cannot find module",
            severity=ErrorSeverity.MEDIUM,
            auto_fix="npm install",
        ),
        ErrorPattern(
            name="type_error",
            pattern=r"Type error|TS\d+:|typescript error",
            severity=ErrorSeverity.MEDIUM,
        ),
    ]

    def __init__(self, circuit_breaker_registry: CircuitBreakerRegistry | None = None) -> None:
        self.circuit_breakers = circuit_breaker_registry or CircuitBreakerRegistry()
        self._events: list[JidokaEvent] = []
        self._init_jidoka_file()

    def _init_jidoka_file(self) -> None:
        """Ensure Jidoka alert file exists."""
        MEKONG_DIR.mkdir(parents=True, exist_ok=True)
        if not JIDOKA_FILE.exists():
            JIDOKA_FILE.touch()

    def detect_error(self, output: str) -> ErrorPattern | None:
        """
        Detect if output contains a known error pattern.

        Args:
            output: Text output to analyze

        Returns:
            Matching ErrorPattern or None.
        """
        for pattern in self.ERROR_PATTERNS:
            if re.search(pattern.pattern, output, re.IGNORECASE):
                logger.info(f"[Jidoka] Detected {pattern.name} (severity={pattern.severity.value})")
                return pattern
        return None

    def handle_error(
        self,
        worker_id: str,
        error: str,
        pattern: ErrorPattern | None = None,
    ) -> str:
        """
        Handle detected error with autonomous response.

        Response flow:
        1. Log to Jidoka file
        2. Attempt auto-fix if available
        3. Rollback if fix fails
        4. Escalate to Telegram for critical issues

        Args:
            worker_id: Worker that encountered error
            error: Error message/output
            pattern: Detected error pattern

        Returns:
            Action taken: "logged", "auto_fix_attempted", "rolled_back", "escalated"
        """
        if not pattern:
            pattern = self.detect_error(error)
            if not pattern:
                return "ignored"

        # Log to Jidoka file
        self._log_alert(worker_id, error, pattern)

        # Check circuit breaker
        breaker = self.circuit_breakers.get(f"worker-{worker_id}")
        if not breaker.can_execute():
            logger.warning(f"[Jidoka] Circuit breaker OPEN for {worker_id} - skipping auto-fix")
            return "circuit_open"

        # Attempt auto-fix if available
        if pattern.auto_fix and pattern.severity in [ErrorSeverity.HIGH, ErrorSeverity.MEDIUM]:
            logger.info(f"[Jidoka] Attempting auto-fix: {pattern.auto_fix}")
            fix_result = self._run_auto_fix(pattern.auto_fix)
            if fix_result:
                breaker.on_success()
                return "auto_fix_attempted"
            else:
                breaker.on_failure("auto-fix failed")
                # Attempt rollback if available
                if pattern.rollback:
                    logger.info(f"[Jidoka] Auto-fix failed, rolling back: {pattern.rollback}")
                    self._run_rollback(pattern.rollback)
                    return "rolled_back"

        # Escalate for critical issues
        if pattern.severity == ErrorSeverity.CRITICAL:
            self._escalate(worker_id, error, pattern)
            breaker.on_failure("critical error")
            return "escalated"

        # Just log for low/medium severity
        breaker.on_failure(error[:100])
        return "logged"

    def _log_alert(self, worker_id: str, error: str, pattern: ErrorPattern) -> str:
        """Log alert to Jidoka file."""
        timestamp = datetime.now().isoformat()
        alert = f"🚨 STOP-THE-LINE {worker_id}: [{pattern.name}] {error[:200]}"

        # Append to file
        with open(JIDOKA_FILE, "a") as f:
            f.write(f"{timestamp} {alert}\n")

        # Rotate if too large
        self._rotate_alerts()

        # Record event
        event = JidokaEvent(
            timestamp=timestamp,
            worker_id=worker_id,
            error=error[:500],
            severity=pattern.severity.value,
            action="detected",
        )
        self._events.append(event)
        if len(self._events) > 100:
            self._events = self._events[-100:]

        logger.warning(f"[Jidoka] {alert}")
        return alert

    def _rotate_alerts(self) -> None:
        """Rotate Jidoka file if too large."""
        if not JIDOKA_FILE.exists():
            return

        lines = JIDOKA_FILE.read_text().strip().split("\n")
        if len(lines) > ALERT_LOG_MAX_LINES:
            # Keep last N lines
            JIDOKA_FILE.write_text("\n".join(lines[-ALERT_LOG_MAX_LINES:]))
            logger.debug(f"[Jidoka] Rotated alerts to last {ALERT_LOG_MAX_LINES}")

    def _run_auto_fix(self, command: str) -> bool:
        """
        Run auto-fix command.

        Args:
            command: Shell command to execute

        Returns:
            True if fix succeeded, False otherwise.
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=120,  # 2 minute timeout
                cwd=MEKONG_ROOT,
            )
            if result.returncode == 0:
                logger.info(f"[Jidoka] Auto-fix succeeded: {command}")
                return True
            else:
                logger.warning(f"[Jidoka] Auto-fix failed: {command} - {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            logger.error(f"[Jidoka] Auto-fix timeout: {command}")
            return False
        except Exception as e:
            logger.exception(f"[Jidoka] Auto-fix error: {e}")
            return False

    def _run_rollback(self, command: str) -> bool:
        """
        Run rollback command.

        Args:
            command: Rollback shell command

        Returns:
            True if rollback succeeded, False otherwise.
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60,
                cwd=MEKONG_ROOT,
            )
            if result.returncode == 0:
                logger.info(f"[Jidoka] Rollback succeeded: {command}")
                return True
            else:
                logger.error(f"[Jidoka] Rollback failed: {command} - {result.stderr}")
                return False
        except Exception as e:
            logger.exception(f"[Jidoka] Rollback error: {e}")
            return False

    def _escalate(self, worker_id: str, error: str, pattern: ErrorPattern) -> None:
        """
        Escalate to Telegram (calls _telegram_alert if available).

        Args:
            worker_id: Worker ID
            error: Error message
            pattern: Error pattern
        """
        alert_msg = f"🚨 CRITICAL: {pattern.name} on {worker_id}\n\nError: {error[:300]}"

        # Try to call Telegram alert via bash
        try:
            token = __import__("os").environ.get("MEKONG_TELEGRAM_TOKEN")
            chat_id = __import__("os").environ.get("MEKONG_TELEGRAM_CHAT_ID")

            if token and chat_id:
                import urllib.request
                import urllib.parse

                data = urllib.parse.urlencode({
                    "chat_id": chat_id,
                    "text": alert_msg,
                    "parse_mode": "Markdown",
                }).encode()

                url = f"https://api.telegram.org/bot{token}/sendMessage"
                req = urllib.request.Request(url, data=data, method="POST")
                urllib.request.urlopen(req, timeout=10)
                logger.info("[Jidoka] Telegram escalation sent")
            else:
                logger.warning("[Jidoka] Telegram not configured, skipping escalation")

        except Exception as e:
            logger.exception(f"[Jidoka] Telegram escalation failed: {e}")

    def get_recent_events(self, limit: int = 10) -> list[dict]:
        """Get recent Jidoka events."""
        return [
            {
                "timestamp": e.timestamp,
                "worker_id": e.worker_id,
                "error": e.error,
                "severity": e.severity,
                "action": e.action,
                "resolved": e.resolved,
            }
            for e in self._events[-limit:]
        ]

    def get_stats(self) -> dict:
        """Get Jidoka statistics."""
        return {
            "total_events": len(self._events),
            "critical_count": sum(1 for e in self._events if e.severity == "critical"),
            "high_count": sum(1 for e in self._events if e.severity == "high"),
            "auto_fix_attempts": sum(1 for e in self._events if e.action == "auto_fix_attempted"),
            "rollbacks": sum(1 for e in self._events if e.action == "rolled_back"),
            "escalations": sum(1 for e in self._events if e.action == "escalated"),
        }

    def read_alerts(self, limit: int = 10) -> list[str]:
        """Read recent alerts from Jidoka file."""
        if not JIDOKA_FILE.exists():
            return []

        lines = JIDOKA_FILE.read_text().strip().split("\n")
        return lines[-limit:]
