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

import uuid
import logging
import re
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PRActivityType(Enum):
    """Categories of PR activities."""
    PRESS_RELEASE = "press_release"
    MEDIA_PITCH = "media_pitch"
    INTERVIEW_ARRANGE = "interview_arrange"
    CRISIS_RESPONSE = "crisis_response"
    EVENT_PR = "event_pr"
    INFLUENCER = "influencer"


class PRStatus(Enum):
    """Lifecycle status of a PR campaign."""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    SENT = "sent"
    PICKED_UP = "picked_up"
    PUBLISHED = "published"
    COMPLETED = "completed"


@dataclass
class MediaContact:
    """A media outlet contact record entity."""
    id: str
    name: str
    outlet: str
    email: str
    beat: str
    last_contact: Optional[datetime] = None

    def __post_init__(self):
        if not self.email or "@" not in self.email:
            raise ValueError(f"Invalid contact email: {self.email}")


@dataclass
class PRActivity:
    """A specific PR campaign or initiative entity."""
    id: str
    title: str
    client: str
    activity_type: PRActivityType
    status: PRStatus = PRStatus.PLANNED
    media_contacts: List[str] = field(default_factory=list)
    coverage_count: int = 0
    specialist: str = ""

    def __post_init__(self):
        if not self.title or not self.client:
            raise ValueError("Title and client are required")


class PRSpecialist:
    """
    PR Specialist System.
    
    Orchestrates media relations, outreach campaigns, and reputation management.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.activities: Dict[str, PRActivity] = {}
        self.contacts: Dict[str, MediaContact] = {}
        logger.info(f"PR Specialist initialized for {agency_name}")
    
    def add_contact(
        self,
        name: str,
        outlet: str,
        email: str,
        beat: str
    ) -> MediaContact:
        """Register a new journalist or media influencer."""
        contact = MediaContact(
            id=f"MC-{uuid.uuid4().hex[:6].upper()}",
            name=name, outlet=outlet, email=email, beat=beat
        )
        self.contacts[contact.id] = contact
        logger.info(f"Media contact added: {name} ({outlet})")
        return contact
    
    def create_campaign(
        self,
        title: str,
        client: str,
        act_type: PRActivityType,
        specialist: str = "Expert AI"
    ) -> PRActivity:
        """Initialize a new PR activity."""
        activity = PRActivity(
            id=f"PR-{uuid.uuid4().hex[:6].upper()}",
            title=title, client=client,
            activity_type=act_type, specialist=specialist
        )
        self.activities[activity.id] = activity
        logger.info(f"PR Campaign created: {title} for {client}")
        return activity
    
    def record_coverage(self, activity_id: str):
        """Log a successful media hit."""
        if activity_id in self.activities:
            self.activities[activity_id].coverage_count += 1
            self.activities[activity_id].status = PRStatus.PICKED_UP
            logger.info(f"Coverage recorded for {activity_id}")
    
    def get_coverage_stats(self) -> Dict[str, int]:
        """Aggregate total media hits across all campaigns."""
        total = sum(a.coverage_count for a in self.activities.values())
        return {"total": total}
    
    def format_dashboard(self) -> str:
        """Render the PR Specialist Dashboard."""
        stats = self.get_coverage_stats()
        active = [a for a in self.activities.values() if a.status != PRStatus.COMPLETED]
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎙️ PR SPECIALIST DASHBOARD{' ' * 32}║",
            f"║  {len(self.activities)} activities │ {stats['total']} total hits │ {len(self.contacts)} contacts{' ' * 12}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📋 ACTIVE CAMPAIGNS                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {PRActivityType.PRESS_RELEASE: "📰", PRActivityType.MEDIA_PITCH: "📧", PRActivityType.INTERVIEW_ARRANGE: "🎤"}
        
        for a in active[:5]:
            icon = type_icons.get(a.activity_type, "📋")
            s_icon = "✅" if a.status == PRStatus.PICKED_UP else "🔄"
            title_disp = (a.title[:20] + '..') if len(a.title) > 22 else a.title
            lines.append(f"║  {s_icon} {icon} {title_disp:<22} │ {a.coverage_count:>2} hits │ {a.client[:8]:<8}  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [📰 Release]  [📧 Pitch]  [📊 Coverage Report]  [⚙️]     ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Reputation!        ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎙️ Initializing PR Specialist...")
    print("=" * 60)
    
    try:
        pr_system = PRSpecialist("Saigon Digital Hub")
        # Seed
        c = pr_system.add_contact("Nguyen A", "VN Express", "a@vn.vn", "Tech")
        a = pr_system.create_campaign("Big Launch", "Sunrise", PRActivityType.PRESS_RELEASE)
        pr_system.record_coverage(a.id)
        
        print("\n" + pr_system.format_dashboard())
        
    except Exception as e:
        logger.error(f"PR Error: {e}")
