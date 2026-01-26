from typing import Dict, Any, Optional
import aiosmtplib
from email.message import EmailMessage as MIMEText
from email.headerregistry import Address
from app.providers.base import EmailProvider, EmailMessage
from app.core.config import get_settings

class SMTPProvider(EmailProvider):
    def __init__(
        self,
        hostname: str,
        port: int,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        timeout: int = 10
    ):
        self.hostname = hostname
        self.port = port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.timeout = timeout

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        msg = MIMEText()
        msg["Subject"] = message.subject
        msg["From"] = message.from_email or get_settings().DEFAULT_FROM_EMAIL
        msg["To"] = message.to_email

        if message.text_content:
            msg.set_content(message.text_content)

        msg.add_alternative(message.html_content, subtype="html")

        if message.reply_to:
            msg["Reply-To"] = message.reply_to

        # Connect and send
        try:
            async with aiosmtplib.SMTP(
                hostname=self.hostname,
                port=self.port,
                use_tls=self.use_tls,
                timeout=self.timeout
            ) as smtp:
                if self.username and self.password:
                    await smtp.login(self.username, self.password)

                await smtp.send_message(msg)

            return {"status": "sent", "provider": "smtp"}

        except Exception as e:
            # In a real app, log this
            raise e

    async def validate_config(self) -> bool:
        try:
            async with aiosmtplib.SMTP(
                hostname=self.hostname,
                port=self.port,
                use_tls=self.use_tls,
                timeout=self.timeout
            ) as smtp:
                if self.username and self.password:
                    await smtp.login(self.username, self.password)
                await smtp.noop()
            return True
        except Exception:
            return False
