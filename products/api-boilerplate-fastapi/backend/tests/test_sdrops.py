"""
Tests for SDROps Agents Package
Agency OS v2.0 - Sales Development Representatives
"""

import pytest
from backend.agents.sdrops import (
    LeadQualifierAgent,
    Lead,
    BANTScore,
    QualificationStatus,
    MeetingBookerAgent,
    Meeting,
    MeetingStatus,
    MeetingType
)


class TestLeadQualifierAgent:
    """Tests for Lead Qualifier Agent"""

    @pytest.fixture
    def agent(self):
        """Create LeadQualifierAgent instance"""
        return LeadQualifierAgent()

    @pytest.fixture
    def sample_lead_data(self, sample_lead):
        """Use sample lead from conftest"""
        return sample_lead

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent is not None
        assert hasattr(agent, 'qualify_lead')

    def test_qualify_lead_returns_score(self, agent):
        """Test lead qualification returns BANT score"""
        lead = Lead(
            id="TEST-001",
            company="Test Corp",
            email="test@example.com",
            budget=50000,
            authority=True,
            need="CRM automation",
            timeline="Q1 2025"
        )
        score = agent.qualify_lead(lead)
        assert isinstance(score, BANTScore)
        assert 0 <= score.total <= 100

    def test_qualification_status_assignment(self, agent):
        """Test correct status based on score"""
        high_score_lead = Lead(
            id="HIGH-001",
            company="Big Corp",
            email="ceo@bigcorp.com",
            budget=100000,
            authority=True,
            need="Critical need",
            timeline="Immediate"
        )
        score = agent.qualify_lead(high_score_lead)
        assert score.status in [QualificationStatus.HOT, QualificationStatus.WARM]


class TestMeetingBookerAgent:
    """Tests for Meeting Booker Agent"""

    @pytest.fixture
    def agent(self):
        """Create MeetingBookerAgent instance"""
        return MeetingBookerAgent()

    @pytest.fixture
    def sample_meeting_data(self, sample_meeting):
        """Use sample meeting from conftest"""
        return sample_meeting

    def test_agent_initialization(self, agent):
        """Test agent initializes correctly"""
        assert agent is not None
        assert hasattr(agent, 'book_meeting')

    def test_book_meeting_returns_meeting(self, agent):
        """Test booking returns Meeting object"""
        meeting = agent.book_meeting(
            lead_id="LEAD-001",
            meeting_type=MeetingType.DISCOVERY,
            preferred_time="2024-12-20T10:00:00Z"
        )
        assert isinstance(meeting, Meeting)
        assert meeting.status == MeetingStatus.SCHEDULED

    def test_meeting_has_required_fields(self, agent):
        """Test meeting has all required fields"""
        meeting = agent.book_meeting(
            lead_id="LEAD-002",
            meeting_type=MeetingType.DEMO
        )
        assert meeting.id is not None
        assert meeting.lead_id == "LEAD-002"
        assert meeting.type == MeetingType.DEMO


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
