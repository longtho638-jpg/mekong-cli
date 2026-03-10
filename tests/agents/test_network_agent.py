"""
Unit tests for NetworkAgent

Coverage: ping, latency, port scan, DNS, traceroute + timeout scenarios
"""

import socket
import subprocess
from unittest.mock import patch, MagicMock
from src.agents.network_agent import NetworkAgent
from src.core.agent_base import Task


class TestNetworkAgentInit:
    """Test NetworkAgent initialization"""

    def test_default_timeout(self):
        """Test default timeout value"""
        agent = NetworkAgent()
        assert agent.timeout_secs == 10

    def test_custom_name(self):
        """Test custom agent name"""
        agent = NetworkAgent(name="custom_network")
        assert agent.name == "custom_network"


class TestNetworkAgentPlan:
    """Test NetworkAgent planning"""

    def test_plan_ping(self):
        """Test planning for ping test"""
        agent = NetworkAgent()
        tasks = agent.plan("ping google.com")
        assert len(tasks) == 1
        assert tasks[0].id == "ping_test"
        assert tasks[0].input["type"] == "ping"

    def test_plan_latency(self):
        """Test planning for latency test"""
        agent = NetworkAgent()
        tasks = agent.plan("test latency http://api.example.com")
        assert len(tasks) == 1
        assert tasks[0].id == "latency_test"
        assert tasks[0].input["type"] == "latency"

    def test_plan_port_scan(self):
        """Test planning for port scan"""
        agent = NetworkAgent()
        tasks = agent.plan("scan ports localhost")
        assert len(tasks) == 1
        assert tasks[0].id == "port_scan"
        assert tasks[0].input["type"] == "port_scan"

    def test_plan_dns_check(self):
        """Test planning for DNS check"""
        agent = NetworkAgent()
        tasks = agent.plan("check dns example.com")
        assert len(tasks) == 1
        assert tasks[0].id == "dns_check"
        assert tasks[0].input["type"] == "dns"

    def test_plan_traceroute(self):
        """Test planning for traceroute"""
        agent = NetworkAgent()
        tasks = agent.plan("trace route to 8.8.8.8")
        assert len(tasks) == 1
        assert tasks[0].id == "trace_route"
        assert tasks[0].input["type"] == "traceroute"

    def test_plan_default(self):
        """Test default planning when no keywords match"""
        agent = NetworkAgent()
        tasks = agent.plan("test network")
        assert len(tasks) == 1
        assert tasks[0].input["type"] == "ping"


class TestNetworkAgentExecute:
    """Test NetworkAgent execution"""

    def test_execute_unknown_task_type(self):
        """Test execution with unknown task type"""
        agent = NetworkAgent()
        task = Task(id="test", description="Test unknown", input={"type": "unknown_type"})
        result = agent.execute(task)
        assert result.success is False
        assert "Unknown task type" in result.error

    def test_execute_exception_handling(self):
        """Test exception handling during execution"""
        agent = NetworkAgent()
        task = Task(id="test", description="Test exception", input={"type": "ping", "query": "google.com"})
        with patch.object(agent, '_execute_ping', side_effect=Exception("Test error")):
            result = agent.execute(task)
        assert result.success is False
        assert "Test error" in result.error


class TestNetworkAgentExtractHost:
    """Test host extraction from queries"""

    def test_extract_from_url(self):
        """Test extracting host from URL"""
        agent = NetworkAgent()
        host = agent._extract_host("check http://api.example.com/health")
        assert host == "api.example.com"

    def test_extract_from_hostname(self):
        """Test extracting hostname"""
        agent = NetworkAgent()
        host = agent._extract_host("ping google.com")
        assert host == "google.com"

    def test_extract_from_ip(self):
        """Test extracting IP address"""
        agent = NetworkAgent()
        host = agent._extract_host("ping 8.8.8.8")
        assert host == "8.8.8.8"

    def test_extract_no_host(self):
        """Test when no host found"""
        agent = NetworkAgent()
        host = agent._extract_host("test network connectivity")
        assert host is None


class TestNetworkAgentPing:
    """Test ping execution"""

    @patch('subprocess.run')
    def test_ping_success(self, mock_run):
        """Test successful ping"""
        mock_run.return_value = MagicMock(
            stdout="64 bytes from 142.250.70.46: icmp_seq=0 ttl=116 time=15.2 ms\n"
                   "--- google.com ping statistics ---\n"
                   "3 packets transmitted, 3 packets received, 0.0% packet loss\n"
                   "round-trip min/avg/max/stddev = 14.5/15.2/16.1/0.8 ms\n",
            returncode=0
        )
        agent = NetworkAgent()
        task = Task(id="ping", description="Ping test", input={"type": "ping", "query": "ping google.com"})
        result = agent._execute_ping(task)
        assert result.success is True
        assert result.output["reachable"] is True

    @patch('subprocess.run')
    def test_ping_failure(self, mock_run):
        """Test failed ping"""
        mock_run.return_value = MagicMock(
            stdout="--- unreachable.invalid ping statistics ---\n"
                   "3 packets transmitted, 0 packets received, 100.0% packet loss\n",
            returncode=2
        )
        agent = NetworkAgent()
        task = Task(id="ping", description="Ping test", input={"type": "ping", "query": "ping unreachable.invalid"})
        result = agent._execute_ping(task)
        assert result.success is False
        assert result.output["reachable"] is False

    @patch('subprocess.run')
    def test_ping_no_host(self, mock_run):
        """Test ping without host"""
        agent = NetworkAgent()
        task = Task(id="ping", description="Ping test", input={"type": "ping", "query": "ping test"})
        result = agent._execute_ping(task)
        assert result.success is False
        assert "No host found" in result.error

    @patch('subprocess.run')
    def test_ping_timeout(self, mock_run):
        """Test ping timeout"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="ping", timeout=15)
        agent = NetworkAgent()
        task = Task(id="ping", description="Ping test", input={"type": "ping", "query": "ping slow.host.com"})
        result = agent._execute_ping(task)
        assert result.success is False
        assert "timeout" in result.error


class TestNetworkAgentLatency:
    """Test latency test execution"""

    @patch('subprocess.run')
    def test_latency_success(self, mock_run):
        """Test successful latency measurement"""
        mock_run.return_value = MagicMock(stdout="200 0.150 0.050", returncode=0)
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency http://api.example.com"})
        result = agent._execute_latency(task)
        assert result.success is True
        assert result.output["status_code"] == 200
        assert "total_latency_ms" in result.output

    @patch('subprocess.run')
    def test_latency_server_error(self, mock_run):
        """Test latency with server error"""
        mock_run.return_value = MagicMock(stdout="500 0.500 0.100", returncode=0)
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency http://api.example.com"})
        result = agent._execute_latency(task)
        assert result.success is False
        assert result.output["status_code"] == 500

    @patch('subprocess.run')
    def test_latency_no_url(self, mock_run):
        """Test latency without URL"""
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency now"})
        result = agent._execute_latency(task)
        assert result.success is False
        assert "No HTTP URL found" in result.error

    @patch('subprocess.run')
    def test_latency_timeout(self, mock_run):
        """Test latency timeout"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="curl", timeout=10)
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency http://slow.api.com"})
        result = agent._execute_latency(task)
        assert result.success is False
        assert "timeout" in result.error

    @patch('subprocess.run')
    def test_latency_partial_output(self, mock_run):
        """Test latency with malformed curl output"""
        mock_run.return_value = MagicMock(stdout="200", returncode=0)  # Missing timing data
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency http://api.example.com"})
        result = agent._execute_latency(task)
        assert result.success is False
        assert "Failed to parse" in result.error


class TestNetworkAgentPortScan:
    """Test port scanning execution"""

    @patch('socket.socket')
    def test_port_scan_open(self, mock_socket):
        """Test scanning open port"""
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 0
        mock_socket.return_value = mock_sock
        agent = NetworkAgent()
        task = Task(id="scan", description="Port scan", input={"type": "port_scan", "query": "scan ports localhost"})
        result = agent._execute_port_scan(task)
        assert result.success is True
        assert 22 in result.output["open_ports"]

    @patch('socket.socket')
    def test_port_scan_closed(self, mock_socket):
        """Test scanning closed port"""
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 1
        mock_socket.return_value = mock_sock
        agent = NetworkAgent()
        task = Task(id="scan", description="Port scan", input={"type": "port_scan", "query": "scan ports localhost"})
        result = agent._execute_port_scan(task)
        assert result.success is False

    @patch('socket.socket')
    def test_port_scan_specific_port(self, mock_socket):
        """Test scanning specific port"""
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 0
        mock_socket.return_value = mock_sock
        agent = NetworkAgent()
        task = Task(id="scan", description="Port scan", input={"type": "port_scan", "query": "scan port 8080"})
        result = agent._execute_port_scan(task)
        assert result.success is True
        assert 8080 in result.output["open_ports"]

    @patch('socket.socket')
    def test_port_scan_socket_exception(self, mock_socket):
        """Test port scan with socket exception"""
        mock_sock = MagicMock()
        mock_sock.connect_ex.side_effect = socket.error("Connection refused")
        mock_socket.return_value = mock_sock
        agent = NetworkAgent()
        task = Task(id="scan", description="Port scan", input={"type": "port_scan", "query": "scan ports localhost"})
        result = agent._execute_port_scan(task)
        assert "scanned" in result.output


class TestNetworkAgentDnsCheck:
    """Test DNS check execution"""

    @patch('subprocess.run')
    def test_dns_success(self, mock_run):
        """Test successful DNS resolution"""
        mock_run.return_value = MagicMock(stdout="142.250.70.46\n", returncode=0)
        agent = NetworkAgent()
        task = Task(id="dns", description="DNS check", input={"type": "dns", "query": "check dns google.com"})
        result = agent._execute_dns_check(task)
        assert result.success is True
        assert result.output["resolved"] is True

    @patch('subprocess.run')
    def test_dns_failure(self, mock_run):
        """Test failed DNS resolution"""
        mock_run.return_value = MagicMock(stdout="", returncode=1)
        agent = NetworkAgent()
        task = Task(id="dns", description="DNS check", input={"type": "dns", "query": "check dns invalid.invalid"})
        result = agent._execute_dns_check(task)
        assert result.success is False

    @patch('subprocess.run')
    def test_dns_no_domain(self, mock_run):
        """Test DNS check without domain"""
        agent = NetworkAgent()
        task = Task(id="dns", description="DNS check", input={"type": "dns", "query": "check dns now"})
        result = agent._execute_dns_check(task)
        assert result.success is False
        assert "No domain found" in result.error

    @patch('subprocess.run')
    def test_dns_timeout(self, mock_run):
        """Test DNS check timeout"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="dig", timeout=10)
        agent = NetworkAgent()
        task = Task(id="dns", description="DNS check", input={"type": "dns", "query": "check dns slow.dns.com"})
        result = agent._execute_dns_check(task)
        assert result.success is False


class TestNetworkAgentTraceroute:
    """Test traceroute execution"""

    @patch('subprocess.run')
    def test_traceroute_success(self, mock_run):
        """Test successful traceroute"""
        mock_run.return_value = MagicMock(
            stdout="traceroute to google.com (142.250.70.46), 10 hops max\n"
                   " 1  192.168.1.1 (192.168.1.1)  5.2 ms  4.8 ms  5.1 ms\n"
                   " 2  10.0.0.1 (10.0.0.1)  15.3 ms  14.9 ms  15.5 ms\n",
            returncode=0
        )
        agent = NetworkAgent()
        task = Task(id="trace", description="Traceroute", input={"type": "traceroute", "query": "trace google.com"})
        result = agent._execute_traceroute(task)
        assert result.success is True
        assert result.output["hop_count"] > 0
    def test_traceroute_no_host(self):
        """Test traceroute without host"""
        agent = NetworkAgent()
        task = Task(id="trace", description="Traceroute", input={"type": "traceroute", "query": "trace route now"})
        result = agent._execute_traceroute(task)
        assert result.success is False
        assert "No host found" in result.error

    @patch('subprocess.run')
    def test_traceroute_timeout(self, mock_run):
        """Test traceroute timeout"""
        mock_run.side_effect = subprocess.TimeoutExpired(cmd="traceroute", timeout=60)
        agent = NetworkAgent()
        task = Task(id="trace", description="Traceroute", input={"type": "traceroute", "query": "trace slow.host.com"})
        result = agent._execute_traceroute(task)
        assert result.success is False
        assert "timeout" in result.error


class TestNetworkAgentEdgeCases:
    """Edge case tests for network scenarios"""

    @patch('subprocess.run')
    def test_ping_partial_stats(self, mock_run):
        """Test ping with partial statistics output"""
        mock_run.return_value = MagicMock(
            stdout="--- google.com ping statistics ---\n"
                   "3 packets transmitted, 3 packets received, 0.0% packet loss\n",
            returncode=0
        )
        agent = NetworkAgent()
        task = Task(id="ping", description="Ping test", input={"type": "ping", "query": "ping google.com"})
        result = agent._execute_ping(task)
        assert result.success is True
        assert result.output["reachable"] is True
        assert "packet_loss_percent" in result.output

    @patch('subprocess.run')
    def test_latency_edge_case_zero_time(self, mock_run):
        """Test latency with zero response time"""
        mock_run.return_value = MagicMock(stdout="200 0.000 0.000", returncode=0)
        agent = NetworkAgent()
        task = Task(id="latency", description="Latency test", input={"type": "latency", "query": "test latency http://localhost"})
        result = agent._execute_latency(task)
        assert result.success is True
        assert result.output["total_latency_ms"] == 0.0

    @patch('socket.socket')
    def test_port_scan_localhost_default(self, mock_socket):
        """Test port scan defaults to localhost when no host specified"""
        mock_sock = MagicMock()
        mock_sock.connect_ex.return_value = 1
        mock_socket.return_value = mock_sock
        agent = NetworkAgent()
        task = Task(id="scan", description="Port scan", input={"type": "port_scan", "query": "scan ports"})
        result = agent._execute_port_scan(task)
        assert result.output["host"] == "localhost"

    @patch('subprocess.run')
    def test_dns_multiple_ips(self, mock_run):
        """Test DNS resolution with multiple IP addresses"""
        mock_run.return_value = MagicMock(
            stdout="142.250.70.46\n142.250.70.47\n142.250.70.48\n",
            returncode=0
        )
        agent = NetworkAgent()
        task = Task(id="dns", description="DNS check", input={"type": "dns", "query": "check dns google.com"})
        result = agent._execute_dns_check(task)
        assert result.success is True
        assert len(result.output["ip_addresses"]) == 3
