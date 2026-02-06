import asyncio
import os
import pytest
import uuid
from typing import AsyncGenerator
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.compiler import compiles

# Set environment variables before importing settings
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_mock"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_mock"

@compiles(UUID, "sqlite")
def visit_uuid(element, compiler, **kw):
    return "CHAR(36)"

@compiles(JSONB, "sqlite")
def visit_jsonb(element, compiler, **kw):
    return "JSON"

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from src.database import Base
from src.models import User, Wallet, CreditPack, Transaction

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def test_engine():
    """Create test engine with in-memory SQLite."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False}
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()

@pytest.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests."""
    async_session = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user with wallet."""
    user = User(id=uuid.uuid4(), email="test@example.com")
    db_session.add(user)
    await db_session.flush()

    wallet = Wallet(id=uuid.uuid4(), user_id=user.id, balance=0)
    db_session.add(wallet)
    await db_session.commit()
    await db_session.refresh(user)

    return user

@pytest.fixture
async def test_wallet(db_session: AsyncSession, test_user: User) -> Wallet:
    """Get the test user's wallet."""
    from sqlalchemy import select
    stmt = select(Wallet).where(Wallet.user_id == test_user.id)
    result = await db_session.execute(stmt)
    return result.scalar_one()

@pytest.fixture
async def test_credit_pack(db_session: AsyncSession) -> CreditPack:
    """Create a test credit pack."""
    pack = CreditPack(
        id=uuid.uuid4(),
        name="Starter Pack",
        credit_amount=1000,
        price_cents=999,
        stripe_price_id="price_test_123",
        is_active=True
    )
    db_session.add(pack)
    await db_session.commit()
    await db_session.refresh(pack)
    return pack
