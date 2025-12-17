"""
🤝 Customer Success Coordinator - Day-to-Day Support
======================================================

Coordinate daily client success activities.
Keep everything running smoothly!

Roles:
- Task coordination
- Meeting scheduling
- Issue tracking
- Cross-team communication
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class TaskType(Enum):
    """Coordinator task types."""
    MEETING = "meeting"
    FOLLOW_UP = "follow_up"
    ESCALATION = "escalation"
    REPORT = "report"
    ADMIN = "admin"


class TaskStatus(Enum):
    """Task status."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


@dataclass
class CoordinatorTask:
    """A coordinator task."""
    id: str
    client: str
    task_type: TaskType
    description: str
    assigned_to: str
    due_date: datetime
    status: TaskStatus = TaskStatus.PENDING
    notes: str = ""


@dataclass
class ClientTouch:
    """Client touchpoint record."""
    id: str
    client: str
    type: str
    summary: str
    next_action: str
    date: datetime = field(default_factory=datetime.now)


class CSCoordinator:
    """
    Customer Success Coordinator.
    
    Coordinate success activities.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.tasks: Dict[str, CoordinatorTask] = {}
        self.touches: List[ClientTouch] = []
    
    def create_task(
        self,
        client: str,
        task_type: TaskType,
        description: str,
        assigned_to: str,
        due_days: int = 1
    ) -> CoordinatorTask:
        """Create a coordination task."""
        task = CoordinatorTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            task_type=task_type,
            description=description,
            assigned_to=assigned_to,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        self.tasks[task.id] = task
        return task
    
    def update_status(self, task: CoordinatorTask, status: TaskStatus, notes: str = ""):
        """Update task status."""
        task.status = status
        if notes:
            task.notes = notes
    
    def log_touch(
        self,
        client: str,
        touch_type: str,
        summary: str,
        next_action: str
    ) -> ClientTouch:
        """Log a client touchpoint."""
        touch = ClientTouch(
            id=f"TCH-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            type=touch_type,
            summary=summary,
            next_action=next_action
        )
        self.touches.append(touch)
        return touch
    
    def get_overdue(self) -> List[CoordinatorTask]:
        """Get overdue tasks."""
        now = datetime.now()
        return [t for t in self.tasks.values() 
                if t.status != TaskStatus.COMPLETED and t.due_date < now]
    
    def get_today(self) -> List[CoordinatorTask]:
        """Get today's tasks."""
        today = datetime.now().date()
        return [t for t in self.tasks.values() 
                if t.status != TaskStatus.COMPLETED and t.due_date.date() == today]
    
    def format_dashboard(self) -> str:
        """Format coordinator dashboard."""
        pending = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        overdue = len(self.get_overdue())
        today = len(self.get_today())
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤝 CS COORDINATOR                                        ║",
            f"║  {len(self.tasks)} tasks │ {pending} pending │ {overdue} overdue           ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  📋 TODAY'S TASKS ({today})                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"meeting": "📅", "follow_up": "📞", "escalation": "⚠️", "report": "📊", "admin": "📝"}
        status_icons = {"pending": "⏳", "in_progress": "🔄", "completed": "✅", "blocked": "🚫"}
        
        for task in self.get_today()[:4]:
            t_icon = type_icons.get(task.task_type.value, "📋")
            s_icon = status_icons.get(task.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {task.client[:12]:<12} │ {task.description[:28]:<28}  ║")
        
        if overdue > 0:
            lines.extend([
                "║                                                           ║",
                f"║  ⚠️ OVERDUE ({overdue})                                       ║",
                "║  ─────────────────────────────────────────────────────── ║",
            ])
            
            for task in self.get_overdue()[:3]:
                days = (datetime.now() - task.due_date).days
                lines.append(f"║    🔴 {task.client[:15]:<15} │ {days} days overdue         ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📞 RECENT TOUCHES                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for touch in self.touches[-3:]:
            lines.append(f"║    📍 {touch.client[:12]:<12} │ {touch.type[:8]:<8} │ {touch.summary[:20]:<20}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Task]  [📞 Log Touch]  [📊 Reports]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Coordinating success!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    coord = CSCoordinator("Saigon Digital Hub")
    
    print("🤝 CS Coordinator")
    print("=" * 60)
    print()
    
    # Create tasks
    coord.create_task("Sunrise Realty", TaskType.MEETING, "Quarterly review call", "Alex", 0)
    coord.create_task("Coffee Lab", TaskType.FOLLOW_UP, "Check on campaign results", "Sarah", 0)
    coord.create_task("Tech Startup", TaskType.REPORT, "Prepare monthly report", "Mike", 1)
    coord.create_task("Fashion Brand", TaskType.ESCALATION, "Address delayed delivery", "Alex", -1)  # Overdue
    
    # Log touches
    coord.log_touch("Sunrise Realty", "Email", "Sent performance update", "Schedule call")
    coord.log_touch("Coffee Lab", "Call", "Discussed new campaign ideas", "Send proposal")
    
    print(coord.format_dashboard())
