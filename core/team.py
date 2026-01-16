"""
👥 Team Performance - Track Team Productivity
===============================================

Track team member performance and productivity.
Build a high-performing agency team!

Features:
- Team member profiles
- Performance metrics
- Leaderboard
- Skill tracking
"""

from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import uuid


class Role(Enum):
    """Team member roles."""
    OWNER = "owner"
    MANAGER = "manager"
    DESIGNER = "designer"
    DEVELOPER = "developer"
    MARKETER = "marketer"
    COPYWRITER = "copywriter"
    SUPPORT = "support"


@dataclass
class TeamMember:
    """A team member."""
    id: str
    name: str
    email: str
    role: Role
    skills: List[str]
    hourly_rate: float
    start_date: datetime
    projects_completed: int = 0
    hours_logged: float = 0
    revenue_generated: float = 0
    client_rating: float = 0.0
    
    @property
    def productivity_score(self) -> float:
        """Calculate productivity score (0-100)."""
        # Based on projects, hours, and ratings
        score = 0
        if self.projects_completed > 0:
            score += min(self.projects_completed * 10, 40)
        if self.hours_logged > 0:
            score += min(self.hours_logged / 10, 30)
        if self.client_rating > 0:
            score += self.client_rating * 6
        return min(score, 100)


class TeamPerformance:
    """
    Team Performance Tracker.
    
    Track and analyze team productivity.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.members: Dict[str, TeamMember] = {}
    
    def add_member(
        self,
        name: str,
        email: str,
        role: Role,
        skills: List[str],
        hourly_rate: float
    ) -> TeamMember:
        """Add a team member."""
        member = TeamMember(
            id=f"TM-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            email=email,
            role=role,
            skills=skills,
            hourly_rate=hourly_rate,
            start_date=datetime.now()
        )
        
        self.members[member.id] = member
        return member
    
    def update_stats(
        self,
        member_id: str,
        projects: int = 0,
        hours: float = 0,
        revenue: float = 0,
        rating: float = 0
    ):
        """Update member statistics."""
        member = self.members.get(member_id)
        if member:
            member.projects_completed += projects
            member.hours_logged += hours
            member.revenue_generated += revenue
            if rating > 0:
                member.client_rating = rating
    
    def format_member(self, member: TeamMember) -> str:
        """Format member profile."""
        role_icons = {
            Role.OWNER: "👑",
            Role.MANAGER: "📋",
            Role.DESIGNER: "🎨",
            Role.DEVELOPER: "💻",
            Role.MARKETER: "📢",
            Role.COPYWRITER: "✍️",
            Role.SUPPORT: "🤝"
        }
        
        score = member.productivity_score
        if score >= 80:
            perf_badge = "🔥 TOP PERFORMER"
        elif score >= 60:
            perf_badge = "⭐ EXCELLENT"
        elif score >= 40:
            perf_badge = "✅ GOOD"
        else:
            perf_badge = "📈 GROWING"
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  👤 {member.name.upper():<50}  ║",
            f"║  {role_icons[member.role]} {member.role.value.capitalize():<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📧 {member.email:<48}  ║",
            f"║  💵 Rate: ${member.hourly_rate:.0f}/hr                                    ║",
            "║                                                           ║",
            "║  📊 PERFORMANCE                                           ║",
            f"║    Projects Completed: {member.projects_completed:<30}  ║",
            f"║    Hours Logged: {member.hours_logged:<36.1f}  ║",
            f"║    Revenue Generated: ${member.revenue_generated:>12,.0f}               ║",
            f"║    Client Rating: {'★' * int(member.client_rating)}{'☆' * (5 - int(member.client_rating))} ({member.client_rating:.1f}/5.0)              ║",
            "║                                                           ║",
        ]
        
        # Productivity bar
        bar_filled = int(40 * score / 100)
        bar = "█" * bar_filled + "░" * (40 - bar_filled)
        lines.append(f"║  [{bar}] {score:.0f}%  ║")
        lines.append(f"║  {perf_badge:<51}  ║")
        
        # Skills
        skills_str = ", ".join(member.skills[:4])
        lines.extend([
            "║                                                           ║",
            f"║  🛠️ {skills_str:<48}  ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)
    
    def format_leaderboard(self) -> str:
        """Format team leaderboard."""
        sorted_members = sorted(
            self.members.values(),
            key=lambda m: m.productivity_score,
            reverse=True
        )
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            "║  👥 TEAM LEADERBOARD                                      ║",
            f"║  {self.agency_name:<51}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  Rank │ Name           │ Role      │ Score │ Projects   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        medals = ["🥇", "🥈", "🥉"]
        for i, member in enumerate(sorted_members[:5]):
            rank = medals[i] if i < 3 else f" {i+1}"
            name = member.name[:14]
            role = member.role.value[:9]
            score = f"{member.productivity_score:.0f}%"
            projects = str(member.projects_completed)
            
            lines.append(
                f"║  {rank:<4} │ {name:<14} │ {role:<9} │ {score:>5} │ {projects:>10} ║"
            )
        
        # Summary
        total_hours = sum(m.hours_logged for m in self.members.values())
        total_revenue = sum(m.revenue_generated for m in self.members.values())
        avg_score = sum(m.productivity_score for m in self.members.values()) / len(self.members) if self.members else 0
        
        lines.extend([
            "║                                                           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📊 Team Stats: {len(self.members)} members | {total_hours:.0f}h logged           ║",
            f"║  💰 Total Revenue: ${total_revenue:>12,.0f}                      ║",
            f"║  📈 Avg Productivity: {avg_score:.0f}%                              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    team = TeamPerformance("Saigon Digital Hub")
    
    print("👥 Team Performance")
    print("=" * 60)
    print()
    
    # Add team members
    m1 = team.add_member("Mai Nguyen", "mai@agency.com", Role.DESIGNER, ["Figma", "UI/UX", "Branding"], 50)
    m2 = team.add_member("Tuan Le", "tuan@agency.com", Role.DEVELOPER, ["React", "Node.js", "Python"], 60)
    m3 = team.add_member("Linh Tran", "linh@agency.com", Role.MARKETER, ["SEO", "Ads", "Analytics"], 45)
    m4 = team.add_member("Hoang Pham", "hoang@agency.com", Role.COPYWRITER, ["Content", "SEO", "Email"], 40)
    
    # Update stats
    team.update_stats(m1.id, projects=8, hours=160, revenue=8000, rating=4.8)
    team.update_stats(m2.id, projects=5, hours=200, revenue=12000, rating=4.5)
    team.update_stats(m3.id, projects=12, hours=180, revenue=15000, rating=4.9)
    team.update_stats(m4.id, projects=6, hours=120, revenue=4800, rating=4.2)
    
    print(team.format_leaderboard())
    print()
    print(team.format_member(m1))
