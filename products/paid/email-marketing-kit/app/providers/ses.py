from typing import Dict, Any, Optional
import aioboto3
from botocore.exceptions import ClientError
from app.providers.base import EmailProvider, EmailMessage
from app.core.config import get_settings

class SESProvider(EmailProvider):
    def __init__(
        self,
        aws_access_key_id: str,
        aws_secret_access_key: str,
        region_name: str,
        configuration_set_name: Optional[str] = None
    ):
        self.aws_access_key_id = aws_access_key_id
        self.aws_secret_access_key = aws_secret_access_key
        self.region_name = region_name
        self.configuration_set_name = configuration_set_name
        self.session = aioboto3.Session()

    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        sender = message.from_email or get_settings().DEFAULT_FROM_EMAIL

        # Prepare destination
        destination = {"ToAddresses": [message.to_email]}
        if message.cc:
            destination["CcAddresses"] = message.cc
        if message.bcc:
            destination["BccAddresses"] = message.bcc

        # Prepare message body
        body = {}
        if message.html_content:
            body["Html"] = {"Data": message.html_content, "Charset": "UTF-8"}
        if message.text_content:
            body["Text"] = {"Data": message.text_content, "Charset": "UTF-8"}

        # Prepare params
        params = {
            "Source": f"{message.from_name} <{sender}>" if message.from_name else sender,
            "Destination": destination,
            "Message": {
                "Subject": {"Data": message.subject, "Charset": "UTF-8"},
                "Body": body
            }
        }

        if self.configuration_set_name:
            params["ConfigurationSetName"] = self.configuration_set_name

        if message.reply_to:
            params["ReplyToAddresses"] = [message.reply_to]

        try:
            async with self.session.client(
                "ses",
                region_name=self.region_name,
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key
            ) as client:
                response = await client.send_email(**params)
                return {
                    "status": "sent",
                    "provider": "ses",
                    "message_id": response.get("MessageId")
                }
        except ClientError as e:
            raise Exception(f"SES Error: {e}")

    async def validate_config(self) -> bool:
        try:
            async with self.session.client(
                "ses",
                region_name=self.region_name,
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key
            ) as client:
                await client.get_account_sending_enabled()
            return True
        except Exception:
            return False
