from typing import Dict, Any, Optional
import httpx
from app.providers.base import EmailProvider, EmailMessage
from app.core.config import get_settings

class ResendProvider(EmailProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.resend.com"

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        sender = message.from_email or get_settings().DEFAULT_FROM_EMAIL

        payload = {
            "from": f"{message.from_name} <{sender}>" if message.from_name else sender,
            "to": [message.to_email],
            "subject": message.subject,
            "html": message.html_content
        }

        if message.text_content:
            payload["text"] = message.text_content

        if message.cc:
            payload["cc"] = message.cc

        if message.bcc:
            payload["bcc"] = message.bcc

        if message.reply_to:
            payload["reply_to"] = message.reply_to

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/emails",
                json=payload,
                headers=headers
            )

            if response.status_code not in [200, 201]:
                raise Exception(f"Resend Error: {response.text}")

            data = response.json()

            return {
                "status": "sent",
                "provider": "resend",
                "message_id": data.get("id")
            }

    async def validate_config(self) -> bool:
        return bool(self.api_key)
