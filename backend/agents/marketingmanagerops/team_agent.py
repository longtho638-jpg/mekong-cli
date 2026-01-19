"""
Team Agent - Marketing Team Management
Manages team members, tasks, and performance.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict


class TaskStatus(Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


@dataclass
class TeamMember:
    """Marketing team member"""

    id: str
    name: str
    role: str
    capacity: int = 40  # hours/week
    assigned: int = 0
    completed_tasks: int = 0

    @property
    def utilization(self) -> float:
        return (self.assigned / self.capacity * 100) if self.capacity > 0 else 0


@dataclass
class MarketingTask:
    """Marketing task"""

    id: str
    title: str
    assignee_id: str
    hours: int
    status: TaskStatus = TaskStatus.TODO
    due_date: datetime = None


class TeamAgent:
    """
    Team Agent - Quản lý Team Marketing

    Responsibilities:
    - Team management
    - Task assignment
    - Performance tracking
    - Capacity planning
    """

    def __init__(self):
        self.name = "Team"
        self.status = "ready"
        self.members: Dict[str, TeamMember] = {}
        self.tasks: Dict[str, MarketingTask] = {}

    def add_member(self, name: str, role: str, capacity: int = 40) -> TeamMember:
        """Add team member"""
        member_id = f"member_{random.randint(100, 999)}"

        member = TeamMember(id=member_id, name=name, role=role, capacity=capacity)

        self.members[member_id] = member
        return member

    def assign_task(
        self, title: str, assignee_id: str, hours: int, due_date: datetime = None
    ) -> MarketingTask:
        """Assign task to team member"""
        if assignee_id not in self.members:
            raise ValueError(f"Member not found: {assignee_id}")

        task_id = f"task_{random.randint(1000, 9999)}"

        task = MarketingTask(
            id=task_id, title=title, assignee_id=assignee_id, hours=hours, due_date=due_date
        )

        self.tasks[task_id] = task
        self.members[assignee_id].assigned += hours

        return task

    def complete_task(self, task_id: str) -> MarketingTask:
        """Complete task"""
        if task_id not in self.tasks:
            raise ValueError(f"Task not found: {task_id}")

        task = self.tasks[task_id]
        task.status = TaskStatus.DONE

        member = self.members[task.assignee_id]
        member.completed_tasks += 1
        member.assigned -= task.hours

        return task

    def get_stats(self) -> Dict:
        """Get team statistics"""
        members = list(self.members.values())
        tasks = list(self.tasks.values())

        return {
            "total_members": len(members),
            "avg_utilization": sum(m.utilization for m in members) / len(members) if members else 0,
            "total_tasks": len(tasks),
            "completed": len([t for t in tasks if t.status == TaskStatus.DONE]),
            "in_progress": len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS]),
        }


# Demo
if __name__ == "__main__":
    agent = TeamAgent()

    print("👥 Team Agent Demo\n")

    # Add members
    m1 = agent.add_member("Nguyen A", "Content Lead", 40)
    m2 = agent.add_member("Tran B", "SEO Specialist", 40)
    m3 = agent.add_member("Le C", "Email Marketer", 40)

    print(f"👤 Member: {m1.name}")
    print(f"   Role: {m1.role}")
    print(f"   Capacity: {m1.capacity}h/week")

    # Assign tasks
    t1 = agent.assign_task("Blog post: Q1 Strategy", m1.id, 8)
    t2 = agent.assign_task("SEO audit homepage", m2.id, 12)
    t3 = agent.assign_task("Newsletter campaign", m3.id, 6)

    print(f"\n📋 Task: {t1.title}")
    print(f"   Assigned to: {m1.name}")
    print(f"   Hours: {t1.hours}")

    # Complete
    agent.complete_task(t1.id)

    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Team: {stats['total_members']}")
    print(f"   Utilization: {stats['avg_utilization']:.0f}%")
    print(f"   Completed: {stats['completed']}/{stats['total_tasks']}")
