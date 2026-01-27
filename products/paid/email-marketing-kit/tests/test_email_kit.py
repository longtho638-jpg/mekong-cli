import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.campaign import Campaign
from app.models.template import EmailTemplate
from app.models.subscriber import Subscriber
from app.models.drip import DripCampaign, DripStep, DripActionType
from datetime import datetime

# --- Integration Tests ---

@pytest.mark.asyncio
async def test_create_campaign_with_segmentation(
    client: AsyncClient, db: AsyncSession
):
    # 1. Create a template
    tpl = EmailTemplate(name="Test Tpl", subject="Subj", body_html="<h1>Hi</h1>")
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)

    # 2. Create campaign with segmentation
    payload = {
        "name": "Seg Campaign",
        "subject": "Seg Subject",
        "template_id": tpl.id,
        "segment_rules": [
            {"field": "status", "operator": "eq", "value": "active"}
        ]
    }
    response = await client.post("/api/v1/campaigns/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Seg Campaign"
    assert data["segment_rules"][0]["value"] == "active"

@pytest.mark.asyncio
async def test_create_drip_campaign(
    client: AsyncClient, db: AsyncSession
):
    # 1. Create a template
    tpl = EmailTemplate(name="Drip Tpl", subject="Drip", body_html="<h1>Drip</h1>")
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)

    # 2. Create drip
    payload = {
        "name": "Welcome Series",
        "trigger_type": "signup",
        "steps": [
            {
                "step_order": 1,
                "action_type": "email",
                "template_id": tpl.id
            },
            {
                "step_order": 2,
                "action_type": "delay",
                "delay_seconds": 86400
            },
            {
                "step_order": 3,
                "action_type": "email",
                "template_id": tpl.id,
                "subject": "Follow up"
            }
        ]
    }
    response = await client.post("/api/v1/drips/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Welcome Series"
    assert len(data["steps"]) == 3
    assert data["steps"][0]["action_type"] == "email"
    assert data["steps"][1]["action_type"] == "delay"

@pytest.mark.asyncio
async def test_resend_provider_logic():
    from app.providers.resend import ResendProvider
    from app.providers.base import EmailMessage

    # Mock httpx
    import respx
    from httpx import Response

    provider = ResendProvider(api_key="re_123")

    with respx.mock(base_url="https://api.resend.com") as resend_mock:
        resend_mock.post("/emails").mock(return_value=Response(200, json={"id": "msg_123"}))

        msg = EmailMessage(
            to_email="test@example.com",
            subject="Hello",
            html_content="<h1>Hi</h1>"
        )

        result = await provider.send_email(msg)
        assert result["status"] == "sent"
        assert result["message_id"] == "msg_123"
        assert result["provider"] == "resend"

@pytest.mark.asyncio
async def test_segmentation_logic(db: AsyncSession):
    from app.services.segmentation import segmentation_service

    # Seed subscribers
    s1 = Subscriber(email="active@example.com", status="active", attributes={"location": "US"})
    s2 = Subscriber(email="inactive@example.com", status="unsubscribed", attributes={"location": "US"})
    s3 = Subscriber(email="active_uk@example.com", status="active", attributes={"location": "UK"})

    db.add_all([s1, s2, s3])
    await db.commit()

    # Test 1: Status = active
    rules = [{"field": "status", "operator": "eq", "value": "active"}]
    subs = await segmentation_service.get_subscribers(db, rules)
    assert len(subs) == 2
    emails = [s.email for s in subs]
    assert "active@example.com" in emails
    assert "active_uk@example.com" in emails

    # Test 2: Location = US
    rules = [{"field": "attributes.location", "operator": "eq", "value": "US"}]
    subs = await segmentation_service.get_subscribers(db, rules)
    assert len(subs) == 2 # active US + inactive US

    # Test 3: Status = active AND Location = US
    rules = [
        {"field": "status", "operator": "eq", "value": "active"},
        {"field": "attributes.location", "operator": "eq", "value": "US"}
    ]
    subs = await segmentation_service.get_subscribers(db, rules)
    assert len(subs) == 1
    assert subs[0].email == "active@example.com"
