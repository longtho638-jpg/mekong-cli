"""
Tests for Rules Loader.
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.rules_loader import (
    RULE_MAPPING,
    get_rules_for_agent,
    load_rules_for_agent
)

class TestRulesLoader:
    
    def test_rule_mapping_structure(self):
        """Verify rule mapping structure."""
        assert isinstance(RULE_MAPPING, dict)
        for rule, agents in RULE_MAPPING.items():
            assert isinstance(rule, str)
            assert isinstance(agents, list)
            assert rule.endswith(".md")
            
    def test_get_rules_for_agent(self):
        """Test rule retrieval for specific agents."""
        # Fullstack developer should have dev rules + primary workflow
        rules = get_rules_for_agent("fullstack-developer")
        assert "development-rules.md" in rules
        assert "primary-workflow.md" in rules
        
        # Planner should have orchestration rules
        planner_rules = get_rules_for_agent("planner")
        assert "orchestration-protocol.md" in planner_rules
        
    def test_get_rules_for_unknown_agent(self):
        """Test unknown agent gets global rules."""
        rules = get_rules_for_agent("unknown-agent")
        assert "primary-workflow.md" in rules
        
    @patch("antigravity.core.rules_loader.Path")
    def test_load_rules_content(self, mock_path):
        """Test loading rule content."""
        # Setup mock
        mock_file = MagicMock()
        mock_file.exists.return_value = True
        mock_file.read_text.return_value = "# Rule Content"
        mock_path.return_value.__truediv__.return_value = mock_file
        
        content = load_rules_for_agent("fullstack-developer", base_path="mock/path")
        
        assert len(content) > 0
        assert "development-rules.md" in content or "primary-workflow.md" in content

if __name__ == "__main__":
    pytest.main([__file__])
