import pytest
from app.models.campaign import Campaign, CampaignEvent
from sqlalchemy import select

@pytest.mark.asyncio
async def test_track_open(client, async_db):
    # Setup data
    # Create template
    tmpl_res = await client.post("/api/v1/templates/", json={
        "name": "Tracking Template",
        "subject": "Track Me",
        "body_html": "<p>Hi</p>"
    })
    tmpl_id = tmpl_res.json()["id"]

    # Create list
    list_res = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Tracking List"
    })
    list_id = list_res.json()["id"]

    # Create campaign
    camp_res = await client.post("/api/v1/campaigns/", json={
        "name": "Tracking Campaign",
        "subject": "Track Me",
        "template_id": tmpl_id,
        "list_ids": [list_id]
    })
    camp_id = camp_res.json()["id"]

    # Create subscriber
    sub_res = await client.post("/api/v1/subscribers/subscribers/", json={
        "email": "tracker@example.com"
    })
    sub_id = sub_res.json()["id"]

    # Call open pixel
    response = await client.get(f"/api/v1/t/o/{camp_id}/{sub_id}/pixel.gif")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/gif"

    # Verify DB side effects
    # 1. Event created
    stmt = select(CampaignEvent).where(
        CampaignEvent.campaign_id == camp_id,
        CampaignEvent.subscriber_id == sub_id,
        CampaignEvent.event_type == "open"
    )
    result = await async_db.execute(stmt)
    event = result.scalar_one_or_none()
    assert event is not None

    # 2. Counter incremented
    # Need to refresh campaign from DB
    camp = await async_db.get(Campaign, camp_id)
    # Note: SQLite concurrency might be tricky here with async, but let's check
    assert camp.open_count == 1

@pytest.mark.asyncio
async def test_track_click(client, async_db):
    # Setup data
    tmpl_res = await client.post("/api/v1/templates/", json={
        "name": "Click Template",
        "subject": "Click Me",
        "body_html": "<p>Hi</p>"
    })
    tmpl_id = tmpl_res.json()["id"]

    # Create list
    list_res = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Click List"
    })
    list_id = list_res.json()["id"]

    camp_res = await client.post("/api/v1/campaigns/", json={
        "name": "Click Campaign",
        "subject": "Click Me",
        "template_id": tmpl_id,
        "list_ids": [list_id]
    })
    camp_id = camp_res.json()["id"]

    sub_res = await client.post("/api/v1/subscribers/subscribers/", json={
        "email": "clicker@example.com"
    })
    sub_id = sub_res.json()["id"]

    target_url = "https://example.com"

    # Call click endpoint
    response = await client.get(f"/api/v1/t/c/{camp_id}/{sub_id}?url={target_url}", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == target_url

    # Verify DB side effects
    stmt = select(CampaignEvent).where(
        CampaignEvent.campaign_id == camp_id,
        CampaignEvent.subscriber_id == sub_id,
        CampaignEvent.event_type == "click"
    )
    result = await async_db.execute(stmt)
    event = result.scalar_one_or_none()
    assert event is not None
    assert event.url == target_url

    camp = await async_db.get(Campaign, camp_id)
    assert camp.click_count == 1
