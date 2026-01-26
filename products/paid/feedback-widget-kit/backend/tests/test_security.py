import pytest
from httpx import AsyncClient
import os

@pytest.mark.asyncio
async def test_file_upload_validation_malicious_ext(auth_client: AsyncClient):
    # Try uploading a .exe file
    file_content = b"malicious content"
    files = {
        "screenshot": ("virus.exe", file_content, "application/x-msdownload")
    }
    data = {
        "type": "bug",
        "content": "Malicious file upload",
        "rating": "1"
    }
    response = await auth_client.post("/api/v1/feedback", data=data, files=files)
    # Should be rejected
    assert response.status_code == 400
    assert "Invalid file extension" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_file_upload_validation_mime_type(auth_client: AsyncClient):
    # Try uploading a file with valid ext but wrong mime (simple check)
    file_content = b"<?php echo 'hack'; ?>"
    files = {
        "screenshot": ("hack.png", file_content, "application/x-php")
    }
    data = {
        "type": "bug",
        "content": "Fake PNG",
        "rating": "1"
    }
    response = await auth_client.post("/api/v1/feedback", data=data, files=files)
    # The API implementation checks content_type from the upload header
    assert response.status_code == 400
    assert "Invalid file type" in response.json().get("detail", "")

@pytest.mark.asyncio
async def test_xss_prevention(auth_client: AsyncClient):
    xss_payload = "<script>alert('XSS')</script>"
    data = {
        "type": "general",
        "content": f"Hello {xss_payload}",
        "rating": "5"
    }
    response = await auth_client.post("/api/v1/feedback", data=data)
    assert response.status_code == 200
    json_response = response.json()
    # Content should NOT contain the script tag literally executed
    # The implementation uses bleach.clean which removes script tags
    assert "<script>" not in json_response["content"]
    assert "alert('XSS')" in json_response["content"] # Bleach keeps text content usually

@pytest.mark.asyncio
async def test_api_key_missing(client: AsyncClient):
    # Using unauthenticated client
    data = {"type": "bug", "content": "No Auth"}
    response = await client.post("/api/v1/feedback", data=data)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_api_key_invalid(client: AsyncClient):
    headers = {"X-API-Key": "wrong-key"}
    data = {"type": "bug", "content": "Wrong Auth"}
    response = await client.post("/api/v1/feedback", data=data, headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_api_key_valid(client: AsyncClient, api_key: str):
    # Use the api_key fixture which creates a key in DB
    headers = {"X-API-Key": api_key}
    data = {"type": "bug", "content": "Good Auth"}
    response = await client.post("/api/v1/feedback", data=data, headers=headers)
    assert response.status_code == 200
    assert response.json()["content"] == "Good Auth"
