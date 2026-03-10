#!/usr/bin/env python3
"""
Example: DAG Scheduler for Parallel Task Execution

Demonstrates how to use Mekong's DAG scheduler to run
independent tasks in parallel with dependency management.
"""

from mekong.core.dag_scheduler import DAGScheduler, validate_dag
from mekong.core.executor import RecipeExecutor
import asyncio


async def main():
    # Define a workflow with dependencies
    #
    # Task graph:
    #   A → C → E
    #   B → D → F
    #
    # A and B can run in parallel
    # C depends on A, D depends on B
    # E depends on C, F depends on D

    dag = {
        "nodes": {
            "A": {"command": "echo 'Task A' && sleep 1"},
            "B": {"command": "echo 'Task B' && sleep 1"},
            "C": {"command": "echo 'Task C (depends on A)' && sleep 1"},
            "D": {"command": "echo 'Task D (depends on B)' && sleep 1"},
            "E": {"command": "echo 'Task E (depends on C)' && sleep 1"},
            "F": {"command": "echo 'Task F (depends on D)' && sleep 1"},
        },
        "edges": [
            ("A", "C"),
            ("B", "D"),
            ("C", "E"),
            ("D", "F"),
        ],
    }

    # Validate DAG
    is_valid, error = validate_dag(dag)
    print(f"DAG valid: {is_valid}")
    if not is_valid:
        print(f"Error: {error}")
        return

    # Create scheduler and execute
    scheduler = DAGScheduler(dag)
    executor = RecipeExecutor()

    print("\n=== Executing DAG ===")
    results = await scheduler.execute(executor)

    print("\n=== Results ===")
    for task_id, result in results.items():
        status = "✅" if result.exit_code == 0 else "❌"
        print(f"{status} {task_id}: {result.stdout.strip()}")

    print("\n✅ DAG execution completed!")


if __name__ == "__main__":
    asyncio.run(main())
