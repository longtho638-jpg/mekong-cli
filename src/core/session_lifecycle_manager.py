"""Mekong CLI - Session Lifecycle Manager.

Maps Electron's session lifecycle to CLI execution sessions.
Manages creation, state transitions, persistence, and cleanup of sessions
across Plan-Execute-Verify runs. Thread-safe via threading.Lock.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from threading import Lock
from typing import Any


class SessionState(str, Enum):
    """Lifecycle states a session can occupy."""

    CREATED = "created"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"


# Valid state machine transitions
_TRANSITIONS: dict[SessionState, list[SessionState]] = {
    SessionState.CREATED:   [SessionState.ACTIVE, SessionState.EXPIRED],
    SessionState.ACTIVE:    [SessionState.PAUSED, SessionState.COMPLETED,
                             SessionState.FAILED, SessionState.EXPIRED],
    SessionState.PAUSED:    [SessionState.ACTIVE, SessionState.FAILED, SessionState.EXPIRED],
    SessionState.COMPLETED: [SessionState.EXPIRED],
    SessionState.FAILED:    [SessionState.EXPIRED],
    SessionState.EXPIRED:   [],
}


@dataclass
class Session:
    """A single CLI execution session with full lifecycle tracking."""

    session_id: str
    state: SessionState
    created_at: float
    updated_at: float
    metadata: dict[str, Any] = field(default_factory=dict)
    history: list[dict[str, Any]] = field(default_factory=list)

    def _record_event(self, event: str, extra: dict[str, Any] | None = None) -> None:
        """Append a timestamped event entry to session history."""
        entry: dict[str, Any] = {"event": event, "timestamp": time.time()}
        if extra:
            entry.update(extra)
        self.history.append(entry)


class SessionManager:
    """Manages CLI execution sessions with state machine enforcement.

    Inspired by Electron's session lifecycle. Supports create, transition,
    persist, restore, and cleanup. Thread-safe via Lock.

    Example::

        mgr = SessionManager()
        s = mgr.create(metadata={"goal": "clean logs"})
        mgr.transition(s.session_id, SessionState.ACTIVE)
        mgr.persist(s.session_id, Path("/tmp/session.json"))
    """

    def __init__(self) -> None:
        """Initialise an empty session store."""
        self._sessions: dict[str, Session] = {}
        self._lock = Lock()

    def create(self, metadata: dict[str, Any] | None = None) -> Session:
        """Create a new session in CREATED state and register it."""
        now = time.time()
        session = Session(
            session_id=str(uuid.uuid4()),
            state=SessionState.CREATED,
            created_at=now,
            updated_at=now,
            metadata=metadata or {},
        )
        session._record_event("created")
        with self._lock:
            self._sessions[session.session_id] = session
        return session

    def get(self, session_id: str) -> Session | None:
        """Return session by ID, or None if not found."""
        with self._lock:
            return self._sessions.get(session_id)

    def transition(self, session_id: str, new_state: SessionState) -> Session:
        """Move a session to new_state, enforcing the state machine.

        Raises:
            KeyError: If session_id does not exist.
            ValueError: If the transition is not permitted.

        """
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                msg = f"Session '{session_id}' not found"
                raise KeyError(msg)
            allowed = _TRANSITIONS.get(session.state, [])
            if new_state not in allowed:
                msg = (
                    f"Invalid transition {session.state.value!r} → {new_state.value!r}. "
                    f"Allowed: {[s.value for s in allowed]}"
                )
                raise ValueError(
                    msg,
                )
            old_state = session.state
            session.state = new_state
            session.updated_at = time.time()
            session._record_event("transition", {"from": old_state.value, "to": new_state.value})
        return session

    def list_active(self) -> list[Session]:
        """Return all sessions in ACTIVE or PAUSED state."""
        with self._lock:
            return [s for s in self._sessions.values()
                    if s.state in (SessionState.ACTIVE, SessionState.PAUSED)]

    def cleanup(self, max_age_seconds: float = 3600.0) -> int:
        """Remove sessions older than max_age_seconds or in terminal states.

        Returns:
            Number of sessions removed.

        """
        cutoff = time.time() - max_age_seconds
        terminal = {SessionState.COMPLETED, SessionState.FAILED, SessionState.EXPIRED}
        with self._lock:
            to_remove = [
                sid for sid, s in self._sessions.items()
                if s.updated_at < cutoff or s.state in terminal
            ]
            for sid in to_remove:
                del self._sessions[sid]
        return len(to_remove)

    def persist(self, session_id: str, filepath: Path) -> None:
        """Serialise a session to a JSON file.

        Raises:
            KeyError: If session_id does not exist.

        """
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                msg = f"Session '{session_id}' not found"
                raise KeyError(msg)
            data = asdict(session)
            data["state"] = session.state.value
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)

    def restore(self, filepath: Path) -> Session:
        """Load a session from a JSON file and register it in the store.

        Raises:
            FileNotFoundError: If filepath does not exist.
            ValueError: If the JSON contains an invalid state value.

        """
        with open(filepath, encoding="utf-8") as fh:
            data = json.load(fh)
        data["state"] = SessionState(data["state"])
        session = Session(**data)
        with self._lock:
            self._sessions[session.session_id] = session
        return session
