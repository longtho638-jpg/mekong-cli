#!/usr/bin/env python3
"""
🏯 Commander Engine v4.0
========================
Agentic Tổng Tư Lệnh - Unified Infrastructure Monitor

Monitors:
- Vercel deployments
- Supabase health
- GitHub CI/CD
- Jules automated tasks

Features:
- Multi-account proxy health
- Anomaly detection
- Auto-recovery suggestions
"""

import asyncio
import json
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


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


class CommanderEngine:
    """
    🏯 Agentic Tổng Tư Lệnh
    =======================
    Unified infrastructure monitor for:
    - Vercel
    - Supabase
    - GitHub CI/CD
    - Jules
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.systems = ["vercel", "supabase", "github", "jules"]

    async def check_vercel(self) -> SystemStatus:
        """Check Vercel deployment status."""
        try:
            result = subprocess.run(
                ["vercel", "ls", "--json", "-n", "3"], capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                deployments = json.loads(result.stdout) if result.stdout else []
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
                    details={"error": result.stderr[:200]},
                )
        except subprocess.TimeoutExpired:
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
            result = subprocess.run(
                ["supabase", "projects", "list"], capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                return SystemStatus(
                    name="supabase", status=InfraStatus.HEALTHY, message="Supabase connected"
                )
            else:
                return SystemStatus(
                    name="supabase",
                    status=InfraStatus.WARNING,
                    message="Supabase CLI error",
                    details={"error": result.stderr[:200]},
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
            result = subprocess.run(
                [
                    "gh",
                    "run",
                    "list",
                    "--branch",
                    branch,
                    "--limit",
                    "3",
                    "--json",
                    "status,conclusion,name",
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                runs = json.loads(result.stdout) if result.stdout else []
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
                    details={"error": result.stderr[:200]},
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
            # Check for jules_runner module
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
            result = subprocess.run(
                ["curl", "-s", "http://localhost:8080/health"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0 and result.stdout:
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
        """Get status of all systems."""
        results = await asyncio.gather(
            self.check_proxy(),
            self.check_vercel(),
            self.check_supabase(),
            self.check_github_ci(),
            self.check_jules(),
            return_exceptions=True,
        )

        status_dict = {}
        system_names = ["proxy", "vercel", "supabase", "github", "jules"]

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
            "jules": "Run: python3 scripts/vibeos/jules_runner.py --reset",
        }
        return actions.get(system, "Manual investigation required")

    def print_dashboard(self, statuses: Dict[str, SystemStatus]):
        """Print a dashboard of all systems."""
        print("\n" + "=" * 60)
        print("🏯 COMMANDER DASHBOARD - Agentic Tổng Tư Lệnh")
        print("=" * 60 + "\n")

        status_icons = {
            InfraStatus.HEALTHY: "✅",
            InfraStatus.WARNING: "⚠️",
            InfraStatus.ERROR: "❌",
            InfraStatus.UNKNOWN: "❓",
        }

        for name, status in statuses.items():
            icon = status_icons.get(status.status, "❓")
            print(f"  {icon} {name.upper():10} │ {status.message}")

        print("\n" + "-" * 60)
        print(f"  Last check: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60 + "\n")


async def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="🏯 Commander Engine")
    parser.add_argument("--status", action="store_true", help="Full status check")
    parser.add_argument("--watch", action="store_true", help="Watch mode")
    parser.add_argument("--interval", type=int, default=30, help="Watch interval (seconds)")
    parser.add_argument("--test-vercel", action="store_true", help="Test Vercel only")
    parser.add_argument("--test-supabase", action="store_true", help="Test Supabase only")
    parser.add_argument("--test-github", action="store_true", help="Test GitHub only")
    parser.add_argument("--test-jules", action="store_true", help="Test Jules only")
    parser.add_argument("--init", action="store_true", help="Initialize commander")

    args = parser.parse_args()

    engine = CommanderEngine()

    if args.init:
        print("🏯 Commander Engine initialized!")
        print("   Run: python3 scripts/vibeos/commander_engine.py --status")
        return

    if args.test_vercel:
        result = await engine.check_vercel()
        print(f"Vercel: {result.status.value} - {result.message}")
        return

    if args.test_supabase:
        result = await engine.check_supabase()
        print(f"Supabase: {result.status.value} - {result.message}")
        return

    if args.test_github:
        result = await engine.check_github_ci()
        print(f"GitHub: {result.status.value} - {result.message}")
        return

    if args.test_jules:
        result = await engine.check_jules()
        print(f"Jules: {result.status.value} - {result.message}")
        return

    if args.watch:
        print("🏯 Commander Watch Mode (Ctrl+C to exit)")
        while True:
            statuses = await engine.full_status()
            engine.print_dashboard(statuses)

            anomalies = await engine.detect_anomalies(statuses)
            if anomalies:
                print("⚠️  ANOMALIES DETECTED:")
                for a in anomalies:
                    print(f"   • [{a.severity}] {a.system}: {a.message}")
                    if a.recovery_action:
                        print(f"     Recovery: {a.recovery_action}")

            await asyncio.sleep(args.interval)
    else:
        # Default: single status check
        statuses = await engine.full_status()
        engine.print_dashboard(statuses)

        anomalies = await engine.detect_anomalies(statuses)
        if anomalies:
            print("⚠️  ANOMALIES DETECTED:")
            for a in anomalies:
                print(f"   • [{a.severity}] {a.system}: {a.message}")
                if a.recovery_action:
                    print(f"     Recovery: {a.recovery_action}")


if __name__ == "__main__":
    asyncio.run(main())
