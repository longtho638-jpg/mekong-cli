"""
Health Score Agent - User Health & Churn Prediction
Calculates health scores and identifies at-risk users.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum


class RiskLevel(Enum):
    HEALTHY = "healthy"
    AT_RISK = "at_risk"
    CRITICAL = "critical"


@dataclass
class UserHealth:
    """User health profile"""
    user_id: str
    user_name: str
    
    # Score components (0-100 each)
    usage_score: int = 0      # 40% weight
    engagement_score: int = 0  # 30% weight
    support_score: int = 0     # 20% weight
    tenure_score: int = 0      # 10% weight
    
    last_active: Optional[datetime] = None
    signup_date: Optional[datetime] = None
    
    def __post_init__(self):
        if self.signup_date is None:
            self.signup_date = datetime.now()
    
    @property
    def health_score(self) -> int:
        """Calculate weighted health score"""
        score = (
            self.usage_score * 0.4 +
            self.engagement_score * 0.3 +
            self.support_score * 0.2 +
            self.tenure_score * 0.1
        )
        return int(score)
    
    @property
    def risk_level(self) -> RiskLevel:
        """Determine risk level from health score"""
        if self.health_score >= 70:
            return RiskLevel.HEALTHY
        elif self.health_score >= 40:
            return RiskLevel.AT_RISK
        else:
            return RiskLevel.CRITICAL


class HealthScoreAgent:
    """
    Health Score Agent - Theo dõi sức khỏe người dùng
    
    Responsibilities:
    - Calculate health scores
    - Predict churn risk
    - Generate retention alerts
    - Track NPS
    """
    
    # Score thresholds
    THRESHOLDS = {
        "days_inactive_warning": 7,
        "days_inactive_critical": 14,
        "low_usage_threshold": 30,
    }
    
    def __init__(self):
        self.name = "Health Score"
        self.status = "ready"
        self.users: Dict[str, UserHealth] = {}
        
    def create_profile(
        self,
        user_id: str,
        user_name: str,
        signup_date: datetime = None
    ) -> UserHealth:
        """Create health profile for user"""
        profile = UserHealth(
            user_id=user_id,
            user_name=user_name,
            signup_date=signup_date,
            last_active=datetime.now()
        )
        
        self.users[user_id] = profile
        return profile
    
    def update_scores(
        self,
        user_id: str,
        usage: int = None,
        engagement: int = None,
        support: int = None
    ) -> UserHealth:
        """Update score components"""
        if user_id not in self.users:
            raise ValueError(f"User not found: {user_id}")
            
        user = self.users[user_id]
        
        if usage is not None:
            user.usage_score = min(100, max(0, usage))
        if engagement is not None:
            user.engagement_score = min(100, max(0, engagement))
        if support is not None:
            user.support_score = min(100, max(0, support))
            
        # Calculate tenure score
        if user.signup_date:
            days = (datetime.now() - user.signup_date).days
            user.tenure_score = min(100, days * 3)  # Max at ~33 days
            
        user.last_active = datetime.now()
        
        return user
    
    def record_activity(self, user_id: str) -> UserHealth:
        """Record user activity"""
        if user_id not in self.users:
            raise ValueError(f"User not found: {user_id}")
            
        user = self.users[user_id]
        user.last_active = datetime.now()
        
        # Boost usage score on activity
        user.usage_score = min(100, user.usage_score + 5)
        
        return user
    
    def get_at_risk_users(self) -> List[UserHealth]:
        """Get users at risk of churn"""
        return [
            u for u in self.users.values()
            if u.risk_level in [RiskLevel.AT_RISK, RiskLevel.CRITICAL]
        ]
    
    def get_inactive_users(self, days: int = 7) -> List[UserHealth]:
        """Get users inactive for X days"""
        cutoff = datetime.now() - timedelta(days=days)
        return [
            u for u in self.users.values()
            if u.last_active and u.last_active < cutoff
        ]
    
    def generate_alert(self, user_id: str) -> Optional[str]:
        """Generate retention alert for user"""
        if user_id not in self.users:
            return None
            
        user = self.users[user_id]
        
        if user.risk_level == RiskLevel.CRITICAL:
            return f"🚨 CRITICAL: {user.user_name} (score: {user.health_score}) - Cần intervention ngay!"
        elif user.risk_level == RiskLevel.AT_RISK:
            return f"⚠️ AT RISK: {user.user_name} (score: {user.health_score}) - Cần check-in"
        
        return None
    
    def get_stats(self) -> Dict:
        """Get health statistics"""
        users = list(self.users.values())
        
        if not users:
            return {"total": 0, "avg_score": 0}
        
        return {
            "total": len(users),
            "avg_score": sum(u.health_score for u in users) / len(users),
            "healthy": len([u for u in users if u.risk_level == RiskLevel.HEALTHY]),
            "at_risk": len([u for u in users if u.risk_level == RiskLevel.AT_RISK]),
            "critical": len([u for u in users if u.risk_level == RiskLevel.CRITICAL]),
        }


# Demo
if __name__ == "__main__":
    agent = HealthScoreAgent()
    
    print("❤️ Health Score Agent Demo\n")
    
    # Create profiles
    user1 = agent.create_profile("user_001", "Nguyễn A")
    user2 = agent.create_profile("user_002", "Trần B")
    
    # Update scores
    agent.update_scores("user_001", usage=85, engagement=70, support=90)
    agent.update_scores("user_002", usage=25, engagement=20, support=50)
    
    print(f"👤 {user1.user_name}: Score = {user1.health_score} ({user1.risk_level.value})")
    print(f"👤 {user2.user_name}: Score = {user2.health_score} ({user2.risk_level.value})")
    
    # At risk
    at_risk = agent.get_at_risk_users()
    print(f"\n⚠️ At Risk: {len(at_risk)} users")
    
    # Alert
    alert = agent.generate_alert("user_002")
    if alert:
        print(f"\n{alert}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Avg Score: {stats['avg_score']:.0f}")
    print(f"   Healthy: {stats['healthy']}")
    print(f"   At Risk: {stats['at_risk']}")
