
import time
from antigravity.core.swarm.engine import AgentSwarm
from antigravity.core.swarm.enums import AgentRole, TaskPriority, TaskStatus
from antigravity.core.swarm.models import SwarmAgent, SwarmTask

import pytest


@pytest.fixture
def swarm():
    s = AgentSwarm()
    s.start()
    yield s
    s.stop()

def test_agent_registration(swarm):
    # Mock handler
    def handler(payload): return "ok"

    agent = swarm.register_agent(
        name="TestAgent",
        handler=handler,
        role=AgentRole.SPECIALIST,
        specialties=["test"]
    )
    # register_agent returns ID, not object
    assert agent is not None
    assert isinstance(agent, str)

    status = swarm.get_status()
    # Check agents by ID
    assert status["agents"][agent]["name"] == "TestAgent"
    assert status["agents"][agent]["role"] == AgentRole.SPECIALIST.value

def test_task_submission(swarm):
    task_id = swarm.submit_task(
        name="Test task",
        payload={"data": "test"},
        priority=TaskPriority.HIGH
    )
    assert task_id is not None

    status = swarm.get_status()
    assert status["pending_tasks"] == 1

def test_task_execution(swarm):
    # Define a task handler function
    def handler(payload):
        time.sleep(0.1)
        return "result"

    # Register a capable agent
    swarm.register_agent(
        name="Worker",
        handler=handler,
        role=AgentRole.WORKER
    )

    task_id = swarm.submit_task(
        name="Quick task",
        payload={"data": "compute"},
        priority=TaskPriority.CRITICAL
    )

    # Wait for execution (simulated)
    # The engine runs in a thread. We need to wait.
    for _ in range(50):
        result = swarm.get_task_result(task_id, wait=False)
        if result == "result":
            break
        time.sleep(0.1)

    result = swarm.get_task_result(task_id)
    assert result == "result"

    metrics = swarm.get_metrics()
    assert metrics.completed_tasks >= 1

def test_priority_scheduling(swarm):
    # Submit low priority task first
    t1 = swarm.submit_task("Low", payload={}, priority=TaskPriority.LOW)
    # Submit critical priority task second
    t2 = swarm.submit_task("Critical", payload={}, priority=TaskPriority.CRITICAL)

    # With no agents, they sit in queue.
    # Check internal queue order (accessing task_manager's queue for testing)
    assert len(swarm.task_manager.task_queue) == 2
    assert swarm.task_manager.task_queue[0] == t2  # Critical should be first
    assert swarm.task_manager.task_queue[1] == t1  # Low should be second
