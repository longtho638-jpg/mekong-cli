import pytest
from app.schemas.notification import NotificationCreate

@pytest.mark.asyncio
async def test_send_notification(client):
    payload = {
        "user_id": "user_test_1",
        "type": "info",
        "title": "Test Notification",
        "body": "This is a test.",
        "data": {"key": "value"}
    }
    response = await client.post("/api/v1/notifications/send", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["user_id"] == payload["user_id"]
    assert "id" in data
    assert data["is_read"] is False

@pytest.mark.asyncio
async def test_get_notifications(client):
    # First create a notification
    payload = {
        "user_id": "user_test_2",
        "type": "info",
        "title": "My Notification",
        "body": "Body text",
    }
    await client.post("/api/v1/notifications/send", json=payload)

    # Get notifications for the user
    response = await client.get("/api/v1/notifications/?user_id=user_test_2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "My Notification"

    # Get notifications for another user (should be empty)
    response_empty = await client.get("/api/v1/notifications/?user_id=other_user")
    assert response_empty.status_code == 200
    assert len(response_empty.json()) == 0

@pytest.mark.asyncio
async def test_mark_as_read(client):
    # Create
    payload = {
        "user_id": "user_test_3",
        "type": "alert",
        "title": "Read Me",
        "body": "Urgent",
    }
    res = await client.post("/api/v1/notifications/send", json=payload)
    notif_id = res.json()["id"]

    # Mark read
    response = await client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    # Verify fetch
    get_res = await client.get("/api/v1/notifications/?user_id=user_test_3")
    assert get_res.json()[0]["is_read"] is True

@pytest.mark.asyncio
async def test_mark_all_as_read(client):
    user_id = "user_test_4"
    # Create multiple
    for i in range(3):
        await client.post("/api/v1/notifications/send", json={
            "user_id": user_id,
            "type": "info",
            "title": f"Notif {i}",
            "body": "body"
        })

    # Mark all read
    response = await client.post(f"/api/v1/notifications/read-all?user_id={user_id}")
    assert response.status_code == 200

    # Verify
    get_res = await client.get(f"/api/v1/notifications/?user_id={user_id}")
    for item in get_res.json():
        assert item["is_read"] is True
