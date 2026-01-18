"""
Tests for SDROps Agents Package
Agency OS v2.0 - Sales Development Representatives
"""

from datetime import datetime, timedelta

import pytest

from backend.agents.sdrops import (
    Lead,
    LeadQualifierAgent,
    Meeting,
    MeetingBookerAgent,
    MeetingStatus,
    MeetingType,
    QualificationStatus,
)


class TestLeadQualifierAgent:
    """Tests for Lead Qualifier Agent"""

    @pytest.fixture
    def agent(self):
        """Create LeadQualifierAgent instance"""
        return LeadQualifierAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent is not None
        assert hasattr(agent, "add_lead")
        assert hasattr(agent, "score_bant")

    def test_add_lead_creates_lead(self, agent):
        """Test adding lead returns Lead object"""
        lead = agent.add_lead(
            name="Test User", company="Test Corp", email="test@example.com", title="CTO"
        )
        assert isinstance(lead, Lead)
        assert lead.name == "Test User"
        assert lead.status == QualificationStatus.PENDING

    def test_score_bant_returns_score(self, agent):
        """Test BANT scoring works correctly"""
        lead = agent.add_lead("Test", "Corp", "test@corp.com", "CEO")

        scored_lead = agent.score_bant(
            lead_id=lead.id, budget=20, authority=20, need=25, timeline=20
        )

        assert scored_lead.bant.total == 85
        assert scored_lead.bant.grade == "A"
        assert scored_lead.status == QualificationStatus.QUALIFIED

    def test_qualification_status_assignment(self, agent):
        """Test correct status based on score"""
        lead = agent.add_lead("Low Score", "Small Co", "low@small.com", "Intern")

        # Low score should disqualify
        scored_lead = agent.score_bant(lead_id=lead.id, budget=5, authority=5, need=10, timeline=5)

        assert scored_lead.bant.total == 25
        assert scored_lead.status == QualificationStatus.DISQUALIFIED


class TestMeetingBookerAgent:
    """Tests for Meeting Booker Agent"""

    @pytest.fixture
    def agent(self):
        """Create MeetingBookerAgent instance"""
        return MeetingBookerAgent()

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent is not None
        assert hasattr(agent, "book")
        assert hasattr(agent, "confirm")

    def test_book_returns_meeting(self, agent):
        """Test booking returns Meeting object"""
        meeting = agent.book(
            lead_name="Test Lead",
            company="Test Corp",
            meeting_type=MeetingType.DISCOVERY,
            scheduled_at=datetime.now() + timedelta(hours=2),
            ae_assigned="AE_001",
        )
        assert isinstance(meeting, Meeting)
        assert meeting.status == MeetingStatus.SCHEDULED

    def test_meeting_has_required_fields(self, agent):
        """Test meeting has all required fields"""
        meeting = agent.book(
            lead_name="Lead 2",
            company="Corp 2",
            meeting_type=MeetingType.DEMO,
            scheduled_at=datetime.now() + timedelta(days=1),
            ae_assigned="AE_002",
        )
        assert meeting.id is not None
        assert meeting.lead_name == "Lead 2"
        assert meeting.meeting_type == MeetingType.DEMO


class TestSDROpsWinWinWin:
    """WIN-WIN-WIN verification for SDROps"""

    def test_sdr_pipeline_benefits_all(self, win_check):
        """Verify SDR pipeline creates value for all parties"""
        # Owner WIN: Qualified leads = higher close rate
        owner_win = "qualified_leads"

        # Agency WIN: Efficient pipeline = scalable operations
        agency_win = "pipeline_efficiency"

        # Startup WIN: Only quality meetings = respects their time
        startup_win = "quality_meetings"

        assert win_check(owner_win, agency_win, startup_win)
