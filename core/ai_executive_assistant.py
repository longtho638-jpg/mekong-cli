"""
🤖 AI Executive Assistant - Smart Admin
=========================================

AI-powered executive assistant.
Your second brain!

Roles:
- Smart scheduling
- Meeting summarization
- Email triage
- Task prioritization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TaskPriority(Enum):
    """Task priority levels."""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MeetingType(Enum):
    """Meeting types."""
    ONE_ON_ONE = "one_on_one"
    TEAM = "team"
    CLIENT = "client"
    BOARD = "board"
    STANDUP = "standup"


class EmailCategory(Enum):
    """Email categories."""
    URGENT = "urgent"
    ACTION_REQUIRED = "action_required"
    FYI = "fyi"
    SPAM = "spam"
    NEWSLETTER = "newsletter"


@dataclass
class ExecutiveTask:
    """A task for the executive."""
    id: str
    title: str
    priority: TaskPriority
    due_date: datetime
    assignee: str = ""
    completed: bool = False
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Meeting:
    """A scheduled meeting."""
    id: str
    title: str
    meeting_type: MeetingType
    attendees: List[str]
    scheduled_at: datetime
    duration_mins: int = 30
    agenda: str = ""
    summary: str = ""
    action_items: List[str] = field(default_factory=list)


@dataclass
class EmailDigest:
    """Daily email digest."""
    date: datetime
    total_emails: int
    by_category: Dict[str, int]
    top_urgent: List[str] = field(default_factory=list)


class AIExecutiveAssistant:
    """
    AI Executive Assistant.
    
    Smart admin automation.
    """
    
    def __init__(self, agency_name: str, executive: str = "CEO"):
        self.agency_name = agency_name
        self.executive = executive
        self.tasks: Dict[str, ExecutiveTask] = {}
        self.meetings: List[Meeting] = []
        self.email_digests: List[EmailDigest] = []
    
    def create_task(
        self,
        title: str,
        priority: TaskPriority,
        due_days: int = 1,
        assignee: str = ""
    ) -> ExecutiveTask:
        """Create a task."""
        task = ExecutiveTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            priority=priority,
            due_date=datetime.now() + timedelta(days=due_days),
            assignee=assignee or self.executive
        )
        self.tasks[task.id] = task
        return task
    
    def complete_task(self, task: ExecutiveTask):
        """Mark task complete."""
        task.completed = True
    
    def schedule_meeting(
        self,
        title: str,
        meeting_type: MeetingType,
        attendees: List[str],
        hours_from_now: int = 24,
        duration: int = 30,
        agenda: str = ""
    ) -> Meeting:
        """Schedule a meeting."""
        meeting = Meeting(
            id=f"MTG-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            meeting_type=meeting_type,
            attendees=attendees,
            scheduled_at=datetime.now() + timedelta(hours=hours_from_now),
            duration_mins=duration,
            agenda=agenda
        )
        self.meetings.append(meeting)
        return meeting
    
    def summarize_meeting(self, meeting: Meeting, summary: str, actions: List[str] = None):
        """Add meeting summary and action items."""
        meeting.summary = summary
        meeting.action_items = actions or []
    
    def create_email_digest(
        self,
        total: int,
        urgent: int,
        action: int,
        fyi: int,
        top_urgent: List[str] = None
    ) -> EmailDigest:
        """Create daily email digest."""
        digest = EmailDigest(
            date=datetime.now(),
            total_emails=total,
            by_category={
                "urgent": urgent,
                "action_required": action,
                "fyi": fyi,
                "other": total - urgent - action - fyi
            },
            top_urgent=top_urgent or []
        )
        self.email_digests.append(digest)
        return digest
    
    def get_daily_brief(self) -> Dict[str, Any]:
        """Get daily briefing."""
        today = datetime.now().date()
        
        pending_tasks = [t for t in self.tasks.values() if not t.completed]
        urgent_tasks = [t for t in pending_tasks if t.priority == TaskPriority.URGENT]
        overdue = [t for t in pending_tasks if t.due_date.date() < today]
        
        today_meetings = [m for m in self.meetings if m.scheduled_at.date() == today]
        
        return {
            "pending_tasks": len(pending_tasks),
            "urgent_tasks": len(urgent_tasks),
            "overdue": len(overdue),
            "today_meetings": len(today_meetings),
            "total_meetings": len(self.meetings)
        }
    
    def format_dashboard(self) -> str:
        """Format AI EA dashboard."""
        brief = self.get_daily_brief()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤖 AI EXECUTIVE ASSISTANT                                ║",
            f"║  {self.executive}'s Dashboard │ {brief['pending_tasks']} tasks │ {brief['today_meetings']} meetings  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 TODAY'S PRIORITIES                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        priority_icons = {"urgent": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}
        
        for task in sorted([t for t in self.tasks.values() if not t.completed], 
                          key=lambda x: list(TaskPriority).index(x.priority))[:5]:
            icon = priority_icons.get(task.priority.value, "⚪")
            due = task.due_date.strftime("%b %d")
            status = "⏰" if task.due_date.date() < datetime.now().date() else "📋"
            
            lines.append(f"║  {status} {icon} {task.title[:25]:<25} │ {due:<8} │ {task.assignee[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📅 UPCOMING MEETINGS                                     ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        type_icons = {"one_on_one": "👤", "team": "👥", "client": "🤝", "board": "🏛️", "standup": "🚀"}
        
        for meeting in sorted(self.meetings, key=lambda x: x.scheduled_at)[:4]:
            icon = type_icons.get(meeting.meeting_type.value, "📅")
            time = meeting.scheduled_at.strftime("%b %d %H:%M")
            
            lines.append(f"║  {icon} {meeting.title[:20]:<20} │ {time:<14} │ {meeting.duration_mins:>2}min  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📧 EMAIL DIGEST                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        if self.email_digests:
            latest = self.email_digests[-1]
            lines.append(f"║    📬 Total: {latest.total_emails:>3} │ 🔴 Urgent: {latest.by_category.get('urgent', 0):>2} │ ⚡ Action: {latest.by_category.get('action_required', 0):>2}  ║")
            for urgent in latest.top_urgent[:2]:
                lines.append(f"║    🔴 {urgent[:50]:<50}  ║")
        else:
            lines.append("║    📭 No email digest yet                                 ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📋 Tasks]  [📅 Schedule]  [📧 Emails]  [🤖 Automate]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Your second brain!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    ea = AIExecutiveAssistant("Saigon Digital Hub", "Khoa Nguyen")
    
    print("🤖 AI Executive Assistant")
    print("=" * 60)
    print()
    
    ea.create_task("Review Q4 financials", TaskPriority.URGENT, 0)
    ea.create_task("Approve marketing budget", TaskPriority.HIGH, 1)
    ea.create_task("Sign partnership agreement", TaskPriority.HIGH, 2)
    ea.create_task("Team performance reviews", TaskPriority.MEDIUM, 7)
    
    m1 = ea.schedule_meeting("Weekly Leadership Sync", MeetingType.TEAM, ["CTO", "CMO", "CFO"], 2, 60)
    m2 = ea.schedule_meeting("Client Onboarding", MeetingType.CLIENT, ["Coffee Lab Team"], 24, 45)
    m3 = ea.schedule_meeting("Board Update", MeetingType.BOARD, ["All Board Members"], 48, 90)
    
    ea.summarize_meeting(m1, "Discussed Q4 goals", ["Finalize budget", "Hire 2 developers"])
    
    ea.create_email_digest(45, 3, 12, 20, ["Contract from BigCorp - URGENT", "Payment reminder"])
    
    print(ea.format_dashboard())
