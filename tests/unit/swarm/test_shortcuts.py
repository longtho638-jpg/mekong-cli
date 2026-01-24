from antigravity.core.swarm import shortcuts
from antigravity.core.swarm.enums import AgentRole, TaskPriority
from unittest.mock import MagicMock, patch

import pytest


class TestShortcuts:
    def setup_method(self):
        shortcuts.reset_swarm()

    def teardown_method(self):
        shortcuts.reset_swarm()

    def test_get_swarm_singleton(self):
        s1 = shortcuts.get_swarm()
        s2 = shortcuts.get_swarm()
        assert s1 is s2
        assert s1 is not None

    def test_reset_swarm(self):
        s1 = shortcuts.get_swarm()
        shortcuts.reset_swarm()
        s2 = shortcuts.get_swarm()
        assert s1 is not s2

    @patch('antigravity.core.swarm.shortcuts.get_swarm')
    def test_register_agent_shortcut(self, mock_get_swarm):
        mock_instance = MagicMock()
        mock_get_swarm.return_value = mock_instance
        def handler(x):
            return x
        
        shortcuts.register_agent("Test", handler, AgentRole.SPECIALIST)
        mock_instance.register_agent.assert_called_once_with("Test", handler, AgentRole.SPECIALIST)

    @patch('antigravity.core.swarm.shortcuts.get_swarm')
    def test_submit_task_shortcut(self, mock_get_swarm):
        mock_instance = MagicMock()
        mock_get_swarm.return_value = mock_instance
        
        shortcuts.submit_task("Task", {"p": 1}, TaskPriority.CRITICAL)
        mock_instance.submit_task.assert_called_once_with("Task", {"p": 1}, TaskPriority.CRITICAL)

    @patch('antigravity.core.swarm.shortcuts.get_swarm')
    def test_get_task_result_shortcut(self, mock_get_swarm):
        mock_instance = MagicMock()
        mock_get_swarm.return_value = mock_instance
        
        shortcuts.get_task_result("t1", wait=False, timeout=10.0)
        mock_instance.get_task_result.assert_called_once_with("t1", wait=False, timeout=10.0)

    @patch('antigravity.core.swarm.shortcuts.get_swarm')
    def test_start_stop_shortcuts(self, mock_get_swarm):
        mock_instance = MagicMock()
        mock_get_swarm.return_value = mock_instance
        
        shortcuts.start_swarm()
        mock_instance.start.assert_called_once()
        
        shortcuts.stop_swarm()
        mock_instance.stop.assert_called_once()
