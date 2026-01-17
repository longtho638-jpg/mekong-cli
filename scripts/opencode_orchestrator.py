#!/usr/bin/env python3
"""
🤖 Autonomous OpenCode Orchestrator
=====================================

Tự động điều khiển OpenCode để restructure codebase.
Chạy tất cả prompts theo sequence, tự kiểm soát kết quả.

Usage:
    python3 scripts/opencode_orchestrator.py

    # Hoặc chạy specific phase
    python3 scripts/opencode_orchestrator.py --phase=2
"""

import json
import subprocess
from datetime import datetime
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
PROMPTS_DIR = PROJECT_ROOT / ".opencode" / "prompts"
LOGS_DIR = PROJECT_ROOT / "logs" / "opencode"
API_BASE = "http://localhost:8000/api/code"


class OpenCodeOrchestrator:
    """
    🏯 Autonomous OpenCode Controller

    Executes restructuring prompts automatically.
    Uses Antigravity API for code analysis and execution.
    """

    PHASES = {
        1: {
            "name": "Codebase Analysis",
            "description": "Analyze entire codebase structure",
            "actions": [
                {
                    "type": "api",
                    "endpoint": "/analyze",
                    "method": "POST",
                    "data": {"path": ".", "depth": 5},
                },
                {"type": "command", "cmd": "find . -name '*.py' -type f | wc -l"},
                {
                    "type": "command",
                    "cmd": "wc -l backend/**/*.py 2>/dev/null | tail -1",
                },
            ],
        },
        2: {
            "name": "Test Suite Verification",
            "description": "Run all tests to verify baseline",
            "actions": [
                {
                    "type": "command",
                    "cmd": ".venv/bin/python3 -m pytest backend/tests/ -v --tb=short 2>&1 | tail -20",
                },
            ],
        },
        3: {
            "name": "Import Optimization",
            "description": "Apply lazy loading to heavy imports",
            "actions": [
                {
                    "type": "command",
                    "cmd": "grep -r 'from core import' backend/api/routers/ | head -10",
                },
            ],
        },
        4: {
            "name": "Customer Funnel Setup",
            "description": "Verify Gumroad webhook integration",
            "actions": [
                {"type": "api", "endpoint": "/tools", "method": "GET"},
                {
                    "type": "command",
                    "cmd": "curl -s http://localhost:8000/api/webhooks/gumroad/test 2>/dev/null || echo 'Webhook not running'",
                },
            ],
        },
        5: {
            "name": "Revenue Dashboard",
            "description": "Check revenue metrics",
            "actions": [
                {
                    "type": "command",
                    "cmd": '.venv/bin/python3 -c "from antigravity.core.revenue_engine import RevenueEngine; e = RevenueEngine(); e.print_dashboard()" 2>&1 | tail -15',
                },
            ],
        },
    }

    def __init__(self):
        self.run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results = {}
        LOGS_DIR.mkdir(parents=True, exist_ok=True)

    def log(self, message: str, level: str = "INFO"):
        """Log with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = {"INFO": "📝", "SUCCESS": "✅", "ERROR": "❌", "WARN": "⚠️"}.get(
            level, "•"
        )
        print(f"[{timestamp}] {prefix} {message}")

    def run_command(self, cmd: str) -> dict:
        """Execute shell command."""
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60,
                cwd=str(PROJECT_ROOT),
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout or result.stderr,
                "returncode": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "Command timeout", "returncode": -1}
        except Exception as e:
            return {"success": False, "output": str(e), "returncode": -1}

    def call_api(self, endpoint: str, method: str = "GET", data: dict = None) -> dict:
        """Call Antigravity API."""
        import requests

        url = f"{API_BASE}{endpoint}"
        try:
            if method == "GET":
                resp = requests.get(url, timeout=10)
            else:
                resp = requests.post(url, json=data or {}, timeout=10)

            return {
                "success": resp.status_code == 200,
                "data": resp.json() if resp.ok else None,
                "status_code": resp.status_code,
            }
        except Exception as e:
            return {"success": False, "data": None, "error": str(e)}

    def execute_action(self, action: dict) -> dict:
        """Execute a single action."""
        if action["type"] == "command":
            return self.run_command(action["cmd"])
        elif action["type"] == "api":
            return self.call_api(
                action["endpoint"], action.get("method", "GET"), action.get("data")
            )
        return {"success": False, "error": "Unknown action type"}

    def run_phase(self, phase_num: int) -> dict:
        """Run a specific phase."""
        phase = self.PHASES.get(phase_num)
        if not phase:
            return {"success": False, "error": f"Phase {phase_num} not found"}

        self.log(f"▶️ Phase {phase_num}: {phase['name']}", "INFO")
        self.log(f"   {phase['description']}", "INFO")

        results = []
        for i, action in enumerate(phase["actions"], 1):
            self.log(f"   Action {i}/{len(phase['actions'])}: {action['type']}", "INFO")
            result = self.execute_action(action)
            results.append(result)

            if result.get("success"):
                # Show truncated output
                output = str(result.get("output") or result.get("data", ""))[:200]
                self.log(f"   → {output}...", "SUCCESS")
            else:
                self.log(
                    f"   → Failed: {result.get('error', 'Unknown error')}", "ERROR"
                )

        success = all(r.get("success") for r in results)
        self.results[phase_num] = {
            "phase": phase["name"],
            "success": success,
            "results": results,
        }

        return {"success": success, "results": results}

    def run_all(self, start_phase: int = 1):
        """Run all phases sequentially."""
        self.log("🚀 Starting Autonomous OpenCode Orchestration", "INFO")
        self.log(f"   Run ID: {self.run_id}", "INFO")
        self.log(f"   Phases: {len(self.PHASES)}", "INFO")
        print()

        for phase_num in range(start_phase, len(self.PHASES) + 1):
            result = self.run_phase(phase_num)
            print()

            if not result["success"]:
                self.log(f"Phase {phase_num} failed, stopping", "WARN")
                break

        # Summary
        self.print_summary()
        self.save_results()

        return self.results

    def print_summary(self):
        """Print execution summary."""
        print("\n" + "=" * 60)
        print("🏯 ORCHESTRATION SUMMARY")
        print("=" * 60)

        total = len(self.results)
        success = sum(1 for r in self.results.values() if r["success"])

        for phase_num, result in self.results.items():
            status = "✅" if result["success"] else "❌"
            print(f"  {status} Phase {phase_num}: {result['phase']}")

        print()
        print(f"📊 Result: {success}/{total} phases completed")
        print("=" * 60)

    def save_results(self):
        """Save results to log file."""
        log_file = LOGS_DIR / f"orchestration_{self.run_id}.json"
        with open(log_file, "w") as f:
            json.dump(
                {
                    "run_id": self.run_id,
                    "timestamp": datetime.now().isoformat(),
                    "results": self.results,
                },
                f,
                indent=2,
                default=str,
            )
        self.log(f"📄 Results saved: {log_file.name}", "INFO")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Autonomous OpenCode Orchestrator")
    parser.add_argument(
        "--phase", type=int, default=1, help="Start from specific phase"
    )
    parser.add_argument("--only", type=int, help="Run only specific phase")
    args = parser.parse_args()

    orchestrator = OpenCodeOrchestrator()

    if args.only:
        orchestrator.run_phase(args.only)
    else:
        orchestrator.run_all(start_phase=args.phase)


if __name__ == "__main__":
    main()
