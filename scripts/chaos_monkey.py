#!/usr/bin/env python3
"""
🐵 Chaos Monkey
==============
Injects chaos (latency, errors, timeouts) into the Agent Swarm to test resilience.

Scenarios:
1. High Latency: Agents taking longer than timeout.
2. Random Exceptions: Agents crashing unexpectedly.
3. Resource Starvation: Flooding the queue.

Usage:
    python3 scripts/chaos_monkey.py --scenario latency --intensity 0.5
"""

import argparse
import asyncio
import logging
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.swarm.engine import AgentSwarm
from antigravity.core.swarm.enums import AgentRole, TaskPriority

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ChaosMonkey")

class ChaosMonkey:
    def __init__(self, scenario: str, intensity: float):
        self.scenario = scenario
        self.intensity = intensity # 0.0 to 1.0
        self.swarm = AgentSwarm(max_workers=5)
        self.stats = {"success": 0, "failed": 0, "timeouts": 0}

    def _chaos_handler(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """A handler that behaves badly based on scenario."""
        task_id = payload.get("id", "unknown")

        # 1. Random Exception
        if self.scenario == "exception" or self.scenario == "mixed":
            if random.random() < self.intensity:
                logger.warning(f"🐵 Casting spell 'CRASH' on task {task_id}")
                raise RuntimeError(f"Chaos Monkey crash for task {task_id}")

        # 2. Latency / Timeout
        if self.scenario == "latency" or self.scenario == "mixed":
            if random.random() < self.intensity:
                delay = random.uniform(1.0, 5.0)
                logger.warning(f"🐵 Casting spell 'SLOW' on task {task_id} (delay {delay}s)")
                time.sleep(delay)

        return {"status": "survived", "task": task_id}

    async def run(self, duration: int = 10, tasks: int = 50):
        logger.info(f"🚀 Starting Chaos Monkey (Scenario: {self.scenario}, Intensity: {self.intensity})")

        # Register chaos agent
        self.swarm.register_agent(
            name="monkey_agent",
            handler=self._chaos_handler,
            role=AgentRole.WORKER
        )

        self.swarm.start()

        task_ids = []
        # Submit tasks
        for i in range(tasks):
            try:
                tid = self.swarm.submit_task(
                    name="monkey_agent",
                    payload={"id": i},
                    timeout_seconds=2 # Short timeout to catch latency
                )
                task_ids.append(tid)
            except Exception as e:
                logger.error(f"Submission failed: {e}")

        # Wait for results
        logger.info("⏳ Waiting for chaos to settle...")
        await asyncio.sleep(duration)

        # Collect results
        for tid in task_ids:
            try:
                result = self.swarm.get_task_result(tid, wait=False)
                if result:
                    self.stats["success"] += 1
                else:
                    # In a real swarm, result might be None if pending, or error wrapped
                    # Ideally swarm returns a wrapper with status
                    # For now assuming None means pending/failed
                    self.stats["failed"] += 1
            except Exception:
                self.stats["failed"] += 1

        self.swarm.stop()
        self.report()

    def report(self):
        logger.info("="*40)
        logger.info("🐵 Chaos Report")
        logger.info(f"   Total Tasks: {sum(self.stats.values())}")
        logger.info(f"   Survived:    {self.stats['success']}")
        logger.info(f"   Failed:      {self.stats['failed']}")
        logger.info("="*40)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", choices=["latency", "exception", "mixed"], default="mixed")
    parser.add_argument("--intensity", type=float, default=0.3)
    parser.add_argument("--duration", type=int, default=5)
    parser.add_argument("--tasks", type=int, default=20)

    args = parser.parse_args()

    monkey = ChaosMonkey(args.scenario, args.intensity)
    asyncio.run(monkey.run(args.duration, args.tasks))
