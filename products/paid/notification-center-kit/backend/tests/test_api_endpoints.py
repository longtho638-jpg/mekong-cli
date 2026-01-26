import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import get_db, Base
from app.models.notification import Notification

# Setup in-memory SQLite DB for testing (Async)
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(expire_on_commit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
async def async_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(async_db):
    def override_get_db():
        yield async_db

    app.dependency_overrides[get_db] = override_get_db
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_send_notification(client):
    response = await client.post(
        "/api/v1/notifications/send",
        json={
            "user_id": "test_user_1",
            "type": "info",
            "title": "Test Notification",
            "body": "This is a test body",
            "data": {"key": "value"}
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Notification"
    assert data["user_id"] == "test_user_1"
    assert data["id"] is not None
    assert data["is_read"] is False

@pytest.mark.asyncio
async def test_get_notifications(client):
    # First create one
    await client.post(
        "/api/v1/notifications/send",
        json={
            "user_id": "test_user_2",
            "type": "alert",
            "title": "Alert 1",
            "body": "Body 1"
        },
    )

    response = await client.get("/api/v1/notifications/?user_id=test_user_2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Alert 1"

@pytest.mark.asyncio
async def test_mark_as_read(client):
    # Create
    res_create = await client.post(
        "/api/v1/notifications/send",
        json={
            "user_id": "test_user_3",
            "type": "info",
            "title": "To Read",
            "body": "Body"
        },
    )
    notif_id = res_create.json()["id"]

    # Mark Read
    response = await client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

@pytest.mark.asyncio
async def test_mark_all_as_read(client):
    user_id = "test_user_4"
    # Create two
    await client.post("/api/v1/notifications/send", json={"user_id": user_id, "type": "info", "title": "1", "body": "1"})
    await client.post("/api/v1/notifications/send", json={"user_id": user_id, "type": "info", "title": "2", "body": "2"})

    response = await client.post(f"/api/v1/notifications/read-all?user_id={user_id}")
    assert response.status_code == 200

    # Verify
    res_get = await client.get(f"/api/v1/notifications/?user_id={user_id}")
    for n in res_get.json():
        assert n["is_read"] is True
