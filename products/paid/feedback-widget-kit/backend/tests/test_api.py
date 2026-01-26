import pytest
import os
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_create_feedback_simple(auth_client: AsyncClient):
    data = {
        "type": "bug",
        "content": "This is a bug report",
        "rating": "5",
        "metadata": '{"page": "/home"}'
    }
    response = await auth_client.post("/api/v1/feedback", data=data)
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["content"] == "This is a bug report"
    assert json_response["type"] == "bug"
    assert json_response["rating"] == 5
    assert json_response["metadata_info"] == {"page": "/home"}
    assert "id" in json_response

@pytest.mark.asyncio
async def test_create_feedback_default_values(auth_client: AsyncClient):
    # Test default values for optional fields
    data = {
        "type": "general",
        "content": "Just a comment"
    }
    response = await auth_client.post("/api/v1/feedback", data=data)
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["type"] == "general"
    assert json_response["rating"] == 0
    assert json_response["metadata_info"] == {}

@pytest.mark.asyncio
async def test_create_feedback_with_screenshot(auth_client: AsyncClient):
    # Create a dummy image file
    file_content = b"fake image content"
    files = {
        "screenshot": ("test_image.png", file_content, "image/png")
    }
    data = {
        "type": "feature",
        "content": "I want a screenshot feature",
        "rating": "4"
    }
    response = await auth_client.post("/api/v1/feedback", data=data, files=files)
    assert response.status_code == 200
    json_response = response.json()
    assert json_response["screenshot_url"] is not None
    assert json_response["screenshot_url"].startswith("/static/")

    # Verify file exists
    # The URL is /static/uuid.ext. We need to check if the file is in the test upload dir.
    # In conftest we set UPLOAD_DIR env var to 'test_uploads'
    filename = json_response["screenshot_url"].split("/")[-1]
    assert os.path.exists(os.path.join("test_uploads", filename))

@pytest.mark.asyncio
async def test_read_feedbacks(auth_client: AsyncClient):
    # Create a feedback first
    await auth_client.post("/api/v1/feedback", data={"type": "bug", "content": "Bug 1"})
    await auth_client.post("/api/v1/feedback", data={"type": "feature", "content": "Feature 1"})

    response = await auth_client.get("/api/v1/feedback")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 2

@pytest.mark.asyncio
async def test_read_feedbacks_filter(auth_client: AsyncClient):
    await auth_client.post("/api/v1/feedback", data={"type": "bug", "content": "Bug 1"})
    await auth_client.post("/api/v1/feedback", data={"type": "feature", "content": "Feature 1"})

    response = await auth_client.get("/api/v1/feedback?type=bug")
    assert response.status_code == 200
    items = response.json()
    # Should only have bugs
    for item in items:
        assert item["type"] == "bug"

@pytest.mark.asyncio
async def test_read_single_feedback(auth_client: AsyncClient):
    create_resp = await auth_client.post("/api/v1/feedback", data={"type": "general", "content": "Single item"})
    feedback_id = create_resp.json()["id"]

    response = await auth_client.get(f"/api/v1/feedback/{feedback_id}")
    assert response.status_code == 200
    assert response.json()["id"] == feedback_id
    assert response.json()["content"] == "Single item"

@pytest.mark.asyncio
async def test_read_nonexistent_feedback(auth_client: AsyncClient):
    response = await auth_client.get("/api/v1/feedback/99999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_feedback_status(auth_client: AsyncClient):
    create_resp = await auth_client.post("/api/v1/feedback", data={"type": "bug", "content": "Fix me"})
    feedback_id = create_resp.json()["id"]

    data = {"status": "resolved"}
    response = await auth_client.patch(f"/api/v1/feedback/{feedback_id}", json=data)
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"

    # Verify persistence
    get_resp = await auth_client.get(f"/api/v1/feedback/{feedback_id}")
    assert get_resp.json()["status"] == "resolved"

@pytest.mark.asyncio
async def test_delete_feedback(auth_client: AsyncClient):
    create_resp = await auth_client.post("/api/v1/feedback", data={"type": "bug", "content": "Delete me"})
    feedback_id = create_resp.json()["id"]

    response = await auth_client.delete(f"/api/v1/feedback/{feedback_id}")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    # Verify deletion
    get_resp = await auth_client.get(f"/api/v1/feedback/{feedback_id}")
    assert get_resp.status_code == 404

@pytest.mark.asyncio
async def test_create_feedback_invalid_metadata_json(auth_client: AsyncClient):
    # The code currently handles JSONDecodeError and defaults to {}
    data = {
        "type": "bug",
        "content": "Bad JSON",
        "metadata": "{bad_json}"
    }
    response = await auth_client.post("/api/v1/feedback", data=data)
    assert response.status_code == 200
    assert response.json()["metadata_info"] == {}
