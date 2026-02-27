"""Bridge to Tom Hum AGI daemon (apps/openclaw-worker/)."""
import subprocess
import pathlib
import time
from typing import Optional

import httpx


class AGIBridge:
    """Bridge to Tom Hum AGI daemon.

    Communicates with the Node.js task-watcher daemon via:
    - HTTP health/metrics endpoints (port 9090)
    - File IPC via tasks/ directory for mission dispatch
    - Process management for daemon lifecycle
    """

    def __init__(self, mekong_dir: Optional[str] = None) -> None:
        self.mekong_dir = pathlib.Path(mekong_dir or pathlib.Path.cwd())
        self.worker_dir = self.mekong_dir / "apps" / "openclaw-worker"
        self.health_url = "http://127.0.0.1:9090"
        self.tasks_dir = self.mekong_dir / "tasks"
        self._process: Optional[subprocess.Popen] = None  # type: ignore[type-arg]

    def start(self) -> bool:
        """Spawn task-watcher.js as background daemon.

        Returns True if process started successfully.
        """
        entry = self.worker_dir / "task-watcher.js"
        if not entry.exists():
            return False
        try:
            self._process = subprocess.Popen(
                ["node", "task-watcher.js"],
                cwd=str(self.worker_dir),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            # Brief wait for node startup
            time.sleep(2)
            return self._process.poll() is None
        except FileNotFoundError:
            return False

    def stop(self) -> bool:
        """Stop the daemon if we spawned it.

        Returns True if a process was stopped.
        """
        if self._process and self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            return True
        return False

    def is_running(self) -> bool:
        """Check if daemon is reachable via health endpoint."""
        try:
            resp = httpx.get(f"{self.health_url}/health", timeout=3.0)
            return resp.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException):
            return False

    def status(self) -> dict:
        """GET /health from daemon — returns AGI score, mission stats."""
        try:
            resp = httpx.get(f"{self.health_url}/health", timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
            return {"error": f"HTTP {resp.status_code}"}
        except (httpx.ConnectError, httpx.TimeoutException):
            return {"error": "Daemon not reachable", "running": False}

    def metrics(self) -> dict:
        """GET /metrics from daemon — returns detailed metrics."""
        try:
            resp = httpx.get(f"{self.health_url}/metrics", timeout=5.0)
            if resp.status_code == 200:
                return resp.json()
            return {"error": f"HTTP {resp.status_code}"}
        except (httpx.ConnectError, httpx.TimeoutException):
            return {"error": "Daemon not reachable"}

    def dispatch(self, mission_content: str, mission_id: Optional[str] = None) -> str:
        """Write mission file to tasks/ directory for daemon to pick up.

        Args:
            mission_content: The mission text or command to execute.
            mission_id: Optional ID; auto-generated from timestamp if omitted.

        Returns:
            Absolute path to the created mission file.
        """
        self.tasks_dir.mkdir(parents=True, exist_ok=True)
        mid = mission_id or f"manual_{int(time.time())}"
        filename = f"mission_{mid}.txt"
        filepath = self.tasks_dir / filename
        filepath.write_text(mission_content, encoding="utf-8")
        return str(filepath)

    def logs(self, lines: int = 50) -> str:
        """Read last N lines from tom_hum_cto.log.

        Args:
            lines: Number of tail lines to return.

        Returns:
            Log content as string.
        """
        log_path = pathlib.Path.home() / "tom_hum_cto.log"
        if not log_path.exists():
            return "Log file not found: ~/tom_hum_cto.log"
        try:
            all_lines = log_path.read_text(
                encoding="utf-8", errors="replace"
            ).splitlines()
            return "\n".join(all_lines[-lines:])
        except OSError as e:
            return f"Error reading log: {e}"
