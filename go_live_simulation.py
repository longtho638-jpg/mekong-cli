"""
🚀 GO-LIVE SIMULATION
=====================
Verifies the integrity of the 10x Refactored Codebase.
"""

import subprocess
import sys
from datetime import datetime


def log(msg, status="INFO"):
    icons = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARN": "⚠️"}
    print(f"{icons.get(status, '')} [{status}] {msg}")


def run_command(cmd, check=True):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if check and result.returncode != 0:
            log(f"Command failed: {cmd}\n{result.stderr}", "ERROR")
            return False
        return True
    except Exception as e:
        log(f"Execution error: {e}", "ERROR")
        return False


def check_imports():
    log("Verifying Core Imports...")
    try:
        import core.agent_orchestrator
        import core.config
        import core.finance.invoicing
        import core.growth.content_marketing
        import core.outreach.service
        import core.sales.catalog

        log("Core modules loaded successfully.", "SUCCESS")
        return True
    except ImportError as e:
        log(f"Import failed: {e}", "ERROR")
        return False


def run_tests():
    log("Running Unit Tests...")
    return run_command("pytest tests/")


def check_cli():
    log("Verifying CLI Entrypoint...")
    return run_command("python3 main.py --help")


def main():
    print("\n🏯 AGENCY OS - GO-LIVE SIMULATION")
    print("===================================\n")

    steps = [
        ("Imports Check", check_imports),
        ("CLI Check", check_cli),
        ("Test Suite", run_tests),
    ]

    failed = 0
    for name, func in steps:
        print(f"\n👉 Running: {name}")
        if func():
            log(f"{name} Passed", "SUCCESS")
        else:
            log(f"{name} Failed", "ERROR")
            failed += 1

    print("\n===================================")
    if failed == 0:
        log("ALL SYSTEMS GO. READY FOR DEPLOYMENT.", "SUCCESS")

        # Create artifact
        with open("GO_LIVE_REPORT.md", "w") as f:
            f.write(f"# Go-Live Report\nDate: {datetime.now()}\nStatus: SUCCESS\n")

        sys.exit(0)
    else:
        log(f"{failed} Critical Failures Detected.", "ERROR")
        sys.exit(1)


if __name__ == "__main__":
    main()
