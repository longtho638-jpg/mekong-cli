"""
Onboarding Agent - User Activation & Milestones
Tracks user progress through onboarding journey.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum


class MilestoneStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


@dataclass
class Milestone:
    """Onboarding milestone"""
    id: str
    name: str
    description: str
    order: int
    status: MilestoneStatus = MilestoneStatus.PENDING
    completed_at: Optional[datetime] = None


@dataclass
class UserOnboarding:
    """User onboarding progress"""
    user_id: str
    user_name: str
    email: str
    plan: str = "starter"  # starter, pro, enterprise
    milestones: List[Milestone] = field(default_factory=list)
    started_at: datetime = None
    activated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.started_at is None:
            self.started_at = datetime.now()
    
    @property
    def progress_percent(self) -> float:
        if not self.milestones:
            return 0
        completed = len([m for m in self.milestones if m.status == MilestoneStatus.COMPLETED])
        return round(completed / len(self.milestones) * 100, 1)
    
    @property
    def is_activated(self) -> bool:
        return self.activated_at is not None


class OnboardingAgent:
    """
    Onboarding Agent - Hướng dẫn người dùng mới
    
    Responsibilities:
    - Track milestone completion
    - Send check-in messages
    - Recommend tutorials
    - Mark activation
    """
    
    # Default milestones
    DEFAULT_MILESTONES = [
        ("install", "Cài đặt CLI", "Chạy npm install -g mekong-cli"),
        ("init", "Khởi tạo project", "Chạy mekong init"),
        ("vibe", "Setup Vibe Tuning", "Chọn giọng địa phương"),
        ("deploy", "Deploy lần đầu", "Chạy mekong deploy"),
        ("first_agent", "Chạy Agent đầu tiên", "Sử dụng Scout hoặc Editor"),
    ]
    
    def __init__(self):
        self.name = "Onboarding"
        self.status = "ready"
        self.users: Dict[str, UserOnboarding] = {}
        
    def start_onboarding(
        self,
        user_id: str,
        user_name: str,
        email: str,
        plan: str = "starter"
    ) -> UserOnboarding:
        """Start onboarding for new user"""
        milestones = [
            Milestone(
                id=f"milestone_{i+1}",
                name=name,
                description=desc,
                order=i+1
            )
            for i, (_, name, desc) in enumerate(self.DEFAULT_MILESTONES)
        ]
        
        user = UserOnboarding(
            user_id=user_id,
            user_name=user_name,
            email=email,
            plan=plan,
            milestones=milestones
        )
        
        self.users[user_id] = user
        return user
    
    def complete_milestone(self, user_id: str, milestone_id: str) -> UserOnboarding:
        """Mark milestone as completed"""
        if user_id not in self.users:
            raise ValueError(f"User not found: {user_id}")
            
        user = self.users[user_id]
        
        for milestone in user.milestones:
            if milestone.id == milestone_id:
                milestone.status = MilestoneStatus.COMPLETED
                milestone.completed_at = datetime.now()
                break
        
        # Check if activated (50%+ complete)
        if user.progress_percent >= 50 and not user.is_activated:
            user.activated_at = datetime.now()
            
        return user
    
    def get_next_milestone(self, user_id: str) -> Optional[Milestone]:
        """Get next pending milestone"""
        if user_id not in self.users:
            return None
            
        user = self.users[user_id]
        for milestone in sorted(user.milestones, key=lambda m: m.order):
            if milestone.status == MilestoneStatus.PENDING:
                return milestone
        return None
    
    def get_checkin_message(self, user_id: str) -> str:
        """Generate personalized check-in message"""
        if user_id not in self.users:
            return "Chào bạn!"
            
        user = self.users[user_id]
        next_m = self.get_next_milestone(user_id)
        
        if user.progress_percent == 100:
            return f"🎉 Chúc mừng {user.user_name}! Bạn đã hoàn thành onboarding!"
        elif next_m:
            return f"Xin chào {user.user_name}! Bước tiếp theo: {next_m.name} - {next_m.description}"
        else:
            return f"Xin chào {user.user_name}! Bạn đang làm rất tốt!"
    
    def get_stats(self) -> Dict:
        """Get onboarding statistics"""
        users = list(self.users.values())
        
        return {
            "total_users": len(users),
            "activated": len([u for u in users if u.is_activated]),
            "avg_progress": sum(u.progress_percent for u in users) / len(users) if users else 0,
            "by_plan": {
                plan: len([u for u in users if u.plan == plan])
                for plan in ["starter", "pro", "enterprise"]
            }
        }


# Demo
if __name__ == "__main__":
    agent = OnboardingAgent()
    
    print("🎯 Onboarding Agent Demo\n")
    
    # Start onboarding
    user = agent.start_onboarding(
        user_id="user_001",
        user_name="Nguyễn Văn A",
        email="a@email.com",
        plan="pro"
    )
    
    print(f"👤 User: {user.user_name}")
    print(f"   Plan: {user.plan}")
    print(f"   Milestones: {len(user.milestones)}")
    
    # Complete milestones
    agent.complete_milestone(user.user_id, "milestone_1")
    agent.complete_milestone(user.user_id, "milestone_2")
    agent.complete_milestone(user.user_id, "milestone_3")
    
    print(f"\n📊 Progress: {user.progress_percent}%")
    print(f"✅ Activated: {user.is_activated}")
    
    # Check-in
    msg = agent.get_checkin_message(user.user_id)
    print(f"\n💬 Check-in: {msg}")
    
    # Stats
    print("\n📈 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_users']}")
    print(f"   Activated: {stats['activated']}")
