from typing import Dict, Any, Optional
import httpx
from app.providers.base import EmailProvider, EmailMessage
from app.core.config import get_settings

class SendGridProvider(EmailProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.sendgrid.com/v3"

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        sender = message.from_email or get_settings().DEFAULT_FROM_EMAIL

        payload = {
            "personalizations": [
                {
                    "to": [{"email": message.to_email}]
                }
            ],
            "from": {"email": sender, "name": message.from_name},
            "subject": message.subject,
            "content": []
        }

        if message.text_content:
            payload["content"].append({"type": "text/plain", "value": message.text_content})

        if message.html_content:
            payload["content"].append({"type": "text/html", "value": message.html_content})

        if message.cc:
            payload["personalizations"][0]["cc"] = [{"email": e} for e in message.cc]

        if message.bcc:
            payload["personalizations"][0]["bcc"] = [{"email": e} for e in message.bcc]

        if message.reply_to:
            payload["reply_to"] = {"email": message.reply_to}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/mail/send",
                json=payload,
                headers=headers
            )

            if response.status_code not in [200, 201, 202]:
                raise Exception(f"SendGrid Error: {response.text}")

            # SendGrid returns 202 Accepted with no body usually,
            # checking header for message-id if available
            message_id = response.headers.get("X-Message-Id")

            return {
                "status": "sent",
                "provider": "sendgrid",
                "message_id": message_id
            }

    async def validate_config(self) -> bool:
        # SendGrid doesn't have a simple "ping", maybe check scopes or user profile
        # For now, simplistic check
        return bool(self.api_key)
