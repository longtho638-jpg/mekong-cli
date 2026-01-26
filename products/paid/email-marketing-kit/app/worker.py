import asyncio
import logging
from typing import Optional, Dict, Any
from app.providers.base import EmailMessage
from app.providers.smtp import SMTPProvider
from app.providers.ses import SESProvider
from app.providers.sendgrid import SendGridProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Factory to get the active provider
def get_provider():
    settings = get_settings()
    # Logic to choose provider based on settings or DB config
    # For MVP, checking Env Vars
    if getattr(settings, "SENDGRID_API_KEY", None):
        return SendGridProvider(api_key=settings.SENDGRID_API_KEY)
    elif getattr(settings, "AWS_ACCESS_KEY_ID", None):
        return SESProvider(
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    else:
        # Default to SMTP
        return SMTPProvider(
            hostname=settings.SMTP_HOSTNAME or "localhost",
            port=settings.SMTP_PORT or 1025,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD
        )

async def send_email_task(ctx: Dict[str, Any], email_data: Dict[str, Any]):
    """
    Background task to send an email.
    Expected email_data to be a dict representation of EmailMessage
    """
    logger.info(f"Worker processing email to {email_data.get('to_email')}")

    provider = get_provider()

    # Reconstruct object
    message = EmailMessage(**email_data)

    try:
        result = await provider.send_email(message)
        logger.info(f"Email sent successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # arq will handle retries if configured
        raise e

# ARQ Worker Settings
class WorkerSettings:
    functions = [send_email_task]
    redis_settings = get_settings().REDIS_URL
    max_jobs = 10
