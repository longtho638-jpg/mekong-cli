import pytest

@pytest.mark.asyncio
async def test_create_template(client):
    response = await client.post("/api/v1/templates/", json={
        "name": "My Template",
        "subject": "Hello {{ name }}",
        "body_html": "<p>Hello {{ name }}</p>"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Template"
    assert data["body_text"] == "Hello {{ name }}"  # Auto-generated

@pytest.mark.asyncio
async def test_preview_template(client):
    # Create template
    res = await client.post("/api/v1/templates/", json={
        "name": "Preview Me",
        "subject": "Hi {{ name }}",
        "body_html": "<b>Hi {{ name }}</b>"
    })
    tmpl_id = res.json()["id"]

    # Preview
    response = await client.post(f"/api/v1/templates/{tmpl_id}/preview", json={
        "name": "Alice"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["subject"] == "Hi Alice"
    assert data["html"] == "<b>Hi Alice</b>"

@pytest.mark.asyncio
async def test_get_templates(client):
    await client.post("/api/v1/templates/", json={"name": "T1", "subject": "S1", "body_html": "H1"})
    await client.post("/api/v1/templates/", json={"name": "T2", "subject": "S2", "body_html": "H2"})

    response = await client.get("/api/v1/templates/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

@pytest.mark.asyncio
async def test_get_template_by_id(client):
    res = await client.post("/api/v1/templates/", json={"name": "T3", "subject": "S3", "body_html": "H3"})
    tmpl_id = res.json()["id"]

    response = await client.get(f"/api/v1/templates/{tmpl_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "T3"

@pytest.mark.asyncio
async def test_update_template(client):
    res = await client.post("/api/v1/templates/", json={"name": "T4", "subject": "S4", "body_html": "H4"})
    tmpl_id = res.json()["id"]

    response = await client.put(f"/api/v1/templates/{tmpl_id}", json={
        "name": "T4 Updated",
        "subject": "S4 Updated"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "T4 Updated"
    assert data["subject"] == "S4 Updated"

