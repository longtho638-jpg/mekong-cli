import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_create_campaign(client):
    # Create template
    tmpl_res = await client.post("/api/v1/templates/", json={
        "name": "Campaign Template",
        "subject": "News",
        "body_html": "<p>Content</p>"
    })
    assert tmpl_res.status_code == 200
    tmpl_id = tmpl_res.json()["id"]

    # Create list
    list_res = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Campaign List"
    })
    assert list_res.status_code == 200
    list_id = list_res.json()["id"]

    # Create campaign
    response = await client.post("/api/v1/campaigns/", json={
        "name": "My Campaign",
        "subject": "Subject Override",
        "template_id": tmpl_id,
        "scheduled_at": None,
        "list_ids": [list_id]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Campaign"
    assert data["status"] == "draft"

@pytest.mark.asyncio
async def test_send_campaign(client):
    # Create template
    tmpl_res = await client.post("/api/v1/templates/", json={
        "name": "Send Template",
        "subject": "News",
        "body_html": "<p>Content</p>"
    })
    assert tmpl_res.status_code == 200
    tmpl_id = tmpl_res.json()["id"]

    # Create list
    list_res = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Send List"
    })
    list_id = list_res.json()["id"]

    # Create campaign
    camp_res = await client.post("/api/v1/campaigns/", json={
        "name": "Send Campaign",
        "subject": "News",
        "template_id": tmpl_id,
        "list_ids": [list_id]
    })
    assert camp_res.status_code == 200
    camp_id = camp_res.json()["id"]

    # Mock dispatcher
    # Note: We need to patch where it is used (endpoints.campaigns), not where it is defined
    with patch("app.api.endpoints.campaigns.dispatcher.dispatch_campaign", new_callable=AsyncMock) as mock_dispatch:
        response = await client.post(f"/api/v1/campaigns/{camp_id}/send")
        assert response.status_code == 200

        mock_dispatch.assert_called_once_with(camp_id)

@pytest.mark.asyncio
async def test_read_campaigns(client):
    # Create template
    tmpl_res = await client.post("/api/v1/templates/", json={
        "name": "List Template",
        "subject": "News",
        "body_html": "<p>Content</p>"
    })
    tmpl_id = tmpl_res.json()["id"]

    # Create list
    list_res = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Read List"
    })
    list_id = list_res.json()["id"]

    # Create campaign
    res = await client.post("/api/v1/campaigns/", json={
        "name": "List Campaign 1",
        "subject": "News",
        "template_id": tmpl_id,
        "list_ids": [list_id]
    })
    assert res.status_code == 200

    response = await client.get("/api/v1/campaigns/")
    assert response.status_code == 200
    data = response.json()
    # There might be campaigns from other tests if DB not cleared properly per function?
    # conftest says scope="function" and it drops all tables, so it should be clean.
    # But wait, test_read_campaigns is running after others.
    assert len(data) >= 1
    found = any(c["name"] == "List Campaign 1" for c in data)
    assert found
