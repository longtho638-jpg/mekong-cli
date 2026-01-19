"""
Design Agent - Design Briefs & Production
Manages design workflow, production, and deliverables.
"""

import random
from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List


class DesignType(Enum):
    GRAPHIC = "graphic"
    VIDEO = "video"
    WEB = "web"
    ANIMATION = "animation"
    PRINT = "print"


class DesignStatus(Enum):
    BRIEFING = "briefing"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    REVISIONS = "revisions"
    APPROVED = "approved"
    DELIVERED = "delivered"


@dataclass
class DesignProject:
    """Design project"""

    id: str
    name: str
    design_type: DesignType
    concept_id: str
    status: DesignStatus = DesignStatus.BRIEFING
    designer: str = ""
    due_date: date = None
    revisions: int = 0
    deliverables: List[str] = field(default_factory=list)
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class DesignAgent:
    """
    Design Agent - Quản lý Thiết kế

    Responsibilities:
    - Design briefs
    - Production tracking
    - Review workflow
    - Deliverable management
    """

    def __init__(self):
        self.name = "Design"
        self.status = "ready"
        self.projects: Dict[str, DesignProject] = {}

    def create_project(
        self,
        name: str,
        design_type: DesignType,
        concept_id: str,
        designer: str = "",
        due_date: date = None,
    ) -> DesignProject:
        """Create design project"""
        project_id = f"design_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        project = DesignProject(
            id=project_id,
            name=name,
            design_type=design_type,
            concept_id=concept_id,
            designer=designer,
            due_date=due_date,
        )

        self.projects[project_id] = project
        return project

    def start_production(self, project_id: str) -> DesignProject:
        """Start production"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        self.projects[project_id].status = DesignStatus.IN_PROGRESS
        return self.projects[project_id]

    def submit_for_review(self, project_id: str) -> DesignProject:
        """Submit for review"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        self.projects[project_id].status = DesignStatus.REVIEW
        return self.projects[project_id]

    def request_revisions(self, project_id: str) -> DesignProject:
        """Request revisions"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        project = self.projects[project_id]
        project.status = DesignStatus.REVISIONS
        project.revisions += 1

        return project

    def approve(self, project_id: str) -> DesignProject:
        """Approve design"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        self.projects[project_id].status = DesignStatus.APPROVED
        return self.projects[project_id]

    def add_deliverable(self, project_id: str, deliverable: str) -> DesignProject:
        """Add deliverable"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        self.projects[project_id].deliverables.append(deliverable)
        return self.projects[project_id]

    def deliver(self, project_id: str) -> DesignProject:
        """Mark as delivered"""
        if project_id not in self.projects:
            raise ValueError(f"Project not found: {project_id}")

        self.projects[project_id].status = DesignStatus.DELIVERED
        return self.projects[project_id]

    def get_stats(self) -> Dict:
        """Get design statistics"""
        projects = list(self.projects.values())
        delivered = [p for p in projects if p.status == DesignStatus.DELIVERED]

        return {
            "total_projects": len(projects),
            "in_progress": len([p for p in projects if p.status == DesignStatus.IN_PROGRESS]),
            "in_review": len([p for p in projects if p.status == DesignStatus.REVIEW]),
            "delivered": len(delivered),
            "avg_revisions": sum(p.revisions for p in projects) / len(projects) if projects else 0,
        }


# Demo
if __name__ == "__main__":
    agent = DesignAgent()

    print("🎨 Design Agent Demo\n")

    # Create project
    from datetime import timedelta

    p1 = agent.create_project(
        name="Summer Splash Video",
        design_type=DesignType.VIDEO,
        concept_id="concept_123",
        designer="Designer A",
        due_date=date.today() + timedelta(days=7),
    )

    print(f"📋 Project: {p1.name}")
    print(f"   Type: {p1.design_type.value}")
    print(f"   Designer: {p1.designer}")
    print(f"   Due: {p1.due_date}")

    # Workflow
    agent.start_production(p1.id)
    agent.submit_for_review(p1.id)
    agent.request_revisions(p1.id)
    agent.submit_for_review(p1.id)
    agent.approve(p1.id)

    # Deliverables
    agent.add_deliverable(p1.id, "video_15s.mp4")
    agent.add_deliverable(p1.id, "video_30s.mp4")
    agent.deliver(p1.id)

    print(f"\n✅ Status: {p1.status.value}")
    print(f"   Revisions: {p1.revisions}")
    print(f"   Deliverables: {len(p1.deliverables)}")
