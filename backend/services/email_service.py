"""
Email Service for Purchase Notifications

Handles sending email notifications for new purchases including:
- Welcome emails
- License key delivery
- Download links
- Getting started instructions
"""

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Email service for sending purchase notifications"""

    def __init__(
        self,
        smtp_host: Optional[str] = None,
        smtp_port: Optional[int] = None,
        smtp_user: Optional[str] = None,
        smtp_password: Optional[str] = None,
        from_email: Optional[str] = None,
        mock_mode: bool = False,
    ):
        """
        Initialize email service

        Args:
            smtp_host: SMTP server host
            smtp_port: SMTP server port
            smtp_user: SMTP username
            smtp_password: SMTP password
            from_email: Sender email address
            mock_mode: If True, only log emails without sending
        """
        self.smtp_host = smtp_host or os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = smtp_user or os.getenv("SMTP_USER", "")
        self.smtp_password = smtp_password or os.getenv("SMTP_PASSWORD", "")
        self.from_email = from_email or os.getenv("FROM_EMAIL", "noreply@binhphap.com")
        self.mock_mode = mock_mode or os.getenv("EMAIL_MOCK_MODE", "true").lower() == "true"

    def _create_welcome_email(
        self, email: str, license_key: str, product_name: str
    ) -> MIMEMultipart:
        """
        Create welcome email with license information

        Args:
            email: Recipient email
            license_key: License key for the product
            product_name: Name of the purchased product

        Returns:
            MIMEMultipart email message
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Welcome to {product_name} - Your License Key Inside"
        msg["From"] = self.from_email
        msg["To"] = email

        # Create plain text version
        text_body = f"""
Welcome to {product_name}!

Thank you for your purchase. Your license key is:

{license_key}

GETTING STARTED:

1. Download the product:
   https://binhphap.com/downloads/{product_name.lower().replace(' ', '-')}

2. Install the product following the installation guide

3. Activate your license using the key above

4. Visit our documentation for detailed guides:
   https://binhphap.com/docs/{product_name.lower().replace(' ', '-')}

NEXT STEPS:

- Join our community: https://binhphap.com/community
- Check out tutorials: https://binhphap.com/tutorials
- Contact support: support@binhphap.com

Thank you for choosing {product_name}!

Best regards,
The Binh Pháp Team

---
This is an automated email. Please do not reply to this message.
If you need assistance, contact us at support@binhphap.com
"""

        # Create HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }}
        .content {{
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }}
        .license-box {{
            background: #f5f5f5;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }}
        .license-key {{
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 2px;
            word-break: break-all;
        }}
        .button {{
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
        }}
        .steps {{
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        .steps ol {{
            margin: 0;
            padding-left: 20px;
        }}
        .steps li {{
            margin: 10px 0;
        }}
        .footer {{
            background: #f5f5f5;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }}
        .links {{
            margin: 20px 0;
        }}
        .links a {{
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to {product_name}!</h1>
        <p>Thank you for your purchase</p>
    </div>

    <div class="content">
        <p>Your license key is ready:</p>

        <div class="license-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your License Key</p>
            <div class="license-key">{license_key}</div>
        </div>

        <div class="steps">
            <h3 style="margin-top: 0;">Getting Started:</h3>
            <ol>
                <li><strong>Download</strong> the product from your account</li>
                <li><strong>Install</strong> following the installation guide</li>
                <li><strong>Activate</strong> using your license key above</li>
                <li><strong>Explore</strong> our documentation and tutorials</li>
            </ol>
        </div>

        <div style="text-align: center;">
            <a href="https://binhphap.com/downloads/{product_name.lower().replace(' ', '-')}" class="button">
                Download Now
            </a>
            <a href="https://binhphap.com/docs/{product_name.lower().replace(' ', '-')}" class="button">
                View Documentation
            </a>
        </div>

        <div class="links">
            <p><strong>Helpful Resources:</strong></p>
            <a href="https://binhphap.com/community">Community</a> |
            <a href="https://binhphap.com/tutorials">Tutorials</a> |
            <a href="mailto:support@binhphap.com">Support</a>
        </div>
    </div>

    <div class="footer">
        <p>This is an automated email. Please do not reply to this message.</p>
        <p>If you need assistance, contact us at <a href="mailto:support@binhphap.com">support@binhphap.com</a></p>
        <p style="margin-top: 10px;">© 2026 Binh Pháp Venture Studio. All rights reserved.</p>
    </div>
</body>
</html>
"""

        # Attach both versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")

        msg.attach(part1)
        msg.attach(part2)

        return msg

    def send_purchase_email(self, email: str, license_key: str, product_name: str) -> bool:
        """
        Send purchase confirmation email with license key

        Args:
            email: Recipient email address
            license_key: License key for the product
            product_name: Name of the purchased product

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Create email message
            msg = self._create_welcome_email(email, license_key, product_name)

            # Mock mode - just log the email
            if self.mock_mode:
                logger.info(f"[MOCK MODE] Would send email to {email}")
                logger.info(f"Subject: {msg['Subject']}")
                logger.info(f"License Key: {license_key}")
                logger.info(f"Product: {product_name}")
                print(f"\n{'='*60}")
                print("MOCK EMAIL SENT")
                print(f"{'='*60}")
                print(f"To: {email}")
                print(f"Subject: {msg['Subject']}")
                print(f"License Key: {license_key}")
                print(f"Product: {product_name}")
                print(f"{'='*60}\n")
                return True

            # Real SMTP sending
            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP credentials not configured, falling back to mock mode")
                return self.send_purchase_email.__wrapped__(self, email, license_key, product_name)

            # Connect to SMTP server
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Purchase email sent successfully to {email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send purchase email to {email}: {str(e)}")
            return False


# Global email service instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get or create global email service instance"""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service


def send_purchase_email(email: str, license_key: str, product_name: str) -> bool:
    """
    Send purchase confirmation email (convenience function)

    Args:
        email: Recipient email address
        license_key: License key for the product
        product_name: Name of the purchased product

    Returns:
        True if email sent successfully, False otherwise
    """
    service = get_email_service()
    return service.send_purchase_email(email, license_key, product_name)
