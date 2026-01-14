"""
Tests for PR Manager system.
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.pr_manager import PRManager, PullRequest

class TestPRManager:
    
    def test_can_auto_merge_logic(self):
        """Test the criteria for auto-merging."""
        manager = PRManager()
        
        # Valid PR
        pr_valid = PullRequest(
            number=1, title="Valid", author="jules[bot]", 
            state="open", mergeable=True, checks_passed=True, 
            url="...", created_at="..."
        )
        can, reason = manager.can_auto_merge(pr_valid)
        assert can is True
        
        # Invalid Author
        pr_author = PullRequest(
            number=2, title="Invalid", author="hacker", 
            state="open", mergeable=True, checks_passed=True, 
            url="...", created_at="..."
        )
        can, reason = manager.can_auto_merge(pr_author)
        assert can is False
        assert "trusted" in reason

        # Conflict
        pr_conflict = PullRequest(
            number=3, title="Conflict", author="jules[bot]", 
            state="open", mergeable=False, checks_passed=True, 
            url="...", created_at="..."
        )
        can, reason = manager.can_auto_merge(pr_conflict)
        assert can is False
        assert "conflict" in reason

    @patch("antigravity.core.pr_manager.subprocess.run")
    def test_get_open_prs_mock(self, mock_run):
        """Test PR listing with mocked gh output."""
        # Mock successful gh output
        mock_res = MagicMock()
        mock_res.returncode = 0
        iso_date = "2026-01-14T12:00:00Z"
        mock_res.stdout = f'[{{"number": 1, "title": "T1", "author": {{"login": "u1"}}, "state": "OPEN", "mergeable": "MERGEABLE", "statusCheckRollup": [], "url": "u", "createdAt": "{iso_date}"}}]'
        mock_run.return_value = mock_res
        
        manager = PRManager()
        prs = manager.get_open_prs()
        assert len(prs) == 1
        assert prs[0].number == 1

if __name__ == "__main__":
    pytest.main([__file__])
