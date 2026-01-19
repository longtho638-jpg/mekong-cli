"""
Product Launch Agent - GTM Planning & Launch Execution
Manages product launches, timelines, and success metrics.
"""

from dataclasses import dataclass, field
from typing import List, Dict
from datetime import datetime, date
from enum import Enum
import random


class LaunchType(Enum):
    MAJOR = "major"
    MINOR = "minor"
    FEATURE = "feature"
    UPDATE = "update"


class LaunchStatus(Enum):
    PLANNING = "planning"
    PRE_LAUNCH = "pre_launch"
    LAUNCHING = "launching"
    LAUNCHED = "launched"
    POST_LAUNCH = "post_launch"


@dataclass
class Milestone:
    """Launch milestone"""
    name: str
    due_date: date
    completed: bool = False


@dataclass
class Launch:
    """Product launch"""
    id: str
    name: str
    product: str
    launch_type: LaunchType
    launch_date: date
    status: LaunchStatus = LaunchStatus.PLANNING
    milestones: List[Milestone] = field(default_factory=list)
    metrics: Dict[str, int] = field(default_factory=dict)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

    @property
    def progress(self) -> float:
        if not self.milestones:
            return 0
        completed = sum(1 for m in self.milestones if m.completed)
        return (completed / len(self.milestones)) * 100


class ProductLaunchAgent:
    """
    Product Launch Agent - Ra mắt Sản phẩm
    
    Responsibilities:
    - Launch planning
    - GTM execution
    - Launch timeline
    - Success metrics
    """

    def __init__(self):
        self.name = "Product Launch"
        self.status = "ready"
        self.launches: Dict[str, Launch] = {}

    def create_launch(
        self,
        name: str,
        product: str,
        launch_type: LaunchType,
        launch_date: date
    ) -> Launch:
        """Create product launch"""
        launch_id = f"launch_{random.randint(100,999)}"

        launch = Launch(
            id=launch_id,
            name=name,
            product=product,
            launch_type=launch_type,
            launch_date=launch_date
        )

        self.launches[launch_id] = launch
        return launch

    def add_milestone(self, launch_id: str, name: str, due_date: date) -> Launch:
        """Add milestone"""
        if launch_id not in self.launches:
            raise ValueError(f"Launch not found: {launch_id}")

        milestone = Milestone(name=name, due_date=due_date)
        self.launches[launch_id].milestones.append(milestone)

        return self.launches[launch_id]

    def complete_milestone(self, launch_id: str, milestone_name: str) -> Launch:
        """Complete milestone"""
        if launch_id not in self.launches:
            raise ValueError(f"Launch not found: {launch_id}")

        launch = self.launches[launch_id]
        for m in launch.milestones:
            if m.name == milestone_name:
                m.completed = True
                break

        return launch

    def update_status(self, launch_id: str, status: LaunchStatus) -> Launch:
        """Update launch status"""
        if launch_id not in self.launches:
            raise ValueError(f"Launch not found: {launch_id}")

        self.launches[launch_id].status = status
        return self.launches[launch_id]

    def record_metric(self, launch_id: str, name: str, value: int) -> Launch:
        """Record launch metric"""
        if launch_id not in self.launches:
            raise ValueError(f"Launch not found: {launch_id}")

        self.launches[launch_id].metrics[name] = value
        return self.launches[launch_id]

    def get_stats(self) -> Dict:
        """Get launch statistics"""
        launches = list(self.launches.values())
        launched = [l for l in launches if l.status == LaunchStatus.LAUNCHED]

        return {
            "total_launches": len(launches),
            "launched": len(launched),
            "in_progress": len([l for l in launches if l.status in [LaunchStatus.PLANNING, LaunchStatus.PRE_LAUNCH]]),
            "avg_progress": sum(l.progress for l in launches) / len(launches) if launches else 0
        }


# Demo
if __name__ == "__main__":
    agent = ProductLaunchAgent()

    print("🚀 Product Launch Agent Demo\n")

    from datetime import timedelta

    # Create launch
    l1 = agent.create_launch(
        name="Product X 2.0",
        product="Product X",
        launch_type=LaunchType.MAJOR,
        launch_date=date.today() + timedelta(days=30)
    )

    print(f"📋 Launch: {l1.name}")
    print(f"   Product: {l1.product}")
    print(f"   Type: {l1.launch_type.value}")
    print(f"   Date: {l1.launch_date}")

    # Add milestones
    agent.add_milestone(l1.id, "Messaging finalized", date.today() + timedelta(days=7))
    agent.add_milestone(l1.id, "Assets ready", date.today() + timedelta(days=14))
    agent.add_milestone(l1.id, "GTM plan approved", date.today() + timedelta(days=21))
    agent.add_milestone(l1.id, "Launch day", date.today() + timedelta(days=30))

    # Complete milestones
    agent.complete_milestone(l1.id, "Messaging finalized")
    agent.complete_milestone(l1.id, "Assets ready")

    print(f"\n📊 Progress: {l1.progress:.0f}%")
    print(f"   Milestones: {sum(1 for m in l1.milestones if m.completed)}/{len(l1.milestones)}")

    # Launch
    agent.update_status(l1.id, LaunchStatus.LAUNCHED)
    agent.record_metric(l1.id, "signups", 500)
    agent.record_metric(l1.id, "press_mentions", 15)

    print(f"\n✅ Status: {l1.status.value}")
    print(f"   Signups: {l1.metrics.get('signups', 0)}")
