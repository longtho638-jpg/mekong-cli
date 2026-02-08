"""
Tests for the cook and related CLI commands using typer.testing.CliRunner.

Validates --help output, --dry-run mode, version command,
and flag visibility in help text.
"""

import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re
import pytest
from typer.testing import CliRunner
from src.main import app

runner = CliRunner()

_ANSI_RE = re.compile(r'\x1b\[[0-9;]*m')


def _plain(text: str) -> str:
    """Strip ANSI escape codes from Rich-rendered output."""
    return _ANSI_RE.sub('', text)


# -------------------------------------------------------------------
# 1. test_cook_help
# -------------------------------------------------------------------
def test_cook_help():
    """Invoke cook --help; expect exit 0 and 'Cook' in output."""
    result = runner.invoke(app, ["cook", "--help"])

    assert result.exit_code == 0
    assert "Cook" in result.output


# -------------------------------------------------------------------
# 2. test_cook_dry_run
# -------------------------------------------------------------------
def test_cook_dry_run():
    """Invoke cook with --dry-run and a simple goal; expect exit 0."""
    result = runner.invoke(app, ["cook", "--dry-run", "echo hello world"])

    assert result.exit_code == 0
    assert "Dry" in result.output or "dry" in result.output.lower()


# -------------------------------------------------------------------
# 3. test_plan_help
# -------------------------------------------------------------------
def test_plan_help():
    """Invoke plan --help; expect exit 0."""
    result = runner.invoke(app, ["plan", "--help"])

    assert result.exit_code == 0
    assert "Plan" in result.output or "plan" in result.output.lower()


# -------------------------------------------------------------------
# 4. test_version_command
# -------------------------------------------------------------------
def test_version_command():
    """Invoke version; expect exit 0 and 'v0.2.0' in output."""
    result = runner.invoke(app, ["version"])

    assert result.exit_code == 0
    assert "v0.4.0" in result.output


# -------------------------------------------------------------------
# 5. test_cook_verbose_flag_in_help
# -------------------------------------------------------------------
def test_cook_verbose_flag_in_help():
    """Verify --verbose appears in cook help text."""
    result = runner.invoke(app, ["cook", "--help"])

    assert result.exit_code == 0
    assert "--verbose" in _plain(result.output)
