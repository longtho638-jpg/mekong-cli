#!/usr/bin/env python3
"""
Swarm CLI Shim
==============
Direct interface to the Swarm Intelligence system.
"""
import argparse
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from antigravity.core.swarm.orchestrator import SwarmOrchestrator
from antigravity.core.swarm.patterns.dev_swarm import ArchitectAgent, CoderAgent, ReviewerAgent


async def run_swarm(task: str, swarm_type: str = "dev"):
    print(f"🐝 Starting {swarm_type} swarm for task: {task}")

    swarm = SwarmOrchestrator()
    bus = swarm.bus

    # Register agents based on swarm type
    if swarm_type == "dev":
        swarm.register_agent(ArchitectAgent("architect", "Architect", bus))
        swarm.register_agent(CoderAgent("coder", "Coder", bus))
        swarm.register_agent(ReviewerAgent("reviewer", "Reviewer", bus))

        # Start the chain
        swarm.dispatch("architect", task)

    elif swarm_type == "growth":
        # Import growth agents only if needed
        from antigravity.core.swarm.patterns.growth_swarm import (
            ContentCreatorAgent,
            SocialManagerAgent,
            StrategistAgent,
        )
        swarm.register_agent(StrategistAgent("strategist", "Strategist", bus))
        swarm.register_agent(ContentCreatorAgent("creator", "Creator", bus))
        swarm.register_agent(SocialManagerAgent("social", "Social Manager", bus))

        swarm.dispatch("strategist", task)

    # Keep alive briefly to allow async processing
    await asyncio.sleep(2)
    print("✅ Swarm execution completed")

def main():
    parser = argparse.ArgumentParser(description="Antigravity Swarm CLI")
    parser.add_argument("task", help="The task description")
    parser.add_argument("--type", default="dev", choices=["dev", "growth"], help="Swarm type")

    args = parser.parse_args()

    asyncio.run(run_swarm(args.task, args.type))

if __name__ == "__main__":
    main()
