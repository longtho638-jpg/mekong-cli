"""
🤖 AI Wingman - Your 24/7 Agency Assistant
==========================================

Works while you sleep. Responds to clients. Never gets tired.

Features:
- Auto-respond to inquiries
- Generate proposals
- Schedule meetings
- Track leads
- Notify on important events
"""

import logging
from typing import Dict, Any, List
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WingmanMode(Enum):
    """Operating modes for AI Wingman."""
    PASSIVE = "passive"       # Just monitor and notify
    SEMI_AUTO = "semi_auto"   # Draft replies, await approval
    FULL_AUTO = "full_auto"   # Auto-respond within guidelines


class NotificationType(Enum):
    """Types of notifications."""
    LEAD = "lead"
    PAYMENT = "payment"
    INQUIRY = "inquiry"
    MILESTONE = "milestone"
    ALERT = "alert"


@dataclass
class AgencyOwnerProfile:
    """Profile for personalization."""
    name: str
    agency_name: str
    timezone: str = "UTC"
    response_style: str = "professional"
    services: List[str] = field(default_factory=lambda: ["SEO", "Content", "PPC"])
    pricing_tier: str = "premium"
    working_hours: Dict[str, str] = field(default_factory=lambda: {"start": "09:00", "end": "18:00"})


@dataclass
class Notification:
    """A notification event."""
    id: str
    type: NotificationType
    title: str
    message: str
    priority: int  # 1-5, 5 being most urgent
    timestamp: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    read: bool = False


class AIWingman:
    """
    Your 24/7 AI Assistant System.
    
    Automates interactions and notifications.
    """

    def __init__(
        self,
        owner_profile: AgencyOwnerProfile,
        mode: WingmanMode = WingmanMode.SEMI_AUTO
    ):
        self.owner = owner_profile
        self.mode = mode
        self.notifications: List[Notification] = []
        self.response_templates = self._load_templates()

        # Initialize stats
        self.stats = {
            "inquiries_handled": 0,
            "proposals_sent": 0,
            "meetings_scheduled": 0,
            "revenue_generated": 0.0,
            "hours_saved": 0
        }
        logger.info(f"AI Wingman initialized for {owner_profile.agency_name} in {mode.value} mode")

    def _load_templates(self) -> Dict[str, str]:
        """Load response templates."""
        return {
            "inquiry_ack": """Hi {client_name}!

Thanks for reaching out to {agency_name}! 

I've received your inquiry about {service} and I'm excited to help.

I'll get back to you within 24 hours with a detailed proposal.

Best,
{owner_name}
{agency_name}""",

            "proposal": """# Proposal for {client_name}

## Project: {project_name}

### Overview
{project_description}

### Services Included
{services_list}

### Investment
- **One-time setup:** ${setup_fee}
- **Monthly retainer:** ${monthly_fee}/month

### Timeline
{timeline}

### Next Steps
1. Review this proposal
2. Schedule a call: {calendar_link}
3. Get started!

Best regards,
{owner_name}
{agency_name}""",

            "meeting_confirm": """Hi {client_name}!

Great news! Your meeting is confirmed:

📅 Date: {date}
⏰ Time: {time} ({timezone})
📍 Location: {location}

See you then!

{owner_name}""",

            "payment_thanks": """Hi {client_name}!

Thank you for your payment of ${amount}! 🎉

I've received it and will continue delivering amazing results for {project_name}.

Your next invoice will be on {next_invoice_date}.

Best,
{owner_name}
{agency_name}"""
        }

    def handle_inquiry(
        self,
        client_name: str,
        client_email: str,
        service: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Handle an incoming client inquiry.
        """
        if not client_email or "@" not in client_email:
             logger.warning(f"Invalid email received from {client_name}")
             # We proceed but log warning

        logger.info(f"Handling inquiry from {client_name} regarding {service}")

        # Create notification
        notif = Notification(
            id=f"inq_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.INQUIRY,
            title=f"New inquiry from {client_name}",
            message=f"Service: {service}\n{message[:100]}...",
            priority=3,
            timestamp=datetime.now(),
            data={
                "client_name": client_name,
                "client_email": client_email,
                "service": service,
                "message": message
            }
        )
        self.notifications.append(notif)

        # Generate response
        response = self.response_templates["inquiry_ack"].format(
            client_name=client_name,
            agency_name=self.owner.agency_name,
            service=service,
            owner_name=self.owner.name
        )

        result = {
            "notification_id": notif.id,
            "response_draft": response,
            "action_taken": "none"
        }

        if self.mode == WingmanMode.FULL_AUTO:
            result["action_taken"] = "sent_automatically"
            result["sent_to"] = client_email
            self.stats["inquiries_handled"] += 1
            logger.info("Auto-response sent")
        elif self.mode == WingmanMode.SEMI_AUTO:
            result["action_taken"] = "awaiting_approval"
            result["approval_required"] = True
            logger.info("Response drafted, awaiting approval")
        else:
            result["action_taken"] = "notification_only"
            logger.info("Passive mode: Notification only")

        return result

    def generate_proposal(
        self,
        client_name: str,
        project_name: str,
        project_description: str,
        services: List[str],
        setup_fee: float,
        monthly_fee: float,
        timeline: str = "4-6 weeks"
    ) -> str:
        """Generate a professional proposal."""
        if setup_fee < 0 or monthly_fee < 0:
            raise ValueError("Fees cannot be negative")

        logger.info(f"Generating proposal for {client_name}: {project_name}")

        services_list = "\n".join([f"- {s}" for s in services])

        proposal = self.response_templates["proposal"].format(
            client_name=client_name,
            project_name=project_name,
            project_description=project_description,
            services_list=services_list,
            setup_fee=setup_fee,
            monthly_fee=monthly_fee,
            timeline=timeline,
            calendar_link=f"https://cal.com/{self.owner.agency_name.lower().replace(' ', '')}",
            owner_name=self.owner.name,
            agency_name=self.owner.agency_name
        )

        self.stats["proposals_sent"] += 1
        return proposal

    def notify_payment(self, client_name: str, amount: float, project: str) -> Notification:
        """Create notification for received payment."""
        if amount <= 0:
             logger.warning(f"Received non-positive payment amount: {amount}")

        logger.info(f"Payment received: ${amount} from {client_name}")

        notif = Notification(
            id=f"pay_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.PAYMENT,
            title=f"💰 Payment received: ${amount}",
            message=f"From {client_name} for {project}",
            priority=4,
            timestamp=datetime.now(),
            data={
                "client_name": client_name,
                "amount": amount,
                "project": project
            }
        )
        self.notifications.append(notif)
        self.stats["revenue_generated"] += amount
        return notif

    def notify_milestone(self, title: str, description: str, priority: int = 3) -> Notification:
        """Create notification for milestone achieved."""
        logger.info(f"Milestone achieved: {title}")
        notif = Notification(
            id=f"mile_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.MILESTONE,
            title=f"🏆 {title}",
            message=description,
            priority=priority,
            timestamp=datetime.now()
        )
        self.notifications.append(notif)
        return notif

    def get_pending_notifications(self, unread_only: bool = True) -> List[Notification]:
        """Get pending notifications."""
        if unread_only:
            return [n for n in self.notifications if not n.read]
        return self.notifications

    def get_daily_summary(self) -> Dict[str, Any]:
        """Get daily summary report."""
        today = datetime.now().date()
        today_notifs = [
            n for n in self.notifications
            if n.timestamp.date() == today
        ]

        return {
            "date": today.isoformat(),
            "total_notifications": len(today_notifs),
            "by_type": {
                "inquiries": len([n for n in today_notifs if n.type == NotificationType.INQUIRY]),
                "payments": len([n for n in today_notifs if n.type == NotificationType.PAYMENT]),
                "milestones": len([n for n in today_notifs if n.type == NotificationType.MILESTONE]),
                "alerts": len([n for n in today_notifs if n.type == NotificationType.ALERT])
            },
            "stats": self.stats,
            "mode": self.mode.value
        }

    def format_for_telegram(self, notification: Notification) -> str:
        """Format notification for Telegram."""
        emoji_map = {
            NotificationType.LEAD: "🎯",
            NotificationType.PAYMENT: "💰",
            NotificationType.INQUIRY: "📩",
            NotificationType.MILESTONE: "🏆",
            NotificationType.ALERT: "🚨"
        }

        emoji = emoji_map.get(notification.type, "📢")
        priority_stars = "⭐" * notification.priority

        return f"""
{emoji} *{notification.title}*
{priority_stars}

{notification.message}

🕐 {notification.timestamp.strftime('%Y-%m-%d %H:%M')}
"""


# Example usage
if __name__ == "__main__":
    # Create owner profile
    owner = AgencyOwnerProfile(
        name="Alex",
        agency_name="Nova Digital",
        services=["SEO", "Content Marketing", "PPC Ads"],
        pricing_tier="premium"
    )

    print("🤖 Initializing AI Wingman...")
    print("=" * 60)

    try:
        # Initialize Wingman
        wingman = AIWingman(owner, mode=WingmanMode.SEMI_AUTO)

        # Simulate an inquiry
        result = wingman.handle_inquiry(
            client_name="John Smith",
            client_email="john@example.com",
            service="SEO",
            message="Hi, I need help ranking my website for 'best coffee shop in NYC'"
        )

        print("\n📩 Inquiry Handled:")
        print(f"   Action: {result['action_taken']}")

        # Generate a proposal
        proposal = wingman.generate_proposal(
            client_name="John Smith",
            project_name="NYC Coffee Shop SEO",
            project_description="Complete SEO optimization to rank #1 for local coffee keywords",
            services=["Technical SEO Audit", "Local SEO Optimization", "Content Strategy"],
            setup_fee=1500,
            monthly_fee=500,
            timeline="8 weeks to page 1"
        )

        print("\n📋 Proposal Generated (Snippet):")
        print("-" * 40)
        print(proposal[:200] + "...")
        print()

        # Payment notification
        notif = wingman.notify_payment("John Smith", 1500, "NYC Coffee Shop SEO")
        print(wingman.format_for_telegram(notif))

        # Daily summary
        summary = wingman.get_daily_summary()
        print("📊 Daily Summary:")
        print(f"   Inquiries: {summary['by_type']['inquiries']}")
        print(f"   Payments: {summary['by_type']['payments']}")
        print(f"   Revenue: ${summary['stats']['revenue_generated']:.2f}")

    except Exception as e:
        logger.error(f"Runtime Error: {e}")
