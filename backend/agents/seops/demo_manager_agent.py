"""
Demo Manager Agent - Product Demo Scheduling
Manages product demos, scripts, and outcomes.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class DemoType(Enum):
    DISCOVERY = "discovery"
    TECHNICAL = "technical"
    EXECUTIVE = "executive"
    FINAL = "final"


class DemoOutcome(Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    POSITIVE = "positive"
    NEGATIVE = "negative"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"


@dataclass
class Demo:
    """Product demo"""
    id: str
    prospect: str
    company: str
    demo_type: DemoType
    scheduled_at: datetime
    se_assigned: str
    outcome: DemoOutcome = DemoOutcome.SCHEDULED
    notes: str = ""
    deal_size: float = 0.0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class DemoManagerAgent:
    """
    Demo Manager Agent - Quản lý Demo Sản phẩm
    
    Responsibilities:
    - Schedule product demos
    - Track demo outcomes
    - Manage demo scripts
    - Setup demo environments
    """
    
    # Demo scripts library
    DEMO_SCRIPTS = {
        DemoType.DISCOVERY: [
            "1. Introduction (2 min)",
            "2. Pain point discussion (5 min)",
            "3. Quick product overview (10 min)",
            "4. Q&A (5 min)",
            "5. Next steps (3 min)"
        ],
        DemoType.TECHNICAL: [
            "1. Architecture overview (5 min)",
            "2. Live coding demo (15 min)",
            "3. Integration walkthrough (10 min)",
            "4. Technical Q&A (10 min)",
            "5. POC discussion (5 min)"
        ],
        DemoType.EXECUTIVE: [
            "1. Business case (5 min)",
            "2. ROI presentation (10 min)",
            "3. Product highlights (10 min)",
            "4. Customer success stories (5 min)",
            "5. Pricing discussion (10 min)"
        ]
    }
    
    def __init__(self):
        self.name = "Demo Manager"
        self.status = "ready"
        self.demos: Dict[str, Demo] = {}
        
    def schedule_demo(
        self,
        prospect: str,
        company: str,
        demo_type: DemoType,
        scheduled_at: datetime,
        se_assigned: str,
        deal_size: float = 0.0
    ) -> Demo:
        """Schedule a new demo"""
        demo_id = f"demo_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        
        demo = Demo(
            id=demo_id,
            prospect=prospect,
            company=company,
            demo_type=demo_type,
            scheduled_at=scheduled_at,
            se_assigned=se_assigned,
            deal_size=deal_size
        )
        
        self.demos[demo_id] = demo
        return demo
    
    def record_outcome(self, demo_id: str, outcome: DemoOutcome, notes: str = "") -> Demo:
        """Record demo outcome"""
        if demo_id not in self.demos:
            raise ValueError(f"Demo not found: {demo_id}")
            
        demo = self.demos[demo_id]
        demo.outcome = outcome
        demo.notes = notes
        
        return demo
    
    def get_script(self, demo_type: DemoType) -> List[str]:
        """Get demo script"""
        return self.DEMO_SCRIPTS.get(demo_type, [])
    
    def get_upcoming(self, days: int = 7) -> List[Demo]:
        """Get upcoming demos"""
        cutoff = datetime.now() + timedelta(days=days)
        return [
            d for d in self.demos.values()
            if d.scheduled_at <= cutoff and d.outcome == DemoOutcome.SCHEDULED
        ]
    
    def get_by_se(self, se_name: str) -> List[Demo]:
        """Get demos by SE"""
        return [d for d in self.demos.values() if d.se_assigned == se_name]
    
    def get_stats(self) -> Dict:
        """Get demo statistics"""
        demos = list(self.demos.values())
        positive = len([d for d in demos if d.outcome == DemoOutcome.POSITIVE])
        completed = len([d for d in demos if d.outcome in [DemoOutcome.POSITIVE, DemoOutcome.NEGATIVE, DemoOutcome.COMPLETED]])
        
        return {
            "total_demos": len(demos),
            "scheduled": len([d for d in demos if d.outcome == DemoOutcome.SCHEDULED]),
            "completed": completed,
            "positive": positive,
            "conversion_rate": f"{positive/completed*100:.0f}%" if completed > 0 else "0%",
            "pipeline_value": sum(d.deal_size for d in demos if d.outcome in [DemoOutcome.SCHEDULED, DemoOutcome.POSITIVE])
        }


# Demo
if __name__ == "__main__":
    agent = DemoManagerAgent()
    
    print("🎬 Demo Manager Agent Demo\n")
    
    # Schedule demos
    demo1 = agent.schedule_demo(
        prospect="Nguyễn A",
        company="TechCorp VN",
        demo_type=DemoType.TECHNICAL,
        scheduled_at=datetime.now() + timedelta(days=2),
        se_assigned="SE_001",
        deal_size=5000
    )
    
    demo2 = agent.schedule_demo(
        prospect="Trần B",
        company="StartupX",
        demo_type=DemoType.DISCOVERY,
        scheduled_at=datetime.now() + timedelta(days=1),
        se_assigned="SE_001",
        deal_size=2000
    )
    
    print(f"📅 Demo: {demo1.company}")
    print(f"   Type: {demo1.demo_type.value}")
    print(f"   Date: {demo1.scheduled_at.strftime('%Y-%m-%d %H:%M')}")
    
    # Get script
    script = agent.get_script(DemoType.TECHNICAL)
    print(f"\n📋 Script: {script[0]}...")
    
    # Record outcome
    agent.record_outcome(demo2.id, DemoOutcome.POSITIVE, "Very interested, moving to POC")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Total: {stats['total_demos']}")
    print(f"   Pipeline: ${stats['pipeline_value']:,.0f}")
