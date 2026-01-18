"""
Tests for Custom Errors.
"""

import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.errors import AntigravityError, ValidationError, WinWinWinError


class TestErrors:
    def test_base_error(self):
        """Test base error properties."""
        err = AntigravityError("Generic failure", code="TEST_FAIL")
        assert err.message == "Generic failure"
        assert err.code == "TEST_FAIL"

        data = err.to_dict()
        assert data["error"] is True
        assert data["code"] == "TEST_FAIL"

    def test_validation_error(self):
        """Test specific validation error."""
        err = ValidationError("Invalid email", field="email")
        assert err.code == "VALIDATION_FAILED"
        assert err.details["field"] == "email"

    def test_win3_error(self):
        """Test win-win-win error."""
        err = WinWinWinError("Agency losing", failing_party="agency")
        assert err.losing_party == "agency"
        assert err.code == "WIN_WIN_WIN_MISALIGNMENT"
        assert err.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__])
