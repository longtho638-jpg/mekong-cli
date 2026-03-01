"""
Mekong CLI - Crash Reporter

Electron's crashReporter mapped to CLI crash capture + recovery.
Captures exceptions, persists structured JSON crash reports, and
suggests recovery actions via error pattern matching.
"""

import json
import platform
import sys
import traceback
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional


class CrashSeverity(Enum):
    """Severity levels for crash reports, lowest to highest impact."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CrashReport:
    """Structured crash report capturing full context of an exception."""

    crash_id: str
    timestamp: str
    severity: CrashSeverity
    error_type: str
    error_message: str
    traceback_str: str
    context: Dict[str, Any]
    system_info: Dict[str, str]
    recovery_attempted: bool = False


# Maps exception type name → (severity, recovery suggestion)
_ERROR_PATTERNS: Dict[str, tuple] = {
    "KeyboardInterrupt": (CrashSeverity.LOW, "User interrupted. Safe to restart with the same command."),
    "FileNotFoundError": (CrashSeverity.MEDIUM, "Required file missing. Check paths and re-run `mekong init`."),
    "PermissionError": (CrashSeverity.MEDIUM, "Insufficient permissions. Check file ownership or run with elevated privileges."),
    "ValueError": (CrashSeverity.MEDIUM, "Invalid input. Review arguments and configuration values."),
    "KeyError": (CrashSeverity.MEDIUM, "Missing key in data structure. Check config or recipe file format."),
    "ConnectionError": (CrashSeverity.HIGH, "Network failed. Verify internet access and proxy settings (port 9191)."),
    "TimeoutError": (CrashSeverity.HIGH, "Operation timed out. Check network stability and increase timeout limits."),
    "MemoryError": (CrashSeverity.CRITICAL, "Out of memory. Free system resources or reduce batch size."),
    "RecursionError": (CrashSeverity.CRITICAL, "Infinite recursion. Check for circular dependencies in recipe definitions."),
}

_DEFAULT = (CrashSeverity.CRITICAL, "Unknown error. Check .mekong/crashes/ and open a GitHub issue.")


def _system_info() -> Dict[str, str]:
    """Collect current system metadata for diagnostic context."""
    return {
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "os": platform.system(),
        "arch": platform.machine(),
        "mekong_version": "2.2.0",
    }


class CrashReporter:
    """Captures, persists, and suggests recovery for CLI crash events.

    Inspired by Electron's crashReporter API, adapted for Python CLI contexts.
    """

    def capture(
        self,
        exception: Exception,
        context: Optional[Dict[str, Any]] = None,
        severity: Optional[CrashSeverity] = None,
    ) -> CrashReport:
        """Capture an exception → CrashReport. Auto-detects severity from exception type."""
        error_type = type(exception).__name__
        auto_severity, _ = _ERROR_PATTERNS.get(error_type, _DEFAULT)
        return CrashReport(
            crash_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow().isoformat() + "Z",
            severity=severity if severity is not None else auto_severity,
            error_type=error_type,
            error_message=str(exception),
            traceback_str=traceback.format_exc(),
            context=context or {},
            system_info=_system_info(),
        )

    def save(self, report: CrashReport, directory: str = ".mekong/crashes") -> Path:
        """Persist CrashReport to disk as JSON. Returns path to written file."""
        crash_dir = Path(directory)
        crash_dir.mkdir(parents=True, exist_ok=True)
        crash_path = crash_dir / f"crash-{report.timestamp[:10]}-{report.crash_id[:8]}.json"
        payload = asdict(report)
        payload["severity"] = report.severity.value
        crash_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        return crash_path

    def list_crashes(self, directory: str = ".mekong/crashes", limit: int = 10) -> List[Path]:
        """List recent crash JSON files newest-first. Returns up to `limit` paths."""
        crash_dir = Path(directory)
        if not crash_dir.exists():
            return []
        files = sorted(crash_dir.glob("crash-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        return files[:limit]

    def suggest_recovery(self, report: CrashReport) -> str:
        """Return human-readable recovery suggestion matched to the error type."""
        _, suggestion = _ERROR_PATTERNS.get(report.error_type, _DEFAULT)
        return suggestion


__all__ = ["CrashSeverity", "CrashReport", "CrashReporter"]
