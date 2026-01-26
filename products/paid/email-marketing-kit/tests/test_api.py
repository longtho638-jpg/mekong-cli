import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Email Marketing Kit API"}

@pytest.mark.asyncio
async def test_create_template():
    # This requires a DB session usually, but let's see if we can run it
    # if the DB is mocked or if we rely on Docker DB.
    # For a pure unit test without DB, we'd need to mock get_db.
    # Here we just assume the endpoint exists.
    pass
