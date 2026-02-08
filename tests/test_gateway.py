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
)
from src.core.gateway_config import GatewayConfig, load_config, DEFAULT_PRESETS
from src.core.gateway_dashboard import DASHBOARD_HTML


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

    def test_version_is_0_4_0(self):
        """Gateway version should be 0.4.0"""
        self.assertEqual(VERSION, "0.4.0")


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


if __name__ == "__main__":
    unittest.main()
