"""
Tests for EZ PR system.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.ez_pr import EzPR


class TestEzPR:
    @patch("antigravity.core.ez_pr.PRManager")
    def test_help_command(self, mock_manager):
        """Test help message."""
        ez = EzPR()
        output = ez.process("help")
        assert "EZ PR" in output
        assert "QUẢN LÝ THAY ĐỔI" in output

    @patch("antigravity.core.ez_pr.PRManager")
    def test_check_empty(self, mock_manager):
        """Test check command when no PRs."""
        # Mock get_open_prs to return empty
        instance = mock_manager.return_value
        instance.get_open_prs.return_value = []

        ez = EzPR()
        output = ez.process("xem pr")
        assert "Không có PR nào" in output

    @patch("antigravity.core.ez_pr.PRManager")
    def test_check_with_prs(self, mock_manager):
        """Test check command with open PRs."""
        # Mock PRs
        pr1 = MagicMock()
        pr1.number = 123
        pr1.title = "Test PR"

        instance = mock_manager.return_value
        instance.get_open_prs.return_value = [pr1]
        instance.can_auto_merge.return_value = (True, "Ready")

        ez = EzPR()
        output = ez.process("check pr")
        assert "#123" in output
        assert "Sẵn sàng" in output


if __name__ == "__main__":
    pytest.main([__file__])
