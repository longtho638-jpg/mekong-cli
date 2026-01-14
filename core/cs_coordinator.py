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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TaskType(Enum):
    """Coordinator task types."""
    MEETING = "meeting"
    FOLLOW_UP = "follow_up"
    ESCALATION = "escalation"
    REPORT = "report"
    ADMIN = "admin"


class TaskStatus(Enum):
    """Execution status for coordinator tasks."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


@dataclass
class CoordinatorTask:
    """A coordinator task entity."""
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
    """Client touchpoint record entity."""
    id: str
    client: str
    type: str
    summary: str
    next_action: str
    date: datetime = field(default_factory=datetime.now)


class CSCoordinator:
    """
    Customer Success Coordinator System.
    
    Orchestrates daily interactions, follow-ups, and task management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.tasks: Dict[str, CoordinatorTask] = {}
        self.touches: List[ClientTouch] = []
        logger.info(f"CS Coordinator initialized for {agency_name}")
    
    def create_task(
        self,
        client: str,
        task_type: TaskType,
        description: str,
        assigned_to: str,
        due_days: int = 1
    ) -> CoordinatorTask:
        """Initialize a new coordination task."""
        if not client or not description:
            raise ValueError("Client and description are required")

        task = CoordinatorTask(
            id=f"TSK-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            task_type=task_type,
            description=description,
            assigned_to=assigned_to,
            due_date=datetime.now() + timedelta(days=due_days)
        )
        self.tasks[task.id] = task
        logger.info(f"Task created for {client}: {task_type.value}")
        return task
    
    def update_status(self, task_id: str, status: TaskStatus, notes: str = "") -> bool:
        """Update the progress of a specific task."""
        if task_id not in self.tasks:
            logger.error(f"Task ID {task_id} not found")
            return False
            
        task = self.tasks[task_id]
        old_status = task.status
        task.status = status
        if notes:
            task.notes = notes
        logger.info(f"Task {task_id} updated: {old_status.value} -> {status.value}")
        return True
    
    def log_touch(
        self,
        client: str,
        touch_type: str,
        summary: str,
        next_action: str
    ) -> ClientTouch:
        """Record a successful client interaction."""
        touch = ClientTouch(
            id=f"TCH-{uuid.uuid4().hex[:6].upper()}",
            client=client,
            type=touch_type,
            summary=summary,
            next_action=next_action
        )
        self.touches.append(touch)
        logger.info(f"Touchpoint logged for {client}")
        return touch
    
    def get_overdue_tasks(self) -> List[CoordinatorTask]:
        """Filter tasks that have passed their deadline."""
        now = datetime.now()
        return [t for t in self.tasks.values() 
                if t.status != TaskStatus.COMPLETED and t.due_date < now]
    
    def format_dashboard(self) -> str:
        """Render the CS Coordinator Dashboard."""
        pending_count = sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING)
        overdue = self.get_overdue_tasks()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🤝 CS COORDINATOR DASHBOARD{' ' * 31}║",
            f"║  {len(self.tasks)} total tasks │ {pending_count} pending │ {len(overdue)} overdue{' ' * 13}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE TASK QUEUE                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {
            TaskType.MEETING: "📅", TaskType.FOLLOW_UP: "📞", 
            TaskType.ESCALATION: "⚠️", TaskType.REPORT: "📊", TaskType.ADMIN: "📝"
        }
        status_icons = {
            TaskStatus.PENDING: "⏳", TaskStatus.IN_PROGRESS: "🔄", 
            TaskStatus.COMPLETED: "✅", TaskStatus.BLOCKED: "🚫"
        }
        
        # Display latest 5 active tasks
        active_tasks = [t for t in self.tasks.values() if t.status != TaskStatus.COMPLETED]
        for t in sorted(active_tasks, key=lambda x: x.due_date)[:5]:
            t_icon = type_icons.get(t.task_type, "📋")
            s_icon = status_icons.get(t.status, "⚪")
            client_disp = (t.client[:12] + '..') if len(t.client) > 14 else t.client
            desc_disp = (t.description[:25] + '..') if len(t.description) > 27 else t.description
            lines.append(f"║  {s_icon} {t_icon} {client_disp:<14} │ {desc_disp:<27}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📞 RECENT INTERACTIONS                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for touch in self.touches[-3:]:
            client_disp = (touch.client[:12] + '..') if len(touch.client) > 14 else touch.client
            lines.append(f"║    📍 {client_disp:<14} │ {touch.type[:8]:<8} │ {touch.summary[:20]:<20}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [➕ New Task]  [📞 Log Touch]  [📊 Sync All]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Sync Success!      ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🤝 Initializing CS Coordinator...")
    print("=" * 60)
    
    try:
        coordinator = CSCoordinator("Saigon Digital Hub")
        
        # Seed data
        coordinator.create_task("Acme Corp", TaskType.MEETING, "Quarterly sync", "Alex", 0)
        coordinator.create_task("Fashion Ltd", TaskType.ESCALATION, "Late delivery", "Mike", -1)
        
        coordinator.log_touch("Acme Corp", "Email", "Sent report", "Wait for reply")
        
        print("\n" + coordinator.format_dashboard())
        
    except Exception as e:
        logger.error(f"Coordinator Error: {e}")
