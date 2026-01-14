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

import uuid
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    """Task priority levels."""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def weight(self) -> int:
        """Numeric weight for sorting (higher is more urgent)."""
        mapping = {
            TaskPriority.URGENT: 4,
            TaskPriority.HIGH: 3,
            TaskPriority.MEDIUM: 2,
            TaskPriority.LOW: 1
        }
        return mapping[self]


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
    AI Executive Assistant System.
    
    Automates scheduling, task tracking, and briefings.
    """
    
    def __init__(self, agency_name: str, executive: str = "CEO"):
        self.agency_name = agency_name
        self.executive = executive
        self.tasks: Dict[str, ExecutiveTask] = {}
        self.meetings: List[Meeting] = []
        self.email_digests: List[EmailDigest] = []
        logger.info(f"AI Executive Assistant initialized for {executive} at {agency_name}")
    
    def create_task(
        self,
        title: str,
        priority: TaskPriority,
        due_days: int = 1,
        assignee: str = ""
    ) -> ExecutiveTask:
        """Create a new task."""
        if not title:
            raise ValueError("Task title cannot be empty")

        task = ExecutiveTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            priority=priority,
            due_date=datetime.now() + timedelta(days=due_days),
            assignee=assignee or self.executive
        )
        self.tasks[task.id] = task
        logger.info(f"Task created: {title} ({priority.value})")
        return task
    
    def complete_task(self, task: ExecutiveTask):
        """Mark task as complete."""
        task.completed = True
        logger.info(f"Task completed: {task.title}")
    
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
        if duration <= 0:
            raise ValueError("Duration must be positive")

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
        logger.info(f"Meeting scheduled: {title} with {len(attendees)} attendees")
        return meeting
    
    def summarize_meeting(self, meeting: Meeting, summary: str, actions: List[str] = None):
        """Add meeting summary and action items."""
        meeting.summary = summary
        meeting.action_items = actions or []
        logger.info(f"Meeting summarized: {meeting.title}")
    
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
                "other": max(0, total - urgent - action - fyi)
            },
            top_urgent=top_urgent or []
        )
        self.email_digests.append(digest)
        logger.info(f"Email digest created. Total: {total}, Urgent: {urgent}")
        return digest
    
    def get_daily_brief(self) -> Dict[str, Any]:
        """Get daily briefing statistics."""
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
            f"║  🤖 AI EXECUTIVE ASSISTANT{' ' * 32}║",
            f"║  {self.executive[:15]:<15}'s Dashboard │ {brief['pending_tasks']:>2} tasks │ {brief['today_meetings']:>2} meetings{' ' * 7}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 TODAY'S PRIORITIES                                    ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        priority_icons = {
            TaskPriority.URGENT: "🔴", 
            TaskPriority.HIGH: "🟠", 
            TaskPriority.MEDIUM: "🟡", 
            TaskPriority.LOW: "🟢"
        }
        
        # Sort by priority weight (descending) and then due date
        pending = [t for t in self.tasks.values() if not t.completed]
        sorted_tasks = sorted(pending, key=lambda x: (-x.priority.weight, x.due_date))[:5]
        
        for task in sorted_tasks:
            icon = priority_icons.get(task.priority, "⚪")
            due = task.due_date.strftime("%b %d")
            status = "⏰" if task.due_date.date() < datetime.now().date() else "📋"
            
            lines.append(f"║  {status} {icon} {task.title[:25]:<25} │ {due:<8} │ {task.assignee[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📅 UPCOMING MEETINGS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        type_icons = {
            MeetingType.ONE_ON_ONE: "👤", 
            MeetingType.TEAM: "👥", 
            MeetingType.CLIENT: "🤝", 
            MeetingType.BOARD: "🏛️", 
            MeetingType.STANDUP: "🚀"
        }
        
        # Sort meetings by date
        sorted_meetings = sorted(self.meetings, key=lambda x: x.scheduled_at)[:4]
        for meeting in sorted_meetings:
            icon = type_icons.get(meeting.meeting_type, "📅")
            time = meeting.scheduled_at.strftime("%b %d %H:%M")
            
            lines.append(f"║  {icon} {meeting.title[:20]:<20} │ {time:<14} │ {meeting.duration_mins:>2}min  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📧 EMAIL DIGEST                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
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
            f"║  🏯 {self.agency_name[:40]:<40} - Second brain!         ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🤖 Initializing AI Executive Assistant...")
    print("=" * 60)
    
    try:
        ea = AIExecutiveAssistant("Saigon Digital Hub", "Khoa Nguyen")
        
        ea.create_task("Review Q4 financials", TaskPriority.URGENT, 0)
        ea.create_task("Approve marketing budget", TaskPriority.HIGH, 1)
        ea.create_task("Sign partnership agreement", TaskPriority.HIGH, 2)
        ea.create_task("Team performance reviews", TaskPriority.MEDIUM, 7)
        
        m1 = ea.schedule_meeting("Weekly Leadership Sync", MeetingType.TEAM, ["CTO", "CMO", "CFO"], 2, 60)
        m2 = ea.schedule_meeting("Client Onboarding", MeetingType.CLIENT, ["Coffee Lab Team"], 24, 45)
        m3 = ea.schedule_meeting("Board Update", MeetingType.BOARD, ["All Board Members"], 48, 90)
        
        ea.summarize_meeting(m1, "Discussed Q4 goals", ["Finalize budget", "Hire 2 developers"])
        
        ea.create_email_digest(45, 3, 12, 20, ["Contract from BigCorp - URGENT", "Payment reminder"])
        
        print("\n" + ea.format_dashboard())
        
    except Exception as e:
        logger.error(f"Runtime Error: {e}")
