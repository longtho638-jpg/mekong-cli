import pytest
from httpx import AsyncClient
from app.core.security import create_access_token
from app.models.user import User
import uuid

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient, db_session):
    """Test getting current user profile."""
    # Create a user
    user = User(
        email="me@example.com",
        full_name="Me User",
        avatar_url="http://me.com/avatar",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create token
    token = create_access_token(subject=str(user.id))

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["full_name"] == "Me User"

@pytest.mark.asyncio
async def test_read_users_me_invalid_token(client: AsyncClient):
    """Test using an invalid token."""
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_read_users_me_user_not_found(client: AsyncClient, db_session):
    """Test using a valid token for a deleted user."""
    # Generate a random UUID
    random_id = uuid.uuid4()
    token = create_access_token(subject=str(random_id))

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    # The endpoint returns 404 if user not found
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_read_users_me_inactive_user(client: AsyncClient, db_session):
    """Test login with inactive user."""
    user = User(
        email="inactive@example.com",
        is_active=False
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(subject=str(user.id))

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
