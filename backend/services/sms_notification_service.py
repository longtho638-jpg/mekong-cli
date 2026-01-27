import os
import boto3
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class SMSNotificationService:
    def __init__(self):
        self.provider = os.getenv('SMS_PROVIDER', 'twilio')  # 'twilio' or 'sns'

        # Twilio configuration
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_from_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.twilio_client = None

        # AWS SNS configuration
        self.sns_client = None

        self._initialize_client()

    def _initialize_client(self):
        if self.provider == 'twilio':
            try:
                from twilio.rest import Client
                if self.twilio_account_sid and self.twilio_auth_token:
                    self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
            except ImportError:
                logger.warning("Twilio library not installed. SMS service disabled.")
        elif self.provider == 'sns':
            try:
                self.sns_client = boto3.client('sns')
            except Exception as e:
                logger.warning(f"Failed to initialize AWS SNS: {e}")

    async def send(self, phone_number: str, title: str, message: str) -> bool:
        """
        Send SMS notification.
        """
        if not phone_number:
            logger.warning("No phone number provided for SMS.")
            return False

        sms_text = f"{title}: {message}"
        # Truncate to avoid excessive costs/splitting if needed, though most providers handle concatenation
        # Standard SMS is 160 chars.

        try:
            if self.provider == 'twilio' and self.twilio_client:
                self.twilio_client.messages.create(
                    to=phone_number,
                    from_=self.twilio_from_number,
                    body=sms_text
                )
                logger.info(f"SMS sent via Twilio to {phone_number}")
                return True
            elif self.provider == 'sns' and self.sns_client:
                self.sns_client.publish(
                    PhoneNumber=phone_number,
                    Message=sms_text
                )
                logger.info(f"SMS sent via SNS to {phone_number}")
                return True
            else:
                logger.warning(f"SMS provider {self.provider} not configured or available.")
                return False
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return False
