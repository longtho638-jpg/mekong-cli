"""
Team Performance Tracker engine.
"""
import uuid
from datetime import datetime
from typing import Dict, List

from .models import Role, TeamMember


class TeamTrackerEngine:
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.members: Dict[str, TeamMember] = {}

    def add_member(
        self, name: str, email: str, role: Role, skills: List[str], hourly_rate: float
    ) -> TeamMember:
        member = TeamMember(
            id=f"TM-{uuid.uuid4().hex[:6].upper()}",
            name=name, email=email, role=role, skills=skills,
            hourly_rate=hourly_rate, start_date=datetime.now(),
        )
        self.members[member.id] = member
        return member

    def update_stats(self, member_id: str, projects: int = 0, hours: float = 0, revenue: float = 0, rating: float = 0):
        member = self.members.get(member_id)
        if member:
            member.projects_completed += projects
            member.hours_logged += hours
            member.revenue_generated += revenue
            if rating > 0: member.client_rating = rating
