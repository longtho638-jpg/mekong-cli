import logging
from typing import Any, Dict

import httpx

from backend.services.email_providers.base import EmailMessage, EmailProvider

logger = logging.getLogger(__name__)


class SendGridProvider(EmailProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.sendgrid.com/v3"

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        # Construct SendGrid payload
        personalization = {"to": [{"email": message.to_email}]}

        if message.cc:
            personalization["cc"] = [{"email": email} for email in message.cc]

        if message.bcc:
            personalization["bcc"] = [{"email": email} for email in message.bcc]

        payload = {
            "personalizations": [personalization],
            "from": {"email": message.from_email},
            "subject": message.subject,
            "content": [{"type": "text/html", "value": message.html_content}],
        }

        if message.from_name:
            payload["from"]["name"] = message.from_name

        if message.text_content:
            payload["content"].insert(0, {"type": "text/plain", "value": message.text_content})

        if message.reply_to:
            payload["reply_to"] = {"email": message.reply_to}

        # SendGrid specific attachment handling would go here

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/mail/send", json=payload, headers=headers
                )

                if response.status_code not in [200, 201, 202]:
                    logger.error(f"SendGrid Error: {response.text}")
                    raise Exception(f"SendGrid Error: {response.text}")

                return {
                    "status": "sent",
                    "provider": "sendgrid",
                    "message_id": response.headers.get("X-Message-Id"),
                }
            except Exception as e:
                logger.error(f"Failed to send email via SendGrid: {str(e)}")
                raise

    async def validate_config(self) -> bool:
        return bool(self.api_key)
