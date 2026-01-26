import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import SessionLocal
from app.db.init_db import init_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
from unittest.mock import AsyncMock, patch

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(test_db):
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def override_get_db(db_session):
    from app.api.deps import get_db
    def _get_db_override():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = _get_db_override
    yield
    app.dependency_overrides = {}

@pytest.fixture
def mock_queue():
    with patch("app.core.queue.queue_manager.get_redis", new_callable=AsyncMock) as mock_get:
        mock_redis = AsyncMock()
        mock_get.return_value = mock_redis
        yield mock_redis

@pytest.mark.asyncio
async def test_create_endpoint(override_get_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/webhooks/", json={
            "url": "https://example.com/webhook",
            "event_types": ["user.created"],
            "description": "Test Endpoint"
        })
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/webhook"
    assert "secret" in data

@pytest.mark.asyncio
async def test_trigger_event(override_get_db, mock_queue):
    transport = ASGITransport(app=app)
    # First create an endpoint
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/v1/webhooks/", json={
            "url": "https://example.com/webhook",
            "event_types": ["order.created"],
            "description": "Order Endpoint"
        })

        # Trigger event
        response = await ac.post("/api/v1/events/trigger", json={
            "event_type": "order.created",
            "payload": {"order_id": 123}
        })
    assert response.status_code == 202
    assert response.json()["message"] == "Event received and processing started"

    # Verify job was enqueued
    mock_queue.enqueue_job.assert_called_once()
    args, kwargs = mock_queue.enqueue_job.call_args
    assert args[0] == "send_webhook_job"
    assert kwargs["event_data"] == {"order_id": 123}
