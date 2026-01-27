import pytest
import pytest_asyncio
from redis.asyncio import Redis
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

@pytest_asyncio.fixture
async def redis_client():
    client = Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )
    yield client
    await client.flushdb()
    await client.close()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
