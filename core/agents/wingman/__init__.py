"""
AI Wingman Facade and Notification Handlers.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List

from core.config import get_settings

from .models import AgencyOwnerProfile, Notification, NotificationType, WingmanMode
from .service import AIWingmanService

# Proxy imports for nested services
try:
    from ..repositories.ai_wingman_repository import AIWingmanRepository
    from ..services.ai_wingman_service import AnthropicProvider, OpenAIProvider
    from ..services.template_engine import DefaultTemplateProvider, TemplateEngine
except ImportError:
    # Fallback placeholders if not found
    AIWingmanRepository = Any
    OpenAIProvider = Any
    AnthropicProvider = Any
    TemplateEngine = Any
    DefaultTemplateProvider = Any

logger = logging.getLogger(__name__)

class AIWingman:
    """
    Refactored AI Wingman với modular architecture.
    """
    def __init__(
        self,
        owner_profile: AgencyOwnerProfile,
        mode: WingmanMode = WingmanMode.SEMI_AUTO,
        provider_type: str = "openai",
    ):
        self.settings = get_settings()
        self.service = AIWingmanService(owner_profile, mode)

        # Initialize dependencies
        if AIWingmanRepository is not Any:
            self.repository = AIWingmanRepository()
            self.service.notifications = self.repository.load_notifications()
            self.service.stats = self.repository.load_stats()

        if TemplateEngine is not Any:
            template_provider = DefaultTemplateProvider()
            self.template_engine = TemplateEngine(template_provider)

        # Provider setup
        if provider_type == "openai" and OpenAIProvider is not Any:
            self.service.set_provider(OpenAIProvider(self.settings.OPENAI_API_KEY or "dummy"))
        elif provider_type == "anthropic" and AnthropicProvider is not Any:
            self.service.set_provider(AnthropicProvider(self.settings.ANTHROPIC_API_KEY or "dummy"))

        logger.info(f"AI Wingman initialized for {owner_profile.agency_name}")

    def handle_inquiry(self, client_name: str, client_email: str, service: str, message: str) -> Dict[str, Any]:
        notif = Notification(
            id=f"inq_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.INQUIRY,
            title=f"New inquiry from {client_name}",
            message=f"Service: {service}\n{message[:100]}...",
            priority=3,
            data={"client_name": client_name, "client_email": client_email, "service": service, "message": message},
        )
        self.service.add_notification(notif)

        response = f"Thank you for your inquiry, {client_name}! We'll get back to you soon."
        if hasattr(self, 'template_engine'):
            try:
                response = self.template_engine.render_inquiry_acknowledgment({
                    "client_name": client_name, "agency_name": self.service.owner.agency_name,
                    "service": service, "owner_name": self.service.owner.name
                })
            except Exception: pass

        result = {"notification_id": notif.id, "response_draft": response, "action_taken": "none"}
        if self.service.can_auto_respond():
            result["action_taken"] = "sent_automatically"
            self.service.update_stats("inquiries_handled", 1)
        elif self.service.needs_approval():
            result["action_taken"] = "awaiting_approval"
            result["approval_required"] = True

        if hasattr(self, 'repository'):
            self.repository.save_notifications(self.service.notifications)
            self.repository.save_stats(self.service.stats)

        return result

    def notify_payment(self, client_name: str, amount: float, project: str) -> Notification:
        notif = Notification(
            id=f"pay_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=NotificationType.PAYMENT,
            title=f"💰 Payment received: ${amount}",
            message=f"From {client_name} for {project}",
            priority=4,
            data={"client_name": client_name, "amount": amount, "project": project},
        )
        self.service.add_notification(notif)
        self.service.update_stats("revenue_generated", amount)
        if hasattr(self, 'repository'):
            self.repository.save_notifications(self.service.notifications)
            self.repository.save_stats(self.service.stats)
        return notif

    def generate_proposal(
        self,
        client_name: str,
        project_name: str,
        project_description: str,
        services: List[str],
        setup_fee: float,
        monthly_fee: float,
    ) -> str:
        """
        Tạo draft proposal cho client.
        """
        proposal = f"PROPOSAL FOR {client_name}\n"
        proposal += f"Project: {project_name}\n"
        proposal += f"Description: {project_description}\n"
        proposal += f"Services: {', '.join(services)}\n"
        proposal += f"Setup Fee: ${setup_fee}\n"
        proposal += f"Monthly Fee: ${monthly_fee}\n"

        self.service.update_stats("proposals_sent", 1)

        if hasattr(self, 'repository'):
            self.repository.save_stats(self.service.stats)

        return proposal

    def get_daily_summary(self) -> Dict[str, Any]:
        today = datetime.now().date()
        today_notifs = [n for n in self.service.notifications if n.timestamp.date() == today]
        return {
            "date": today.isoformat(),
            "total_notifications": len(today_notifs),
            "stats": self.service.stats,
            "mode": self.service.mode.value,
        }
