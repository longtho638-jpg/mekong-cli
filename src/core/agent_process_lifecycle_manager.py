"""
Mekong CLI - Agent Process Lifecycle Manager

Electron's main process lifecycle mapped to CLI agent process management.
Tracks spawn/kill/crash/restart with EventBus integration.
Enforces M1 16GB concurrency cap (default: 5 simultaneous agents).
"""

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from .event_bus import EventBus, EventType, get_event_bus


class ProcessState(str, Enum):
    """Agent lifecycle states: IDLE → SPAWNING → RUNNING → STOPPING → IDLE|CRASHED."""
    IDLE = "idle"
    SPAWNING = "spawning"
    RUNNING = "running"
    STOPPING = "stopping"
    CRASHED = "crashed"


@dataclass
class AgentProcess:
    """Metadata record for a managed agent process (agent_id, type, state, pid, metadata)."""
    agent_id: str
    agent_type: str
    state: ProcessState
    pid: Optional[int] = None
    started_at: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


CrashCallback = Callable[[str], None]  # (agent_id) -> None


class ProcessManager:
    """Lifecycle manager for agent processes (mirrors Electron main process).

    spawn/kill/restart track agent state. report_crash fires callbacks.
    Concurrency cap protects M1 16GB from overload.
    """

    def __init__(
        self,
        max_concurrent: int = 5,
        shutdown_timeout: float = 5.0,
        event_bus: Optional[EventBus] = None,
    ) -> None:
        """Args:
            max_concurrent: Max simultaneous RUNNING agents (default 5 for M1 16GB).
            shutdown_timeout: Seconds to wait for graceful shutdown.
            event_bus: Falls back to shared singleton if None.
        """
        self._processes: Dict[str, AgentProcess] = {}
        self._crash_callbacks: Dict[str, List[CrashCallback]] = {}
        self._spawn_configs: Dict[str, Dict[str, Any]] = {}
        self.max_concurrent = max_concurrent
        self.shutdown_timeout = shutdown_timeout
        self._bus: EventBus = event_bus or get_event_bus()

    def spawn(self, agent_type: str, config: Optional[Dict[str, Any]] = None) -> AgentProcess:
        """Register and start a new agent. Returns AgentProcess in RUNNING state.

        Raises:
            RuntimeError: Concurrency cap already reached.
        """
        if self.running_count >= self.max_concurrent:
            raise RuntimeError(
                f"Max concurrent agents reached ({self.max_concurrent}). "
                "Kill an agent before spawning another."
            )
        agent_id = uuid.uuid4().hex[:12]
        cfg = config or {}
        process = AgentProcess(
            agent_id=agent_id,
            agent_type=agent_type,
            state=ProcessState.SPAWNING,
            metadata=dict(cfg),
        )
        self._processes[agent_id] = process
        self._spawn_configs[agent_id] = cfg
        process.state = ProcessState.RUNNING
        self._bus.emit(EventType.JOB_STARTED, {"agent_id": agent_id, "agent_type": agent_type})
        return process

    def kill(self, agent_id: str) -> bool:
        """Gracefully stop an agent. Returns True if found, False if unknown."""
        process = self._processes.get(agent_id)
        if process is None:
            return False
        process.state = ProcessState.STOPPING
        # Extend for subprocess.Popen: SIGTERM → wait(timeout) → SIGKILL
        process.state = ProcessState.IDLE
        self._bus.emit(EventType.JOB_COMPLETED, {
            "agent_id": agent_id,
            "agent_type": process.agent_type,
            "duration_ms": (time.time() - process.started_at) * 1000,
        })
        del self._processes[agent_id]
        self._crash_callbacks.pop(agent_id, None)
        return True

    def get_process(self, agent_id: str) -> Optional[AgentProcess]:
        """Return AgentProcess by ID, or None if not found."""
        return self._processes.get(agent_id)

    def list_processes(self) -> List[AgentProcess]:
        """Return all tracked agent processes (any state)."""
        return list(self._processes.values())

    def on_crash(self, agent_id: str, callback: CrashCallback) -> None:
        """Register a crash callback for agent_id (mirrors app.on('child-process-gone'))."""
        self._crash_callbacks.setdefault(agent_id, []).append(callback)

    def report_crash(self, agent_id: str) -> None:
        """Mark agent as CRASHED, emit HEALTH_WARNING, invoke crash callbacks."""
        process = self._processes.get(agent_id)
        if process is None:
            return
        process.state = ProcessState.CRASHED
        self._bus.emit(EventType.HEALTH_WARNING, {
            "agent_id": agent_id, "agent_type": process.agent_type, "reason": "crashed",
        })
        for cb in self._crash_callbacks.get(agent_id, []):
            try:
                cb(agent_id)
            except Exception:
                pass  # callbacks must not crash the manager

    def restart(self, agent_id: str) -> AgentProcess:
        """Kill and respawn with original config. Returns new AgentProcess.

        Raises:
            KeyError: agent_id was never registered.
        """
        process = self._processes.get(agent_id)
        if process is None:
            raise KeyError(f"Unknown agent_id: {agent_id!r}")
        agent_type = process.agent_type
        config = self._spawn_configs.get(agent_id, {})
        self.kill(agent_id)
        return self.spawn(agent_type, config)

    @property
    def running_count(self) -> int:
        """Number of agents currently in RUNNING state."""
        return sum(1 for p in self._processes.values() if p.state == ProcessState.RUNNING)

    @property
    def capacity_available(self) -> bool:
        """True if another agent can be spawned within the concurrency cap."""
        return self.running_count < self.max_concurrent


_default_manager: Optional[ProcessManager] = None


def get_process_manager() -> ProcessManager:
    """Get or create the shared ProcessManager singleton."""
    global _default_manager
    if _default_manager is None:
        _default_manager = ProcessManager()
    return _default_manager


__all__ = [
    "ProcessState",
    "AgentProcess",
    "ProcessManager",
    "CrashCallback",
    "get_process_manager",
]
