"""
Tests for Content Factory system.
"""

import sys
import os
import pytest

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from antigravity.core.content_factory import ContentFactory, ContentType

class TestContentFactory:

    def test_generate_ideas(self):
        """Test random idea generation."""
        factory = ContentFactory(niche="Gạo ST25")
        ideas = factory.generate_ideas(10)

        assert len(ideas) == 10
        assert "Gạo ST25" in ideas[0].title
        assert isinstance(ideas[0].content_type, ContentType)

    def test_create_post(self):
        """Test post creation from idea."""
        factory = ContentFactory()
        ideas = factory.generate_ideas(1)
        post = factory.create_post(ideas[0])

        assert post.title == ideas[0].title
        assert len(post.body) > 0
        assert post.virality_score == ideas[0].virality_score

    def test_calendar_generation(self):
        """Test content calendar creation."""
        factory = ContentFactory()
        calendar = factory.get_calendar(7)

        assert len(calendar) == 7
        assert "date" in calendar[0]
        assert "title" in calendar[0]
        assert "virality" in calendar[0]

if __name__ == "__main__":
    pytest.main([__file__])
