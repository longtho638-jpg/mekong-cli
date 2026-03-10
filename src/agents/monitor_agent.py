"""
Mekong CLI - Monitor Agent

Monitoring & health check agent for services and system resources.
"""

import subprocess
import platform
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from src.core.agent_base import AgentBase, Task, Result, TaskStatus


@dataclass
class HealthCheckResult:
    """Result of a health check"""
    service: str
    status: str  # "healthy", "unhealthy", "unknown"
    response_time_ms: Optional[float] = None
    error: Optional[str] = None
    metrics: Optional[Dict[str, Any]] = None


class MonitorAgent(AgentBase):
    """
    Monitoring agent for service health checks and system resources.

    Capabilities:
    - HTTP endpoint health checks
    - Port availability checks
    - System resource monitoring (CPU, RAM, disk)
    - Alert on threshold violations
    """

    def __init__(self, name: str = "monitor", max_retries: int = 2) -> None:
        super().__init__(name, max_retries)
        self.thresholds = {
            "cpu_percent": 80.0,
            "memory_percent": 85.0,
            "disk_percent": 90.0,
            "response_time_ms": 1000.0,
        }

    def plan(self, input_data: str) -> List[Task]:
        """
        Parse monitoring input into tasks.

        Input format:
        - "check health http://localhost:8080"
        - "monitor system resources"
        - "check port 5432"
        """
        tasks: List[Task] = []
        input_lower = input_data.lower()

        if "health" in input_lower and ("http" in input_lower or "endpoint" in input_lower):
            tasks.append(Task(
                id="health_check",
                description="Check HTTP endpoint health",
                input={"type": "http_health", "query": input_data},
            ))

        if "port" in input_lower:
            tasks.append(Task(
                id="port_check",
                description="Check port availability",
                input={"type": "port_check", "query": input_data},
            ))

        if "system" in input_lower or "resource" in input_lower or "cpu" in input_lower or "memory" in input_lower:
            tasks.append(Task(
                id="system_resources",
                description="Monitor system resources",
                input={"type": "system_resources", "query": input_data},
            ))

        if not tasks:
            tasks.append(Task(
                id="full_health",
                description="Run full system health check",
                input={"type": "full_health", "query": input_data},
            ))

        return tasks

    def execute(self, task: Task) -> Result:
        """Execute monitoring task"""
        task_type = task.input.get("type", "health_check")

        try:
            if task_type == "http_health":
                return self._execute_http_health(task)
            elif task_type == "port_check":
                return self._execute_port_check(task)
            elif task_type == "system_resources":
                return self._execute_system_resources(task)
            elif task_type == "full_health":
                return self._execute_full_health(task)
            else:
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=f"Unknown task type: {task_type}",
                )
        except Exception as e:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=str(e),
            )

    def _execute_http_health(self, task: Task) -> Result:
        """Check HTTP endpoint health using curl"""
        import re

        # Extract URL from query
        url_match = re.search(r'https?://\S+', task.input.get("query", ""))
        if not url_match:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No HTTP URL found in query",
            )

        url = url_match.group(0).strip()

        # Use curl to check endpoint
        cmd = f"curl -s -o /dev/null -w '%{{http_code}} %{{time_total}}' --max-time 10 '{url}'"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            parts = proc.stdout.strip().split()

            if len(parts) >= 2:
                status_code = int(parts[0])
                response_time = float(parts[1]) * 1000  # Convert to ms

                is_healthy = 200 <= status_code < 400
                result = HealthCheckResult(
                    service=url,
                    status="healthy" if is_healthy else "unhealthy",
                    response_time_ms=response_time,
                    metrics={"status_code": status_code},
                )

                alert = ""
                if response_time > self.thresholds["response_time_ms"]:
                    alert = f"SLOW: {response_time:.0f}ms > {self.thresholds['response_time_ms']:.0f}ms threshold"

                return Result(
                    task_id=task.id,
                    success=is_healthy,
                    output={
                        "service": url,
                        "status": result.status,
                        "status_code": status_code,
                        "response_time_ms": response_time,
                        "alert": alert,
                    },
                )
            else:
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=f"Failed to parse curl output: {proc.stdout}",
                )
        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Health check timeout for {url}",
            )

    def _execute_port_check(self, task: Task) -> Result:
        """Check if port is open/available"""
        import re

        # Extract port from query
        port_match = re.search(r'\b(\d{2,5})\b', task.input.get("query", ""))
        if not port_match:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No port number found in query",
            )

        port = int(port_match.group(1))
        if port < 1 or port > 65535:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Invalid port: {port}",
            )

        # Check port using nc (netcat) or lsof
        cmd = f"nc -z localhost {port} 2>&1 || echo 'closed'"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
            is_open = "closed" not in proc.stdout.lower()

            return Result(
                task_id=task.id,
                success=is_open,
                output={
                    "port": port,
                    "status": "open" if is_open else "closed",
                    "host": "localhost",
                },
            )
        except Exception as e:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=str(e),
            )

    def _execute_system_resources(self, task: Task) -> Result:
        """Monitor system resources (CPU, memory, disk)"""
        metrics: Dict[str, Any] = {}
        alerts: List[str] = []

        try:
            # CPU usage (using top on macOS)
            cpu_cmd = "top -l 1 | grep 'CPU usage' | head -1"
            cpu_result = subprocess.run(cpu_cmd, shell=True, capture_output=True, text=True, timeout=5)
            if cpu_result.returncode == 0:
                import re
                cpu_match = re.search(r'(\d+\.?\d*)%\s+user', cpu_result.stdout)
                if cpu_match:
                    cpu_percent = float(cpu_match.group(1))
                    metrics["cpu_percent"] = cpu_percent
                    metrics["cpu_user"] = cpu_percent
                    if cpu_percent > self.thresholds["cpu_percent"]:
                        alerts.append(f"CPU HIGH: {cpu_percent:.1f}% > {self.thresholds['cpu_percent']:.1f}%")

            # Memory usage
            mem_cmd = "vm_stat | awk '/Pages active/ {print $3}' | tr -d '.'"
            mem_result = subprocess.run(mem_cmd, shell=True, capture_output=True, text=True, timeout=5)
            if mem_result.returncode == 0:
                try:
                    pages_active = int(mem_result.stdout.strip())
                    page_size = 4096  # macOS default
                    total_mem_cmd = "sysctl -n hw.memsize"
                    total_result = subprocess.run(total_mem_cmd, shell=True, capture_output=True, text=True, timeout=5)
                    if total_result.returncode == 0:
                        total_bytes = int(total_result.stdout.strip())
                        used_bytes = pages_active * page_size
                        mem_percent = (used_bytes / total_bytes) * 100
                        metrics["memory_percent"] = mem_percent
                        if mem_percent > self.thresholds["memory_percent"]:
                            alerts.append(f"MEMORY HIGH: {mem_percent:.1f}% > {self.thresholds['memory_percent']:.1f}%")
                except (ValueError, IndexError):
                    pass

            # Disk usage
            disk_cmd = "df -h / | tail -1 | awk '{print $5}' | tr -d '%'"
            disk_result = subprocess.run(disk_cmd, shell=True, capture_output=True, text=True, timeout=5)
            if disk_result.returncode == 0:
                try:
                    disk_percent = float(disk_result.stdout.strip())
                    metrics["disk_percent"] = disk_percent
                    if disk_percent > self.thresholds["disk_percent"]:
                        alerts.append(f"DISK HIGH: {disk_percent:.1f}% > {self.thresholds['disk_percent']:.1f}%")
                except ValueError:
                    pass

            is_healthy = len(alerts) == 0

            return Result(
                task_id=task.id,
                success=is_healthy,
                output={
                    "metrics": metrics,
                    "alerts": alerts,
                    "thresholds": self.thresholds,
                    "platform": platform.system(),
                },
            )
        except Exception as e:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"System resource check failed: {str(e)}",
            )

    def _execute_full_health(self, task: Task) -> Result:
        """Run complete health check (HTTP + system)"""
        system_result = self._execute_system_resources(task)

        return Result(
            task_id=task.id,
            success=system_result.success,
            output={
                "type": "full_health",
                "system": system_result.output,
                "timestamp": subprocess.run("date -u +%Y-%m-%dT%H:%M:%SZ", shell=True, capture_output=True, text=True).stdout.strip(),
            },
        )

    def set_threshold(self, metric: str, value: float) -> None:
        """Update alert threshold"""
        if metric in self.thresholds:
            self.thresholds[metric] = value

    def get_thresholds(self) -> Dict[str, float]:
        """Return current thresholds"""
        return self.thresholds.copy()


__all__ = ["MonitorAgent", "HealthCheckResult"]
