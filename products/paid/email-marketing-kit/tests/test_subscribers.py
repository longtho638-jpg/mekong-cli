import pytest
from app.core.unsubscribe_token import generate_unsubscribe_token

@pytest.mark.asyncio
async def test_create_mailing_list(client):
    response = await client.post("/api/v1/subscribers/lists/", json={
        "name": "Test List",
        "description": "A list for testing"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test List"
    assert "id" in data

@pytest.mark.asyncio
async def test_create_subscriber(client):
    # First create a list
    list_res = await client.post("/api/v1/subscribers/lists/", json={"name": "News"})
    list_id = list_res.json()["id"]

    # Create subscriber
    response = await client.post("/api/v1/subscribers/subscribers/", json={
        "email": "john@example.com",
        "first_name": "John",
        "list_ids": [list_id]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "john@example.com"
    assert data["status"] == "unconfirmed"
    assert len(data["lists"]) == 1
    assert data["lists"][0]["id"] == list_id

@pytest.mark.asyncio
async def test_unsubscribe(client):
    # Create subscriber
    sub_res = await client.post("/api/v1/subscribers/subscribers/", json={
        "email": "leaver@example.com"
    })
    sub_id = sub_res.json()["id"]

    # Generate token
    token = generate_unsubscribe_token(sub_id)

    # Unsubscribe
    response = await client.get(f"/api/v1/subscribers/unsubscribe?token={token}")
    assert response.status_code == 200
    assert "You have been unsubscribed" in response.text

@pytest.mark.asyncio
async def test_list_subscribers(client):
    # Create subscribers
    await client.post("/api/v1/subscribers/subscribers/", json={"email": "s1@example.com", "status": "active"})
    await client.post("/api/v1/subscribers/subscribers/", json={"email": "s2@example.com", "status": "unconfirmed"})

    # List all
    response = await client.get("/api/v1/subscribers/subscribers/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    # Filter by status
    response = await client.get("/api/v1/subscribers/subscribers/?status=active")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert all(s["status"] == "active" for s in data)

@pytest.mark.asyncio
async def test_delete_subscriber(client):
    res = await client.post("/api/v1/subscribers/subscribers/", json={"email": "del@example.com"})
    sub_id = res.json()["id"]

    response = await client.delete(f"/api/v1/subscribers/subscribers/{sub_id}")
    assert response.status_code == 200

    # Verify deleted
    response = await client.get("/api/v1/subscribers/subscribers/")
    data = response.json()
    assert not any(s["id"] == sub_id for s in data)

@pytest.mark.asyncio
async def test_list_mailing_lists(client):
    await client.post("/api/v1/subscribers/lists/", json={"name": "L1"})
    await client.post("/api/v1/subscribers/lists/", json={"name": "L2"})

    response = await client.get("/api/v1/subscribers/lists/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

