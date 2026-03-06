"""
Unit Tests for License Management UI
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client."""
    from src.api.license_ui import create_license_ui_app
    app = create_license_ui_app()
    return TestClient(app)


class TestLicenseUI:
    """Test License UI endpoints."""

    def test_dashboard_load(self, client):
        """Test dashboard HTML loads."""
        response = client.get("/")
        assert response.status_code == 200
        assert "RAAS License Manager" in response.text

    def test_get_status_no_license(self, client):
        """Test status endpoint with no license."""
        with patch('src.api.license_ui.validate_at_startup') as mock_validate:
            mock_validate.return_value = (False, "No license")
            response = client.get("/api/status")
            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is False

    def test_get_status_with_license(self, client):
        """Test status endpoint with valid license."""
        with patch('src.api.license_ui.validate_at_startup') as mock_validate:
            mock_validate.return_value = (True, None)
            response = client.get("/api/status")
            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is True

    def test_activate_invalid_format(self, client):
        """Test activate with invalid key format."""
        response = client.post("/api/activate", json={"license_key": "invalid-key"})
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False

    def test_activate_valid_key(self, client, tmp_path):
        """Test activate with valid key."""
        env_file = tmp_path / ".env"
        features_list = ["basic_cli_commands", "premium_agents"]
        with patch('src.api.license_ui.Path') as mock_path:
            mock_path.return_value = env_file
            with patch('src.api.license_ui.get_validator') as mock_get:
                mock_validator = MagicMock()
                mock_validator.validate.return_value = (True, None)
                mock_validator.get_tier.return_value = "pro"
                mock_validator.get_features.return_value = features_list
                mock_get.return_value = mock_validator
                response = client.post("/api/activate", json={"license_key": "raas_pro_test123"})
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True

    def test_validate_key(self, client):
        """Test validate endpoint."""
        features_list = ["basic_cli_commands", "premium_agents", "priority_support"]
        with patch('src.api.license_ui.get_validator') as mock_get:
            mock_validator = MagicMock()
            mock_validator.validate.return_value = (True, None)
            mock_validator.get_tier.return_value = "enterprise"
            mock_validator.get_features.return_value = features_list
            mock_get.return_value = mock_validator
            response = client.post("/api/validate", json={"license_key": "raas_ent_test123"})
            assert response.status_code == 200
            data = response.json()
            assert data["valid"] is True

    def test_deactivate(self, client, tmp_path):
        """Test deactivate endpoint."""
        env_file = tmp_path / ".env"
        env_file.write_text("RAAS_LICENSE_KEY=test123\n")
        with patch('src.api.license_ui.Path') as mock_path:
            mock_path.return_value = env_file
            response = client.post("/api/deactivate")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True


class TestLicenseUICommands:
    """Test CLI commands."""

    def test_license_ui_command_help(self):
        """Test license-ui command help."""
        from typer.testing import CliRunner
        from src.commands.license_commands import app
        runner = CliRunner()
        result = runner.invoke(app, ["ui", "--help"])
        assert result.exit_code == 0
        assert "--host" in result.output
        assert "--port" in result.output

    def test_interactive_command_exists(self):
        """Test interactive command exists and runs."""
        from typer.testing import CliRunner
        from src.commands.license_commands import app
        runner = CliRunner()
        # Test that the interactive command exists by getting help
        result = runner.invoke(app, ["interactive", "--help"])
        assert result.exit_code == 0
        assert "Interactive" in result.output or "interactive" in result.output.lower()
