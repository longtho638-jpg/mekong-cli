"""
Unit tests for MonitorAgent
Coverage: thresholds, planning, HTTP health, port check, system resources, timeout scenarios
"""

import subprocess
from unittest.mock import patch, MagicMock
from src.agents.monitor_agent import MonitorAgent
from src.core.agent_base import Task, Result


class TestMonitorAgentInit:
    """Test MonitorAgent initialization"""

    def test_default_thresholds(self):
        agent = MonitorAgent()
        thresholds = agent.get_thresholds()
        assert thresholds["cpu_percent"] == 80.0
        assert thresholds["memory_percent"] == 85.0
        assert thresholds["disk_percent"] == 90.0
        assert thresholds["response_time_ms"] == 1000.0

    def test_custom_name(self):
        agent = MonitorAgent(name="custom_monitor")
        assert agent.name == "custom_monitor"

    def test_set_threshold(self):
        agent = MonitorAgent()
        agent.set_threshold("cpu_percent", 95.0)
        assert agent.get_thresholds()["cpu_percent"] == 95.0

    def test_set_invalid_threshold(self):
        agent = MonitorAgent()
        agent.set_threshold("invalid_metric", 50.0)
        assert "invalid_metric" not in agent.get_thresholds()


class TestMonitorAgentPlan:
    """Test MonitorAgent planning"""

    def test_plan_http_health(self):
        agent = MonitorAgent()
        tasks = agent.plan("check health http://localhost:8080")
        assert len(tasks) == 1
        assert tasks[0].id == "health_check"
        assert tasks[0].input["type"] == "http_health"

    def test_plan_port_check(self):
        agent = MonitorAgent()
        tasks = agent.plan("check port 5432")
        assert len(tasks) == 1
        assert tasks[0].id == "port_check"
        assert tasks[0].input["type"] == "port_check"

    def test_plan_system_resources(self):
        agent = MonitorAgent()
        tasks = agent.plan("monitor system resources")
        assert len(tasks) == 1
        assert tasks[0].id == "system_resources"

    def test_plan_full_health(self):
        agent = MonitorAgent()
        tasks = agent.plan("run health check")
        assert len(tasks) == 1
        assert tasks[0].id == "full_health"


class TestMonitorAgentExecute:
    """Test MonitorAgent execution"""

    def test_execute_unknown_task_type(self):
        agent = MonitorAgent()
        task = Task(id="test", description="Test unknown", input={"type": "unknown_type"})
        result = agent.execute(task)
        assert result.success is False
        assert "Unknown task type" in result.error

    @patch.object(MonitorAgent, '_execute_http_health', side_effect=Exception("Test error"))
    def test_execute_exception_handling(self, mock_method):
        agent = MonitorAgent()
        task = Task(id="test", description="Test exception", input={"type": "http_health", "query": ""})
        result = agent.execute(task)
        assert result.success is False
        assert "Test error" in result.error


class TestMonitorAgentHttpHealth:
    """Test HTTP health check execution"""

    @patch('subprocess.run')
    def test_http_health_success(self, mock_run):
        mock_run.return_value = MagicMock(stdout="200 0.250", returncode=0)
        agent = MonitorAgent()
        task = Task(id="health", description="HTTP health check", input={"type": "http_health", "query": "check http://localhost:8080"})
        result = agent._execute_http_health(task)
        assert result.success is True
        assert result.output["status"] == "healthy"

    @patch('subprocess.run')
    def test_http_health_server_error(self, mock_run):
        mock_run.return_value = MagicMock(stdout="500 0.500", returncode=0)
        agent = MonitorAgent()
        task = Task(id="health", description="HTTP health check", input={"type": "http_health", "query": "check http://localhost:8080"})
        result = agent._execute_http_health(task)
        assert result.success is False

    @patch('subprocess.run')
    def test_http_health_slow_response(self, mock_run):
        mock_run.return_value = MagicMock(stdout="200 2.500", returncode=0)
        agent = MonitorAgent()
        task = Task(id="health", description="HTTP health check", input={"type": "http_health", "query": "check http://localhost:8080"})
        result = agent._execute_http_health(task)
        assert "SLOW" in result.output["alert"]

    @patch('subprocess.run')
    def test_http_health_no_url(self, mock_run):
        agent = MonitorAgent()
        task = Task(id="health", description="HTTP health check", input={"type": "http_health", "query": "check health now"})
        result = agent._execute_http_health(task)
        assert result.success is False

    @patch('subprocess.run')
    def test_http_health_timeout(self, mock_run):
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="curl", timeout=15)
        agent = MonitorAgent()
        task = Task(id="health", description="HTTP health check", input={"type": "http_health", "query": "check http://localhost:8080"})
        result = agent._execute_http_health(task)
        assert result.success is False
        assert "timeout" in result.error


class TestMonitorAgentPortCheck:
    """Test port check execution"""

    @patch('subprocess.run')
    def test_port_open(self, mock_run):
        mock_run.return_value = MagicMock(stdout="", stderr="", returncode=0)
        agent = MonitorAgent()
        task = Task(id="port", description="Port check", input={"type": "port_check", "query": "check port 5432"})
        result = agent._execute_port_check(task)
        assert result.success is True

    @patch('subprocess.run')
    def test_port_closed(self, mock_run):
        mock_run.return_value = MagicMock(stdout="closed", returncode=0)
        agent = MonitorAgent()
        task = Task(id="port", description="Port check", input={"type": "port_check", "query": "check port 9999"})
        result = agent._execute_port_check(task)
        assert result.success is False

    @patch('subprocess.run')
    def test_port_invalid_low(self, mock_run):
        agent = MonitorAgent()
        task = Task(id="port", description="Port check", input={"type": "port_check", "query": "check port 00"})
        result = agent._execute_port_check(task)
        assert result.success is False
        assert "Invalid port" in result.error

    @patch('subprocess.run')
    def test_port_invalid_high(self, mock_run):
        agent = MonitorAgent()
        task = Task(id="port", description="Port check", input={"type": "port_check", "query": "check port 70000"})
        result = agent._execute_port_check(task)
        assert result.success is False
        assert "Invalid port" in result.error


class TestMonitorAgentSystemResources:
    """Test system resources monitoring"""

    @patch('subprocess.run')
    def test_system_resources_healthy(self, mock_run):
        mock_run.side_effect = [
            MagicMock(stdout="CPU usage: 25.5% user", returncode=0),
            MagicMock(stdout="12345", returncode=0),
            MagicMock(stdout="17179869184", returncode=0),
            MagicMock(stdout="45", returncode=0),
        ]
        agent = MonitorAgent()
        task = Task(id="system", description="System check", input={"type": "system_resources", "query": "check system"})
        result = agent._execute_system_resources(task)
        assert result.success is True

    @patch('subprocess.run')
    def test_system_resources_high_cpu(self, mock_run):
        mock_run.side_effect = [
            MagicMock(stdout="CPU usage: 95.0% user", returncode=0),
            MagicMock(stdout="12345", returncode=0),
            MagicMock(stdout="17179869184", returncode=0),
            MagicMock(stdout="45", returncode=0),
        ]
        agent = MonitorAgent()
        task = Task(id="system", description="System check", input={"type": "system_resources", "query": "check system"})
        result = agent._execute_system_resources(task)
        assert result.success is False
        assert any("CPU HIGH" in alert for alert in result.output["alerts"])

    @patch('subprocess.run')
    def test_system_resources_high_disk(self, mock_run):
        mock_run.side_effect = [
            MagicMock(stdout="CPU usage: 25.0% user", returncode=0),
            MagicMock(stdout="12345", returncode=0),
            MagicMock(stdout="17179869184", returncode=0),
            MagicMock(stdout="95", returncode=0),
        ]
        agent = MonitorAgent()
        task = Task(id="system", description="System check", input={"type": "system_resources", "query": "check system"})
        result = agent._execute_system_resources(task)
        assert result.success is False
        assert any("DISK HIGH" in alert for alert in result.output["alerts"])

    @patch('subprocess.run')
    def test_system_resources_timeout(self, mock_run):
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="top", timeout=5)
        agent = MonitorAgent()
        task = Task(id="system", description="System check", input={"type": "system_resources", "query": "check system"})
        result = agent._execute_system_resources(task)
        assert result.success is False


class TestMonitorAgentFullHealth:
    """Test full health check"""

    @patch.object(MonitorAgent, '_execute_system_resources')
    def test_full_health_check(self, mock_system):
        mock_system.return_value = Result(task_id="system", success=True, output={"metrics": {"cpu": 50}})
        agent = MonitorAgent()
        task = Task(id="full", description="Full health check", input={"type": "full_health", "query": "full check"})
        result = agent._execute_full_health(task)
        assert "system" in result.output
        assert "timestamp" in result.output
