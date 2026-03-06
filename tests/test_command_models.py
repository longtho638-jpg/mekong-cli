"""
Tests for CLI Command Models - Pydantic v2 validation

Tests cover:
- Valid input passes validation
- Invalid input raises ValidationError with clear message
- Edge cases: empty strings, max length, special chars
"""

import pytest
from datetime import datetime, timedelta
from pathlib import Path
from pydantic import ValidationError

from src.cli.command_models import (
    CookCommand,
    PlanCommand,
    LicenseGenerateCommand,
    LicenseValidateCommand,
    SwarmRegisterCommand,
    RunCommand,
    AgentCommand,
)


class TestCookCommand:
    """Test CookCommand model validation."""

    def test_valid_minimal(self):
        """Test valid minimal cook command."""
        cmd = CookCommand(goal="Build a REST API")
        assert cmd.goal == "Build a REST API"
        assert cmd.recipe is None
        assert cmd.verbose is False
        assert cmd.dry_run is False

    def test_valid_full(self, tmp_path):
        """Test valid cook command with all fields."""
        recipe_file = tmp_path / "recipe.md"
        recipe_file.write_text("# Recipe")

        cmd = CookCommand(
            goal="Build API",
            recipe=recipe_file,
            verbose=True,
            dry_run=True,
            strict=True,
            no_rollback=True,
        )
        assert cmd.goal == "Build API"
        assert cmd.recipe == recipe_file
        assert cmd.verbose is True

    def test_goal_empty(self):
        """Test that empty goal raises error."""
        with pytest.raises(ValidationError) as exc_info:
            CookCommand(goal="")
        assert "String should have at least 1 character" in str(exc_info.value)

    def test_goal_whitespace_only(self):
        """Test that whitespace-only goal raises error."""
        with pytest.raises(ValueError) as exc_info:
            CookCommand(goal="   ")
        assert "Goal cannot be empty or whitespace only" in str(exc_info.value)

    def test_goal_too_long(self):
        """Test that goal exceeding max length raises error."""
        long_goal = "x" * 3000
        with pytest.raises(ValidationError) as exc_info:
            CookCommand(goal=long_goal)
        assert "String should have at most 2000 characters" in str(exc_info.value)

    def test_recipe_not_exists(self, tmp_path):
        """Test that non-existent recipe file raises error."""
        non_existent = tmp_path / "not_found.md"
        with pytest.raises(ValidationError) as exc_info:
            CookCommand(goal="Test", recipe=non_existent)
        assert "Recipe file not found" in str(exc_info.value)


class TestPlanCommand:
    """Test PlanCommand model validation."""

    def test_valid_minimal(self):
        """Test valid minimal plan command."""
        cmd = PlanCommand(goal="Plan architecture")
        assert cmd.goal == "Plan architecture"
        assert cmd.output_format == "markdown"

    def test_valid_output_format_json(self):
        """Test valid plan command with JSON output."""
        cmd = PlanCommand(goal="Plan", output_format="json")
        assert cmd.output_format == "json"

    def test_invalid_output_format(self):
        """Test that invalid output format raises error."""
        with pytest.raises(ValidationError) as exc_info:
            PlanCommand(goal="Plan", output_format="xml")
        assert "Output format must be one of" in str(exc_info.value)

    def test_goal_empty(self):
        """Test that empty goal raises error."""
        with pytest.raises(ValidationError) as exc_info:
            PlanCommand(goal="")
        assert "String should have at least 1 character" in str(exc_info.value)


class TestLicenseGenerateCommand:
    """Test LicenseGenerateCommand model validation."""

    def test_valid_minimal(self):
        """Test valid minimal license generation."""
        cmd = LicenseGenerateCommand(
            tier="pro",
            email="user@example.com",
            org_name="Acme Corp",
        )
        assert cmd.tier == "pro"
        assert cmd.email == "user@example.com"
        assert cmd.duration_days == 365

    def test_valid_enterprise(self):
        """Test valid enterprise license."""
        cmd = LicenseGenerateCommand(
            tier="enterprise",
            email="admin@company.com",
            org_name="Big Company",
            duration_days=730,
            features=["agents", "swarm", "analytics"],
        )
        assert cmd.tier == "enterprise"
        assert cmd.duration_days == 730

    def test_invalid_tier(self):
        """Test that invalid tier raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseGenerateCommand(
                tier="premium",
                email="user@example.com",
                org_name="Test",
            )
        assert "Tier must be one of" in str(exc_info.value)

    def test_invalid_email(self):
        """Test that invalid email raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseGenerateCommand(
                tier="pro",
                email="not-an-email",
                org_name="Test",
            )
        assert "type=email_validator" in str(exc_info.value) or "value is not a valid email" in str(exc_info.value)

    def test_duration_too_long(self):
        """Test that duration > 730 days raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseGenerateCommand(
                tier="pro",
                email="user@example.com",
                org_name="Test",
                duration_days=1000,
            )
        assert "Input should be less than or equal to 730" in str(exc_info.value)

    def test_duration_zero(self):
        """Test that duration = 0 raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseGenerateCommand(
                tier="pro",
                email="user@example.com",
                org_name="Test",
                duration_days=0,
            )
        assert "Input should be greater than or equal to 1" in str(exc_info.value)


class TestLicenseValidateCommand:
    """Test LicenseValidateCommand model validation."""

    def test_valid_license_key(self):
        """Test valid license key format."""
        cmd = LicenseValidateCommand(license_key="RPP-ABC123DEF456GHI7")
        assert cmd.license_key == "RPP-ABC123DEF456GHI7"

    def test_valid_rep_prefix(self):
        """Test valid REP- prefix."""
        cmd = LicenseValidateCommand(license_key="REP-XYZ789ABC123DEF4")
        assert cmd.license_key == "REP-XYZ789ABC123DEF4"

    def test_invalid_no_prefix(self):
        """Test that key without prefix raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseValidateCommand(license_key="ABC123DEF456GHI7")
        assert "License key must start with RPP- or REP-" in str(exc_info.value)

    def test_invalid_too_short(self):
        """Test that key too short raises error."""
        with pytest.raises(ValidationError) as exc_info:
            LicenseValidateCommand(license_key="RPP-SHORT")
        assert "License key must start with RPP- or REP-" in str(exc_info.value)


class TestSwarmRegisterCommand:
    """Test SwarmRegisterCommand model validation."""

    def test_valid_minimal(self):
        """Test valid minimal swarm registration."""
        cmd = SwarmRegisterCommand(
            node_name="worker-1",
            token="swarm-token-123",
        )
        assert cmd.node_name == "worker-1"
        assert cmd.host == "localhost"
        assert cmd.port == 8080

    def test_valid_full(self):
        """Test valid swarm registration with all fields."""
        cmd = SwarmRegisterCommand(
            node_name="gpu-node",
            host="192.168.1.100",
            port=9090,
            token="token",
            grpc_port=50051,
        )
        assert cmd.host == "192.168.1.100"
        assert cmd.port == 9090
        assert cmd.grpc_port == 50051

    def test_invalid_node_name_starts_number(self):
        """Test that node name starting with number raises error."""
        with pytest.raises(ValidationError) as exc_info:
            SwarmRegisterCommand(
                node_name="1-worker",
                token="token",
            )
        assert "Node name must start with a letter" in str(exc_info.value)

    def test_invalid_port_too_high(self):
        """Test that port > 65535 raises error."""
        with pytest.raises(ValidationError) as exc_info:
            SwarmRegisterCommand(
                node_name="worker",
                token="token",
                port=70000,
            )
        assert "Input should be less than or equal to 65535" in str(exc_info.value)


class TestRunCommand:
    """Test RunCommand model validation."""

    def test_valid(self, tmp_path):
        """Test valid run command."""
        recipe = tmp_path / "recipe.md"
        recipe.write_text("# Recipe")

        cmd = RunCommand(recipe=recipe, verbose=True)
        assert cmd.recipe == recipe
        assert cmd.verbose is True

    def test_recipe_not_exists(self, tmp_path):
        """Test that non-existent recipe raises error."""
        with pytest.raises(ValidationError) as exc_info:
            RunCommand(recipe=tmp_path / "not_found.md")
        assert "Recipe file not found" in str(exc_info.value)

    def test_wrong_extension(self, tmp_path):
        """Test that wrong extension raises error."""
        recipe = tmp_path / "recipe.txt"
        recipe.write_text("# Recipe")

        with pytest.raises(ValidationError) as exc_info:
            RunCommand(recipe=recipe)
        assert ".md extension" in str(exc_info.value)


class TestAgentCommand:
    """Test AgentCommand model validation."""

    def test_valid(self):
        """Test valid agent command."""
        cmd = AgentCommand(
            name="researcher",
            command="Search for best practices",
        )
        assert cmd.name == "researcher"
        assert cmd.command == "Search for best practices"

    def test_invalid_name_starts_number(self):
        """Test that name starting with number raises error."""
        with pytest.raises(ValidationError) as exc_info:
            AgentCommand(name="1-agent", command="test")
        assert "Agent name must start with a letter" in str(exc_info.value)

    def test_command_too_long(self):
        """Test that command exceeding max length raises error."""
        long_command = "x" * 6000
        with pytest.raises(ValidationError) as exc_info:
            AgentCommand(name="agent", command=long_command)
        assert "String should have at most 5000 characters" in str(exc_info.value)
