"""
Verification script for Agent Swarm Refactor.
"""
import os
import sys
import threading
import time

# Add project root to path
sys.path.insert(0, os.getcwd())

from antigravity.core.agent_swarm import (
    AgentRole,
    TaskPriority,
    TaskStatus,
    get_swarm,
    get_task_result,
    register_agent,
    start_swarm,
    stop_swarm,
    submit_task,
)


def test_handler(payload):
    print(f"   Agent processing: {payload}")
    time.sleep(0.1)  # Simulate work
    return f"Processed {payload}"

def verify_swarm():
    print("Testing Agent Swarm Refactor...")

    # 1. Start Swarm
    print("\n1. Starting Swarm...")
    swarm = get_swarm(max_workers=2)
    start_swarm()

    if not swarm._running:
        print("❌ Swarm failed to start")
        return False

    print("   Swarm started ✅")

    # 2. Register Agent
    print("\n2. Registering Agent...")
    agent_id = register_agent(
        name="TestAgent",
        handler=test_handler,
        role=AgentRole.WORKER
    )
    print(f"   Agent registered: {agent_id}")

    # 3. Submit Task
    print("\n3. Submitting Task...")
    task_id = submit_task(
        name="TestTask",
        payload="Hello World",
        priority=TaskPriority.HIGH
    )
    print(f"   Task submitted: {task_id}")

    # 4. Wait for Result
    print("\n4. Waiting for Result...")
    result = get_task_result(task_id, wait=True, timeout=2.0)

    if result != "Processed Hello World":
        print(f"❌ Unexpected result: {result}")
        stop_swarm()
        return False

    print(f"   Got result: {result} ✅")

    # 5. Check Metrics
    print("\n5. Checking Metrics...")
    metrics = swarm.get_metrics()
    print(f"   Completed tasks: {metrics.completed_tasks}")

    if metrics.completed_tasks < 1:
        print("❌ Metrics not updated")
        stop_swarm()
        return False

    # 6. Stop Swarm
    print("\n6. Stopping Swarm...")
    stop_swarm()

    if swarm._running:
        print("❌ Swarm failed to stop")
        return False

    print("   Swarm stopped ✅")

    print("\n✅ Verification Successful!")
    return True

if __name__ == "__main__":
    try:
        if verify_swarm():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Exception during verification: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
