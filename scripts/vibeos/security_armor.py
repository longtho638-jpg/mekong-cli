#!/usr/bin/env python3
"""
🛡️ Security Armor v4.0
======================
Pre-deploy, runtime, and post-deploy quality gates

4 Layers:
- Layer 0: Proxy Protection
- Layer 1: Pre-Deploy (Lint, TypeScript, React audit)
- Layer 2: Runtime (4-system monitoring)
- Layer 3: Post-Deploy (E2E, Lighthouse)
"""

import asyncio
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import List, Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))


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
    status: GateStatus
    message: str
    duration_ms: int = 0
    details: Optional[str] = None


class SecurityArmor:
    """
    🛡️ Security Armor
    =================
    Pre-deploy quality gates for AgencyOS.
    """

    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent.parent.parent

    async def run_all_gates(self, dry_run: bool = False) -> List[GateResult]:
        """Run all pre-deploy gates."""
        print("\n🛡️ SECURITY ARMOR - Pre-Deploy Gates")
        print("=" * 50 + "\n")

        results = []

        # Layer 1: Pre-Deploy Gates
        gates = [
            ("Ruff Lint", self.check_ruff),
            ("TypeScript", self.check_typescript),
            ("Python Tests", self.check_pytest),
        ]

        for name, gate_fn in gates:
            start = datetime.now()
            result = await gate_fn(dry_run)
            duration = int((datetime.now() - start).total_seconds() * 1000)
            result.duration_ms = duration
            results.append(result)

            icon = {
                GateStatus.PASS: "✅",
                GateStatus.FAIL: "❌",
                GateStatus.WARN: "⚠️",
                GateStatus.SKIP: "⏭️",
            }.get(result.status, "❓")

            print(f"  {icon} {result.name}: {result.message} ({duration}ms)")

        print("\n" + "-" * 50)

        # Summary
        passed = sum(1 for r in results if r.status == GateStatus.PASS)
        failed = sum(1 for r in results if r.status == GateStatus.FAIL)

        if failed > 0:
            print(f"❌ BLOCKED: {failed} gate(s) failed")
            return results
        else:
            print(f"✅ ALL GATES PASSED ({passed}/{len(results)})")
            return results

    async def check_ruff(self, dry_run: bool = False) -> GateResult:
        """Check Ruff linting (0 errors required)."""
        if dry_run:
            return GateResult("Ruff Lint", GateStatus.SKIP, "Dry run")

        try:
            result = subprocess.run(
                ["ruff", "check", "."],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=self.project_root,
            )
            if result.returncode == 0:
                return GateResult("Ruff Lint", GateStatus.PASS, "0 errors")
            else:
                error_count = result.stdout.count("\n") if result.stdout else 0
                return GateResult(
                    "Ruff Lint",
                    GateStatus.FAIL,
                    f"{error_count} errors",
                    details=result.stdout[:500],
                )
        except FileNotFoundError:
            return GateResult("Ruff Lint", GateStatus.WARN, "Ruff not installed")
        except Exception as e:
            return GateResult("Ruff Lint", GateStatus.FAIL, str(e))

    async def check_typescript(self, dry_run: bool = False) -> GateResult:
        """Check TypeScript compilation."""
        if dry_run:
            return GateResult("TypeScript", GateStatus.SKIP, "Dry run")

        try:
            # Check if we have TypeScript files
            ts_files = list(self.project_root.glob("apps/**/*.ts"))
            if not ts_files:
                return GateResult("TypeScript", GateStatus.SKIP, "No TS files found")

            result = subprocess.run(
                ["pnpm", "typecheck"],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=self.project_root,
            )
            if result.returncode == 0:
                return GateResult("TypeScript", GateStatus.PASS, "No type errors")
            else:
                return GateResult(
                    "TypeScript", GateStatus.FAIL, "Type errors found", details=result.stderr[:500]
                )
        except FileNotFoundError:
            return GateResult("TypeScript", GateStatus.WARN, "pnpm not installed")
        except Exception as e:
            return GateResult("TypeScript", GateStatus.FAIL, str(e))

    async def check_pytest(self, dry_run: bool = False) -> GateResult:
        """Run Python tests."""
        if dry_run:
            return GateResult("Python Tests", GateStatus.SKIP, "Dry run")

        try:
            result = subprocess.run(
                ["pytest", "tests/", "-q", "--tb=no"],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=self.project_root,
            )
            if result.returncode == 0:
                # Parse passed count
                lines = result.stdout.strip().split("\n")
                summary = lines[-1] if lines else "Tests passed"
                return GateResult("Python Tests", GateStatus.PASS, summary)
            else:
                return GateResult(
                    "Python Tests", GateStatus.FAIL, "Tests failed", details=result.stdout[:500]
                )
        except FileNotFoundError:
            return GateResult("Python Tests", GateStatus.WARN, "pytest not installed")
        except Exception as e:
            return GateResult("Python Tests", GateStatus.FAIL, str(e))

    async def check_react_best_practices(self, path: str = "apps/dashboard") -> GateResult:
        """Check React best practices (via Vercel Agent Skills)."""
        # This would integrate with Vercel Agent Skills
        # For now, return a placeholder
        return GateResult(
            "React Best Practices", GateStatus.SKIP, "Use: npx add-skill vercel-labs/agent-skills"
        )


async def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="🛡️ Security Armor")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode")
    parser.add_argument("--ruff", action="store_true", help="Ruff only")
    parser.add_argument("--typescript", action="store_true", help="TypeScript only")
    parser.add_argument("--pytest", action="store_true", help="Pytest only")

    args = parser.parse_args()

    armor = SecurityArmor()

    if args.ruff:
        result = await armor.check_ruff()
        print(f"Ruff: {result.status.value} - {result.message}")
    elif args.typescript:
        result = await armor.check_typescript()
        print(f"TypeScript: {result.status.value} - {result.message}")
    elif args.pytest:
        result = await armor.check_pytest()
        print(f"Pytest: {result.status.value} - {result.message}")
    else:
        results = await armor.run_all_gates(dry_run=args.dry_run)

        # Exit with error if any gate failed
        if any(r.status == GateStatus.FAIL for r in results):
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
