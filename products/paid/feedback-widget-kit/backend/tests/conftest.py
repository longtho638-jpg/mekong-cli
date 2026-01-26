import pytest
import pytest_asyncio
import os
import shutil
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

# Set env vars for testing before imports
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["UPLOAD_DIR"] = "test_uploads"
os.environ["SECRET_KEY"] = "test_secret"

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, get_db
from app.main import app
from app.core.config import settings

# Re-create engine with sqlite for tests
# StaticPool is important for in-memory sqlite to persist data across sessions/requests in the same test.
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

@pytest_asyncio.fixture(scope="function")
async def db():
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    # Drop tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(scope="function")
async def client(db):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    # Setup upload dir
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    # Cleanup
    if os.path.exists(settings.UPLOAD_DIR):
        shutil.rmtree(settings.UPLOAD_DIR)

@pytest_asyncio.fixture(scope="function")
async def api_key(db):
    """Creates a valid API key record in the DB and returns the raw key."""
    import secrets
    import hashlib
    from app import models

    raw_key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    db_key = models.ApiKey(name="Test Key", key_hash=key_hash, allowed_domains=["*"])
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)
    return raw_key

@pytest_asyncio.fixture(scope="function")
async def auth_client(client, api_key):
    """Returns a AsyncClient with valid API key headers."""
    client.headers["X-API-Key"] = api_key
    return client
