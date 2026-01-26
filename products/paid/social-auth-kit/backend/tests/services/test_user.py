import pytest
from unittest.mock import MagicMock
from app.services.user_service import UserService
from app.providers.base import UnifiedUserProfile
from app.models.user import User

@pytest.mark.asyncio
async def test_get_or_create_social_user_creates_new(db_session):
    """Test that a new user is created if they don't exist."""
    profile = UnifiedUserProfile(
        email="service_new@example.com",
        provider="google",
        provider_user_id="s_123",
        full_name="Service New",
        avatar_url="http://avatar.com/new"
    )

    user = await UserService.get_or_create_social_user(db_session, profile)

    assert user.email == "service_new@example.com"
    assert user.full_name == "Service New"
    assert user.id is not None

    # Verify it's in DB
    saved_user = await UserService.get_by_email(db_session, "service_new@example.com")
    assert saved_user is not None
    assert saved_user.id == user.id

@pytest.mark.asyncio
async def test_get_or_create_social_user_updates_existing(db_session):
    """Test that an existing user is updated."""
    # Create initial user
    profile1 = UnifiedUserProfile(
        email="service_update@example.com",
        provider="google",
        provider_user_id="s_456",
        full_name="Original Name",
        avatar_url="http://avatar.com/old"
    )
    user1 = await UserService.get_or_create_social_user(db_session, profile1)
    assert user1.full_name == "Original Name"

    # Update profile
    profile2 = UnifiedUserProfile(
        email="service_update@example.com",
        provider="google",
        provider_user_id="s_456",
        full_name="Updated Name",
        avatar_url="http://avatar.com/new"
    )
    user2 = await UserService.get_or_create_social_user(db_session, profile2)

    assert user2.id == user1.id
    assert user2.full_name == "Updated Name"
    assert user2.avatar_url == "http://avatar.com/new"

    # Verify DB update
    saved_user = await UserService.get_by_email(db_session, "service_update@example.com")
    assert saved_user.full_name == "Updated Name"

@pytest.mark.asyncio
async def test_get_by_id(db_session):
    """Test retrieving a user by ID."""
    profile = UnifiedUserProfile(
        email="id_test@example.com",
        provider="google",
        provider_user_id="id_123",
        full_name="ID Test",
    )
    user = await UserService.get_or_create_social_user(db_session, profile)

    # Test get_by_id
    found_user = await UserService.get_by_id(db_session, user.id)
    assert found_user is not None
    assert found_user.email == "id_test@example.com"

    # Test non-existent ID
    import uuid
    random_id = uuid.uuid4()
    not_found = await UserService.get_by_id(db_session, random_id)
    assert not_found is None
