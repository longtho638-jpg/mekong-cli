"""
Tests for Headless Mode.
"""

import json
import os
import sys

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.headless import HeadlessMode


class TestHeadless:
    def test_prompt_execution(self):
        """Test simple prompt processing."""
        headless = HeadlessMode()
        result = headless.execute("Hello world")

        assert result["status"] == "success"
        assert "Processed" in result["message"]

    def test_slash_command_routing(self):
        """Test routing of / commands."""
        headless = HeadlessMode()
        result = headless.execute("/infra")

        assert result["status"] == "success"
        assert "Infra" in result["message"]

    def test_json_output_format(self):
        """Test JSON output capability."""
        headless = HeadlessMode(output_format="json")
        result = headless.execute("/infra")

        # result["output"] should be a JSON string
        data = json.loads(result["output"])
        assert isinstance(data, list)
        assert len(data) == 10


if __name__ == "__main__":
    pytest.main([__file__])
