import re
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class EmailTemplateService:
    """
    Service for managing and rendering email templates.
    Supports basic variable substitution (Jinja2-lite) and layout management.
    """

    def __init__(self):
        # In a real app, load these from DB or filesystem
        self._templates = {
            "welcome": {
                "subject": "Welcome to {{ project_name }}!",
                "body_html": "<h1>Welcome {{ name }}!</h1><p>Thanks for joining {{ project_name }}.</p>",
                "body_text": "Welcome {{ name }}!\nThanks for joining {{ project_name }}."
            },
            "password_reset": {
                "subject": "Reset your password",
                "body_html": "<p>Click <a href='{{ reset_link }}'>here</a> to reset your password.</p>",
                "body_text": "Click here to reset your password: {{ reset_link }}"
            },
            "invoice": {
                "subject": "Invoice {{ invoice_id }} from {{ project_name }}",
                "body_html": "<h1>Invoice {{ invoice_id }}</h1><p>Amount: {{ amount }}</p><p>View invoice: <a href='{{ invoice_link }}'>here</a></p>",
                "body_text": "Invoice {{ invoice_id }}\nAmount: {{ amount }}\nView: {{ invoice_link }}"
            }
        }

    def render(self, template_str: str, context: Dict[str, Any]) -> str:
        """
        Render a template string with context variables.
        Uses {{ variable }} syntax.
        """
        if not template_str:
            return ""

        result = template_str
        for key, value in context.items():
            pattern = f"{{{{ {key} }}}}"
            # Also support no spaces {{key}}
            pattern_nospace = f"{{{{{key}}}}}"

            val_str = str(value)
            result = result.replace(pattern, val_str).replace(pattern_nospace, val_str)

        return result

    def get_template(self, template_name: str) -> Optional[Dict[str, str]]:
        return self._templates.get(template_name)

    def render_template(self, template_name: str, context: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """
        Get and render a named template.
        Returns dict with keys: subject, html_content, text_content
        """
        template = self.get_template(template_name)
        if not template:
            logger.warning(f"Template not found: {template_name}")
            return None

        return {
            "subject": self.render(template["subject"], context),
            "html_content": self.render(template["body_html"], context),
            "text_content": self.render(template["body_text"], context)
        }

# Singleton
email_template_service = EmailTemplateService()
