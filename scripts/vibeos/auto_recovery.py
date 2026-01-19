#!/usr/bin/env python3
"""
🏯 Auto-Recovery Engine v5.0
============================
Automatic recovery actions for detected anomalies.

Features:
- Auto-restart failed services
- Auto-fix common issues
- Notification on critical failures
"""

import asyncio
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.vibeos.commander_engine import CommanderEngine, InfraStatus


class AutoRecoveryEngine:
    """
    🛡️ Auto-Recovery for Agentic Tổng Tư Lệnh
    ==========================================
    Automatic recovery actions based on anomalies.
    """

    def __init__(self):
        self.commander = CommanderEngine()
        self.recovery_log: list[dict] = []

    async def run_recovery(self, system: str, action: str) -> bool:
        """Execute a recovery action."""
        print(f"🔧 Executing recovery for {system}: {action}")

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
                print(f"   ⚠️ No auto-recovery available for {system}")
                return False
        except Exception as e:
            print(f"   ❌ Recovery failed: {e}")
            return False

    async def _recover_proxy(self) -> bool:
        """Restart Antigravity Proxy."""
        try:
            # Check if proxy is running
            result = subprocess.run(
                ["pgrep", "-f", "antigravity-claude-proxy"], capture_output=True, text=True
            )

            if result.returncode != 0:
                # Proxy not running, start it
                subprocess.Popen(
                    ["antigravity-claude-proxy", "start"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                print("   ✅ Proxy started")
                self._log_recovery("proxy", "started")
                return True
            else:
                print("   ℹ️ Proxy already running")
                return True
        except FileNotFoundError:
            print("   ❌ antigravity-claude-proxy not installed")
            return False

    async def _recover_github_ci(self) -> bool:
        """Suggest GitHub CI recovery."""
        print("   ℹ️ GitHub CI recovery suggestions:")
        print("      1. Run: gh run view --log-failed")
        print("      2. Fix lint errors: pnpm run lint --fix")
        print("      3. Re-push: git push origin main")
        return False  # Manual intervention needed

    async def _recover_vercel(self) -> bool:
        """Suggest Vercel recovery."""
        print("   ℹ️ Vercel recovery suggestions:")
        print("      1. Run: vercel login")
        print("      2. Run: vercel --prod")
        return False  # Manual intervention needed

    async def _recover_supabase(self) -> bool:
        """Restart Supabase connection."""
        print("   ℹ️ Supabase recovery suggestions:")
        print("      1. Run: supabase login")
        print("      2. Run: supabase status")
        return False  # Manual intervention needed

    def _log_recovery(self, system: str, action: str):
        """Log a recovery action."""
        self.recovery_log.append(
            {"timestamp": datetime.now().isoformat(), "system": system, "action": action}
        )

    async def auto_recover_all(self) -> dict:
        """Check all systems and auto-recover where possible."""
        print("\n🏯 AUTO-RECOVERY ENGINE v5.0")
        print("=" * 50 + "\n")

        statuses = await self.commander.full_status()
        anomalies = await self.commander.detect_anomalies(statuses)

        results = {}

        if not anomalies:
            print("✅ All systems healthy - no recovery needed")
            return results

        print(f"⚠️ Found {len(anomalies)} anomalie(s) - attempting recovery...\n")

        for anomaly in anomalies:
            if anomaly.severity == "HIGH":
                success = await self.run_recovery(anomaly.system, anomaly.recovery_action or "")
                results[anomaly.system] = success

        print("\n" + "-" * 50)
        print("Recovery complete")
        return results


async def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="🛡️ Auto-Recovery Engine")
    parser.add_argument("--auto", action="store_true", help="Auto-recover all systems")
    parser.add_argument("--proxy", action="store_true", help="Recover proxy only")
    parser.add_argument("--daemon", action="store_true", help="Run as daemon (check every 5 min)")

    args = parser.parse_args()

    engine = AutoRecoveryEngine()

    if args.daemon:
        print("🔄 Running as daemon (Ctrl+C to stop)")
        while True:
            await engine.auto_recover_all()
            await asyncio.sleep(300)  # 5 minutes
    elif args.proxy:
        await engine._recover_proxy()
    else:
        await engine.auto_recover_all()


if __name__ == "__main__":
    asyncio.run(main())
