"""
🤖 Refactored AI Wingman - Main Interface
==========================================

Main interface sử dụng refactored services với clean architecture.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from core.config import get_settings

try:
    from .repositories.ai_wingman_repository import AIWingmanRepository
    from .services.ai_wingman_service import (
        AgencyOwnerProfile,
        AIWingmanService,
        AnthropicProvider,
        Notification,
        NotificationType,
        OpenAIProvider,
        WingmanMode,
    )
    from .services.template_engine import DefaultTemplateProvider, TemplateEngine
except ImportError:
    # Fallback for direct execution
    from repositories.ai_wingman_repository import AIWingmanRepository
    from services.ai_wingman_service import (
        AgencyOwnerProfile,
        AIWingmanService,
        AnthropicProvider,
        Notification,
        NotificationType,
        OpenAIProvider,
        WingmanMode,
    )
    from services.template_engine import DefaultTemplateProvider, TemplateEngine

logger = logging.getLogger(__name__)


class AIWingman:
    """
    Refactored AI Wingman với clean architecture.

    Sử dụng service layer pattern với clear separation of concerns.
    """

    def __init__(
        self,
        owner_profile: AgencyOwnerProfile,
        mode: WingmanMode = WingmanMode.SEMI_AUTO,
        provider_type: str = "openai",
    ):
        self.settings = get_settings()

        # Khởi tạo core service
        self.service = AIWingmanService(owner_profile, mode)

        # Khởi tạo template engine
        template_provider = DefaultTemplateProvider()
        self.template_engine = TemplateEngine(template_provider)

        # Khởi tạo repository
        self.repository = AIWingmanRepository()

        # Load existing data
        self.service.notifications = self.repository.load_notifications()
        self.service.stats = self.repository.load_stats()

        # Setup AI provider
        if provider_type == "openai":
            key = self.settings.OPENAI_API_KEY or "dummy_key"
            self.service.set_provider(OpenAIProvider(key))
        elif provider_type == "anthropic":
            key = self.settings.ANTHROPIC_API_KEY or "dummy_key"
            self.service.set_provider(AnthropicProvider(key))

        logger.info(f"AI Wingman initialized for {owner_profile.agency_name}")

    def handle_inquiry(
        self, client_name: str, client_email: str, service: str, message: str
    ) -> Dict[str, Any]:
        """
        Xử lý inquiry từ client.

        Returns:
            Dict với thông tin về kết quả xử lý
        """
        if not client_email or "@" not in client_email:
            logger.warning(f"Invalid email received from {client_name}")

        logger.info(f"Handling inquiry from {client_name} regarding {service}")

        # Tạo notification
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
                "message": message,
            },
        )

        self.service.add_notification(notif)

        # Generate response
        try:
            response = self.template_engine.render_inquiry_acknowledgment(
                {
                    "client_name": client_name,
                    "agency_name": self.service.owner.agency_name,
                    "service": service,
                    "owner_name": self.service.owner.name,
                }
            )
        except Exception as e:
            logger.error(f"Failed to render response: {e}")
            response = f"Thank you for your inquiry, {client_name}! We'll get back to you soon."

        result = {"notification_id": notif.id, "response_draft": response, "action_taken": "none"}

        if self.service.can_auto_respond():
            result["action_taken"] = "sent_automatically"
            result["sent_to"] = client_email
            self.service.update_stats("inquiries_handled", 1)
            logger.info("Auto-response sent")
        elif self.service.needs_approval():
            result["action_taken"] = "awaiting_approval"
            result["approval_required"] = True
            logger.info("Response drafted, awaiting approval")
        else:
            result["action_taken"] = "notification_only"
            logger.info("Passive mode: Notification only")

        # Save changes
        self.repository.save_notifications(self.service.notifications)
        self.repository.save_stats(self.service.stats)

        return result

    def generate_proposal(
        self,
        client_name: str,
        project_name: str,
        project_description: str,
        services: List[str],
        setup_fee: float,
        monthly_fee: float,
        timeline: str = "4-6 weeks",
    ) -> str:
        """Generate professional proposal."""
        if setup_fee < 0 or monthly_fee < 0:
            raise ValueError("Fees cannot be negative")

        logger.info(f"Generating proposal for {client_name}: {project_name}")

        services_list = "\n".join([f"- {s}" for s in services])

        try:
            proposal = self.template_engine.render_proposal(
                {
                    "client_name": client_name,
                    "project_name": project_name,
                    "project_description": project_description,
                    "services_list": services_list,
                    "setup_fee": setup_fee,
                    "monthly_fee": monthly_fee,
                    "timeline": timeline,
                    "calendar_link": f"https://cal.com/{self.service.owner.agency_name.lower().replace(' ', '')}",
                    "owner_name": self.service.owner.name,
                    "agency_name": self.service.owner.agency_name,
                }
            )

            self.service.update_stats("proposals_sent", 1)
            self.repository.save_stats(self.service.stats)

            return proposal
        except Exception as e:
            logger.error(f"Failed to generate proposal: {e}")
            raise

    def notify_payment(self, client_name: str, amount: float, project: str) -> Notification:
        """Tạo notification cho payment received."""
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
            data={"client_name": client_name, "amount": amount, "project": project},
        )

        self.service.add_notification(notif)
        self.service.update_stats("revenue_generated", amount)

        # Save changes
        self.repository.save_notifications(self.service.notifications)
        self.repository.save_stats(self.service.stats)

        return notif

    def notify_milestone(self, title: str, description: str, priority: int = 3) -> Notification:
        """Tạo notification cho milestone."""
        logger.info(f"Milestone achieved: {title}")

        notif = Notification(
            id=f"mile_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.MILESTONE,
            title=f"🏆 {title}",
            message=description,
            priority=priority,
            timestamp=datetime.now(),
        )

        self.service.add_notification(notif)
        self.repository.save_notifications(self.service.notifications)

        return notif

    def get_pending_notifications(self, unread_only: bool = True) -> List[Notification]:
        """Get pending notifications."""
        return self.service.get_pending_notifications(unread_only)

    def get_daily_summary(self) -> Dict[str, Any]:
        """Get daily summary report."""
        today = datetime.now().date()
        today_notifs = [n for n in self.service.notifications if n.timestamp.date() == today]

        return {
            "date": today.isoformat(),
            "total_notifications": len(today_notifs),
            "by_type": {
                "inquiries": len([n for n in today_notifs if n.type == NotificationType.INQUIRY]),
                "payments": len([n for n in today_notifs if n.type == NotificationType.PAYMENT]),
                "milestones": len(
                    [n for n in today_notifs if n.type == NotificationType.MILESTONE]
                ),
                "alerts": len([n for n in today_notifs if n.type == NotificationType.ALERT]),
            },
            "stats": self.service.stats,
            "mode": self.service.mode.value,
        }

    def format_for_telegram(self, notification: Notification) -> str:
        """Format notification cho Telegram."""
        emoji_map = {
            NotificationType.LEAD: "🎯",
            NotificationType.PAYMENT: "💰",
            NotificationType.INQUIRY: "📩",
            NotificationType.MILESTONE: "🏆",
            NotificationType.ALERT: "🚨",
        }

        emoji = emoji_map.get(notification.type, "📢")
        priority_stars = "⭐" * notification.priority

        return f"""
{emoji} *{notification.title}*
{priority_stars}

{notification.message}

🕐 {notification.timestamp.strftime("%Y-%m-%d %H:%M")}
"""
