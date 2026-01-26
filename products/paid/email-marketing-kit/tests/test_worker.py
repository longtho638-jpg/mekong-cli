import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.worker import get_provider, send_email_task, WorkerSettings
from app.providers.smtp import SMTPProvider
from app.providers.ses import SESProvider
from app.providers.sendgrid import SendGridProvider

@patch("app.worker.get_settings")
def test_get_provider_sendgrid(mock_get_settings):
    mock_settings = MagicMock()
    mock_settings.SENDGRID_API_KEY = "sg-key"
    # Ensure other keys are None to trigger SendGrid branch
    mock_settings.AWS_ACCESS_KEY_ID = None
    mock_get_settings.return_value = mock_settings

    provider = get_provider()
    assert isinstance(provider, SendGridProvider)
    assert provider.api_key == "sg-key"

@patch("app.worker.get_settings")
def test_get_provider_ses(mock_get_settings):
    mock_settings = MagicMock()
    mock_settings.SENDGRID_API_KEY = None
    mock_settings.AWS_ACCESS_KEY_ID = "aws-key"
    mock_settings.AWS_SECRET_ACCESS_KEY = "aws-secret"
    mock_settings.AWS_REGION = "us-east-1"
    mock_get_settings.return_value = mock_settings

    provider = get_provider()
    assert isinstance(provider, SESProvider)

@patch("app.worker.get_settings")
def test_get_provider_smtp_default(mock_get_settings):
    mock_settings = MagicMock()
    mock_settings.SENDGRID_API_KEY = None
    mock_settings.AWS_ACCESS_KEY_ID = None
    mock_settings.SMTP_HOSTNAME = "smtp.host"
    mock_settings.SMTP_PORT = 587
    mock_settings.SMTP_USERNAME = "user"
    mock_settings.SMTP_PASSWORD = "pass"
    mock_get_settings.return_value = mock_settings

    provider = get_provider()
    assert isinstance(provider, SMTPProvider)

@pytest.mark.asyncio
@patch("app.worker.get_provider")
async def test_send_email_task_success(mock_get_provider):
    mock_provider = AsyncMock()
    mock_provider.send_email.return_value = {"status": "sent"}
    mock_get_provider.return_value = mock_provider

    email_data = {
        "to_email": "test@example.com",
        "subject": "Test",
        "html_content": "<p>Hi</p>",
        "text_content": "Hi",
        "from_email": "sender@example.com"
    }

    result = await send_email_task({}, email_data)

    assert result["status"] == "sent"
    mock_provider.send_email.assert_awaited_once()

@pytest.mark.asyncio
@patch("app.worker.get_provider")
async def test_send_email_task_failure(mock_get_provider):
    mock_provider = AsyncMock()
    mock_provider.send_email.side_effect = Exception("Sending failed")
    mock_get_provider.return_value = mock_provider

    email_data = {
        "to_email": "fail@example.com",
        "subject": "Fail",
        "html_content": "<p>Hi</p>",
        "text_content": "Hi",
        "from_email": "sender@example.com"
    }

    with pytest.raises(Exception) as exc:
        await send_email_task({}, email_data)

    assert "Sending failed" in str(exc.value)

def test_worker_settings():
    assert send_email_task in WorkerSettings.functions
    assert WorkerSettings.max_jobs == 10
