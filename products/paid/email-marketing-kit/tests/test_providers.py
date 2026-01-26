import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.providers.smtp import SMTPProvider
from app.providers.ses import SESProvider
from app.providers.sendgrid import SendGridProvider
from app.providers.base import EmailMessage

@pytest.fixture
def email_message():
    return EmailMessage(
        to_email="test@example.com",
        subject="Test Subject",
        html_content="<p>Test</p>",
        text_content="Test",
        from_email="sender@example.com"
    )

@pytest.mark.asyncio
async def test_smtp_provider(email_message):
    provider = SMTPProvider(
        hostname="localhost",
        port=1025,
        username="user",
        password="password"
    )

    with patch("aiosmtplib.SMTP") as mock_smtp_cls:
        mock_smtp = AsyncMock()
        mock_smtp_cls.return_value = mock_smtp
        # Context manager support
        mock_smtp.__aenter__.return_value = mock_smtp
        mock_smtp.__aexit__.return_value = None

        result = await provider.send_email(email_message)

        assert result["status"] == "sent"
        assert result["provider"] == "smtp"

        mock_smtp.login.assert_awaited_once_with("user", "password")
        mock_smtp.send_message.assert_awaited_once()

@pytest.mark.asyncio
async def test_ses_provider(email_message):
    # Mock Session before init
    with patch("aioboto3.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session_cls.return_value = mock_session

        mock_client = AsyncMock()
        # client() returns an async context manager
        mock_session.client.return_value.__aenter__.return_value = mock_client
        mock_session.client.return_value.__aexit__.return_value = None

        mock_client.send_email.return_value = {"MessageId": "ses-id"}

        provider = SESProvider(
            aws_access_key_id="key",
            aws_secret_access_key="secret",
            region_name="us-east-1"
        )

        result = await provider.send_email(email_message)

        assert result["status"] == "sent"
        assert result["provider"] == "ses"
        assert result["message_id"] == "ses-id"

        mock_client.send_email.assert_awaited_once()

@pytest.mark.asyncio
async def test_sendgrid_provider(email_message):
    provider = SendGridProvider(api_key="sg-key")

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client_cls.return_value = mock_client
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None

        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_response.headers = {"X-Message-Id": "sg-id"}
        mock_client.post.return_value = mock_response

        result = await provider.send_email(email_message)

        assert result["status"] == "sent"
        assert result["provider"] == "sendgrid"
        assert result["message_id"] == "sg-id"

        mock_client.post.assert_awaited_once()
