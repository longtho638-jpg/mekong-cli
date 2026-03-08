"""
Telemetry Collector — Usage Event Collection

Collects anonymized usage events:
- command_executed
- session_started
- session_ended
- error_occurred

Reference: plans/260307-1602-telemetry-consent-opt-in/plan.md
"""

import atexit
import hashlib
import json
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from .telemetry_consent import ConsentManager


@dataclass
class TelemetryEvent:
    """Telemetry event."""

    event_type: str
    anonymous_id: str
    timestamp: str
    session_id: str
    properties: Dict[str, Any] = field(default_factory=dict)
    cli_version: str = "3.0.0"

    def to_dict(self) -> dict:
        return asdict(self)


class TelemetryCollector:
    """
    Collect anonymized usage telemetry.

    Events are buffered and uploaded in batches.
    """

    def __init__(self, consent_manager: Optional[ConsentManager] = None):
        self._consent_manager = consent_manager or ConsentManager()
        self._buffer: List[TelemetryEvent] = []
        self._session_id: Optional[str] = None
        self._session_start: Optional[float] = None
        self._commands_count = 0
        self._max_buffer_size = 50
        self._storage_file = Path.home() / ".mekong" / "telemetry-buffer.json"
        self._initialized = False

        atexit.register(self._flush_on_exit)

    def _ensure_anonymous_id(self) -> Optional[str]:
        """Get anonymous ID (only if consent given)."""
        if not self._consent_manager.has_consent():
            return None
        return self._consent_manager.get_anonymous_id()

    def _get_session_id(self) -> str:
        """Get or create session ID."""
        if not self._session_id:
            self._session_id = str(uuid.uuid4())
        return self._session_id

    def _hash_error(self, error_message: str) -> str:
        """Hash error message for anonymization."""
        return hashlib.sha256(error_message.encode()).hexdigest()[:16]

    def _get_python_version(self) -> str:
        """Get Python version string."""
        try:
            import sys
            return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        except Exception as e:
            import logging
            logging.debug(f"Failed to get Python version: {e}")
            return "unknown"

    def _get_os_info(self) -> str:
        """Get OS information."""
        try:
            import platform
            return platform.system()
        except Exception as e:
            import logging
            logging.debug(f"Failed to get OS info: {e}")
            return "unknown"

    def session_start(self) -> None:
        """Record session start event."""
        if self._initialized:
            return

        anonymous_id = self._ensure_anonymous_id()
        if not anonymous_id:
            self._initialized = True
            return

        self._session_start = time.time()

        event = TelemetryEvent(
            event_type="session_started",
            anonymous_id=anonymous_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=self._get_session_id(),
            properties={
                "cli_version": "3.0.0",
                "python_version": self._get_python_version(),
                "os": self._get_os_info(),
            },
        )
        self._buffer.append(event)
        self._initialized = True

    def command_executed(
        self,
        command_name: str,
        duration_ms: int,
        exit_code: int,
        error_type: Optional[str] = None,
    ) -> None:
        """Record command execution event."""
        if not self._initialized:
            self.session_start()

        anonymous_id = self._ensure_anonymous_id()
        if not anonymous_id:
            return

        self._commands_count += 1

        properties = {
            "command": command_name,
            "duration_ms": duration_ms,
            "exit_code": exit_code,
            "success": exit_code == 0,
        }

        if error_type:
            properties["error_type_hash"] = self._hash_error(error_type)

        event = TelemetryEvent(
            event_type="command_executed",
            anonymous_id=anonymous_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=self._get_session_id(),
            properties=properties,
        )
        self._buffer.append(event)
        self._check_buffer()

    def error_occurred(
        self,
        error_type: str,
        error_message: str,
        command_name: Optional[str] = None,
    ) -> None:
        """Record error event."""
        anonymous_id = self._ensure_anonymous_id()
        if not anonymous_id:
            return

        event = TelemetryEvent(
            event_type="error_occurred",
            anonymous_id=anonymous_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=self._get_session_id(),
            properties={
                "error_type": error_type,
                "error_message_hash": self._hash_error(error_message),
                "command": command_name,
            },
        )
        self._buffer.append(event)
        self._check_buffer()

    def session_end(self) -> None:
        """Record session end event."""
        anonymous_id = self._ensure_anonymous_id()
        if not anonymous_id:
            return

        duration_ms = 0
        if self._session_start:
            duration_ms = int((time.time() - self._session_start) * 1000)

        event = TelemetryEvent(
            event_type="session_ended",
            anonymous_id=anonymous_id,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=self._get_session_id(),
            properties={
                "duration_ms": duration_ms,
                "commands_count": self._commands_count,
            },
        )
        self._buffer.append(event)

    def _check_buffer(self) -> None:
        """Check if buffer needs upload."""
        if len(self._buffer) >= self._max_buffer_size:
            self._flush()

    def _flush(self) -> None:
        """Flush buffer to storage."""
        if not self._buffer:
            return

        self._storage_file.parent.mkdir(parents=True, exist_ok=True)

        existing = []
        if self._storage_file.exists():
            try:
                with open(self._storage_file, "r") as f:
                    existing = json.load(f)
            except json.JSONDecodeError:
                existing = []

        existing.extend([e.to_dict() for e in self._buffer])

        with open(self._storage_file, "w") as f:
            json.dump(existing, f, indent=2)

        self._buffer = []

    def _flush_on_exit(self) -> None:
        """Flush on program exit."""
        self.session_end()
        self._flush()

    def get_pending_events(self) -> List[dict]:
        """Get pending events from storage."""
        if not self._storage_file.exists():
            return []

        try:
            with open(self._storage_file, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def clear_buffer(self) -> None:
        """Clear local buffer."""
        if self._storage_file.exists():
            self._storage_file.unlink()


_collector: Optional[TelemetryCollector] = None


def get_collector() -> TelemetryCollector:
    """Get singleton TelemetryCollector instance."""
    global _collector
    if _collector is None:
        _collector = TelemetryCollector()
    return _collector


def track_command(
    command_name: str,
    duration_ms: int = 0,
    exit_code: int = 0,
    error_type: Optional[str] = None,
) -> None:
    """Track command execution (convenience function)."""
    collector = get_collector()
    collector.command_executed(command_name, duration_ms, exit_code, error_type)


def track_error(
    error_type: str,
    error_message: str,
    command_name: Optional[str] = None,
) -> None:
    """Track error event (convenience function)."""
    collector = get_collector()
    collector.error_occurred(error_type, error_message, command_name)
