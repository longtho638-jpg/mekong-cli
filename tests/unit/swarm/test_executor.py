import time
from antigravity.core.swarm.enums import AgentRole, TaskPriority, TaskStatus
from antigravity.core.swarm.executor import TaskExecutor
from antigravity.core.swarm.models import SwarmAgent, SwarmTask
from unittest.mock import MagicMock, patch

import pytest


class TestTaskExecutor:
    @pytest.fixture
    def mock_swarm(self):
        swarm = MagicMock()
        swarm.registry = MagicMock()
        swarm.task_manager = MagicMock()
        swarm.metrics = MagicMock()
        swarm._executor = MagicMock()
        swarm._task_times = []
        swarm._lock = MagicMock().__enter__.return_value = MagicMock()
        return swarm

    @pytest.fixture
    def executor(self, mock_swarm):
        return TaskExecutor(mock_swarm)

    def test_find_best_task_worker(self, executor, mock_swarm):
        # Worker should take the first task
        agent = SwarmAgent(id="a1", name="W", role=AgentRole.WORKER, handler=lambda x: x)
        mock_swarm.task_manager.task_queue = ["t1", "t2"]
        mock_swarm.task_manager.get_task.side_effect = lambda tid: SwarmTask(id=tid, name=tid, payload={})
        
        assert executor._find_best_task(agent) == "t1"

    def test_find_best_task_specialist(self, executor, mock_swarm):
        # Specialist should match by specialty in task name
        agent = SwarmAgent(id="a1", name="S", role=AgentRole.SPECIALIST, handler=lambda x: x, specialties=["python"])
        
        t1 = SwarmTask(id="t1", name="JavaScript task", payload={})
        t2 = SwarmTask(id="t2", name="Python code", payload={})
        
        mock_swarm.task_manager.task_queue = ["t1", "t2"]
        mock_swarm.task_manager.get_task.side_effect = lambda tid: t1 if tid == "t1" else t2
        
        assert executor._find_best_task(agent) == "t2"

    def test_assign_task(self, executor, mock_swarm):
        agent = SwarmAgent(id="a1", name="W", role=AgentRole.WORKER, handler=lambda x: x)
        task = SwarmTask(id="t1", name="T1", payload={})
        
        mock_swarm.task_manager.get_task.return_value = task
        
        executor._assign_task("t1", agent)
        
        assert task.status == TaskStatus.ASSIGNED
        assert task.assigned_agent == "a1"
        assert agent.is_busy
        mock_swarm.task_manager.remove_task_from_queue.assert_called_once_with("t1")
        mock_swarm._executor.submit.assert_called_once()

    def test_execute_task_success(self, executor, mock_swarm):
        handler = MagicMock(return_value="OK")
        agent = SwarmAgent(id="a1", name="W", role=AgentRole.WORKER, handler=handler)
        task = SwarmTask(id="t1", name="T1", payload="INPUT")
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()
        
        mock_swarm.task_manager.get_task.return_value = task
        mock_swarm.registry.get_agent.return_value = agent
        
        executor._execute_task("t1", "a1")
        
        handler.assert_called_once_with("INPUT")
        assert task.status == TaskStatus.COMPLETED
        assert task.result == "OK"
        assert agent.tasks_completed == 1
        assert not agent.is_busy

    def test_execute_task_failure(self, executor, mock_swarm):
        handler = MagicMock(side_effect=ValueError("Boom"))
        agent = SwarmAgent(id="a1", name="W", role=AgentRole.WORKER, handler=handler)
        task = SwarmTask(id="t1", name="T1", payload="INPUT")
        task.status = TaskStatus.RUNNING
        task.started_at = time.time()
        
        mock_swarm.task_manager.get_task.return_value = task
        mock_swarm.registry.get_agent.return_value = agent
        
        executor._execute_task("t1", "a1")
        
        assert task.status == TaskStatus.FAILED
        assert "Boom" in task.error
        assert agent.tasks_failed == 1
        assert not agent.is_busy
