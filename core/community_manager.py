"""
👥 Community Manager - Engagement & Growth
=============================================

Manage community engagement.
Build your tribe!

Features:
- Member engagement tracking
- Community health score
- Volunteer coordination
- Social impact metrics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class MemberStatus(Enum):
    """Member status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    NEW = "new"
    CHAMPION = "champion"


class EngagementLevel(Enum):
    """Engagement level."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CHAMPION = "champion"


class VolunteerRole(Enum):
    """Volunteer roles."""
    EVENT_HELPER = "event_helper"
    CONTENT_CREATOR = "content_creator"
    MENTOR = "mentor"
    AMBASSADOR = "ambassador"
    COORDINATOR = "coordinator"


@dataclass
class CommunityMember:
    """A community member."""
    id: str
    name: str
    email: str
    status: MemberStatus = MemberStatus.NEW
    engagement_score: int = 50  # 0-100
    joined_date: datetime = field(default_factory=datetime.now)
    events_attended: int = 0
    posts: int = 0


@dataclass
class Volunteer:
    """A volunteer."""
    id: str
    name: str
    role: VolunteerRole
    hours_contributed: float = 0
    active: bool = True


@dataclass
class CommunityProgram:
    """A community program."""
    id: str
    name: str
    description: str
    participants: int = 0
    impact_metric: str = ""
    active: bool = True


class CommunityManager:
    """
    Community Manager.
    
    Build and engage your community.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.members: Dict[str, CommunityMember] = {}
        self.volunteers: Dict[str, Volunteer] = {}
        self.programs: Dict[str, CommunityProgram] = {}
        
        self._init_demo_data()
    
    def _init_demo_data(self):
        """Initialize demo data."""
        # Members
        members = [
            ("Alex Nguyen", "alex@email.com", MemberStatus.CHAMPION, 95),
            ("Sarah Tran", "sarah@email.com", MemberStatus.ACTIVE, 75),
            ("Mike Chen", "mike@email.com", MemberStatus.ACTIVE, 60),
            ("Lisa Pham", "lisa@email.com", MemberStatus.NEW, 30),
            ("David Le", "david@email.com", MemberStatus.INACTIVE, 20),
        ]
        
        for name, email, status, score in members:
            self.add_member(name, email, status, score)
        
        # Volunteers
        volunteers = [
            ("Alex Nguyen", VolunteerRole.AMBASSADOR, 50),
            ("Sarah Tran", VolunteerRole.CONTENT_CREATOR, 30),
            ("Mike Chen", VolunteerRole.EVENT_HELPER, 15),
        ]
        
        for name, role, hours in volunteers:
            self.add_volunteer(name, role, hours)
        
        # Programs
        programs = [
            ("Weekly Meetup", "Community networking event", 25, "Connections made"),
            ("Mentorship Program", "1:1 mentoring", 12, "Mentees supported"),
            ("Content Club", "Content creation group", 8, "Posts created"),
        ]
        
        for name, desc, participants, metric in programs:
            self.add_program(name, desc, participants, metric)
    
    def add_member(
        self,
        name: str,
        email: str,
        status: MemberStatus = MemberStatus.NEW,
        engagement_score: int = 50
    ) -> CommunityMember:
        """Add a community member."""
        member = CommunityMember(
            id=f"MBR-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            email=email,
            status=status,
            engagement_score=engagement_score
        )
        self.members[member.id] = member
        return member
    
    def add_volunteer(
        self,
        name: str,
        role: VolunteerRole,
        hours: float = 0
    ) -> Volunteer:
        """Add a volunteer."""
        volunteer = Volunteer(
            id=f"VOL-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            role=role,
            hours_contributed=hours
        )
        self.volunteers[volunteer.id] = volunteer
        return volunteer
    
    def add_program(
        self,
        name: str,
        description: str,
        participants: int = 0,
        impact_metric: str = ""
    ) -> CommunityProgram:
        """Add a community program."""
        program = CommunityProgram(
            id=f"PRG-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            description=description,
            participants=participants,
            impact_metric=impact_metric
        )
        self.programs[program.id] = program
        return program
    
    def get_community_health_score(self) -> float:
        """Calculate community health score."""
        if not self.members:
            return 0
        return sum(m.engagement_score for m in self.members.values()) / len(self.members)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get community statistics."""
        active = sum(1 for m in self.members.values() 
                    if m.status in [MemberStatus.ACTIVE, MemberStatus.CHAMPION])
        champions = sum(1 for m in self.members.values() 
                       if m.status == MemberStatus.CHAMPION)
        volunteer_hours = sum(v.hours_contributed for v in self.volunteers.values())
        
        return {
            "members": len(self.members),
            "active_members": active,
            "champions": champions,
            "volunteers": len(self.volunteers),
            "volunteer_hours": volunteer_hours,
            "programs": len(self.programs),
            "health_score": self.get_community_health_score()
        }
    
    def format_dashboard(self) -> str:
        """Format community manager dashboard."""
        stats = self.get_stats()
        
        health = stats['health_score']
        health_icon = "🟢" if health >= 70 else "🟡" if health >= 50 else "🔴"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👥 COMMUNITY MANAGER                                     ║",
            f"║  {health_icon} {health:.0f}% health │ {stats['active_members']} active │ {stats['champions']} champions  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  👥 COMMUNITY MEMBERS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"active": "🟢", "inactive": "⚪", 
                       "new": "🆕", "champion": "⭐"}
        
        for member in sorted(self.members.values(), 
                            key=lambda x: x.engagement_score, reverse=True)[:4]:
            icon = status_icons.get(member.status.value, "👤")
            bar = "█" * (member.engagement_score // 10) + "░" * (10 - member.engagement_score // 10)
            lines.append(f"║    {icon} {member.name[:14]:<14} │ {bar} │ {member.engagement_score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🙋 VOLUNTEERS                                            ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        role_icons = {"event_helper": "📅", "content_creator": "✍️",
                     "mentor": "🎓", "ambassador": "⭐", "coordinator": "📋"}
        
        for vol in list(self.volunteers.values())[:3]:
            icon = role_icons.get(vol.role.value, "🙋")
            lines.append(f"║    {icon} {vol.name:<18} │ {vol.hours_contributed:>5.0f} hours  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 COMMUNITY PROGRAMS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for prog in list(self.programs.values())[:3]:
            lines.append(f"║    📋 {prog.name:<22} │ {prog.participants:>3} members  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 COMMUNITY METRICS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    👥 Total Members:      {stats['members']:>12}              ║",
            f"║    🟢 Active Members:     {stats['active_members']:>12}              ║",
            f"║    ⭐ Champions:          {stats['champions']:>12}              ║",
            f"║    🙋 Volunteers:         {stats['volunteers']:>12}              ║",
            f"║    ⏱️ Volunteer Hours:    {stats['volunteer_hours']:>12.0f}              ║",
            "║                                                           ║",
            "║  [👥 Members]  [🙋 Volunteers]  [📋 Programs]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Build your tribe!                ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cm = CommunityManager("Saigon Digital Hub")
    
    print("👥 Community Manager")
    print("=" * 60)
    print()
    
    print(cm.format_dashboard())
