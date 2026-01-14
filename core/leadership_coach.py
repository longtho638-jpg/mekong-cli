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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LeadershipCompetency(Enum):
    """Core leadership skills assessed."""
    VISION = "vision"
    COMMUNICATION = "communication"
    DECISION_MAKING = "decision_making"
    TEAM_BUILDING = "team_building"
    EMOTIONAL_INTELLIGENCE = "emotional_intelligence"
    STRATEGIC_THINKING = "strategic_thinking"
    EXECUTION = "execution"


class SessionType(Enum):
    """Categories of professional coaching."""
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    WORKSHOP = "workshop"
    ASSESSMENT = "assessment"
    FEEDBACK = "feedback_session"


class FeedbackSource(Enum):
    """Origins of 360-degree performance feedback."""
    SELF = "self"
    MANAGER = "manager"
    PEER = "peer"
    DIRECT_REPORT = "direct_report"
    STAKEHOLDER = "stakeholder"


@dataclass
class LeadershipProfile:
    """A professional leadership development profile."""
    id: str
    name: str
    role: str
    scores: Dict[str, int] = field(default_factory=dict)
    strengths: List[str] = field(default_factory=list)
    growth_areas: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.name or not self.role:
            raise ValueError("Name and role are required")


@dataclass
class CoachingSession:
    """A scheduled or completed coaching interaction."""
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
    """An individual 360-degree feedback entry record."""
    id: str
    leader_id: str
    source: FeedbackSource
    competency: LeadershipCompetency
    score: int  # 1-10
    comment: str = ""

    def __post_init__(self):
        if not 1 <= self.score <= 10:
            raise ValueError("Score must be between 1 and 10")


class LeadershipCoach:
    """
    Leadership Coach System.
    
    Orchestrates executive assessments, professional coaching sessions, and cultural feedback loops.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.profiles: Dict[str, LeadershipProfile] = {}
        self.sessions: List[CoachingSession] = []
        self.feedback: List[Feedback360] = []
        logger.info(f"Leadership Coach initialized for {agency_name}")
    
    def create_profile(self, name: str, role: str) -> LeadershipProfile:
        """Register a new leader for development tracking."""
        p = LeadershipProfile(id=f"LDR-{uuid.uuid4().hex[:6].upper()}", name=name, role=role)
        self.profiles[p.id] = p
        logger.info(f"Leadership profile created: {name} ({role})")
        return p
    
    def add_360_feedback(
        self,
        profile_id: str,
        source: FeedbackSource,
        comp: LeadershipCompetency,
        score: int,
        comment: str = ""
    ) -> Optional[Feedback360]:
        """Log a new piece of organizational feedback."""
        if profile_id not in self.profiles: return None
        
        fb = Feedback360(
            id=f"FBK-{uuid.uuid4().hex[:6].upper()}",
            leader_id=profile_id, source=source,
            competency=comp, score=score, comment=comment
        )
        self.feedback.append(fb)
        logger.info(f"Feedback logged for {self.profiles[profile_id].name}: {comp.value} ({score})")
        return fb
    
    def format_dashboard(self) -> str:
        """Render the Leadership Coach Dashboard."""
        active_sessions = [s for s in self.sessions if not s.completed]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎯 LEADERSHIP COACH DASHBOARD{' ' * 32}║",
            f"║  {len(self.profiles)} profiles │ {len(self.feedback)} feedback entries{' ' * 20}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 ACTIVE LEADERS                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for p in list(self.profiles.values())[:4]:
            avg_score = sum(p.scores.values()) / len(p.scores) if p.scores else 0.0
            bar = "█" * int(avg_score) + "░" * (10 - int(avg_score))
            lines.append(f"║  👤 {p.name[:15]:<15} │ {bar} │ {avg_score:>4.1f} avg {' ' * 13} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  📅 UPCOMING SESSIONS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for s in active_sessions[:3]:
            name = self.profiles[s.leader_id].name if s.leader_id in self.profiles else "???"
            time_disp = s.scheduled_at.strftime("%b %d")
            lines.append(f"║    📅 {time_disp} │ {name[:12]:<12} │ {s.topic[:25]:<25} ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [👤 Profiles]  [📅 Schedule]  [📊 360 Analysis]  [⚙️]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Impact!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎯 Initializing Leadership Coach...")
    print("=" * 60)
    
    try:
        coach = LeadershipCoach("Saigon Digital Hub")
        # Seed
        p1 = coach.create_profile("Khoa Nguyen", "CEO")
        coach.add_360_feedback(p1.id, FeedbackSource.PEER, LeadershipCompetency.VISION, 9)
        
        print("\n" + coach.format_dashboard())
        
    except Exception as e:
        logger.error(f"Coach Error: {e}")
