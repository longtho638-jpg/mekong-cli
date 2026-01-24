"""
Security Server Handlers
========================
Logic for Security Armor MCP.
"""

import asyncio
import logging
import subprocess
import sys
from dataclasses import asdict, dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class GateStatus(Enum):
    """Gate check status."""
    PASS = "pass"
    FAIL = "fail"
    WARN = "warn"
    SKIP = "skip"

@dataclass
class GateResult:
    """Result of a gate check."""
    name: str
    status: str  # Converted to string for JSON serialization
    message: str
    duration_ms: int = 0
    details: Optional[str] = None

class SecurityHandler:
    """
    Security Armor Logic
    Adapted for MCP usage.
    """

    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent.parent

    async def run_all_gates(self, dry_run: bool = False) -> List[Dict[str, Any]]:
        """Run all pre-deploy gates."""
        logger.info("🛡️ Running all security gates...")
        results: List[Dict[str, Any]] = []
        gates = [
            ("Ruff Lint", self.check_ruff),
            ("TypeScript", self.check_typescript),
            ("Python Tests", self.check_pytest),
        ]

        for name, gate_fn in gates:
            start_time = asyncio.get_event_loop().time()
            result = await gate_fn(dry_run)
            duration = int((asyncio.get_event_loop().time() - start_time) * 1000)
            result.duration_ms = duration
            results.append(asdict(result))

        return results

    async def check_ruff(self, dry_run: bool = False) -> GateResult:
        """Check Ruff linting (0 errors required)."""
        if dry_run:
            return GateResult("Ruff Lint", GateStatus.SKIP.value, "Dry run")

        try:
            result = await asyncio.create_subprocess_exec(
                "ruff", "check", ".",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.project_root
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=60)

            if result.returncode == 0:
                return GateResult("Ruff Lint", GateStatus.PASS.value, "0 errors")
            else:
                output = stdout.decode()
                error_count = output.count("\n") if output else 0
                return GateResult(
                    "Ruff Lint",
                    GateStatus.FAIL.value,
                    f"{error_count} errors",
                    details=output[:500],
                )
        except FileNotFoundError:
            return GateResult("Ruff Lint", GateStatus.WARN.value, "Ruff not installed")
        except Exception as e:
            return GateResult("Ruff Lint", GateStatus.FAIL.value, str(e))

    async def check_typescript(self, dry_run: bool = False) -> GateResult:
        """Check TypeScript compilation."""
        if dry_run:
            return GateResult("TypeScript", GateStatus.SKIP.value, "Dry run")

        try:
            # Check if we have TypeScript files
            ts_files = list(self.project_root.glob("apps/**/*.ts"))
            if not ts_files:
                return GateResult("TypeScript", GateStatus.SKIP.value, "No TS files found")

            result = await asyncio.create_subprocess_exec(
                "pnpm", "typecheck",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.project_root
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=120)

            if result.returncode == 0:
                return GateResult("TypeScript", GateStatus.PASS.value, "No type errors")
            else:
                return GateResult(
                    "TypeScript", GateStatus.FAIL.value, "Type errors found", details=stderr.decode()[:500]
                )
        except FileNotFoundError:
            return GateResult("TypeScript", GateStatus.WARN.value, "pnpm not installed")
        except Exception as e:
            return GateResult("TypeScript", GateStatus.FAIL.value, str(e))

    async def check_pytest(self, dry_run: bool = False) -> GateResult:
        """Run Python tests."""
        if dry_run:
            return GateResult("Python Tests", GateStatus.SKIP.value, "Dry run")

        try:
            result = await asyncio.create_subprocess_exec(
                "pytest", "tests/", "-q", "--tb=no",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=self.project_root
            )
            stdout, stderr = await asyncio.wait_for(result.communicate(), timeout=120)

            if result.returncode == 0:
                lines = stdout.decode().strip().split("\n")
                summary = lines[-1] if lines else "Tests passed"
                return GateResult("Python Tests", GateStatus.PASS.value, summary)
            else:
                return GateResult(
                    "Python Tests", GateStatus.FAIL.value, "Tests failed", details=stdout.decode()[:500]
                )
        except FileNotFoundError:
            return GateResult("Python Tests", GateStatus.WARN.value, "pytest not installed")
        except Exception as e:
            return GateResult("Python Tests", GateStatus.FAIL.value, str(e))
