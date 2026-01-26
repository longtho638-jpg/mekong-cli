import pytest
import fakeredis
from app.services.queue import QueueService
from app.core.config import settings
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def mock_redis():
    server = fakeredis.FakeServer()
    redis_client = fakeredis.FakeStrictRedis(server=server, decode_responses=True)
    return redis_client

@pytest.fixture
def queue_service(mock_redis, monkeypatch):
    # Monkeypatch the redis connection in QueueService
    monkeypatch.setattr("app.services.queue.redis.from_url", lambda url, decode_responses: mock_redis)
    return QueueService()

@pytest.fixture
def client(mock_redis, monkeypatch):
    # Monkeypatch for API tests
    monkeypatch.setattr("app.services.queue.redis.from_url", lambda url, decode_responses: mock_redis)
    return TestClient(app)
