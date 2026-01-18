"""
Tests for Coding Level controller.
"""

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.coding_level import (
    LEVELS,
    Level,
    get_level,
    get_level_prompt,
    load_level_style,
    set_level,
)


class TestCodingLevel:
    def test_levels_configuration(self):
        """Verify levels configuration."""
        assert len(LEVELS) == 6
        assert LEVELS[Level.GOD].name == "GOD"
        assert LEVELS[Level.ELI5].name == "ELI5"

    def test_set_get_level(self):
        """Test setting and getting level."""
        # Default is 3
        assert get_level().level == 3

        # Change to 5
        set_level(5)
        assert get_level().level == 5

        # Change back to 3 for cleanup
        set_level(3)

    def test_invalid_level(self):
        """Test invalid level raises error."""
        with pytest.raises(ValueError):
            set_level(99)

    def test_get_level_prompt(self):
        """Test prompt generation."""
        prompt = get_level_prompt(3)
        assert "Coding Style: Senior" in prompt
        assert "Level 3" in prompt

    @patch("antigravity.core.coding_level.Path")
    def test_load_level_style(self, mock_path):
        """Test loading style file."""
        mock_file = MagicMock()
        mock_file.exists.return_value = True
        mock_file.read_text.return_value = "# Senior Style"
        mock_path.return_value.__truediv__.return_value = mock_file

        content = load_level_style(3, base_path="mock/path")
        assert content == "# Senior Style"


if __name__ == "__main__":
    pytest.main([__file__])
