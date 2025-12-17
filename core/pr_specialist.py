"""
🎙️ Public Relations Specialist - PR & Media
==============================================

Manage public relations and media.
Reputation that shines!

Roles:
- Press releases
- Media relations
- Crisis management
- Brand reputation
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class PRActivityType(Enum):
    """PR activity types."""
    PRESS_RELEASE = "press_release"
    MEDIA_PITCH = "media_pitch"
    INTERVIEW_ARRANGE = "interview_arrange"
    CRISIS_RESPONSE = "crisis_response"
    EVENT_PR = "event_pr"
    INFLUENCER = "influencer"


class PRStatus(Enum):
    """PR activity status."""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    SENT = "sent"
    PICKED_UP = "picked_up"
    PUBLISHED = "published"
    COMPLETED = "completed"


@dataclass
class MediaContact:
    """A media contact."""
    id: str
    name: str
    outlet: str
    email: str
    beat: str
    last_contact: Optional[datetime] = None


@dataclass
class PRActivity:
    """A PR activity."""
    id: str
    title: str
    client: str
    activity_type: PRActivityType
    status: PRStatus = PRStatus.PLANNED
    media_contacts: List[str] = field(default_factory=list)
    coverage_count: int = 0
    specialist: str = ""


class PRSpecialist:
    """
    Public Relations Specialist.
    
    PR and media relations.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.activities: Dict[str, PRActivity] = {}
        self.contacts: Dict[str, MediaContact] = {}
    
    def add_contact(
        self,
        name: str,
        outlet: str,
        email: str,
        beat: str
    ) -> MediaContact:
        """Add a media contact."""
        contact = MediaContact(
            id=f"MC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            outlet=outlet,
            email=email,
            beat=beat
        )
        self.contacts[contact.id] = contact
        return contact
    
    def create_activity(
        self,
        title: str,
        client: str,
        activity_type: PRActivityType,
        specialist: str = ""
    ) -> PRActivity:
        """Create a PR activity."""
        activity = PRActivity(
            id=f"PR-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            client=client,
            activity_type=activity_type,
            specialist=specialist
        )
        self.activities[activity.id] = activity
        return activity
    
    def record_coverage(self, activity: PRActivity):
        """Record media coverage."""
        activity.coverage_count += 1
        if activity.coverage_count > 0:
            activity.status = PRStatus.PICKED_UP
    
    def update_status(self, activity: PRActivity, status: PRStatus):
        """Update activity status."""
        activity.status = status
    
    def get_coverage_stats(self) -> Dict[str, int]:
        """Get coverage statistics."""
        total = sum(a.coverage_count for a in self.activities.values())
        by_type = {}
        for atype in PRActivityType:
            by_type[atype.value] = sum(
                a.coverage_count for a in self.activities.values() 
                if a.activity_type == atype
            )
        return {"total": total, "by_type": by_type}
    
    def format_dashboard(self) -> str:
        """Format PR dashboard."""
        stats = self.get_coverage_stats()
        active = sum(1 for a in self.activities.values() if a.status != PRStatus.COMPLETED)
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎙️ PR SPECIALIST                                         ║",
            f"║  {len(self.activities)} activities │ {stats['total']} coverage │ {len(self.contacts)} contacts   ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE CAMPAIGNS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"press_release": "📰", "media_pitch": "📧", "interview_arrange": "🎤",
                     "crisis_response": "🚨", "event_pr": "🎉", "influencer": "⭐"}
        status_icons = {"planned": "📋", "in_progress": "🔄", "sent": "📤",
                       "picked_up": "✅", "published": "🚀", "completed": "🏆"}
        
        for activity in list(self.activities.values())[:5]:
            t_icon = type_icons.get(activity.activity_type.value, "📋")
            s_icon = status_icons.get(activity.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {activity.title[:20]:<20} │ {activity.coverage_count:>2} hits │ {activity.client[:8]:<8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 MEDIA CONTACTS                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for contact in list(self.contacts.values())[:3]:
            lines.append(f"║    📇 {contact.name[:15]:<15} │ {contact.outlet[:20]:<20}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 COVERAGE BY TYPE                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for atype in list(PRActivityType)[:3]:
            count = stats["by_type"].get(atype.value, 0)
            icon = type_icons.get(atype.value, "📋")
            lines.append(f"║    {icon} {atype.value.replace('_', ' ').title():<18} │ {count:>2} coverage          ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📰 Press Release]  [📧 Pitch]  [📊 Report]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Reputation that shines!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    pr = PRSpecialist("Saigon Digital Hub")
    
    print("🎙️ PR Specialist")
    print("=" * 60)
    print()
    
    # Add contacts
    pr.add_contact("Nguyen Van A", "VN Express", "a@vnexpress.vn", "Business")
    pr.add_contact("Tran Thi B", "Forbes VN", "b@forbes.vn", "Tech")
    
    # Create activities
    a1 = pr.create_activity("Office Launch PR", "Sunrise Realty", PRActivityType.PRESS_RELEASE, "Lisa")
    a2 = pr.create_activity("CEO Interview", "Coffee Lab", PRActivityType.INTERVIEW_ARRANGE, "Tom")
    a3 = pr.create_activity("Product Launch", "Tech Startup", PRActivityType.MEDIA_PITCH, "Lisa")
    
    # Record coverage
    pr.record_coverage(a1)
    pr.record_coverage(a1)
    pr.record_coverage(a3)
    pr.update_status(a2, PRStatus.IN_PROGRESS)
    
    print(pr.format_dashboard())
