"""
Tests for Editor Agent
Agency OS v2.0 - WIN-WIN-WIN Testing
"""

import pytest

from backend.agents.editor import ContentDraft, EditorAgent


class TestContentDraft:
    """Tests for ContentDraft dataclass"""

    def test_content_draft_creation(self):
        """Test basic ContentDraft creation"""
        draft = ContentDraft(
            title="Test Article",
            body="This is the content body.",
            platform="blog",
            pillar="Code-to-Cashflow",
            hashtags=["test", "demo"],
            vibe="mien-tay",
        )
        assert draft.title == "Test Article"
        assert draft.platform == "blog"
        assert draft.pillar == "Code-to-Cashflow"
        assert draft.word_count > 0


class TestEditorAgent:
    """Tests for EditorAgent"""

    @pytest.fixture
    def agent(self):
        """Create EditorAgent instance"""
        return EditorAgent()

    def test_agent_init(self, agent):
        """Test agent initialization"""
        assert agent.name == "Editor"
        assert agent.status == "ready"

    def test_create_post_returns_draft(self, agent):
        """Test create_post returns ContentDraft"""
        draft = agent.create_post(
            topic="AI Tools for Startups",
            pillar="Code-to-Cashflow",
            platform="facebook",
        )
        assert isinstance(draft, ContentDraft)
        assert draft.platform == "facebook"
        assert draft.title == "AI Tools for Startups"

    def test_create_post_blog_platform(self, agent):
        """Test blog post generation"""
        draft = agent.create_post(
            topic="Startup Success Guide", pillar="Solopreneur Mindset", platform="blog"
        )
        assert isinstance(draft, ContentDraft)
        assert draft.platform == "blog"
        assert len(draft.body) > 0

    def test_batch_create_multiple_posts(self, agent):
        """Test batch creation of multiple posts"""
        topics = ["AI automation", "Local-first apps"]
        drafts = agent.batch_create(topics=topics, pillar="Local AI", platforms=["facebook"])
        assert len(drafts) == 2
        assert all(isinstance(d, ContentDraft) for d in drafts)


class TestEditorWinWinWin:
    """WIN-WIN-WIN verification for Editor"""

    @pytest.fixture
    def agent(self):
        return EditorAgent()

    def test_content_benefits_all_parties(self, agent, win_check):
        """Verify content creation benefits all stakeholders"""
        draft = agent.create_post(
            topic="Startup Success Guide", pillar="Solopreneur Mindset", platform="blog"
        )

        owner_win = bool(draft.title)  # Builds thought leadership
        agency_win = draft.platform in [
            "blog",
            "twitter",
            "facebook",
        ]  # Distributable content
        startup_win = len(draft.body) > 0  # Educational value

        assert win_check(owner_win, agency_win, startup_win)
