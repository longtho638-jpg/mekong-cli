"""
Recovery Server Handlers
========================
Logic for Auto-Recovery MCP.
"""

import asyncio
import logging
import subprocess

# Import CommanderHandler to get system status
from antigravity.mcp_servers.commander_server.handlers import CommanderHandler, InfraStatus
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)


class RecoveryHandler:
    """
    Auto-Recovery Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.commander = CommanderHandler()
        self.recovery_log: list[dict] = []

    async def auto_recover_all(self) -> Dict[str, Any]:
        """Check all systems and auto-recover where possible."""
        statuses = await self.commander.full_status()
        anomalies = await self.commander.detect_anomalies(statuses)

        results = {}

        if not anomalies:
            return {
                "recovered": False,
                "message": "✅ All systems healthy - no recovery needed",
                "actions": {}
            }

        actions = {}
        for anomaly in anomalies:
            if anomaly.severity == "HIGH":
                success = await self.run_recovery(anomaly.system)
                actions[anomaly.system] = "Recovered" if success else "Failed"
                results[anomaly.system] = success

        return {
            "recovered": True,
            "message": f"⚠️ Found {len(anomalies)} anomalies",
            "actions": actions,
            "details": [a.message for a in anomalies]
        }

    async def run_recovery(self, system: str) -> bool:
        """Execute a recovery action."""
        try:
            if system == "proxy":
                return await self._recover_proxy()
            elif system == "github":
                return await self._recover_github_ci()
            elif system == "vercel":
                return await self._recover_vercel()
            elif system == "supabase":
                return await self._recover_supabase()
            else:
                return False
        except Exception as e:
            self._log_recovery(system, f"Failed: {str(e)}")
            return False

    async def _recover_proxy(self) -> bool:
        """Restart Antigravity Proxy."""
        try:
            # Check if proxy is running
            result = await asyncio.create_subprocess_exec(
                "pgrep", "-f", "antigravity-claude-proxy",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            await result.communicate()

            if result.returncode != 0:
                # Proxy not running, start it
                subprocess.Popen(
                    ["antigravity-claude-proxy", "start"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                self._log_recovery("proxy", "started")
                return True
            else:
                return True
        except FileNotFoundError:
            return False

    async def _recover_github_ci(self) -> bool:
        """Suggest GitHub CI recovery."""
        # Manual intervention usually needed
        return False

    async def _recover_vercel(self) -> bool:
        """Suggest Vercel recovery."""
        # Manual intervention usually needed
        return False

    async def _recover_supabase(self) -> bool:
        """Restart Supabase connection."""
        # Manual intervention usually needed
        return False

    def _log_recovery(self, system: str, action: str):
        """Log a recovery action."""
        self.recovery_log.append(
            {"timestamp": datetime.now().isoformat(), "system": system, "action": action}
        )
