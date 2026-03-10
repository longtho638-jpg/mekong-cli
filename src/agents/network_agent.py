"""
Mekong CLI - Network Agent

Network & API testing agent for connectivity and latency checks.
"""

import subprocess
import socket
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from src.core.agent_base import AgentBase, Task, Result


@dataclass
class NetworkTestResult:
    """Result of network test"""
    target: str
    test_type: str
    success: bool
    latency_ms: Optional[float] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class NetworkAgent(AgentBase):
    """
    Network testing agent for connectivity and performance.

    Capabilities:
    - HTTP/API latency testing
    - Ping/connectivity tests
    - Port scanning
    - DNS resolution checks
    - Network path tracing
    """

    def __init__(self, name: str = "network", max_retries: int = 2) -> None:
        super().__init__(name, max_retries)
        self.timeout_secs = 10

    def plan(self, input_data: str) -> List[Task]:
        """
        Parse network test input into tasks.

        Input format:
        - "ping google.com"
        - "test latency http://api.example.com"
        - "scan ports localhost"
        - "check dns example.com"
        """
        tasks: List[Task] = []
        input_lower = input_data.lower()

        if "ping" in input_lower or "connectivity" in input_lower:
            tasks.append(Task(
                id="ping_test",
                description="Test network connectivity",
                input={"type": "ping", "query": input_data},
            ))

        if "latency" in input_lower or "response" in input_lower:
            tasks.append(Task(
                id="latency_test",
                description="Test endpoint latency",
                input={"type": "latency", "query": input_data},
            ))

        if "scan" in input_lower and "port" in input_lower:
            tasks.append(Task(
                id="port_scan",
                description="Scan open ports",
                input={"type": "port_scan", "query": input_data},
            ))

        if "dns" in input_lower or "resolve" in input_lower:
            tasks.append(Task(
                id="dns_check",
                description="Check DNS resolution",
                input={"type": "dns", "query": input_data},
            ))

        if "trace" in input_lower or "traceroute" in input_lower:
            tasks.append(Task(
                id="trace_route",
                description="Trace network path",
                input={"type": "traceroute", "query": input_data},
            ))

        if not tasks:
            tasks.append(Task(
                id="connectivity",
                description="Run connectivity test",
                input={"type": "ping", "query": input_data},
            ))

        return tasks

    def execute(self, task: Task) -> Result:
        """Execute network test task"""
        task_type = task.input.get("type", "ping")

        try:
            if task_type == "ping":
                return self._execute_ping(task)
            elif task_type == "latency":
                return self._execute_latency(task)
            elif task_type == "port_scan":
                return self._execute_port_scan(task)
            elif task_type == "dns":
                return self._execute_dns_check(task)
            elif task_type == "traceroute":
                return self._execute_traceroute(task)
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

    def _extract_host(self, query: str) -> Optional[str]:
        """Extract hostname/IP from query string"""
        import re
        # Try to find URL
        url_match = re.search(r'https?://([a-zA-Z0-9.\-]+)', query)
        if url_match:
            return url_match.group(1)
        # Try to find hostname/IP
        host_match = re.search(r'\b([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3})\b', query)
        if host_match:
            return host_match.group(1)
        return None

    def _execute_ping(self, task: Task) -> Result:
        """Ping host to test connectivity"""
        host = self._extract_host(task.input.get("query", ""))
        if not host:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No host found in query",
            )

        # Use ping command (3 packets on macOS)
        cmd = f"ping -c 3 -W 5000 '{host}' 2>&1"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            output = proc.stdout

            # Parse ping results
            import re
            rtt_match = re.search(r'rtt min/avg/max/stddev = ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+)', output)
            packet_loss_match = re.search(r'(\d+)% packet loss', output)

            result_data: Dict[str, Any] = {
                "host": host,
                "reachable": proc.returncode == 0,
            }

            if rtt_match:
                result_data["min_ms"] = float(rtt_match.group(1))
                result_data["avg_ms"] = float(rtt_match.group(2))
                result_data["max_ms"] = float(rtt_match.group(3))

            if packet_loss_match:
                result_data["packet_loss_percent"] = float(packet_loss_match.group(1))

            is_success = proc.returncode == 0 and result_data.get("packet_loss_percent", 100) < 100

            return Result(
                task_id=task.id,
                success=is_success,
                output=result_data,
            )
        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=f"Ping timeout for {host}",
            )

    def _execute_latency(self, task: Task) -> Result:
        """Test HTTP endpoint latency"""
        import re

        query = task.input.get("query", "")
        url_match = re.search(r'https?://\S+', query)

        if not url_match:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No HTTP URL found in query",
            )

        url = url_match.group(0).strip()

        # Use curl for latency measurement
        cmd = f"curl -s -o /dev/null -w '%{{http_code}} %{{time_total}} %{{time_connect}}' --max-time {self.timeout_secs} '{url}'"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=self.timeout_secs + 5)
            parts = proc.stdout.strip().split()

            if len(parts) >= 3:
                status_code = int(parts[0])
                total_time = float(parts[1]) * 1000  # ms
                connect_time = float(parts[2]) * 1000  # ms

                is_success = 200 <= status_code < 400

                return Result(
                    task_id=task.id,
                    success=is_success,
                    output={
                        "url": url,
                        "status_code": status_code,
                        "total_latency_ms": total_time,
                        "connect_latency_ms": connect_time,
                        "ttfb_ms": total_time - connect_time,
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
                error=f"Latency test timeout for {url}",
            )

    def _execute_port_scan(self, task: Task) -> Result:
        """Scan common ports on host"""
        import re

        query = task.input.get("query", "")

        # Extract host
        host = self._extract_host(query)
        if not host:
            host = "localhost"

        # Default ports to scan
        default_ports = [22, 80, 443, 3000, 5000, 5432, 6379, 8080, 8443, 9000]

        # Check if specific port mentioned
        port_match = re.search(r'port\s*(\d+)', query.lower())
        if port_match:
            ports = [int(port_match.group(1))]
        else:
            ports = default_ports

        open_ports: List[int] = []
        closed_ports: List[int] = []

        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((host, port))
                if result == 0:
                    open_ports.append(port)
                else:
                    closed_ports.append(port)
                sock.close()
            except Exception:
                closed_ports.append(port)

        return Result(
            task_id=task.id,
            success=len(open_ports) > 0,
            output={
                "host": host,
                "open_ports": open_ports,
                "closed_ports": closed_ports,
                "scanned": len(ports),
            },
        )

    def _execute_dns_check(self, task: Task) -> Result:
        """Check DNS resolution"""
        import re

        query = task.input.get("query", "")

        # Extract domain
        domain = self._extract_host(query)
        if not domain:
            # Try to find any domain-like string
            domain_match = re.search(r'\b([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b', query)
            if domain_match:
                domain = domain_match.group(1)

        if not domain:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No domain found in query",
            )

        # Use nslookup or dig
        cmd = f"dig +short '{domain}' 2>&1 || nslookup '{domain}' 2>&1"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)

            if proc.returncode == 0 and proc.stdout.strip():
                # Extract IPs
                import re
                ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', proc.stdout)

                return Result(
                    task_id=task.id,
                    success=len(ips) > 0,
                    output={
                        "domain": domain,
                        "resolved": True,
                        "ip_addresses": ips,
                        "raw_output": proc.stdout[:500],
                    },
                )
            else:
                return Result(
                    task_id=task.id,
                    success=False,
                    output=None,
                    error=f"DNS resolution failed for {domain}",
                )
        except Exception as e:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=str(e),
            )

    def _execute_traceroute(self, task: Task) -> Result:
        """Trace network path to host"""
        host = self._extract_host(task.input.get("query", ""))
        if not host:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="No host found in query",
            )

        # Use traceroute (macOS) or tracepath (Linux)
        cmd = f"traceroute -m 10 -w 2000 '{host}' 2>&1"
        try:
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)

            # Parse hops
            lines = proc.stdout.strip().split('\n')[1:]  # Skip header
            hops = []
            for line in lines[:10]:  # Max 10 hops
                if line.strip():
                    hops.append(line.strip())

            return Result(
                task_id=task.id,
                success=proc.returncode == 0 or len(hops) > 0,
                output={
                    "host": host,
                    "hops": hops,
                    "hop_count": len(hops),
                    "raw_output": proc.stdout[:1000],
                },
            )
        except subprocess.TimeoutExpired:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error="Traceroute timeout",
            )
        except Exception as e:
            return Result(
                task_id=task.id,
                success=False,
                output=None,
                error=str(e),
            )


__all__ = ["NetworkAgent", "NetworkTestResult"]
