"""
Field Visit Agent - Customer Visit Management
Manages field visits, check-ins, and travel planning.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class VisitStatus(Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class VisitType(Enum):
    FIRST_MEETING = "first_meeting"
    FOLLOW_UP = "follow_up"
    DEMO = "demo"
    CLOSING = "closing"
    SERVICE = "service"


@dataclass
class Visit:
    """Field visit"""
    id: str
    customer_name: str
    company: str
    address: str
    visit_type: VisitType
    scheduled_at: datetime
    status: VisitStatus = VisitStatus.SCHEDULED
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: str = ""
    outcome: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def duration_mins(self) -> int:
        if self.check_in_time and self.check_out_time:
            return int((self.check_out_time - self.check_in_time).total_seconds() / 60)
        return 0


class FieldVisitAgent:
    """
    Field Visit Agent - Quản lý Thăm Khách hàng
    
    Responsibilities:
    - Schedule customer visits
    - Check-in/check-out tracking
    - Visit notes and outcomes
    - Travel planning
    """
    
    def __init__(self):
        self.name = "Field Visit"
        self.status = "ready"
        self.visits: Dict[str, Visit] = {}
        
    def schedule_visit(
        self,
        customer_name: str,
        company: str,
        address: str,
        visit_type: VisitType,
        scheduled_at: datetime
    ) -> Visit:
        """Schedule a new field visit"""
        visit_id = f"visit_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        visit = Visit(
            id=visit_id,
            customer_name=customer_name,
            company=company,
            address=address,
            visit_type=visit_type,
            scheduled_at=scheduled_at
        )
        
        self.visits[visit_id] = visit
        return visit
    
    def check_in(self, visit_id: str) -> Visit:
        """Check in at customer location"""
        if visit_id not in self.visits:
            raise ValueError(f"Visit not found: {visit_id}")
            
        visit = self.visits[visit_id]
        visit.check_in_time = datetime.now()
        visit.status = VisitStatus.IN_PROGRESS
        
        return visit
    
    def check_out(self, visit_id: str, notes: str = "", outcome: str = "") -> Visit:
        """Check out from customer location"""
        if visit_id not in self.visits:
            raise ValueError(f"Visit not found: {visit_id}")
            
        visit = self.visits[visit_id]
        visit.check_out_time = datetime.now()
        visit.status = VisitStatus.COMPLETED
        visit.notes = notes
        visit.outcome = outcome
        
        return visit
    
    def get_today_visits(self) -> List[Visit]:
        """Get today's scheduled visits"""
        today = datetime.now().date()
        return [
            v for v in self.visits.values()
            if v.scheduled_at.date() == today
        ]
    
    def get_upcoming(self, days: int = 7) -> List[Visit]:
        """Get upcoming visits"""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            v for v in self.visits.values()
            if v.scheduled_at <= cutoff and v.status == VisitStatus.SCHEDULED
        ]
    
    def get_stats(self) -> Dict:
        """Get visit statistics"""
        visits = list(self.visits.values())
        completed = [v for v in visits if v.status == VisitStatus.COMPLETED]
        
        return {
            "total_visits": len(visits),
            "completed": len(completed),
            "scheduled": len([v for v in visits if v.status == VisitStatus.SCHEDULED]),
            "avg_duration_mins": sum(v.duration_mins for v in completed) / len(completed) if completed else 0,
            "today": len(self.get_today_visits())
        }


# Demo
if __name__ == "__main__":
    agent = FieldVisitAgent()
    
    print("🚗 Field Visit Agent Demo\n")
    
    # Schedule visits
    v1 = agent.schedule_visit(
        "Nguyễn A", "TechCorp VN", "123 Nguyễn Huệ, Q1, HCM",
        VisitType.DEMO, datetime.now() + timedelta(hours=2)
    )
    
    v2 = agent.schedule_visit(
        "Trần B", "StartupX", "456 Lê Lợi, Q1, HCM",
        VisitType.FOLLOW_UP, datetime.now() + timedelta(hours=4)
    )
    
    print(f"📅 Visit: {v1.company} ({v1.visit_type.value})")
    print(f"   Address: {v1.address}")
    
    # Check in/out
    agent.check_in(v1.id)
    print(f"\n✅ Checked in at {v1.check_in_time.strftime('%H:%M')}")
    
    agent.check_out(v1.id, "Great demo", "Moving to POC")
    print(f"✅ Checked out ({v1.duration_mins} mins)")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_visits']}")
    print(f"   Completed: {stats['completed']}")
