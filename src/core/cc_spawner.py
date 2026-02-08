"""
Mekong CLI - CC CLI Spawner (Tôm Hùm Executor)

Spawns Claude Code CLI sessions to execute coding goals autonomously.
Used by: Telegram Bot, Supervisor, Gateway.
"""

import asyncio
import os

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional


class SessionStatus(str, Enum):
    """Status of a CC CLI session."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class CCSession:
    """Represents a single CC CLI session."""

    id: str = field(default_factory=lambda: uuid.uuid4().hex[:8])
    goal: str = ""
    cwd: str = ""
    status: SessionStatus = SessionStatus.PENDING
    pid: Optional[int] = None
    output_buffer: List[str] = field(default_factory=list)
    start_time: float = 0.0
    end_time: float = 0.0
    exit_code: Optional[int] = None
    error: str = ""

    @property
    def duration(self) -> float:
        """Duration in seconds."""
        end = self.end_time or time.time()
        return end - self.start_time if self.start_time else 0.0

    @property
    def output(self) -> str:
        """Full output as string."""
        return "\n".join(self.output_buffer)

    @property
    def last_output(self) -> str:
        """Last 10 lines of output."""
        return "\n".join(self.output_buffer[-10:])

    def to_dict(self) -> dict:
        """Serialize for API/Telegram responses."""
        return {
            "id": self.id,
            "goal": self.goal[:60],
            "status": self.status.value,
            "pid": self.pid,
            "duration": round(self.duration, 1),
            "exit_code": self.exit_code,
            "output_lines": len(self.output_buffer),
        }


class CCSpawner:
    """
    Spawns and manages Claude Code CLI sessions.

    Usage:
        spawner = CCSpawner()
        session = await spawner.spawn("Build auth module for AgencyOS")
        # session.status will update as CC CLI runs
    """

    DEFAULT_CWD = str(Path.home() / "mekong-cli")
    DEFAULT_TIMEOUT = 600  # 10 minutes

    def __init__(self, cwd: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT):
        self.cwd = cwd or self.DEFAULT_CWD
        self.timeout = timeout
        self._sessions: Dict[str, CCSession] = {}

    @property
    def active_sessions(self) -> List[CCSession]:
        """List sessions currently running."""
        return [s for s in self._sessions.values() if s.status == SessionStatus.RUNNING]

    @property
    def all_sessions(self) -> List[CCSession]:
        """List all sessions."""
        return list(self._sessions.values())

    async def spawn(
        self,
        goal: str,
        cwd: Optional[str] = None,
        timeout: Optional[int] = None,
        project: Optional[str] = None,
    ) -> CCSession:
        """
        Spawn a new CC CLI session.

        Args:
            goal: The coding goal to accomplish.
            cwd: Working directory. Defaults to mekong-cli root.
            timeout: Timeout in seconds. Defaults to 600.
            project: Optional project name under apps/ (e.g. 'agencyos-web').
        """
        session = CCSession(
            goal=goal,
            cwd=cwd or self.cwd,
            start_time=time.time(),
        )

        # If project specified, set cwd to apps/<project>
        if project:
            project_dir = os.path.join(self.cwd, "apps", project)
            if os.path.isdir(project_dir):
                session.cwd = project_dir
            else:
                session.status = SessionStatus.FAILED
                session.error = f"Project directory not found: {project_dir}"
                self._sessions[session.id] = session
                return session

        self._sessions[session.id] = session

        # Launch in background
        asyncio.create_task(self._run_session(session, timeout or self.timeout))

        return session

    async def _run_session(self, session: CCSession, timeout: int) -> None:
        """Run the CC CLI process and capture output."""
        session.status = SessionStatus.RUNNING

        # Build command
        # Use --dangerously-skip-permissions for autonomous mode
        # Use --print for non-interactive output
        cmd = [
            "claude",
            "--dangerously-skip-permissions",
            "--print",
            session.goal,
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                cwd=session.cwd,
            )

            session.pid = process.pid

            # Read output line by line
            async def read_output():
                while True:
                    line = await process.stdout.readline()
                    if not line:
                        break
                    decoded = line.decode("utf-8", errors="replace").rstrip()
                    session.output_buffer.append(decoded)
                    # Keep buffer manageable
                    if len(session.output_buffer) > 500:
                        session.output_buffer = session.output_buffer[-300:]

            try:
                await asyncio.wait_for(read_output(), timeout=timeout)
            except asyncio.TimeoutError:
                session.status = SessionStatus.TIMEOUT
                session.error = f"Timed out after {timeout}s"
                process.kill()
                await process.wait()
                session.exit_code = -1
                session.end_time = time.time()
                return

            await process.wait()
            session.exit_code = process.returncode

            if process.returncode == 0:
                session.status = SessionStatus.COMPLETED
            else:
                session.status = SessionStatus.FAILED
                session.error = f"Exit code: {process.returncode}"

        except FileNotFoundError:
            session.status = SessionStatus.FAILED
            session.error = (
                "claude CLI not found. Install: npm i -g @anthropic-ai/claude-code"
            )
        except Exception as e:
            session.status = SessionStatus.FAILED
            session.error = str(e)

        session.end_time = time.time()

    def get_session(self, session_id: str) -> Optional[CCSession]:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def clear_completed(self) -> int:
        """Remove completed/failed sessions. Returns count removed."""
        to_remove = [
            sid
            for sid, s in self._sessions.items()
            if s.status
            in (SessionStatus.COMPLETED, SessionStatus.FAILED, SessionStatus.TIMEOUT)
        ]
        for sid in to_remove:
            del self._sessions[sid]
        return len(to_remove)


# Singleton instance
_spawner: Optional[CCSpawner] = None


def get_spawner() -> CCSpawner:
    """Get or create the global CCSpawner instance."""
    global _spawner
    if _spawner is None:
        _spawner = CCSpawner()
    return _spawner


__all__ = [
    "CCSpawner",
    "CCSession",
    "SessionStatus",
    "get_spawner",
]
