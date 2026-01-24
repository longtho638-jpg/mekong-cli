#!/usr/bin/env python3
"""
📊 Agent Benchmarking Engine
===========================
Executes standardized performance tests across Antigravity agents.
Tracks latency, success rate, and token efficiency.

Usage:
    python3 scripts/benchmark_agents.py --suite research --iterations 5
"""

import argparse
import asyncio
import json
import logging

# Add project root to path
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.agent_orchestrator.engine import execute_chain
from antigravity.core.telemetry import get_telemetry

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Standardized benchmarks
BENCHMARKS = {
    "research": [
        {"suite": "strategy", "cmd": "brainstorm", "context": {"topic": "AI in healthcare"}},
        {"suite": "strategy", "cmd": "audit", "context": {"target": "competitor-x.com"}},
    ],
    "dev": [
        {"suite": "ops", "cmd": "watzup", "context": {}},
        {"suite": "docs", "cmd": "journal", "context": {"entry": "Test entry"}},
    ],
    "revenue": [
        {"suite": "revenue", "cmd": "check", "context": {}},
    ]
}

async def run_benchmark(suite: str, cmd: str, context: Dict[str, Any], iterations: int) -> Dict[str, Any]:
    """Runs a specific benchmark multiple times."""
    logger.info(f"🚀 Benchmarking {suite}:{cmd} ({iterations} iterations)")

    results = []
    for i in range(iterations):
        logger.info(f"  Iteration {i+1}/{iterations}...")
        start_time = time.perf_counter()

        try:
            # We execute the full chain
            result = execute_chain(suite, cmd, context)
            duration = (time.perf_counter() - start_time) * 1000

            results.append({
                "iteration": i + 1,
                "success": result.success,
                "duration_ms": duration,
                "steps": len(result.steps)
            })
        except Exception as e:
            logger.error(f"  ❌ Failed: {e}")
            results.append({
                "iteration": i + 1,
                "success": False,
                "error": str(e)
            })

    # Calculate stats
    durations = [r["duration_ms"] for r in results if r.get("success")]
    success_rate = sum(1 for r in results if r.get("success")) / iterations * 100
    avg_latency = sum(durations) / len(durations) if durations else 0

    return {
        "suite": suite,
        "command": cmd,
        "iterations": iterations,
        "success_rate": f"{success_rate:.1f}%",
        "avg_latency_ms": round(avg_latency, 2),
        "min_latency_ms": round(min(durations), 2) if durations else 0,
        "max_latency_ms": round(max(durations), 2) if durations else 0
    }

async def main():
    parser = argparse.ArgumentParser(description="Antigravity Agent Benchmarking CLI")
    parser.add_argument("--suite", type=str, choices=list(BENCHMARKS.keys()) + ["all"], default="all")
    parser.add_argument("--iterations", type=int, default=3)
    parser.add_argument("--output", type=str, default="reports/benchmarks/latest.json")
    args = parser.parse_args()

    suites_to_run = BENCHMARKS.keys() if args.suite == "all" else [args.suite]

    all_reports = []

    print("\n" + "="*50)
    print("🔥 ANTIGRAVITY AGENT BENCHMARK")
    print(f"   Started at: {datetime.now().isoformat()}")
    print("="*50)

    for suite_name in suites_to_run:
        for benchmark in BENCHMARKS[suite_name]:
            report = await run_benchmark(
                benchmark["suite"],
                benchmark["cmd"],
                benchmark["context"],
                args.iterations
            )
            all_reports.append(report)

            # Print immediate summary
            print(f"\n📊 SUMMARY: {report['suite']}:{report['command']}")
            print(f"   Success: {report['success_rate']}")
            print(f"   Avg Latency: {report['avg_latency_ms']}ms")

    # Save results
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "benchmarks": all_reports
        }, f, indent=2)

    print("\n" + "="*50)
    print(f"✅ Benchmark Complete. Report saved to {args.output}")
    print("="*50 + "\n")

if __name__ == "__main__":
    asyncio.run(main())
