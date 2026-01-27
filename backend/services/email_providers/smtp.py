import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict

from backend.services.email_providers.base import EmailMessage, EmailProvider

logger = logging.getLogger(__name__)

class SMTPProvider(EmailProvider):
    def __init__(self, host: str, port: int, user: str, password: str):
        self.host = host
        self.port = port
        self.user = user
        self.password = password

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = message.subject
        msg["From"] = f"{message.from_name} <{message.from_email}>" if message.from_name else message.from_email
        msg["To"] = message.to_email

        if message.cc:
            msg["Cc"] = ", ".join(message.cc)

        if message.reply_to:
            msg["Reply-To"] = message.reply_to

        if message.text_content:
            msg.attach(MIMEText(message.text_content, "plain"))

        msg.attach(MIMEText(message.html_content, "html"))

        # Attachments would need more complex handling here (MIMEBase etc), skipping for MVP parity

        try:
            # This is synchronous, but we are inside an async method.
            # Ideally run in executor, but for now simple wrap is okay for low volume.
            # For high volume, SMTP provider is not recommended anyway.
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                if self.user and self.password:
                    server.login(self.user, self.password)
                server.send_message(msg)

            return {
                "status": "sent",
                "provider": "smtp",
                "message_id": None # SMTP doesn't always give an ID easily without parsing response
            }
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {str(e)}")
            raise

    async def validate_config(self) -> bool:
        return bool(self.host and self.port)
