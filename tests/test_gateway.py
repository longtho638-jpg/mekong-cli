"""
Tests for Mekong Gateway — OpenClaw Hybrid Commander.

Tests cover:
- Health endpoint
- Token authentication (valid, invalid, missing env)
- Command execution via /cmd
- Response structure and telemetry trace
- Edge cases (empty goal, missing fields)
- Dashboard HTML serving and WebSocket live log
- Multi-project listing via /projects
- Gateway config loading
- WebSocket live streaming endpoint
- Swarm registry, endpoints, and event bus
"""

import json
import os
import unittest
from unittest.mock import patch, MagicMock
from dataclasses import dataclass
from pathlib import Path
import tempfile

from fastapi.testclient import TestClient

from src.core.gateway import (
    create_app, verify_token, CommandRequest,
    build_human_summary, HumanSummary, PRESET_ACTIONS,
    VERSION, ProjectInfo, _scan_projects,
    SwarmNodeInfo, SwarmRegisterRequest, SwarmDispatchRequest,
    ScheduleJobInfo, ScheduleAddRequest,
)
from src.core.gateway_config import GatewayConfig, load_config, DEFAULT_PRESETS
from src.core.gateway_dashboard import DASHBOARD_HTML
from src.core.swarm import SwarmNode, SwarmRegistry
from src.core.event_bus import EventType, Event, EventBus, get_event_bus
from src.core.scheduler import ScheduledJob, Scheduler


class TestGatewayHealth(unittest.TestCase):
    """Tests for the /health endpoint"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_health_returns_200(self):
        """Health endpoint should return 200 OK"""
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)

    def test_health_response_structure(self):
        """Health response must contain status, version, engine"""
        resp = self.client.get("/health")
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertIn("version", data)
        self.assertIn("engine", data)

    def test_health_engine_value(self):
        """Engine should be Plan-Execute-Verify"""
        resp = self.client.get("/health")
        self.assertEqual(resp.json()["engine"], "Plan-Execute-Verify")


class TestGatewayTokenAuth(unittest.TestCase):
    """Tests for token authentication"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    def test_valid_token_accepted(self):
        """Valid token should pass verification"""
        # verify_token should not raise for correct token
        try:
            verify_token("test-secret")
        except Exception:
            self.fail("verify_token raised unexpectedly for valid token")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    def test_invalid_token_rejected(self):
        """Invalid token should return 401"""
        resp = self.client.post(
            "/cmd",
            json={"goal": "test", "token": "wrong-token"},
        )
        self.assertEqual(resp.status_code, 401)

    @patch.dict(os.environ, {}, clear=True)
    def test_missing_env_returns_500(self):
        """Missing MEKONG_API_TOKEN env var should return 500"""
        # Remove MEKONG_API_TOKEN if present
        os.environ.pop("MEKONG_API_TOKEN", None)
        resp = self.client.post(
            "/cmd",
            json={"goal": "test", "token": "any-token"},
        )
        self.assertEqual(resp.status_code, 500)
        self.assertIn("not configured", resp.json()["detail"])

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    def test_invalid_token_error_message(self):
        """Invalid token error should say 'Invalid token'"""
        resp = self.client.post(
            "/cmd",
            json={"goal": "test", "token": "bad"},
        )
        self.assertEqual(resp.json()["detail"], "Invalid token")


class TestGatewayCommandExecution(unittest.TestCase):
    """Tests for the POST /cmd endpoint"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_returns_success(self, mock_orch_cls, mock_get_client):
        """Successful goal execution returns status=success"""
        # Setup mocks
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 1
        mock_result.completed_steps = 1
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "list files", "token": "test-secret"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "success")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_response_structure(self, mock_orch_cls, mock_get_client):
        """Response must contain all required fields"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 2
        mock_result.completed_steps = 2
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "deploy app", "token": "test-secret"},
        )
        data = resp.json()
        required_fields = [
            "status", "goal", "total_steps", "completed_steps",
            "failed_steps", "success_rate", "errors", "warnings", "steps",
        ]
        for field in required_fields:
            self.assertIn(field, data, f"Missing field: {field}")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_returns_goal_echo(self, mock_orch_cls, mock_get_client):
        """Response should echo back the original goal"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 0
        mock_result.completed_steps = 0
        mock_result.failed_steps = 0
        mock_result.success_rate = 0.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "my custom goal", "token": "test-secret"},
        )
        self.assertEqual(resp.json()["goal"], "my custom goal")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_with_step_results(self, mock_orch_cls, mock_get_client):
        """Response should include step summaries when steps exist"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        # Create a mock step result
        mock_step = MagicMock()
        mock_step.order = 1
        mock_step.title = "Install deps"

        mock_verification = MagicMock()
        mock_verification.passed = True
        mock_verification.summary = "All checks passed"

        mock_execution = MagicMock()
        mock_execution.exit_code = 0

        mock_sr = MagicMock()
        mock_sr.step = mock_step
        mock_sr.verification = mock_verification
        mock_sr.execution = mock_execution

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 1
        mock_result.completed_steps = 1
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = [mock_sr]
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "install", "token": "test-secret"},
        )
        data = resp.json()
        self.assertEqual(len(data["steps"]), 1)
        self.assertEqual(data["steps"][0]["title"], "Install deps")
        self.assertTrue(data["steps"][0]["passed"])

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_failed_goal(self, mock_orch_cls, mock_get_client):
        """Failed goal should return status=failed"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "failed"
        mock_result.total_steps = 1
        mock_result.completed_steps = 0
        mock_result.failed_steps = 1
        mock_result.success_rate = 0.0
        mock_result.errors = ["Step 1 failed"]
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "fail task", "token": "test-secret"},
        )
        self.assertEqual(resp.json()["status"], "failed")
        self.assertEqual(resp.json()["errors"], ["Step 1 failed"])


class TestGatewayTelemetry(unittest.TestCase):
    """Tests for telemetry trace in response"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_trace_included_when_available(self, mock_orch_cls, mock_get_client):
        """Trace data should be included when telemetry has a trace"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_trace = MagicMock()
        # asdict will be called on this, so mock it at module level
        trace_dict = {
            "goal": "test goal",
            "steps": [],
            "total_duration": 1.5,
            "llm_calls": 0,
            "errors": [],
        }

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 0
        mock_result.completed_steps = 0
        mock_result.failed_steps = 0
        mock_result.success_rate = 0.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = mock_trace
        mock_orch_cls.return_value = mock_orch

        with patch("src.core.gateway.asdict", return_value=trace_dict):
            resp = self.client.post(
                "/cmd",
                json={"goal": "test goal", "token": "test-secret"},
            )
        data = resp.json()
        self.assertIsNotNone(data["trace"])
        self.assertEqual(data["trace"]["goal"], "test goal")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_trace_null_when_unavailable(self, mock_orch_cls, mock_get_client):
        """Trace should be null when telemetry has no trace"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 0
        mock_result.completed_steps = 0
        mock_result.failed_steps = 0
        mock_result.success_rate = 0.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "no trace", "token": "test-secret"},
        )
        self.assertIsNone(resp.json()["trace"])


class TestGatewayEdgeCases(unittest.TestCase):
    """Tests for edge cases and error handling"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_cmd_missing_goal_returns_422(self):
        """Missing goal field should return 422"""
        resp = self.client.post(
            "/cmd",
            json={"token": "some-token"},
        )
        self.assertEqual(resp.status_code, 422)

    def test_cmd_missing_token_returns_422(self):
        """Missing token field should return 422"""
        resp = self.client.post(
            "/cmd",
            json={"goal": "test"},
        )
        self.assertEqual(resp.status_code, 422)

    def test_cmd_empty_body_returns_422(self):
        """Empty body should return 422"""
        resp = self.client.post("/cmd", json={})
        self.assertEqual(resp.status_code, 422)

    def test_cmd_get_not_allowed(self):
        """GET /cmd should return 405 Method Not Allowed"""
        resp = self.client.get("/cmd")
        self.assertEqual(resp.status_code, 405)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_orchestrator_exception_returns_500(self, mock_orch_cls, mock_get_client):
        """Orchestrator exception should return 500"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_orch.run_from_goal.side_effect = RuntimeError("Boom")
        mock_orch_cls.return_value = mock_orch

        resp = self.client.post(
            "/cmd",
            json={"goal": "crash", "token": "test-secret"},
        )
        self.assertEqual(resp.status_code, 500)
        self.assertIn("Boom", resp.json()["detail"])

    def test_nonexistent_endpoint_returns_404(self):
        """Unknown endpoint should return 404"""
        resp = self.client.get("/nonexistent")
        self.assertEqual(resp.status_code, 404)


class TestGatewayAppFactory(unittest.TestCase):
    """Tests for the create_app factory function"""

    def test_create_app_returns_fastapi_instance(self):
        """create_app should return a FastAPI instance"""
        from fastapi import FastAPI
        app = create_app()
        self.assertIsInstance(app, FastAPI)

    def test_create_app_has_routes(self):
        """App should have /health, /cmd, /, /presets, /projects, /ws routes"""
        app = create_app()
        routes = [r.path for r in app.routes]
        self.assertIn("/health", routes)
        self.assertIn("/cmd", routes)
        self.assertIn("/", routes)
        self.assertIn("/presets", routes)
        self.assertIn("/projects", routes)
        self.assertIn("/ws", routes)

    def test_create_app_title(self):
        """App title should be Mekong Gateway"""
        app = create_app()
        self.assertEqual(app.title, "Mekong Gateway")


class TestCommandRequestModel(unittest.TestCase):
    """Tests for Pydantic request model validation"""

    def test_valid_request(self):
        """Valid request should parse correctly"""
        req = CommandRequest(goal="deploy", token="secret")
        self.assertEqual(req.goal, "deploy")
        self.assertEqual(req.token, "secret")

    def test_empty_goal_rejected(self):
        """Empty goal should be rejected by min_length"""
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            CommandRequest(goal="", token="secret")

    def test_empty_token_rejected(self):
        """Empty token should be rejected by min_length"""
        from pydantic import ValidationError
        with self.assertRaises(ValidationError):
            CommandRequest(goal="test", token="")


class TestGatewayDashboard(unittest.TestCase):
    """Tests for the Washing Machine dashboard at /"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_dashboard_returns_200(self):
        """Dashboard endpoint should return 200"""
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)

    def test_dashboard_returns_html(self):
        """Dashboard should return HTML content type"""
        resp = self.client.get("/")
        self.assertIn("text/html", resp.headers["content-type"])

    def test_dashboard_contains_title(self):
        """Dashboard HTML should contain the title"""
        resp = self.client.get("/")
        self.assertIn("Mekong Dashboard", resp.text)

    def test_dashboard_contains_preset_buttons(self):
        """Dashboard should contain preset action labels"""
        resp = self.client.get("/")
        self.assertIn("Quick Deploy", resp.text)
        self.assertIn("Audit Leads", resp.text)
        self.assertIn("Plan Content", resp.text)

    def test_dashboard_contains_token_input(self):
        """Dashboard should have a token input field"""
        resp = self.client.get("/")
        self.assertIn('id="token"', resp.text)

    def test_dashboard_contains_version(self):
        """Dashboard should contain the current version"""
        resp = self.client.get("/")
        self.assertIn(VERSION, resp.text)

    def test_dashboard_contains_project_selector(self):
        """Dashboard should have project selector dropdown"""
        resp = self.client.get("/")
        self.assertIn('id="project-select"', resp.text)

    def test_dashboard_contains_live_log(self):
        """Dashboard should have live log panel"""
        resp = self.client.get("/")
        self.assertIn('id="live-log"', resp.text)


class TestGatewayProjects(unittest.TestCase):
    """Tests for the /projects endpoint"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_projects_returns_200(self):
        """Projects endpoint should return 200"""
        resp = self.client.get("/projects")
        self.assertEqual(resp.status_code, 200)

    def test_projects_returns_list(self):
        """Projects should return a list"""
        resp = self.client.get("/projects")
        self.assertIsInstance(resp.json(), list)

    def test_projects_structure(self):
        """Each project should have name, path, has_git"""
        resp = self.client.get("/projects")
        for proj in resp.json():
            self.assertIn("name", proj)
            self.assertIn("path", proj)
            self.assertIn("has_git", proj)

    def test_projects_excludes_hidden_dirs(self):
        """Projects should not include dot-prefixed directories"""
        resp = self.client.get("/projects")
        for proj in resp.json():
            self.assertFalse(proj["name"].startswith("."))

    def test_scan_projects_with_temp_dir(self):
        """_scan_projects should find directories in project_paths"""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create fake projects
            os.makedirs(os.path.join(tmpdir, "project-a"))
            os.makedirs(os.path.join(tmpdir, "project-b", ".git"))
            os.makedirs(os.path.join(tmpdir, ".hidden"))

            with patch("src.core.gateway.GATEWAY_CONFIG") as mock_cfg:
                mock_cfg.project_paths = [tmpdir]
                projects = _scan_projects()

            names = [p.name for p in projects]
            self.assertIn("project-a", names)
            self.assertIn("project-b", names)
            self.assertNotIn(".hidden", names)

            # Check has_git
            proj_b = next(p for p in projects if p.name == "project-b")
            self.assertTrue(proj_b.has_git)


class TestGatewayWebSocket(unittest.TestCase):
    """Tests for the WebSocket /ws endpoint"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_ws_returns_complete_message(self, mock_orch_cls, mock_get_client):
        """WebSocket should return a complete message after execution"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 1
        mock_result.completed_steps = 1
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        with self.client.websocket_connect("/ws") as ws:
            ws.send_json({"goal": "test goal", "token": "test-secret"})
            # First message: status "Planning..."
            msg1 = ws.receive_json()
            self.assertEqual(msg1["type"], "status")
            # Second message: complete
            msg2 = ws.receive_json()
            self.assertEqual(msg2["type"], "complete")
            self.assertEqual(msg2["status"], "success")

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    def test_ws_invalid_token_returns_error(self):
        """WebSocket with invalid token should return error"""
        with self.client.websocket_connect("/ws") as ws:
            ws.send_json({"goal": "test", "token": "wrong"})
            msg = ws.receive_json()
            self.assertEqual(msg["type"], "error")
            self.assertIn("Invalid token", msg["message"])

    def test_ws_missing_goal_returns_error(self):
        """WebSocket with missing goal should return error"""
        with self.client.websocket_connect("/ws") as ws:
            ws.send_json({"token": "abc"})
            msg = ws.receive_json()
            self.assertEqual(msg["type"], "error")
            self.assertIn("Missing", msg["message"])

    def test_ws_missing_token_returns_error(self):
        """WebSocket with missing token should return error"""
        with self.client.websocket_connect("/ws") as ws:
            ws.send_json({"goal": "test"})
            msg = ws.receive_json()
            self.assertEqual(msg["type"], "error")
            self.assertIn("Missing", msg["message"])

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_ws_complete_has_human_summary(self, mock_orch_cls, mock_get_client):
        """WebSocket complete message should include human_summary"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 2
        mock_result.completed_steps = 2
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        with self.client.websocket_connect("/ws") as ws:
            ws.send_json({"goal": "deploy", "token": "test-secret"})
            ws.receive_json()  # status
            msg = ws.receive_json()  # complete
            self.assertIn("human_summary", msg)
            self.assertIn("en", msg["human_summary"])
            self.assertIn("vi", msg["human_summary"])


class TestGatewayConfig(unittest.TestCase):
    """Tests for gateway configuration loading"""

    def test_default_config_has_presets(self):
        """Default config should have preset actions"""
        cfg = GatewayConfig()
        self.assertEqual(len(cfg.presets), 6)

    def test_default_config_host_port(self):
        """Default config should have localhost:8000"""
        cfg = GatewayConfig()
        self.assertEqual(cfg.host, "127.0.0.1")
        self.assertEqual(cfg.port, 8000)

    def test_default_config_project_paths(self):
        """Default config should have apps/ as project path"""
        cfg = GatewayConfig()
        self.assertEqual(cfg.project_paths, ["apps"])

    def test_load_config_missing_file_returns_defaults(self):
        """Loading a non-existent config returns defaults"""
        cfg = load_config("/nonexistent/path/gateway.yaml")
        self.assertEqual(cfg.host, "127.0.0.1")
        self.assertEqual(cfg.port, 8000)
        self.assertEqual(len(cfg.presets), 6)

    def test_load_config_with_yaml(self):
        """Loading a valid YAML config should override defaults"""
        try:
            import yaml
        except ImportError:
            self.skipTest("PyYAML not installed")

        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            yaml.dump({"host": "0.0.0.0", "port": 9000, "tunnel_name": "my-tunnel"}, f)
            f.flush()
            cfg = load_config(f.name)

        os.unlink(f.name)
        self.assertEqual(cfg.host, "0.0.0.0")
        self.assertEqual(cfg.port, 9000)
        self.assertEqual(cfg.tunnel_name, "my-tunnel")

    def test_default_presets_match_gateway(self):
        """DEFAULT_PRESETS should match PRESET_ACTIONS from gateway"""
        self.assertEqual(len(DEFAULT_PRESETS), len(PRESET_ACTIONS))
        self.assertEqual(DEFAULT_PRESETS[0]["id"], "deploy")

    def test_version_is_0_6_0(self):
        """Gateway version should be 0.9.0"""
        self.assertEqual(VERSION, "0.9.0")


class TestDashboardTemplate(unittest.TestCase):
    """Tests for the extracted dashboard HTML template"""

    def test_template_has_presets_placeholder(self):
        """Template should contain __PRESETS_JSON__ placeholder"""
        self.assertIn("__PRESETS_JSON__", DASHBOARD_HTML)

    def test_template_has_version_placeholder(self):
        """Template should contain __VERSION__ placeholder"""
        self.assertIn("__VERSION__", DASHBOARD_HTML)

    def test_template_has_websocket_code(self):
        """Template should contain WebSocket client code"""
        self.assertIn("WebSocket", DASHBOARD_HTML)
        self.assertIn("runGoalWS", DASHBOARD_HTML)

    def test_template_has_live_log(self):
        """Template should contain live log elements"""
        self.assertIn("live-log", DASHBOARD_HTML)
        self.assertIn("log-entries", DASHBOARD_HTML)

    def test_template_has_project_selector(self):
        """Template should contain project selector"""
        self.assertIn("project-select", DASHBOARD_HTML)
        self.assertIn("loadProjects", DASHBOARD_HTML)

    def test_template_uses_safe_dom(self):
        """Template should use createElement, not innerHTML"""
        self.assertIn("createElement", DASHBOARD_HTML)
        self.assertNotIn("innerHTML", DASHBOARD_HTML)


class TestGatewayPresets(unittest.TestCase):
    """Tests for the /presets endpoint"""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_presets_returns_200(self):
        """Presets endpoint should return 200"""
        resp = self.client.get("/presets")
        self.assertEqual(resp.status_code, 200)

    def test_presets_returns_list(self):
        """Presets should return a list"""
        resp = self.client.get("/presets")
        data = resp.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_presets_structure(self):
        """Each preset should have id, icon, label, label_vi, goal"""
        resp = self.client.get("/presets")
        for preset in resp.json():
            self.assertIn("id", preset)
            self.assertIn("icon", preset)
            self.assertIn("label", preset)
            self.assertIn("label_vi", preset)
            self.assertIn("goal", preset)

    def test_presets_count_matches_constant(self):
        """Presets count should match PRESET_ACTIONS constant"""
        resp = self.client.get("/presets")
        self.assertEqual(len(resp.json()), len(PRESET_ACTIONS))


class TestHumanSummary(unittest.TestCase):
    """Tests for human-friendly summary generation"""

    def _make_mock_result(self, status, completed, total, failed):
        """Helper to create mock orchestration result"""
        mock = MagicMock()
        mock.status.value = status
        mock.completed_steps = completed
        mock.total_steps = total
        mock.failed_steps = failed
        mock.success_rate = (completed / total * 100) if total else 0.0
        return mock

    def test_success_summary_english(self):
        """Success summary should say 'All done'"""
        result = self._make_mock_result("success", 3, 3, 0)
        summary = build_human_summary(result)
        self.assertIn("All done", summary.en)
        self.assertIn("3", summary.en)

    def test_success_summary_vietnamese(self):
        """Success summary should have Vietnamese text"""
        result = self._make_mock_result("success", 2, 2, 0)
        summary = build_human_summary(result)
        self.assertIn("Xong", summary.vi)

    def test_partial_summary(self):
        """Partial summary should mention completion ratio"""
        result = self._make_mock_result("partial", 2, 3, 1)
        summary = build_human_summary(result)
        self.assertIn("Partially done", summary.en)
        self.assertIn("2/3", summary.en)

    def test_failed_summary(self):
        """Failed summary should mention errors"""
        result = self._make_mock_result("failed", 0, 2, 2)
        summary = build_human_summary(result)
        self.assertIn("Failed", summary.en)
        self.assertIn("2", summary.en)

    def test_summary_returns_human_summary_type(self):
        """build_human_summary should return HumanSummary instance"""
        result = self._make_mock_result("success", 1, 1, 0)
        summary = build_human_summary(result)
        self.assertIsInstance(summary, HumanSummary)

    @patch.dict(os.environ, {"MEKONG_API_TOKEN": "test-secret"})
    @patch("src.core.gateway.get_client")
    @patch("src.core.gateway.RecipeOrchestrator")
    def test_cmd_includes_human_summary(self, mock_orch_cls, mock_get_client):
        """POST /cmd response should include human_summary field"""
        mock_client = MagicMock()
        mock_client.is_available = False
        mock_get_client.return_value = mock_client

        mock_orch = MagicMock()
        mock_result = MagicMock()
        mock_result.status.value = "success"
        mock_result.total_steps = 1
        mock_result.completed_steps = 1
        mock_result.failed_steps = 0
        mock_result.success_rate = 100.0
        mock_result.errors = []
        mock_result.warnings = []
        mock_result.step_results = []
        mock_orch.run_from_goal.return_value = mock_result
        mock_orch.telemetry.get_trace.return_value = None
        mock_orch_cls.return_value = mock_orch

        app = create_app()
        client = TestClient(app)
        resp = client.post(
            "/cmd",
            json={"goal": "test", "token": "test-secret"},
        )
        data = resp.json()
        self.assertIn("human_summary", data)
        self.assertIn("en", data["human_summary"])
        self.assertIn("vi", data["human_summary"])


class TestParserDisplayTag(unittest.TestCase):
    """Tests for recipe 'display: one-button' frontmatter tag"""

    def test_recipe_default_display_empty(self):
        """Recipe display should default to empty string"""
        from src.core.parser import Recipe
        r = Recipe(name="Test", description="desc")
        self.assertEqual(r.display, "")

    def test_recipe_is_one_button_false_by_default(self):
        """is_one_button should be False by default"""
        from src.core.parser import Recipe
        r = Recipe(name="Test", description="desc")
        self.assertFalse(r.is_one_button)

    def test_recipe_is_one_button_true(self):
        """is_one_button should be True when display='one-button'"""
        from src.core.parser import Recipe
        r = Recipe(name="Test", description="desc", display="one-button")
        self.assertTrue(r.is_one_button)

    def test_parser_extracts_display_from_frontmatter(self):
        """Parser should extract display tag from frontmatter"""
        from src.core.parser import RecipeParser
        parser = RecipeParser()
        content = "---\nname: Deploy App\ndisplay: one-button\n---\n\n# Deploy\n\nDeploy all.\n\n## Step 1: Build\n\nnpm run build\n"
        recipe = parser.parse_string(content, "test")
        self.assertEqual(recipe.display, "one-button")
        self.assertTrue(recipe.is_one_button)

    def test_parser_no_display_tag(self):
        """Parser should set empty display when tag is absent"""
        from src.core.parser import RecipeParser
        parser = RecipeParser()
        content = "---\nname: Simple\n---\n\n# Simple\n\nDesc.\n\n## Step 1: Run\n\necho hi\n"
        recipe = parser.parse_string(content, "test")
        self.assertEqual(recipe.display, "")
        self.assertFalse(recipe.is_one_button)


class TestSwarmRegistry(unittest.TestCase):
    """Tests for SwarmNode and SwarmRegistry."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.config_path = os.path.join(self.tmpdir, "swarm.yaml")
        self.registry = SwarmRegistry(config_path=self.config_path)

    def test_register_node(self):
        """register_node should create a node with generated ID."""
        node = self.registry.register_node("node-1", "localhost", 8001, "tok")
        self.assertTrue(len(node.id) > 0)
        self.assertEqual(node.name, "node-1")
        self.assertEqual(node.host, "localhost")
        self.assertEqual(node.port, 8001)

    def test_list_nodes_returns_all(self):
        """list_nodes should return all registered nodes."""
        self.registry.register_node("a", "h1", 8001, "t1")
        self.registry.register_node("b", "h2", 8002, "t2")
        nodes = self.registry.list_nodes()
        self.assertEqual(len(nodes), 2)

    def test_get_node_by_id(self):
        """get_node should return a specific node."""
        node = self.registry.register_node("n", "h", 8000, "t")
        found = self.registry.get_node(node.id)
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "n")

    def test_get_node_not_found(self):
        """get_node should return None for unknown ID."""
        self.assertIsNone(self.registry.get_node("nonexistent"))

    def test_remove_node(self):
        """remove_node should remove a registered node."""
        node = self.registry.register_node("n", "h", 8000, "t")
        self.assertTrue(self.registry.remove_node(node.id))
        self.assertEqual(len(self.registry.list_nodes()), 0)

    def test_remove_nonexistent_returns_false(self):
        """remove_node should return False for unknown ID."""
        self.assertFalse(self.registry.remove_node("bad-id"))

    def test_persistence_save_and_load(self):
        """Registry should persist and reload from YAML."""
        self.registry.register_node("persist", "h", 9000, "tok")
        # Create new registry from same file
        reg2 = SwarmRegistry(config_path=self.config_path)
        nodes = reg2.list_nodes()
        self.assertEqual(len(nodes), 1)
        self.assertEqual(nodes[0].name, "persist")

    def test_node_default_status(self):
        """New nodes should have 'unknown' status."""
        node = self.registry.register_node("n", "h", 8000, "t")
        self.assertEqual(node.status, "unknown")

    @patch("src.core.swarm.requests.get")
    def test_check_health_healthy(self, mock_get):
        """check_health should set 'healthy' on 200 response."""
        mock_get.return_value = MagicMock(status_code=200)
        node = self.registry.register_node("n", "h", 8000, "t")
        status = self.registry.check_health(node)
        self.assertEqual(status, "healthy")
        self.assertEqual(node.status, "healthy")

    @patch("src.core.swarm.requests.get")
    def test_check_health_unreachable(self, mock_get):
        """check_health should set 'unreachable' on connection error."""
        import requests as req_lib
        mock_get.side_effect = req_lib.ConnectionError("fail")
        node = self.registry.register_node("n", "h", 8000, "t")
        status = self.registry.check_health(node)
        self.assertEqual(status, "unreachable")

    @patch("src.core.swarm.requests.post")
    def test_dispatch_goal_success(self, mock_post):
        """dispatch_goal should return response JSON."""
        mock_post.return_value = MagicMock(
            json=MagicMock(return_value={"status": "success"})
        )
        node = self.registry.register_node("n", "h", 8000, "t")
        result = self.registry.dispatch_goal(node.id, "test goal")
        self.assertEqual(result["status"], "success")

    def test_dispatch_goal_unknown_node(self):
        """dispatch_goal should return error for unknown node."""
        result = self.registry.dispatch_goal("bad", "goal")
        self.assertIn("error", result)


class TestEventBus(unittest.TestCase):
    """Tests for the in-process event bus."""

    def setUp(self):
        self.bus = EventBus()

    def test_subscribe_and_emit(self):
        """Subscribers should receive emitted events."""
        received = []
        self.bus.subscribe(EventType.GOAL_STARTED, lambda e: received.append(e))
        self.bus.emit(EventType.GOAL_STARTED, {"goal": "test"})
        self.assertEqual(len(received), 1)
        self.assertEqual(received[0].data["goal"], "test")

    def test_emit_returns_event(self):
        """emit should return the Event object."""
        event = self.bus.emit(EventType.STEP_COMPLETED, {"step": 1})
        self.assertIsInstance(event, Event)
        self.assertEqual(event.type, EventType.STEP_COMPLETED)

    def test_unsubscribe(self):
        """Unsubscribed callbacks should not receive events."""
        received = []
        cb = lambda e: received.append(e)
        self.bus.subscribe(EventType.GOAL_STARTED, cb)
        self.bus.unsubscribe(EventType.GOAL_STARTED, cb)
        self.bus.emit(EventType.GOAL_STARTED)
        self.assertEqual(len(received), 0)

    def test_multiple_subscribers(self):
        """Multiple subscribers should all receive events."""
        counts = [0, 0]
        self.bus.subscribe(EventType.STEP_STARTED, lambda e: counts.__setitem__(0, counts[0]+1))
        self.bus.subscribe(EventType.STEP_STARTED, lambda e: counts.__setitem__(1, counts[1]+1))
        self.bus.emit(EventType.STEP_STARTED)
        self.assertEqual(counts, [1, 1])

    def test_clear_removes_all(self):
        """clear should remove all subscribers."""
        self.bus.subscribe(EventType.GOAL_STARTED, lambda e: None)
        self.bus.clear()
        self.assertEqual(self.bus.subscriber_count, 0)

    def test_subscriber_count(self):
        """subscriber_count should reflect total subscribers."""
        self.bus.subscribe(EventType.GOAL_STARTED, lambda e: None)
        self.bus.subscribe(EventType.STEP_FAILED, lambda e: None)
        self.assertEqual(self.bus.subscriber_count, 2)

    def test_subscriber_error_does_not_break_emit(self):
        """A failing subscriber should not prevent other subscribers."""
        received = []
        self.bus.subscribe(EventType.GOAL_STARTED, lambda e: 1/0)  # raises
        self.bus.subscribe(EventType.GOAL_STARTED, lambda e: received.append(e))
        self.bus.emit(EventType.GOAL_STARTED)
        self.assertEqual(len(received), 1)

    def test_event_types_are_strings(self):
        """EventType values should be strings."""
        self.assertEqual(EventType.GOAL_STARTED.value, "goal_started")
        self.assertEqual(EventType.STEP_FAILED.value, "step_failed")

    def test_get_event_bus_singleton(self):
        """get_event_bus should return same instance."""
        bus1 = get_event_bus()
        bus2 = get_event_bus()
        self.assertIs(bus1, bus2)


class TestSwarmEndpoints(unittest.TestCase):
    """Tests for swarm API endpoints."""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_swarm_register(self):
        """POST /swarm/register should create a node."""
        resp = self.client.post("/swarm/register", json={
            "name": "test-node", "host": "10.0.0.1", "port": 8001, "token": "secret"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "test-node")
        self.assertIn("id", data)

    def test_swarm_list_nodes(self):
        """GET /swarm/nodes should return a list."""
        resp = self.client.get("/swarm/nodes")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_swarm_remove_node_not_found(self):
        """DELETE /swarm/nodes/{bad_id} should return 404."""
        resp = self.client.delete("/swarm/nodes/nonexistent")
        self.assertEqual(resp.status_code, 404)

    def test_swarm_dispatch_node_not_found(self):
        """POST /swarm/dispatch with bad node_id should return 404."""
        resp = self.client.post("/swarm/dispatch", json={
            "node_id": "bad", "goal": "test"
        })
        self.assertEqual(resp.status_code, 404)

    def test_swarm_routes_exist(self):
        """Gateway should have swarm routes."""
        routes = [r.path for r in self.app.routes]
        self.assertIn("/swarm/register", routes)
        self.assertIn("/swarm/nodes", routes)
        self.assertIn("/swarm/dispatch", routes)
        self.assertIn("/swarm/nodes/{node_id}", routes)

    def test_swarm_register_missing_name(self):
        """POST /swarm/register with missing name should return 422."""
        resp = self.client.post("/swarm/register", json={
            "host": "h", "port": 8000, "token": "t"
        })
        self.assertEqual(resp.status_code, 422)


class TestDashboardSwarmTab(unittest.TestCase):
    """Tests for swarm tab in dashboard template."""

    def test_dashboard_has_tabs(self):
        """Dashboard should have tab navigation."""
        self.assertIn("switchTab", DASHBOARD_HTML)
        self.assertIn("tab-actions", DASHBOARD_HTML)
        self.assertIn("tab-swarm", DASHBOARD_HTML)

    def test_dashboard_has_swarm_nodes_container(self):
        """Dashboard should have swarm nodes container."""
        self.assertIn("swarm-nodes", DASHBOARD_HTML)

    def test_dashboard_has_load_swarm_nodes(self):
        """Dashboard should have loadSwarmNodes function."""
        self.assertIn("loadSwarmNodes", DASHBOARD_HTML)

    def test_dashboard_has_dispatch_to_node(self):
        """Dashboard should have dispatchToNode function."""
        self.assertIn("dispatchToNode", DASHBOARD_HTML)

    def test_dashboard_has_swarm_stats(self):
        """Dashboard should have swarm stats container."""
        self.assertIn("swarm-stats", DASHBOARD_HTML)


# ====================================================================
# Scheduler Engine Tests
# ====================================================================


class TestScheduler(unittest.TestCase):
    """Tests for the Scheduler engine."""

    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".yaml", delete=False)
        self.tmp.close()
        self.scheduler = Scheduler(config_path=self.tmp.name)

    def tearDown(self):
        import os
        os.unlink(self.tmp.name)

    def test_add_interval_job(self):
        """Adding an interval job should persist it."""
        job = self.scheduler.add_job("test", "echo hi", job_type="interval", interval_seconds=60)
        self.assertEqual(job.name, "test")
        self.assertEqual(job.goal, "echo hi")
        self.assertEqual(job.job_type, "interval")
        self.assertEqual(job.interval_seconds, 60)
        self.assertTrue(job.enabled)

    def test_add_daily_job(self):
        """Adding a daily job should set daily_time."""
        job = self.scheduler.add_job("daily", "backup", job_type="daily", daily_time="14:30")
        self.assertEqual(job.job_type, "daily")
        self.assertEqual(job.daily_time, "14:30")

    def test_list_jobs(self):
        """list_jobs should return all added jobs."""
        self.scheduler.add_job("a", "goal a")
        self.scheduler.add_job("b", "goal b")
        self.assertEqual(len(self.scheduler.list_jobs()), 2)

    def test_get_job(self):
        """get_job should retrieve by ID."""
        job = self.scheduler.add_job("x", "goal x")
        found = self.scheduler.get_job(job.id)
        self.assertIsNotNone(found)
        self.assertEqual(found.name, "x")

    def test_get_job_missing(self):
        """get_job should return None for unknown ID."""
        self.assertIsNone(self.scheduler.get_job("nope"))

    def test_remove_job(self):
        """remove_job should delete the job."""
        job = self.scheduler.add_job("del", "goal del")
        self.assertTrue(self.scheduler.remove_job(job.id))
        self.assertIsNone(self.scheduler.get_job(job.id))

    def test_remove_job_missing(self):
        """remove_job should return False for unknown ID."""
        self.assertFalse(self.scheduler.remove_job("nope"))

    def test_job_count(self):
        """job_count property should reflect number of jobs."""
        self.assertEqual(self.scheduler.job_count, 0)
        self.scheduler.add_job("c", "goal c")
        self.assertEqual(self.scheduler.job_count, 1)

    def test_persistence(self):
        """Jobs should survive save/load cycle."""
        self.scheduler.add_job("persist", "goal persist", interval_seconds=120)
        loaded = Scheduler(config_path=self.tmp.name)
        self.assertEqual(len(loaded.list_jobs()), 1)
        self.assertEqual(loaded.list_jobs()[0].name, "persist")
        self.assertEqual(loaded.list_jobs()[0].interval_seconds, 120)

    def test_get_due_jobs_none(self):
        """No jobs should be due immediately after adding with future next_run."""
        job = self.scheduler.add_job("future", "goal", interval_seconds=9999)
        due = self.scheduler.get_due_jobs()
        self.assertEqual(len(due), 0)

    def test_get_due_jobs_past(self):
        """Jobs with past next_run should be due."""
        import time
        job = self.scheduler.add_job("past", "goal")
        job.next_run = time.time() - 10
        due = self.scheduler.get_due_jobs()
        self.assertEqual(len(due), 1)

    def test_mark_completed(self):
        """mark_completed should increment run_count and update timestamps."""
        job = self.scheduler.add_job("run", "goal")
        self.assertEqual(job.run_count, 0)
        self.scheduler.mark_completed(job)
        self.assertEqual(job.run_count, 1)
        self.assertGreater(job.last_run, 0)

    def test_is_running_default_false(self):
        """Scheduler should not be running by default."""
        self.assertFalse(self.scheduler.is_running)

    def test_stop(self):
        """stop() should set _running to False."""
        self.scheduler._running = True
        self.scheduler.stop()
        self.assertFalse(self.scheduler.is_running)


class TestSchedulerTick(unittest.TestCase):
    """Tests for the scheduler tick (async execution)."""

    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".yaml", delete=False)
        self.tmp.close()
        self.scheduler = Scheduler(config_path=self.tmp.name)

    def tearDown(self):
        import os
        os.unlink(self.tmp.name)

    def test_tick_no_due_jobs(self):
        """tick should return empty list when no jobs due."""
        import asyncio
        self.scheduler.add_job("later", "goal", interval_seconds=9999)
        results = asyncio.get_event_loop().run_until_complete(self.scheduler.tick())
        self.assertEqual(len(results), 0)

    def test_tick_with_due_job(self):
        """tick should execute due jobs and return results."""
        import asyncio
        import time
        job = self.scheduler.add_job("now", "goal now")
        job.next_run = time.time() - 10
        callback_called = []
        self.scheduler.set_run_callback(
            lambda goal: {"status": "success", "goal": goal} or callback_called.append(goal)
        )
        results = asyncio.get_event_loop().run_until_complete(self.scheduler.tick())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "success")

    def test_tick_emits_events(self):
        """tick should emit JOB_STARTED and JOB_COMPLETED events."""
        import asyncio
        import time
        bus = get_event_bus()
        bus.clear()
        events = []
        bus.subscribe(EventType.JOB_STARTED, lambda e: events.append(e))
        bus.subscribe(EventType.JOB_COMPLETED, lambda e: events.append(e))

        job = self.scheduler.add_job("evt", "goal evt")
        job.next_run = time.time() - 10
        self.scheduler.set_run_callback(lambda g: {"status": "ok"})
        asyncio.get_event_loop().run_until_complete(self.scheduler.tick())

        self.assertEqual(len(events), 2)
        self.assertEqual(events[0].type, EventType.JOB_STARTED)
        self.assertEqual(events[1].type, EventType.JOB_COMPLETED)
        bus.clear()

    def test_tick_handles_callback_error(self):
        """tick should handle errors in run callback gracefully."""
        import asyncio
        import time
        job = self.scheduler.add_job("err", "goal err")
        job.next_run = time.time() - 10
        self.scheduler.set_run_callback(lambda g: (_ for _ in ()).throw(RuntimeError("boom")))
        results = asyncio.get_event_loop().run_until_complete(self.scheduler.tick())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "error")

    def test_tick_no_callback(self):
        """tick with no callback should mark job as skipped."""
        import asyncio
        import time
        job = self.scheduler.add_job("skip", "goal skip")
        job.next_run = time.time() - 10
        results = asyncio.get_event_loop().run_until_complete(self.scheduler.tick())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "skipped")


class TestSchedulerDailyTime(unittest.TestCase):
    """Tests for daily time calculation."""

    def test_next_daily_run_future(self):
        """_next_daily_run should return a future timestamp."""
        import time
        ts = Scheduler._next_daily_run("23:59")
        self.assertGreater(ts, time.time() - 86400)

    def test_next_daily_run_invalid(self):
        """Invalid time should default to 09:00."""
        ts = Scheduler._next_daily_run("invalid")
        self.assertGreater(ts, 0)


# ====================================================================
# Schedule Gateway Endpoints Tests
# ====================================================================


class TestScheduleEndpoints(unittest.TestCase):
    """Tests for /schedule/* endpoints."""

    def setUp(self):
        self.app = create_app()
        self.client = TestClient(self.app)

    def test_list_jobs_empty(self):
        """GET /schedule/jobs should return empty list initially."""
        resp = self.client.get("/schedule/jobs")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    def test_add_job(self):
        """POST /schedule/jobs should add a job."""
        resp = self.client.post("/schedule/jobs", json={
            "name": "test-job",
            "goal": "echo test",
            "job_type": "interval",
            "interval_seconds": 120,
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "test-job")
        self.assertEqual(data["goal"], "echo test")
        self.assertEqual(data["interval_seconds"], 120)
        self.assertTrue(data["enabled"])

    def test_add_daily_job(self):
        """POST /schedule/jobs should add a daily job."""
        resp = self.client.post("/schedule/jobs", json={
            "name": "daily-job",
            "goal": "backup db",
            "job_type": "daily",
            "daily_time": "08:00",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["job_type"], "daily")
        self.assertEqual(data["daily_time"], "08:00")

    def test_add_and_list(self):
        """Adding a job should make it appear in list."""
        self.client.post("/schedule/jobs", json={
            "name": "listed",
            "goal": "echo listed",
        })
        resp = self.client.get("/schedule/jobs")
        jobs = resp.json()
        names = [j["name"] for j in jobs]
        self.assertIn("listed", names)

    def test_remove_job(self):
        """DELETE /schedule/jobs/{id} should remove the job."""
        add_resp = self.client.post("/schedule/jobs", json={
            "name": "to-remove",
            "goal": "echo remove",
        })
        job_id = add_resp.json()["id"]
        del_resp = self.client.delete(f"/schedule/jobs/{job_id}")
        self.assertEqual(del_resp.status_code, 200)
        self.assertEqual(del_resp.json()["status"], "removed")

    def test_remove_job_not_found(self):
        """DELETE /schedule/jobs/{id} with unknown ID should return 404."""
        resp = self.client.delete("/schedule/jobs/nonexistent")
        self.assertEqual(resp.status_code, 404)


# ====================================================================
# Version bump tests
# ====================================================================


class TestVersionIs060(unittest.TestCase):
    """Verify version was bumped to 0.9.0."""

    def test_gateway_version_string(self):
        """VERSION constant should be 0.9.0."""
        self.assertEqual(VERSION, "0.9.0")

    def test_health_reports_version(self):
        """Health endpoint should report 0.9.0."""
        app = create_app()
        client = TestClient(app)
        resp = client.get("/health")
        self.assertEqual(resp.json()["version"], "0.9.0")


# ====================================================================
# Dashboard Auto-Pilot Tab Tests
# ====================================================================


class TestDashboardAutoPilotTab(unittest.TestCase):
    """Tests for Auto-Pilot tab in dashboard template."""

    def test_dashboard_has_autopilot_tab(self):
        """Dashboard should have autopilot tab."""
        self.assertIn("tab-autopilot", DASHBOARD_HTML)

    def test_dashboard_has_schedule_jobs_container(self):
        """Dashboard should have sched-jobs container."""
        self.assertIn("sched-jobs", DASHBOARD_HTML)

    def test_dashboard_has_load_schedule_jobs(self):
        """Dashboard should have loadScheduleJobs function."""
        self.assertIn("loadScheduleJobs", DASHBOARD_HTML)

    def test_dashboard_has_add_schedule_job(self):
        """Dashboard should have addScheduleJob function."""
        self.assertIn("addScheduleJob", DASHBOARD_HTML)

    def test_dashboard_has_remove_schedule_job(self):
        """Dashboard should have removeScheduleJob function."""
        self.assertIn("removeScheduleJob", DASHBOARD_HTML)

    def test_dashboard_has_sched_add_form(self):
        """Dashboard should have schedule add form inputs."""
        self.assertIn("sched-name", DASHBOARD_HTML)
        self.assertIn("sched-goal", DASHBOARD_HTML)
        self.assertIn("sched-type", DASHBOARD_HTML)

    def test_dashboard_has_job_type_styles(self):
        """Dashboard should have job-type CSS classes."""
        self.assertIn(".sched-job", DASHBOARD_HTML)
        self.assertIn(".job-type.interval", DASHBOARD_HTML)
        self.assertIn(".job-type.daily", DASHBOARD_HTML)


# ====================================================================
# EventBus Job Event Types Tests
# ====================================================================


class TestEventBusJobEvents(unittest.TestCase):
    """Tests for JOB_STARTED and JOB_COMPLETED event types."""

    def test_job_started_event_exists(self):
        """EventType should have JOB_STARTED."""
        self.assertEqual(EventType.JOB_STARTED.value, "job_started")

    def test_job_completed_event_exists(self):
        """EventType should have JOB_COMPLETED."""
        self.assertEqual(EventType.JOB_COMPLETED.value, "job_completed")

    def test_emit_job_events(self):
        """Should be able to emit and subscribe to job events."""
        bus = EventBus()
        received = []
        bus.subscribe(EventType.JOB_STARTED, lambda e: received.append(e))
        bus.emit(EventType.JOB_STARTED, {"job_id": "abc"})
        self.assertEqual(len(received), 1)
        self.assertEqual(received[0].data["job_id"], "abc")


if __name__ == "__main__":
    unittest.main()
