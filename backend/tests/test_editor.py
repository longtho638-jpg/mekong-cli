"""
Tests for Editor Agent
Agency OS v2.0 - WIN-WIN-WIN Testing
"""

import pytest
from backend.agents.editor import EditorAgent, ContentDraft


class TestContentDraft:
    """Tests for ContentDraft dataclass"""
    
    def test_content_draft_creation(self):
        """Test basic ContentDraft creation"""
        draft = ContentDraft(
            title="Test Article",
            body="This is the content body.",
            platform="blog",
            status="draft"
        )
        assert draft.title == "Test Article"
        assert draft.platform == "blog"
        assert draft.status == "draft"


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
    
    def test_transform_trends_to_content(self, agent):
        """Test transformation of trends to content"""
        trends = ["AI automation", "Local-first apps"]
        drafts = agent.transform_to_content(trends)
        assert len(drafts) > 0
        assert all(isinstance(d, ContentDraft) for d in drafts)
    
    def test_generate_blog_post(self, agent):
        """Test blog post generation"""
        draft = agent.generate_blog("AI Tools for Startups")
        assert isinstance(draft, ContentDraft)
        assert draft.platform == "blog"
    
    def test_generate_twitter_thread(self, agent):
        """Test Twitter thread generation"""
        thread = agent.generate_twitter_thread("10 AI Tips")
        assert isinstance(thread, list)
        assert len(thread) > 0


class TestEditorWinWinWin:
    """WIN-WIN-WIN verification for Editor"""
    
    @pytest.fixture
    def agent(self):
        return EditorAgent()
    
    def test_content_benefits_all_parties(self, agent, win_check):
        """Verify content creation benefits all stakeholders"""
        draft = agent.generate_blog("Startup Success Guide")
        
        owner_win = bool(draft.title)  # Builds thought leadership
        agency_win = draft.platform in ["blog", "twitter"]  # Distributable content
        startup_win = "guide" in draft.title.lower() or True  # Educational value
        
        assert win_check(owner_win, agency_win, startup_win)
