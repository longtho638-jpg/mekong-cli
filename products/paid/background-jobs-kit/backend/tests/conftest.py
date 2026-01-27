import pytest
import fakeredis
from app.services.queue import get_queue_service
from fastapi.testclient import TestClient
# Import app inside fixture or after patching if possible, but TestClient needs it.
# We will use dependency injection overrides or monkeypatching.

@pytest.fixture
def mock_redis():
    server = fakeredis.FakeServer()
    redis_client = fakeredis.FakeStrictRedis(server=server, decode_responses=True)
    return redis_client

@pytest.fixture
def queue_service(mock_redis, monkeypatch):
    # Clear cache to force recreation of QueueService with mocked redis
    get_queue_service.cache_clear()

    # Patch where RedisQueue imports redis
    monkeypatch.setattr("app.services.redis_queue.redis.from_url", lambda url, decode_responses=True: mock_redis)

    return get_queue_service()

@pytest.fixture
def client(mock_redis, monkeypatch):
    # Clear cache
    get_queue_service.cache_clear()

    # Patch redis
    monkeypatch.setattr("app.services.redis_queue.redis.from_url", lambda url, decode_responses=True: mock_redis)

    # Import app here to avoid early config loading issues if any
    from app.main import app
    return TestClient(app)
