"""
Health Score Agent engine logic.
"""
from datetime import datetime
from typing import Dict, List, Optional

from .models import RiskLevel, UserHealth


class HealthEngine:
    def __init__(self):
        self.users: Dict[str, UserHealth] = {}

    def create_profile(self, user_id: str, user_name: str, signup_date: datetime = None) -> UserHealth:
        profile = UserHealth(user_id=user_id, user_name=user_name, signup_date=signup_date, last_active=datetime.now())
        self.users[user_id] = profile
        return profile

    def update_scores(self, user_id: str, usage: int = None, engagement: int = None, support: int = None) -> UserHealth:
        if user_id not in self.users: raise ValueError("User not found")
        user = self.users[user_id]
        if usage is not None: user.usage_score = usage
        if engagement is not None: user.engagement_score = engagement
        if support is not None: user.support_score = support
        return user
