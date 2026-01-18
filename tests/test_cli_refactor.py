from unittest.mock import patch

from cli.commands.mcp import setup_mcp
from cli.commands.vibe import setup_vibe
from cli.entrypoint import app

# Ensure imports work
from core.licensing import LicenseTier, LicenseValidator


def test_license_validator_import():
    assert LicenseValidator is not None
    assert LicenseTier.STARTER == "starter"


def test_license_validator_init():
    with patch("core.licensing.validator.Path"):
        validator = LicenseValidator()
        assert validator is not None


def test_cli_imports():
    # If we can import app, the entrypoint is likely valid
    assert app is not None


def test_command_imports():
    assert setup_mcp is not None
    assert setup_vibe is not None
