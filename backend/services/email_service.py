"""
Email Service
=============

Unified email service supporting multiple providers (Resend, SendGrid, SMTP).
Handles transactional emails, marketing blasts, and drip campaigns.
"""

import logging
from typing import Any, Dict, List, Optional

from backend.api.config import settings
from backend.services.email_providers import (
    EmailMessage,
    EmailProvider,
    ResendProvider,
    SendGridProvider,
    SMTPProvider,
)
from backend.services.template_service import template_service

logger = logging.getLogger(__name__)


class EmailService:
    """
    High-level email service that delegates to specific providers.
    Implements the Strategy pattern for provider selection.
    """

    def __init__(self):
        self.provider: Optional[EmailProvider] = None
        self.template_service = template_service
        self._initialize_provider()

    def _initialize_provider(self):
        """Initialize the configured email provider."""
        provider_type = settings.email_provider.lower()

        if settings.email_mock_mode:
            logger.info("Email service running in MOCK mode")
            return

        try:
            if provider_type == "resend":
                if settings.resend_api_key:
                    self.provider = ResendProvider(api_key=settings.resend_api_key)
                else:
                    logger.warning("Resend API key not found, falling back to mock/log")

            elif provider_type == "sendgrid":
                if settings.sendgrid_api_key:
                    self.provider = SendGridProvider(api_key=settings.sendgrid_api_key)
                else:
                    logger.warning("SendGrid API key not found, falling back to mock/log")

            elif provider_type == "smtp":
                self.provider = SMTPProvider(
                    host=settings.smtp_host,
                    port=settings.smtp_port,
                    user=settings.smtp_user,
                    password=settings.smtp_password,
                )

            else:
                logger.warning(f"Unknown email provider: {provider_type}. using mock/log.")

        except Exception as e:
            logger.error(f"Failed to initialize email provider {provider_type}: {str(e)}")

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Send an email using the configured provider.
        """
        if settings.email_mock_mode or not self.provider:
            logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
            return {"status": "mock_sent", "provider": "mock"}

        message = EmailMessage(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            from_email=from_email or settings.default_from_email,
            from_name=from_name or settings.default_from_name,
            cc=cc,
            bcc=bcc,
            reply_to=reply_to,
            attachments=attachments,
            metadata=metadata,
        )

        try:
            return await self.provider.send_email(message)
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            # In production, we might want to queue this for retry or fallback
            raise

    async def send_template_email(
        self,
        to_email: str,
        subject: str,
        template_name: str,
        template_context: Dict[str, Any],
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Send an email using a Jinja2 template.
        """
        try:
            html_content = await self.template_service.render_template(
                template_name, template_context
            )
            # Optional: Generate text version from HTML or separate template

            return await self.send_email(
                to_email=to_email, subject=subject, html_content=html_content, **kwargs
            )
        except Exception as e:
            logger.error(f"Failed to render/send template email {template_name}: {e}")
            raise

    # --- Legacy Support / Helper Methods ---

    async def send_welcome_email(self, email: str, name: str, verify_url: str = "#"):
        """Send standard welcome email."""
        subject = f"Welcome to {settings.project_name}!"

        return await self.send_template_email(
            to_email=email,
            subject=subject,
            template_name="emails/welcome.html",
            template_context={
                "user_name": name,
                "action_url": verify_url,
                "unsubscribe_url": "#",  # TODO: Real unsubscribe link
            },
        )

    async def send_purchase_email(self, email: str, license_key: str, product_name: str) -> bool:
        """
        Send purchase confirmation email with license key.
        Maintained for compatibility with legacy code, but now async.
        """
        subject = f"Welcome to {product_name} - Your License Key Inside"

        # Simple template for now - ideally use EmailTemplates service
        html_body = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">Welcome to {product_name}!</h2>
            <p>Thank you for your purchase. Your license key is:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; border: 1px solid #ddd; font-family: monospace; font-size: 1.2em; text-align: center;">
                {license_key}
            </div>
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Download the product</li>
                <li>Activate using the key above</li>
            </ol>
            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 0.8em; color: #888;">If you need help, reply to this email.</p>
        </div>
        """

        text_body = f"""
        Welcome to {product_name}!

        Thank you for your purchase. Your license key is:
        {license_key}

        Download and activate now.
        """

        try:
            await self.send_email(
                to_email=email, subject=subject, html_content=html_body, text_content=text_body
            )
            return True
        except Exception:
            return False


# Global instance
email_service = EmailService()


def get_email_service():
    return email_service
