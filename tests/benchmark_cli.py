#!/usr/bin/env python3
"""
CLI Performance Benchmark
==========================
Measures startup time and --help response time for mekong-cli commands.

Target: --help should respond in <200ms
Measures:
1. Main CLI startup time
2. Individual command module load times
3. --help response times
4. Import overhead analysis

Usage:
    python tests/benchmark_cli.py
    python tests/benchmark_cli.py --verbose
    python tests/benchmark_cli.py --export-json report.json
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


class PerformanceBenchmark:
    """CLI performance benchmark runner."""

    # Performance thresholds (milliseconds)
    EXCELLENT_MS = 100
    GOOD_MS = 200
    WARNING_MS = 500
    CRITICAL_MS = 1000

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.results: Dict[str, Dict] = {}

    def measure_command(self, cmd: List[str], name: str, iterations: int = 5) -> Dict:
        """Measure command execution time over multiple iterations.

        Args:
            cmd: Command to execute as list
            name: Name for this benchmark
            iterations: Number of times to run (default: 5)

        Returns:
            Dict with timing statistics
        """
        times = []

        for i in range(iterations):
            start = time.perf_counter()
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    timeout=5,
                    cwd=PROJECT_ROOT,
                )
                elapsed = (time.perf_counter() - start) * 1000  # Convert to ms
                times.append(elapsed)

                if self.verbose:
                    print(f"  Iteration {i+1}: {elapsed:.1f}ms")

            except subprocess.TimeoutExpired:
                times.append(5000)  # 5 second timeout
                if self.verbose:
                    print(f"  Iteration {i+1}: TIMEOUT")
            except Exception as e:
                if self.verbose:
                    print(f"  Iteration {i+1}: ERROR - {e}")
                times.append(None)

        # Filter out None values
        valid_times = [t for t in times if t is not None]

        if not valid_times:
            return {
                "name": name,
                "min_ms": None,
                "max_ms": None,
                "avg_ms": None,
                "median_ms": None,
                "status": "ERROR",
            }

        # Calculate statistics
        valid_times.sort()
        avg_ms = sum(valid_times) / len(valid_times)
        median_ms = valid_times[len(valid_times) // 2]

        # Determine status
        if avg_ms < self.EXCELLENT_MS:
            status = "EXCELLENT"
        elif avg_ms < self.GOOD_MS:
            status = "GOOD"
        elif avg_ms < self.WARNING_MS:
            status = "WARNING"
        elif avg_ms < self.CRITICAL_MS:
            status = "SLOW"
        else:
            status = "CRITICAL"

        return {
            "name": name,
            "min_ms": min(valid_times),
            "max_ms": max(valid_times),
            "avg_ms": avg_ms,
            "median_ms": median_ms,
            "iterations": len(valid_times),
            "status": status,
        }

    def benchmark_main_cli(self) -> Dict:
        """Benchmark main CLI --help."""
        print(f"\n{BOLD}Benchmarking Main CLI{RESET}")
        print("=" * 60)

        cmd = [sys.executable, "-m", "cli.entrypoint", "--help"]
        result = self.measure_command(cmd, "mekong --help")
        self.results["main_cli"] = result

        self._print_result(result)
        return result

    def benchmark_command_modules(self) -> Dict[str, Dict]:
        """Benchmark individual command modules."""
        print(f"\n{BOLD}Benchmarking Command Modules{RESET}")
        print("=" * 60)

        # Find all command modules
        commands_dir = PROJECT_ROOT / "cli" / "commands"
        command_files = list(commands_dir.glob("*.py"))
        command_files = [f for f in command_files if f.name != "__init__.py"]

        results = {}

        for cmd_file in sorted(command_files):
            cmd_name = cmd_file.stem

            # Test --help for this command
            cmd = [sys.executable, "-m", "cli.entrypoint", cmd_name, "--help"]
            result = self.measure_command(cmd, f"{cmd_name} --help", iterations=3)
            results[cmd_name] = result

            self._print_result(result)

        self.results["commands"] = results
        return results

    def benchmark_import_time(self) -> Dict:
        """Benchmark import time of key modules."""
        print(f"\n{BOLD}Benchmarking Import Times{RESET}")
        print("=" * 60)

        modules_to_test = [
            "cli.entrypoint",
            "cli.commands.revenue",
            "cli.commands.deploy",
            "cli.commands.test",
            "cli.commands.plan",
            "core.constants",
            "typer",
            "rich.console",
        ]

        results = {}

        for module in modules_to_test:
            cmd = [
                sys.executable,
                "-c",
                f"import time; start=time.perf_counter(); import {module}; print((time.perf_counter()-start)*1000)",
            ]

            try:
                output = subprocess.check_output(cmd, timeout=5, cwd=PROJECT_ROOT)
                import_time = float(output.decode().strip())

                # Determine status
                if import_time < 50:
                    status = "EXCELLENT"
                elif import_time < 100:
                    status = "GOOD"
                elif import_time < 200:
                    status = "WARNING"
                else:
                    status = "SLOW"

                result = {
                    "name": module,
                    "import_ms": import_time,
                    "status": status,
                }
                results[module] = result

                self._print_import_result(result)

            except Exception as e:
                if self.verbose:
                    print(f"{RED}✗{RESET} {module}: ERROR - {e}")
                results[module] = {"name": module, "import_ms": None, "status": "ERROR"}

        self.results["imports"] = results
        return results

    def _print_result(self, result: Dict):
        """Print a formatted benchmark result."""
        status = result["status"]
        avg_ms = result.get("avg_ms")

        if avg_ms is None:
            print(f"{RED}✗{RESET} {result['name']}: ERROR")
            return

        # Color based on status
        if status == "EXCELLENT":
            color = GREEN
            symbol = "✓"
        elif status == "GOOD":
            color = GREEN
            symbol = "✓"
        elif status == "WARNING":
            color = YELLOW
            symbol = "⚠"
        else:
            color = RED
            symbol = "✗"

        print(
            f"{color}{symbol}{RESET} {result['name']:<30} "
            f"{avg_ms:>6.1f}ms (min: {result['min_ms']:.1f}ms, "
            f"max: {result['max_ms']:.1f}ms) [{status}]"
        )

    def _print_import_result(self, result: Dict):
        """Print a formatted import result."""
        status = result["status"]
        import_ms = result.get("import_ms")

        if import_ms is None:
            print(f"{RED}✗{RESET} {result['name']}: ERROR")
            return

        if status == "EXCELLENT":
            color = GREEN
            symbol = "✓"
        elif status == "GOOD":
            color = GREEN
            symbol = "✓"
        elif status == "WARNING":
            color = YELLOW
            symbol = "⚠"
        else:
            color = RED
            symbol = "✗"

        print(f"{color}{symbol}{RESET} {result['name']:<30} {import_ms:>6.1f}ms [{status}]")

    def print_summary(self):
        """Print summary and recommendations."""
        print(f"\n{BOLD}Performance Summary{RESET}")
        print("=" * 60)

        # Count by status
        all_results = []

        if "main_cli" in self.results:
            all_results.append(self.results["main_cli"])

        if "commands" in self.results:
            all_results.extend(self.results["commands"].values())

        status_counts = {
            "EXCELLENT": 0,
            "GOOD": 0,
            "WARNING": 0,
            "SLOW": 0,
            "CRITICAL": 0,
            "ERROR": 0,
        }

        for result in all_results:
            status = result.get("status", "ERROR")
            status_counts[status] = status_counts.get(status, 0) + 1

        # Print status distribution
        total = len(all_results)
        print(f"\nTotal Benchmarks: {total}")
        print(f"{GREEN}✓{RESET} Excellent (<100ms): {status_counts['EXCELLENT']}")
        print(f"{GREEN}✓{RESET} Good (<200ms):      {status_counts['GOOD']}")
        print(f"{YELLOW}⚠{RESET} Warning (<500ms):  {status_counts['WARNING']}")
        print(f"{RED}✗{RESET} Slow (<1000ms):    {status_counts['SLOW']}")
        print(f"{RED}✗{RESET} Critical (>1000ms): {status_counts['CRITICAL']}")
        print(f"{RED}✗{RESET} Errors:            {status_counts['ERROR']}")

        # Performance score (percentage of commands meeting target)
        target_met = status_counts["EXCELLENT"] + status_counts["GOOD"]
        score = (target_met / total * 100) if total > 0 else 0

        print(f"\n{BOLD}Performance Score:{RESET} {score:.1f}% (target: >80%)")

        # Recommendations
        print(f"\n{BOLD}Recommendations:{RESET}")

        if status_counts["SLOW"] > 0 or status_counts["CRITICAL"] > 0:
            print("\n⚠️  Slow commands detected. Consider:")
            print("   - Use lazy imports (import inside functions)")
            print("   - Defer heavy module loads until actually needed")
            print("   - Cache expensive computations")
            print("   - Profile with `python -m cProfile -s cumtime`")

        if "imports" in self.results:
            slow_imports = [
                name
                for name, result in self.results["imports"].items()
                if result.get("status") in ["WARNING", "SLOW"]
            ]
            if slow_imports:
                print("\n⚠️  Slow imports detected:")
                for module in slow_imports:
                    print(f"   - {module}")
                print("   Consider lazy loading these modules")

        # Check if target met
        main_cli = self.results.get("main_cli", {})
        main_avg = main_cli.get("avg_ms", float("inf"))

        if main_avg < 200:
            print(f"\n{GREEN}✓ Target met:{RESET} Main CLI --help < 200ms ({main_avg:.1f}ms)")
        else:
            print(
                f"\n{RED}✗ Target missed:{RESET} Main CLI --help > 200ms ({main_avg:.1f}ms)"
            )

    def export_json(self, filepath: str):
        """Export results to JSON file."""
        with open(filepath, "w") as f:
            json.dump(self.results, f, indent=2)
        print(f"\n{GREEN}✓{RESET} Results exported to: {filepath}")


def main():
    """Main benchmark runner."""
    parser = argparse.ArgumentParser(description="CLI Performance Benchmark")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--export-json", metavar="FILE", help="Export results to JSON")
    parser.add_argument("--quick", action="store_true", help="Quick benchmark (fewer iterations)")

    args = parser.parse_args()

    print(f"{BOLD}MEKONG-CLI Performance Benchmark{RESET}")
    print("=" * 60)
    print("Target: --help responds in <200ms")
    print(f"Python: {sys.version.split()[0]}")
    print(f"Project: {PROJECT_ROOT}")

    benchmark = PerformanceBenchmark(verbose=args.verbose)

    # Run benchmarks
    benchmark.benchmark_main_cli()
    benchmark.benchmark_command_modules()
    benchmark.benchmark_import_time()

    # Print summary
    benchmark.print_summary()

    # Export if requested
    if args.export_json:
        benchmark.export_json(args.export_json)


if __name__ == "__main__":
    main()
