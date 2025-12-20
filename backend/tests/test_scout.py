"""
Tests for Scout Agent
Agency OS v2.0 - WIN-WIN-WIN Testing
"""

import pytest
from backend.agents.scout import ScoutAgent, TrendItem, IntelBrief


class TestTrendItem:
    """Tests for TrendItem dataclass"""
    
    def test_trend_item_creation(self):
        """Test basic TrendItem creation"""
        trend = TrendItem(
            title="AI Agent frameworks",
            source="Product Hunt",
            score=95.0
        )
        assert trend.title == "AI Agent frameworks"
        assert trend.source == "Product Hunt"
        assert trend.score == 95.0
        assert trend.timestamp is not None
    
    def test_trend_item_with_url(self):
        """Test TrendItem with optional URL"""
        trend = TrendItem(
            title="Test Trend",
            source="Twitter",
            score=80.0,
            url="https://example.com"
        )
        assert trend.url == "https://example.com"


class TestIntelBrief:
    """Tests for IntelBrief dataclass"""
    
    def test_intel_brief_creation(self):
        """Test basic IntelBrief creation"""
        trends = [TrendItem("Trend 1", "Source", 90.0)]
        brief = IntelBrief(
            topic="AI automation",
            trends=trends,
            competitors=["A", "B"],
            content_angles=["Angle 1"]
        )
        assert brief.topic == "AI automation"
        assert len(brief.trends) == 1
        assert len(brief.competitors) == 2
        assert brief.generated_at is not None


class TestScoutAgent:
    """Tests for ScoutAgent"""
    
    @pytest.fixture
    def agent(self):
        """Create ScoutAgent instance"""
        return ScoutAgent()
    
    def test_agent_init(self, agent):
        """Test agent initialization"""
        assert agent.name == "Scout"
        assert agent.status == "ready"
    
    def test_get_trending(self, agent):
        """Test get_trending returns correct number of trends"""
        trends = agent.get_trending(3)
        assert len(trends) == 3
        assert all(isinstance(t, TrendItem) for t in trends)
    
    def test_get_trending_max(self, agent):
        """Test get_trending respects max count"""
        trends = agent.get_trending(10)
        assert len(trends) <= 5  # Max sample trends
    
    def test_research_returns_intel_brief(self, agent):
        """Test research method returns IntelBrief"""
        brief = agent.research("AI automation")
        assert isinstance(brief, IntelBrief)
        assert brief.topic == "AI automation"
    
    def test_research_has_trends(self, agent):
        """Test research includes trends"""
        brief = agent.research("AI")
        assert len(brief.trends) > 0
    
    def test_research_has_content_angles(self, agent):
        """Test research includes content angles"""
        brief = agent.research("AI")
        assert len(brief.content_angles) == 3
    
    def test_generate_ideas(self, agent):
        """Test idea generation for known pillar"""
        ideas = agent.generate_ideas("Code-to-Cashflow", 3)
        assert len(ideas) == 3
        assert all(isinstance(idea, str) for idea in ideas)
    
    def test_generate_ideas_unknown_pillar(self, agent):
        """Test idea generation for unknown pillar"""
        ideas = agent.generate_ideas("Unknown Pillar")
        assert len(ideas) >= 1  # Falls back to default


class TestScoutAgentWinWinWin:
    """WIN-WIN-WIN verification tests"""
    
    @pytest.fixture
    def agent(self):
        return ScoutAgent()
    
    def test_research_provides_actionable_intelligence(self, agent, win_check):
        """Test that research output benefits all parties"""
        brief = agent.research("startup strategy")
        
        # Owner WIN: Gets market intelligence
        owner_win = len(brief.trends) > 0
        
        # Agency WIN: Has content angles for marketing
        agency_win = len(brief.content_angles) > 0
        
        # Startup WIN: Competitor data for positioning
        startup_win = len(brief.competitors) > 0
        
        assert win_check(owner_win, agency_win, startup_win)
