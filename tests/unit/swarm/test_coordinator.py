import time
from antigravity.core.swarm.coordinator import SwarmCoordinator
from antigravity.core.swarm.enums import AgentRole, TaskPriority, TaskStatus
from antigravity.core.swarm.models import SwarmTask
from antigravity.core.swarm.state import SwarmState
from unittest.mock import MagicMock

import pytest


class TestSwarmCoordinator:
    @pytest.fixture
    def mock_swarm(self):
        swarm = MagicMock()
        swarm.registry = MagicMock()
        swarm.task_manager = MagicMock()
        return swarm

    @pytest.fixture
    def state(self):
        return SwarmState()

    @pytest.fixture
    def coordinator(self, mock_swarm, state):
        return SwarmCoordinator(mock_swarm, state)

    def test_register_agent(self, coordinator, mock_swarm, state):
        mock_swarm.registry.register.return_value = "agent_1"
        def handler(x):
            return x
        
        agent_id = coordinator.register_agent("TestAgent", handler, AgentRole.WORKER, ["test"])
        
        assert agent_id == "agent_1"
        mock_swarm.registry.register.assert_called_once_with("TestAgent", handler, AgentRole.WORKER, ["test"])
        assert state.metrics.total_agents == 1
        assert state.metrics.idle_agents == 1

    def test_get_metrics(self, coordinator, mock_swarm, state):
        state.task_times = [1.0, 2.0, 3.0]
        
        # Mock task manager's tasks
        t1 = SwarmTask(id="t1", name="T1", payload={}, completed_at=time.time() - 10)
        t2 = SwarmTask(id="t2", name="T2", payload={}, completed_at=time.time() - 20)
        t3 = SwarmTask(id="t3", name="T3", payload={}, completed_at=time.time() - 70) # Over 60s ago
        
        mock_swarm.task_manager.get_pending_count.return_value = 5
        # Mock get_all_tasks for calculate_throughput
        mock_swarm.task_manager.get_all_tasks.return_value = {"t1": t1, "t2": t2, "t3": t3}

        metrics = coordinator.get_metrics()
        
        assert metrics.avg_task_time == 2.0
        assert metrics.throughput_per_minute == 2

    def test_get_status(self, coordinator, mock_swarm, state):
        # Mock agents in registry
        agent1 = MagicMock()
        agent1.id = "a1"
        agent1.name = "Agent1"
        agent1.role = AgentRole.WORKER
        agent1.is_busy = False
        agent1.tasks_completed = 10
        agent1.tasks_failed = 0
        
        mock_swarm.registry.agents = {"a1": agent1}
        mock_swarm.task_manager.get_pending_count.return_value = 5
        
        status = coordinator.get_status()
        
        assert not status["running"]
        assert "a1" in status["agents"]
        assert status["agents"]["a1"]["name"] == "Agent1"
        assert status["agents"]["a1"]["success_rate"] == 1.0
        assert status["pending_tasks"] == 5

    def test_find_best_agent(self, coordinator, mock_swarm):
        # Setup agents
        # a1: 10/11 = 0.909
        a1 = MagicMock(id="a1", is_busy=False, role=AgentRole.WORKER, specialties=["python"], tasks_completed=10, tasks_failed=1)
        # a2: 5/10 = 0.5
        a2 = MagicMock(id="a2", is_busy=False, role=AgentRole.WORKER, specialties=["python"], tasks_completed=5, tasks_failed=5)
        # a3: 100/100 = 1.0 (busy)
        a3 = MagicMock(id="a3", is_busy=True, role=AgentRole.WORKER, specialties=["python"], tasks_completed=100, tasks_failed=0)
        
        mock_swarm.registry.agents = {"a1": a1, "a2": a2, "a3": a3}
        
        # Best available (a1 has better success rate than a2, a3 is busy)
        assert coordinator.find_best_agent(specialty="python") == "a1"
        
        # If a1 becomes busy, a2 is best available even if it has lower success rate than a3
        a1.is_busy = True
        assert coordinator.find_best_agent(specialty="python") == "a2"
        
        # If all busy, pick best success rate (a3 has 1.0, a1 has 0.9, a2 has 0.5)
        a2.is_busy = True
        assert coordinator.find_best_agent(specialty="python") == "a3"
        
        # By role
        a4 = MagicMock(id="a4", is_busy=False, role=AgentRole.SPECIALIST, specialties=[], tasks_completed=1, tasks_failed=0)
        mock_swarm.registry.agents["a4"] = a4
        assert coordinator.find_best_agent(role=AgentRole.SPECIALIST) == "a4"
