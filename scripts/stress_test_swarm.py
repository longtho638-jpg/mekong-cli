#!/usr/bin/env python3
"""
🔥 Swarm Stress Test
====================
Simulates high-concurrency agent swarm activity to test:
1. Quota Server resilience
2. Network Optimizer stability
3. Commander monitoring load

Usage:
    python3 scripts/stress_test_swarm.py --agents 50 --duration 10
"""

import asyncio
import random
import time
import sys
import argparse
from pathlib import Path
from dataclasses import dataclass

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import MCP handlers directly for simulation
try:
    from antigravity.mcp_servers.quota_server.handlers import QuotaHandler
    from antigravity.mcp_servers.network_server.handlers import NetworkHandler
    from antigravity.mcp_servers.commander_server.handlers import CommanderHandler
except ImportError as e:
    print(f"Error importing handlers: {e}")
    sys.exit(1)

@dataclass
class AgentStats:
    requests: int = 0
    errors: int = 0
    latency_sum: float = 0.0

class SwarmSimulator:
    def __init__(self, agent_count: int, duration: int):
        self.agent_count = agent_count
        self.duration = duration
        self.quota_handler = QuotaHandler()
        self.network_handler = NetworkHandler()
        self.commander_handler = CommanderHandler()
        self.stats = AgentStats()
        self.running = False

    async def agent_loop(self, agent_id: int):
        """Simulate single agent lifecycle."""
        while self.running:
            start = time.time()
            try:
                # 1. Check Quota
                # Simulate checking quota for a model
                model = random.choice(["claude-3-5-sonnet", "gemini-1.5-pro", "gpt-4o"])
                # We don't have a direct "check_quota" method exposed in handler for single check easily
                # without full request mock, but we can call get_status
                await asyncio.to_thread(self.quota_handler.get_status)

                # 2. Check Network (simulated lightweight check)
                # Network handler get_status might be slow due to subprocess calls
                # so we'll do it less frequently or mock it if needed.
                # For stress testing, let's hit it occasionally (10% chance)
                if random.random() < 0.1:
                    await self.network_handler.get_status()

                self.stats.requests += 1
                self.stats.latency_sum += (time.time() - start)

            except Exception as e:
                self.stats.errors += 1
                # print(f"Agent {agent_id} error: {e}")

            # Random think time
            await asyncio.sleep(random.uniform(0.1, 0.5))

    async def monitor_loop(self):
        """Monitor system health during stress test."""
        while self.running:
            # Commander checks system health
            status = await self.commander_handler.full_status()
            # We explicitly don't print everything to avoid spam, just check for errors
            error_count = sum(1 for s in status.values() if s.status.value == "error")

            rps = self.stats.requests / (time.time() - self.start_time)
            print(f"📊 Load: {rps:.1f} req/s | Errors: {self.stats.errors} | System Errors: {error_count}")

            await asyncio.sleep(1)

    async def run(self):
        """Run the swarm."""
        print(f"🔥 Starting Swarm Stress Test")
        print(f"   Agents: {self.agent_count}")
        print(f"   Duration: {self.duration}s")
        print("=" * 40)

        self.running = True
        self.start_time = time.time()

        # Launch agents
        agents = [self.agent_loop(i) for i in range(self.agent_count)]

        # Launch monitor
        monitor = asyncio.create_task(self.monitor_loop())

        # Run for duration
        try:
            await asyncio.wait_for(asyncio.gather(*agents), timeout=self.duration)
        except asyncio.TimeoutError:
            self.running = False

        # Cleanup
        await monitor

        self.report()

    def report(self):
        total_time = time.time() - self.start_time
        avg_latency = (self.stats.latency_sum / self.stats.requests * 1000) if self.stats.requests else 0

        print("\n" + "=" * 40)
        print("🏁 Stress Test Results")
        print(f"   Total Requests: {self.stats.requests}")
        print(f"   Total Errors:   {self.stats.errors}")
        print(f"   Avg Latency:    {avg_latency:.2f}ms")
        print(f"   Throughput:     {self.stats.requests / total_time:.1f} req/s")

        if self.stats.errors > 0:
            print("\n❌ FAILURE: Errors detected during stress test")
            sys.exit(1)
        else:
            print("\n✅ SUCCESS: System withstood the swarm")
            sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--agents", type=int, default=20)
    parser.add_argument("--duration", type=int, default=10)
    args = parser.parse_args()

    simulator = SwarmSimulator(args.agents, args.duration)
    asyncio.run(simulator.run())
