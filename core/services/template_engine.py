"""
🤖 AI Wingman Templates - Response Templates
============================================

Quản lý templates cho các loại phản hồi tự động.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict

logger = logging.getLogger(__name__)


class TemplateProvider(ABC):
    """Abstract base class cho template providers."""

    @abstractmethod
    def get_template(self, template_name: str) -> str:
        """Lấy template theo tên."""
        pass

    @abstractmethod
    def list_templates(self) -> list[str]:
        """Lấy danh sách tất cả templates."""
        pass


class DefaultTemplateProvider(TemplateProvider):
    """Provider với templates mặc định."""

    def __init__(self):
        self.templates = {
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
{agency_name}""",
            "milestone_celebration": """Hi {client_name}!

🏆 Great news! We've reached a major milestone:

{milestone_description}

This achievement brings us closer to your goals. Thank you for your trust and partnership!

Best,
{owner_name}
{agency_name}""",
            "project_update": """Hi {client_name}!

Quick update on {project_name}:

{update_details}

Current Status: {status}
Next Milestone: {next_milestone}

Let me know if you have any questions!

Best,
{owner_name}""",
        }
        logger.info("Default template provider initialized")

    def get_template(self, template_name: str) -> str:
        """Lấy template, raise error nếu không tìm thấy."""
        if template_name not in self.templates:
            raise ValueError(f"Template '{template_name}' not found")
        return self.templates[template_name]

    def list_templates(self) -> list[str]:
        """Lấy danh sách tên tất cả templates."""
        return list(self.templates.keys())

    def add_template(self, name: str, content: str) -> None:
        """Thêm template mới."""
        self.templates[name] = content
        logger.info(f"Added template: {name}")

    def update_template(self, name: str, content: str) -> None:
        """Cập nhật template tồn tại."""
        if name not in self.templates:
            raise ValueError(f"Template '{name}' not found")
        self.templates[name] = content
        logger.info(f"Updated template: {name}")

    def delete_template(self, name: str) -> None:
        """Xóa template."""
        if name not in self.templates:
            raise ValueError(f"Template '{name}' not found")
        del self.templates[name]
        logger.info(f"Deleted template: {name}")


class TemplateEngine:
    """Engine để xử lý và render templates."""

    def __init__(self, provider: TemplateProvider):
        self.provider = provider
        logger.info("Template engine initialized")

    def render_template(self, template_name: str, variables: Dict[str, Any]) -> str:
        """Render template với variables."""
        try:
            template = self.provider.get_template(template_name)
            return template.format(**variables)
        except KeyError as e:
            logger.error(f"Missing variable for template '{template_name}': {e}")
            raise ValueError(f"Missing required variable: {e}")
        except Exception as e:
            logger.error(f"Failed to render template '{template_name}': {e}")
            raise

    def render_inquiry_acknowledgment(self, variables: Dict[str, Any]) -> str:
        """Render template xác nhận inquiry."""
        required_vars = ["client_name", "agency_name", "service", "owner_name"]
        self._validate_variables(required_vars, variables)
        return self.render_template("inquiry_ack", variables)

    def render_proposal(self, variables: Dict[str, Any]) -> str:
        """Render proposal template."""
        required_vars = [
            "client_name",
            "project_name",
            "project_description",
            "services_list",
            "setup_fee",
            "monthly_fee",
            "timeline",
            "calendar_link",
            "owner_name",
            "agency_name",
        ]
        self._validate_variables(required_vars, variables)
        return self.render_template("proposal", variables)

    def render_meeting_confirmation(self, variables: Dict[str, Any]) -> str:
        """Render meeting confirmation template."""
        required_vars = ["client_name", "date", "time", "timezone", "location", "owner_name"]
        self._validate_variables(required_vars, variables)
        return self.render_template("meeting_confirm", variables)

    def render_payment_thanks(self, variables: Dict[str, Any]) -> str:
        """Render payment thank you template."""
        required_vars = [
            "client_name",
            "amount",
            "project_name",
            "next_invoice_date",
            "owner_name",
            "agency_name",
        ]
        self._validate_variables(required_vars, variables)
        return self.render_template("payment_thanks", variables)

    def _validate_variables(self, required: list[str], variables: Dict[str, Any]) -> None:
        """Kiểm tra tất cả variables cần thiết có tồn tại."""
        missing = [var for var in required if var not in variables]
        if missing:
            raise ValueError(f"Missing required variables: {missing}")
