"""
Handlers for the Commander MCP Server.
Migrated from scripts/vibeos/commander_engine.py
"""
import asyncio
import json
import logging
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

# Setup logging
logger = logging.getLogger(__name__)

class InfraStatus(Enum):
    """Infrastructure status levels."""
    HEALTHY = "healthy"
    WARNING = "warning"
    ERROR = "error"
    UNKNOWN = "unknown"

@dataclass
class SystemStatus:
    """Status of a single system."""
    name: str
    status: InfraStatus
    message: str
    last_check: str = field(default_factory=lambda: datetime.now().isoformat())
    details: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Anomaly:
    """Detected anomaly."""
    system: str
    type: str
    message: str
    severity: str
    recovery_action: Optional[str] = None

class CommanderHandler:
    """
    Commander Engine Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        # Adjust project root calculation
        # scripts/vibeos/commander_engine.py was at root/scripts/vibeos
        # This file is at root/antigravity/mcp_servers/commander_server
        self.project_root = Path(__file__).parent.parent.parent.parent
        self.systems = ["vercel", "supabase", "github", "jules", "proxy", "taskmaster"]

    async def check_taskmaster(self) -> SystemStatus:
        """Check Task Master AI status via MCP."""
        try:
            # Check if task-master-ai is configured in MCP
            mcp_config = self.project_root / ".claude" / "mcp.json"
            if mcp_config.exists():
                try:
                    with open(mcp_config) as f:
                        config = json.load(f)
                        if "task-master-ai" in config.get("mcpServers", {}):
                            # Check for active tasks
                            tasks_file = self.project_root / "tasks" / "tasks.json"
                            if tasks_file.exists():
                                with open(tasks_file) as tf:
                                    tasks = json.load(tf)
                                    pending = len([t for t in tasks.get("tasks", []) if t.get("status") == "pending"])
                                    doing = len([t for t in tasks.get("tasks", []) if t.get("status") == "in-progress"])
                                    return SystemStatus(
                                        name="taskmaster",
                                        status=InfraStatus.HEALTHY,
                                        message=f"{doing} active, {pending} pending tasks",
                                        details={"active": doing, "pending": pending},
                                    )
                            return SystemStatus(
                                name="taskmaster",
                                status=InfraStatus.HEALTHY,
                                message="Task Master configured (no tasks.json)",
                            )
                except Exception:
                    pass
            return SystemStatus(
                name="taskmaster", status=InfraStatus.UNKNOWN, message="Task Master not configured"
            )
        except Exception as e:
            return SystemStatus(
                name="taskmaster",
                status=InfraStatus.WARNING,
                message=f"Task Master check error: {str(e)}",
            )

    async def check_vercel(self) -> SystemStatus:
        """Check Vercel deployment status."""
        try:
            result = await asyncio.create_subprocess_exec(
                "vercel", "ls", "--json", "-n", "3",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=30)

            if result.returncode == 0:
                deployments = json.loads(stdout.decode()) if stdout else []
                # Check for recent failures
                recent = deployments[:3] if deployments else []
                errors = [d for d in recent if d.get("readyState") == "ERROR"]

                if errors:
                    return SystemStatus(
                        name="vercel",
                        status=InfraStatus.ERROR,
                        message=f"{len(errors)} failed deployment(s)",
                        details={"failed": len(errors), "total": len(recent)},
                    )
                return SystemStatus(
                    name="vercel",
                    status=InfraStatus.HEALTHY,
                    message=f"{len(recent)} recent deployments OK",
                    details={"deployments": len(recent)},
                )
            else:
                return SystemStatus(
                    name="vercel",
                    status=InfraStatus.WARNING,
                    message="Could not fetch deployments",
                    details={"error": stderr.decode()[:200]},
                )
        except asyncio.TimeoutError:
            return SystemStatus(
                name="vercel", status=InfraStatus.WARNING, message="Vercel CLI timeout"
            )
        except FileNotFoundError:
            return SystemStatus(
                name="vercel", status=InfraStatus.UNKNOWN, message="Vercel CLI not installed"
            )
        except Exception as e:
            return SystemStatus(name="vercel", status=InfraStatus.ERROR, message=str(e))

    async def check_supabase(self) -> SystemStatus:
        """Check Supabase project health."""
        try:
            result = await asyncio.create_subprocess_exec(
                "supabase", "projects", "list",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=30)

            if result.returncode == 0:
                return SystemStatus(
                    name="supabase", status=InfraStatus.HEALTHY, message="Supabase connected"
                )
            else:
                return SystemStatus(
                    name="supabase",
                    status=InfraStatus.WARNING,
                    message="Supabase CLI error",
                    details={"error": stderr.decode()[:200]},
                )
        except FileNotFoundError:
            return SystemStatus(
                name="supabase", status=InfraStatus.UNKNOWN, message="Supabase CLI not installed"
            )
        except Exception as e:
            return SystemStatus(name="supabase", status=InfraStatus.ERROR, message=str(e))

    async def check_github_ci(self, branch: str = "main") -> SystemStatus:
        """Check GitHub Actions CI status."""
        try:
            result = await asyncio.create_subprocess_exec(
                "gh", "run", "list", "--branch", branch, "--limit", "3", "--json", "status,conclusion,name",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=30)

            if result.returncode == 0:
                runs = json.loads(stdout.decode()) if stdout else []
                if not runs:
                    return SystemStatus(
                        name="github", status=InfraStatus.UNKNOWN, message="No recent CI runs"
                    )

                # Check for failures
                failures = [r for r in runs if r.get("conclusion") == "failure"]
                in_progress = [r for r in runs if r.get("status") == "in_progress"]

                if failures:
                    return SystemStatus(
                        name="github",
                        status=InfraStatus.ERROR,
                        message=f"{len(failures)} failed CI run(s)",
                        details={"failed": len(failures), "runs": runs[:3]},
                    )
                elif in_progress:
                    return SystemStatus(
                        name="github",
                        status=InfraStatus.WARNING,
                        message=f"{len(in_progress)} CI run(s) in progress",
                        details={"in_progress": len(in_progress)},
                    )
                else:
                    return SystemStatus(
                        name="github",
                        status=InfraStatus.HEALTHY,
                        message="All CI runs passing ✓",
                        details={"runs": len(runs)},
                    )
            else:
                return SystemStatus(
                    name="github",
                    status=InfraStatus.WARNING,
                    message="gh CLI error",
                    details={"error": stderr.decode()[:200]},
                )
        except FileNotFoundError:
            return SystemStatus(
                name="github", status=InfraStatus.UNKNOWN, message="gh CLI not installed"
            )
        except Exception as e:
            return SystemStatus(name="github", status=InfraStatus.ERROR, message=str(e))

    async def check_jules(self) -> SystemStatus:
        """Check Jules automated task status."""
        try:
            jules_status_file = Path.home() / ".mekong" / "jules_status.json"

            if jules_status_file.exists():
                with open(jules_status_file) as f:
                    status_data = json.load(f)
                    last_run = status_data.get("last_run", "Unknown")
                    task_count = status_data.get("tasks_completed", 0)
                    return SystemStatus(
                        name="jules",
                        status=InfraStatus.HEALTHY,
                        message=f"{task_count} tasks completed",
                        details={"last_run": last_run},
                    )
            else:
                return SystemStatus(
                    name="jules", status=InfraStatus.UNKNOWN, message="No Jules status file found"
                )
        except Exception as e:
            return SystemStatus(
                name="jules", status=InfraStatus.WARNING, message=f"Jules check error: {str(e)}"
            )

    async def check_proxy(self) -> SystemStatus:
        """Check Antigravity Proxy health."""
        try:
            result = await asyncio.create_subprocess_exec(
                "curl", "-s", "http://localhost:8080/health",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=5)

            if result.returncode == 0 and stdout:
                return SystemStatus(
                    name="proxy",
                    status=InfraStatus.HEALTHY,
                    message="Antigravity Proxy running at :8080",
                )
            else:
                return SystemStatus(
                    name="proxy", status=InfraStatus.ERROR, message="Proxy not responding"
                )
        except Exception:
            return SystemStatus(name="proxy", status=InfraStatus.ERROR, message="Proxy not running")

    async def full_status(self) -> Dict[str, SystemStatus]:
        """Get status of all systems (6-system monitoring)."""
        results = await asyncio.gather(
            self.check_proxy(),
            self.check_vercel(),
            self.check_supabase(),
            self.check_github_ci(),
            self.check_jules(),
            self.check_taskmaster(),
            return_exceptions=True,
        )

        status_dict = {}
        system_names = ["proxy", "vercel", "supabase", "github", "jules", "taskmaster"]

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                status_dict[system_names[i]] = SystemStatus(
                    name=system_names[i], status=InfraStatus.ERROR, message=str(result)
                )
            else:
                status_dict[system_names[i]] = result

        return status_dict

    async def detect_anomalies(self, statuses: Dict[str, SystemStatus]) -> List[Anomaly]:
        """Detect anomalies based on current status."""
        anomalies = []

        for name, status in statuses.items():
            if status.status == InfraStatus.ERROR:
                recovery = self._get_recovery_action(name)
                anomalies.append(
                    Anomaly(
                        system=name,
                        type="ERROR",
                        message=status.message,
                        severity="HIGH",
                        recovery_action=recovery,
                    )
                )
            elif status.status == InfraStatus.WARNING:
                anomalies.append(
                    Anomaly(system=name, type="WARNING", message=status.message, severity="MEDIUM")
                )

        return anomalies

    def _get_recovery_action(self, system: str) -> str:
        """Get suggested recovery action for a system."""
        actions = {
            "proxy": "Run: antigravity-claude-proxy start",
            "vercel": "Run: vercel --prod (redeploy)",
            "supabase": "Check: supabase status",
            "github": "Check: gh run view <id> --log-failed",
            "jules": "Run: mekong automation run jules-reset",
        }
        return actions.get(system, "Manual investigation required")

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC API
    # ═══════════════════════════════════════════════════════════════

    async def get_dashboard(self) -> Dict[str, Any]:
        """Get full dashboard data."""
        statuses = await self.full_status()
        anomalies = await self.detect_anomalies(statuses)

        # Convert to dict for JSON serialization
        statuses_json = {}
        for k, v in statuses.items():
            statuses_json[k] = {
                "status": v.status.value,
                "message": v.message,
                "last_check": v.last_check,
                "details": v.details
            }

        anomalies_json = []
        for a in anomalies:
            anomalies_json.append({
                "system": a.system,
                "type": a.type,
                "message": a.message,
                "severity": a.severity,
                "recovery_action": a.recovery_action
            })

        return {
            "timestamp": datetime.now().isoformat(),
            "systems": statuses_json,
            "anomalies": anomalies_json,
            "summary": f"{len(statuses)} systems monitored, {len(anomalies)} anomalies detected"
        }

    async def check_system(self, system_name: str) -> Dict[str, Any]:
        """Check a specific system."""
        checkers = {
            "proxy": self.check_proxy,
            "vercel": self.check_vercel,
            "supabase": self.check_supabase,
            "github": self.check_github_ci,
            "jules": self.check_jules,
            "taskmaster": self.check_taskmaster
        }

        checker = checkers.get(system_name)
        if not checker:
            return {"success": False, "error": f"Unknown system: {system_name}"}

        try:
            status = await checker()
            return {
                "success": True,
                "system": system_name,
                "status": status.status.value,
                "message": status.message,
                "details": status.details
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
