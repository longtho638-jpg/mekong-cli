import logging
from typing import Any, Dict

import httpx

from backend.services.email_providers.base import EmailMessage, EmailProvider

logger = logging.getLogger(__name__)


class ResendProvider(EmailProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.resend.com"

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        payload = {
            "from": f"{message.from_name} <{message.from_email}>"
            if message.from_name and message.from_email
            else message.from_email,
            "to": [message.to_email],
            "subject": message.subject,
            "html": message.html_content,
        }

        if message.text_content:
            payload["text"] = message.text_content

        if message.cc:
            payload["cc"] = message.cc

        if message.bcc:
            payload["bcc"] = message.bcc

        if message.reply_to:
            payload["reply_to"] = message.reply_to

        if message.attachments:
            payload["attachments"] = message.attachments

        if message.metadata:
            payload["tags"] = [{"name": k, "value": str(v)} for k, v in message.metadata.items()]

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/emails", json=payload, headers=headers
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Resend Error: {response.text}")
                    raise Exception(f"Resend Error: {response.text}")

                data = response.json()
                return {"status": "sent", "provider": "resend", "message_id": data.get("id")}
            except Exception as e:
                logger.error(f"Failed to send email via Resend: {str(e)}")
                raise

    async def validate_config(self) -> bool:
        return bool(self.api_key)
