import pytest
from unittest.mock import MagicMock, AsyncMock, patch, ANY
from app.services.dispatcher import dispatcher, CampaignDispatcher
from app.models.campaign import Campaign, CampaignStatus
from app.models.subscriber import Subscriber

@pytest.mark.asyncio
async def test_connect_redis():
    # Test redis connection singleton logic
    with patch("app.services.dispatcher.create_pool") as mock_create_pool:
        mock_redis = AsyncMock()
        mock_create_pool.return_value = mock_redis

        # Reset redis
        dispatcher.redis = None

        await dispatcher.connect()
        assert dispatcher.redis is not None
        mock_create_pool.assert_awaited_once()

        # Call again, should not create pool again
        await dispatcher.connect()
        assert mock_create_pool.call_count == 1

@pytest.mark.asyncio
@patch("app.services.dispatcher.AsyncSessionLocal")
@patch("app.services.dispatcher.create_pool")
async def test_dispatch_campaign_success(mock_create_pool, mock_session_cls):
    # Mock Redis
    mock_redis = AsyncMock()
    mock_create_pool.return_value = mock_redis
    dispatcher.redis = None # Force connect

    # Mock DB Session
    mock_db = AsyncMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_db

    # Mock Campaign
    campaign = MagicMock(spec=Campaign)
    campaign.id = 1
    campaign.status = CampaignStatus.DRAFT
    campaign.body_html = "<p>Hello {{ first_name }}</p></body>"
    campaign.body_text = "Hello {{ first_name }}"
    campaign.subject = "Hi {{ first_name }}"
    campaign.sent_count = 0

    mock_db.get.return_value = campaign

    # Mock Subscribers
    sub1 = MagicMock(spec=Subscriber)
    sub1.id = 101
    sub1.email = "sub1@example.com"
    sub1.first_name = "Alice"
    sub1.last_name = "Doe"
    sub1.status = "active"

    sub2 = MagicMock(spec=Subscriber)
    sub2.id = 102
    sub2.email = "sub2@example.com"
    sub2.first_name = "Bob"
    sub2.last_name = "Smith"
    sub2.status = "active"

    # Mock DB execute result
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [sub1, sub2]
    mock_db.execute.return_value = mock_result

    # Run dispatch
    await dispatcher.dispatch_campaign(campaign_id=1)

    # Verifications

    # 1. Campaign status flow
    assert campaign.status == CampaignStatus.COMPLETED
    assert campaign.started_at is not None
    assert campaign.completed_at is not None
    assert campaign.sent_count == 2 # 2 subscribers

    # 2. Redis enqueue
    assert mock_redis.enqueue_job.call_count == 2

    # Check job arguments for first subscriber
    call_args = mock_redis.enqueue_job.call_args_list[0]
    job_name, job_data = call_args[0]
    assert job_name == "send_email_task"
    assert job_data["to_email"] == "sub1@example.com"
    assert job_data["subject"] == "Hi Alice"
    assert "Hello Alice" in job_data["html_content"]

    # Check Tracking Pixel injection
    assert 'pixel.gif' in job_data["html_content"]
    assert str(campaign.id) in job_data["html_content"]
    assert str(sub1.id) in job_data["html_content"]

@pytest.mark.asyncio
@patch("app.services.dispatcher.AsyncSessionLocal")
async def test_dispatch_campaign_not_found(mock_session_cls):
    mock_db = AsyncMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_db
    mock_db.get.return_value = None # Campaign not found

    await dispatcher.dispatch_campaign(campaign_id=999)

    # Should just return without error
    mock_db.execute.assert_not_called()

@pytest.mark.asyncio
@patch("app.services.dispatcher.AsyncSessionLocal")
@patch("app.services.dispatcher.create_pool")
async def test_dispatch_campaign_rendering_error_resilience(mock_create_pool, mock_session_cls):
    # Mock Redis
    mock_redis = AsyncMock()
    mock_create_pool.return_value = mock_redis
    dispatcher.redis = None

    # Mock DB
    mock_db = AsyncMock()
    mock_session_cls.return_value.__aenter__.return_value = mock_db

    campaign = MagicMock(spec=Campaign)
    campaign.id = 1
    campaign.body_html = "Bad Template {{ missing }}"
    campaign.sent_count = 0
    mock_db.get.return_value = campaign

    sub = MagicMock(spec=Subscriber)
    sub.email = "sub@example.com"
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [sub]
    mock_db.execute.return_value = mock_result

    # Run
    await dispatcher.dispatch_campaign(campaign_id=1)

    # Should not crash, but also should NOT enqueue job for this sub
    mock_redis.enqueue_job.assert_not_called()
    # Sent count should remain 0
    assert campaign.sent_count == 0
    # Status should still complete
    assert campaign.status == CampaignStatus.COMPLETED
