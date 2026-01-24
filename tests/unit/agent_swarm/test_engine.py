import pytest
from unittest.mock import MagicMock, patch
from antigravity.core.agent_swarm.engine import AgentSwarm
from antigravity.core.agent_swarm.enums import AgentRole, TaskPriority

class TestAgentSwarm:
    @pytest.fixture
    def swarm(self):
        # We patch ThreadPoolExecutor to avoid starting real threads
        with patch('antigravity.core.agent_swarm.engine.ThreadPoolExecutor'), \
             patch('antigravity.core.agent_swarm.engine.TaskExecutor'):
            return AgentSwarm()

    def test_swarm_initialization(self, swarm):
        assert swarm.max_workers == 10
        assert swarm.registry is not None
        assert swarm.task_manager is not None
        assert swarm.state is not None
        assert swarm.coordinator is not None
        assert swarm.state.running is False

    def test_register_agent_delegation(self, swarm):
        swarm.coordinator.register_agent = MagicMock(return_value="agent_1")
        handler = lambda x: x
        
        res = swarm.register_agent("Test", handler, AgentRole.WORKER, ["test"])
        
        assert res == "agent_1"
        swarm.coordinator.register_agent.assert_called_once_with("Test", handler, AgentRole.WORKER, ["test"])

    def test_submit_task_delegation(self, swarm):
        swarm.task_manager.submit_task = MagicMock(return_value="task_1")
        
        res = swarm.submit_task("Task", {"data": 1}, TaskPriority.HIGH, 100)
        
        assert res == "task_1"
        swarm.task_manager.submit_task.assert_called_once_with("Task", {"data": 1}, TaskPriority.HIGH, 100)
        assert swarm.state.metrics.total_tasks == 1

    def test_start_stop(self, swarm):
        swarm.start()
        assert swarm.state.running is True
        swarm._task_executor.try_assign_tasks.assert_called()
        
        swarm.stop()
        assert swarm.state.running is False
        swarm._executor.shutdown.assert_called_with(wait=True)

    def test_get_task_result_delegation(self, swarm):
        swarm.task_manager.get_task_result = MagicMock(return_value="RESULT")
        
        res = swarm.get_task_result("t1", wait=True, timeout=5.0)
        
        assert res == "RESULT"
        swarm.task_manager.get_task_result.assert_called_once_with("t1", True, 5.0)

    def test_get_metrics_delegation(self, swarm):
        swarm.coordinator.get_metrics = MagicMock(return_value="METRICS")
        assert swarm.get_metrics() == "METRICS"

    def test_get_status_delegation(self, swarm):
        swarm.coordinator.get_status = MagicMock(return_value="STATUS")
        assert swarm.get_status() == "STATUS"
