"""
🎯 Leadership Coach - Executive Development
=============================================

Develop leadership capabilities.
Lead with impact!

Roles:
- Leadership assessment
- Coaching sessions
- 360 feedback
- Executive presence
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class LeadershipCompetency(Enum):
    """Leadership competencies."""
    VISION = "vision"
    COMMUNICATION = "communication"
    DECISION_MAKING = "decision_making"
    TEAM_BUILDING = "team_building"
    EMOTIONAL_INTELLIGENCE = "emotional_intelligence"
    STRATEGIC_THINKING = "strategic_thinking"
    EXECUTION = "execution"


class SessionType(Enum):
    """Coaching session types."""
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    WORKSHOP = "workshop"
    ASSESSMENT = "assessment"
    FEEDBACK = "feedback_session"


class FeedbackSource(Enum):
    """360 feedback sources."""
    SELF = "self"
    MANAGER = "manager"
    PEER = "peer"
    DIRECT_REPORT = "direct_report"
    STAKEHOLDER = "stakeholder"


@dataclass
class LeadershipProfile:
    """A leader's profile."""
    id: str
    name: str
    role: str
    scores: Dict[str, int] = field(default_factory=dict)  # competency: score 1-10
    strengths: List[str] = field(default_factory=list)
    growth_areas: List[str] = field(default_factory=list)


@dataclass
class CoachingSession:
    """A coaching session."""
    id: str
    leader_id: str
    session_type: SessionType
    topic: str
    scheduled_at: datetime
    duration_mins: int = 60
    notes: str = ""
    action_items: List[str] = field(default_factory=list)
    completed: bool = False


@dataclass
class Feedback360:
    """360 degree feedback."""
    id: str
    leader_id: str
    source: FeedbackSource
    competency: LeadershipCompetency
    score: int  # 1-10
    comment: str = ""


class LeadershipCoach:
    """
    Leadership Coach.
    
    Develop leaders.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.profiles: Dict[str, LeadershipProfile] = {}
        self.sessions: List[CoachingSession] = []
        self.feedback: List[Feedback360] = []
    
    def create_profile(
        self,
        name: str,
        role: str
    ) -> LeadershipProfile:
        """Create a leadership profile."""
        profile = LeadershipProfile(
            id=f"LDR-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            role=role
        )
        self.profiles[profile.id] = profile
        return profile
    
    def assess_competency(self, profile: LeadershipProfile, competency: LeadershipCompetency, score: int):
        """Assess a competency."""
        profile.scores[competency.value] = min(10, max(1, score))
        
        if score >= 8:
            if competency.value not in profile.strengths:
                profile.strengths.append(competency.value)
        elif score <= 4:
            if competency.value not in profile.growth_areas:
                profile.growth_areas.append(competency.value)
    
    def schedule_session(
        self,
        profile: LeadershipProfile,
        session_type: SessionType,
        topic: str,
        hours_from_now: int = 24,
        duration: int = 60
    ) -> CoachingSession:
        """Schedule a coaching session."""
        session = CoachingSession(
            id=f"SES-{uuid.uuid4().hex[:6].upper()}",
            leader_id=profile.id,
            session_type=session_type,
            topic=topic,
            scheduled_at=datetime.now() + timedelta(hours=hours_from_now),
            duration_mins=duration
        )
        self.sessions.append(session)
        return session
    
    def complete_session(self, session: CoachingSession, notes: str, actions: List[str] = None):
        """Complete a session."""
        session.completed = True
        session.notes = notes
        session.action_items = actions or []
    
    def add_feedback(
        self,
        profile: LeadershipProfile,
        source: FeedbackSource,
        competency: LeadershipCompetency,
        score: int,
        comment: str = ""
    ) -> Feedback360:
        """Add 360 feedback."""
        fb = Feedback360(
            id=f"FBK-{uuid.uuid4().hex[:6].upper()}",
            leader_id=profile.id,
            source=source,
            competency=competency,
            score=score,
            comment=comment
        )
        self.feedback.append(fb)
        return fb
    
    def get_leader_score(self, profile: LeadershipProfile) -> float:
        """Get overall leadership score."""
        if not profile.scores:
            return 0
        return sum(profile.scores.values()) / len(profile.scores)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get coaching statistics."""
        completed = sum(1 for s in self.sessions if s.completed)
        avg_score = sum(self.get_leader_score(p) for p in self.profiles.values()) / len(self.profiles) if self.profiles else 0
        
        return {
            "leaders": len(self.profiles),
            "sessions": len(self.sessions),
            "completed": completed,
            "feedback_count": len(self.feedback),
            "avg_score": avg_score
        }
    
    def format_dashboard(self) -> str:
        """Format leadership coach dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 LEADERSHIP COACH                                      ║",
            f"║  {stats['leaders']} leaders │ {stats['completed']}/{stats['sessions']} sessions │ {stats['avg_score']:.1f} avg  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 LEADERSHIP PROFILES                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        for profile in list(self.profiles.values())[:4]:
            score = self.get_leader_score(profile)
            strengths = len(profile.strengths)
            growth = len(profile.growth_areas)
            
            bar = "█" * int(score) + "░" * (10 - int(score))
            lines.append(f"║  👤 {profile.name[:14]:<14} │ {bar} {score:.1f} │ +{strengths}/-{growth}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📅 COACHING SESSIONS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"one_on_one": "👤", "group": "👥", "workshop": "🔧",
                     "assessment": "📊", "feedback_session": "💬"}
        
        for session in [s for s in self.sessions if not s.completed][:3]:
            icon = type_icons.get(session.session_type.value, "📅")
            profile = self.profiles.get(session.leader_id)
            name = profile.name if profile else "Unknown"
            time = session.scheduled_at.strftime("%b %d %H:%M")
            
            lines.append(f"║  {icon} {name[:12]:<12} │ {session.topic[:15]:<15} │ {time:<10}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 COMPETENCY OVERVIEW                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        comp_icons = {"vision": "👁️", "communication": "💬", "decision_making": "⚖️",
                     "team_building": "🤝", "emotional_intelligence": "❤️",
                     "strategic_thinking": "🧠", "execution": "⚡"}
        
        for comp in list(LeadershipCompetency)[:4]:
            scores = [f.score for f in self.feedback if f.competency == comp]
            avg = sum(scores) / len(scores) if scores else 0
            icon = comp_icons.get(comp.value, "📊")
            
            bar = "█" * int(avg) + "░" * (10 - int(avg))
            lines.append(f"║  {icon} {comp.value.replace('_', ' ').title()[:15]:<15} │ {bar} │ {avg:.1f}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [👤 Profiles]  [📅 Sessions]  [📊 360 Feedback]          ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Lead with impact!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    lc = LeadershipCoach("Saigon Digital Hub")
    
    print("🎯 Leadership Coach")
    print("=" * 60)
    print()
    
    p1 = lc.create_profile("Khoa Nguyen", "CEO")
    p2 = lc.create_profile("Alex Tran", "CTO")
    
    lc.assess_competency(p1, LeadershipCompetency.VISION, 9)
    lc.assess_competency(p1, LeadershipCompetency.COMMUNICATION, 8)
    lc.assess_competency(p1, LeadershipCompetency.STRATEGIC_THINKING, 9)
    lc.assess_competency(p2, LeadershipCompetency.EXECUTION, 8)
    lc.assess_competency(p2, LeadershipCompetency.TEAM_BUILDING, 7)
    
    s1 = lc.schedule_session(p1, SessionType.ONE_ON_ONE, "Q1 Vision Setting", 24)
    s2 = lc.schedule_session(p2, SessionType.WORKSHOP, "Tech Leadership", 48)
    
    lc.add_feedback(p1, FeedbackSource.DIRECT_REPORT, LeadershipCompetency.COMMUNICATION, 9, "Great communicator")
    lc.add_feedback(p1, FeedbackSource.PEER, LeadershipCompetency.VISION, 8)
    lc.add_feedback(p2, FeedbackSource.MANAGER, LeadershipCompetency.EXECUTION, 8)
    
    print(lc.format_dashboard())
