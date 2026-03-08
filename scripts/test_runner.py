#!/usr/bin/env python3
"""
RỪNG Test Runner - Optimized test execution for mekong-cli.

Parallel execution, smart discovery, fast fail, retry flaky tests.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import List, Optional


class TestRunner:
    """Optimized test runner with parallel execution."""

    def __init__(self, verbose: bool = False, fail_fast: bool = False):
        self.verbose = verbose
        self.fail_fast = fail_fast
        self.project_root = Path(__file__).parent.parent

    def run(
        self,
        test_paths: Optional[List[str]] = None,
        parallel: bool = True,
        max_retries: int = 2,
    ) -> int:
        """Run tests with optimization."""
        start_time = time.time()

        # Build pytest args
        args = ["-m", "pytest"]

        if self.verbose:
            args.extend(["-v", "--tb=short"])
        else:
            args.extend(["-q", "--tb=line"])

        if self.fail_fast:
            args.append("-x")

        # Parallel execution
        if parallel:
            args.extend(["-n", "auto", "--dist", "loadgroup"])

        # Add test paths
        if test_paths:
            args.extend(test_paths)
        else:
            args.append("tests/")

        # Run with retry for flaky tests
        for attempt in range(max_retries + 1):
            if attempt > 0:
                print(f"\n[yellow]Retry attempt {attempt}/{max_retries}...[/yellow]")

            result = subprocess.run(args, cwd=self.project_root)

            if result.returncode == 0:
                elapsed = time.time() - start_time
                print(f"\n[green]✓ All tests passed in {elapsed:.1f}s[/green]")
                return 0

            if self.fail_fast:
                break

        elapsed = time.time() - start_time
        print(f"\n[red]✗ Tests failed after {max_retries + 1} attempts ({elapsed:.1f}s)[/red]")
        return 1


def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="RỪNG Test Runner - Optimized test execution"
    )
    parser.add_argument(
        "paths",
        nargs="*",
        help="Test paths to run (default: tests/)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Verbose output",
    )
    parser.add_argument(
        "-x", "--fail-fast",
        action="store_true",
        help="Stop on first failure",
    )
    parser.add_argument(
        "--no-parallel",
        action="store_true",
        help="Disable parallel execution",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=2,
        help="Max retries for flaky tests (default: 2)",
    )

    args = parser.parse_args()

    runner = TestRunner(verbose=args.verbose, fail_fast=args.fail_fast)
    sys.exit(
        runner.run(
            test_paths=args.paths or None,
            parallel=not args.no_parallel,
            max_retries=args.retries,
        )
    )


if __name__ == "__main__":
    main()
