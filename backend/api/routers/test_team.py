"""
Tests for Team Management API endpoints

Tests team creation, member invitations, removals, and seat management.
"""

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# Define fixture to mock Redis for all tests in this module
@pytest.fixture(scope="module", autouse=True)
def mock_redis_services():
    """
    Patch all Redis clients in the services layer to prevent real connection attempts.
    Since singletons might already be initialized, we patch the attributes on the singletons
    or the modules where they are defined.
    """
    mock_redis = AsyncMock()
    # Common async redis methods
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()
    mock_redis.setex = AsyncMock()
    mock_redis.delete = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    mock_redis.zadd = AsyncMock()
    mock_redis.zremrangebyscore = AsyncMock()
    mock_redis.zcard = AsyncMock(return_value=0)
    mock_redis.pipeline = MagicMock(return_value=MagicMock(execute=AsyncMock(return_value=[])))

    # Patch the core redis client definition
    p1 = patch("backend.core.infrastructure.redis.redis_client", mock_redis)

    # Patch the service wrapper singletons
    # We need to import them to patch the instances, or patch where they are imported.
    # Patching the module attribute where the singleton is stored is effective.
    p2 = patch("backend.services.redis_client.redis_service._client", mock_redis)
    p3 = patch("backend.services.ip_blocker.ip_blocker.redis", mock_redis)
    p4 = patch("backend.services.rate_limit_monitor.rate_limit_monitor.redis", mock_redis)

    # Also patch Redis class to prevent new instances from connecting
    p5 = patch("redis.asyncio.Redis", return_value=mock_redis)
    p6 = patch("redis.Redis", return_value=mock_redis)

    with p1, p2, p3, p4, p5, p6:
        yield mock_redis

# Define fixture to mock CacheWarmer for all tests in this module
@pytest.fixture(scope="module", autouse=True)
def mock_cache_warmer():
    with patch("backend.services.cache.warming.CacheWarmer") as MockWarmer:
        # Configure the mock to return an async initialize method that does nothing
        mock_instance = MockWarmer.return_value
        async def async_init(): return None
        mock_instance.initialize.side_effect = async_init
        yield MockWarmer

@pytest.fixture
def client():
    # Import app here
    from backend.api.main import app

    # Disable RateLimitMiddleware dispatch for testing to avoid complexity
    # We patch the dispatch method of the class to skip logic
    async def skip_middleware(self, request, call_next):
        return await call_next(request)

    # Patch RateLimitMiddleware.dispatch
    p_middleware = patch("backend.middleware.rate_limiter.RateLimitMiddleware.dispatch", side_effect=skip_middleware, autospec=True)

    # Also patch IpBlocker to be safe (it's used in RateLimitMiddleware but we are skipping it,
    # but other things might use it)
    p_ip_blocker = patch("backend.services.ip_blocker.ip_blocker.is_blocked", new_callable=AsyncMock)
    p_ip_blocker.return_value = False

    with p_middleware, p_ip_blocker as mock_is_blocked:
        mock_is_blocked.return_value = False

        # Use context manager to handle startup/shutdown events properly
        with TestClient(app) as c:
            yield c

class TestTeamCreation:
    """Test team creation endpoint"""

    def test_create_team_success(self, client):
        """Test successful team creation"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Agency",
                "owner_email": "owner@test.com",
                "license_tier": "pro",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "team" in data
        assert data["team"]["name"] == "Test Agency"
        assert data["team"]["owner_email"] == "owner@test.com"
        assert data["team"]["license_tier"] == "pro"
        assert data["team"]["max_seats"] == 3
        assert data["team"]["active_members"] == 1  # Owner
        assert data["team"]["available_seats"] == 2
        # return data["team"]["team_id"] # Return value unused in test

    def test_create_team_invalid_tier(self, client):
        """Test team creation with invalid tier"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Agency",
                "owner_email": "owner@test.com",
                "license_tier": "invalid",
            },
        )
        assert response.status_code == 400
        assert "Invalid license tier" in response.json()["detail"]

    def test_create_team_enterprise_unlimited_seats(self, client):
        """Test enterprise tier has unlimited seats"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Enterprise Team",
                "owner_email": "enterprise@test.com",
                "license_tier": "enterprise",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["team"]["max_seats"] == -1
        assert data["team"]["available_seats"] == -1


class TestMemberInvitation:
    """Test member invitation endpoint"""

    @pytest.fixture(autouse=True)
    def setup_team(self, client):
        """Create a test team before each test"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Team",
                "owner_email": "owner@test.com",
                "license_tier": "pro",
            },
        )
        self.team_id = response.json()["team"]["team_id"]

    def test_invite_member_success(self, client):
        """Test successful member invitation"""
        response = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member1@test.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["member"]["email"] == "member1@test.com"
        assert data["member"]["role"] == "member"
        assert data["member"]["status"] == "invited"
        # 3 max - 1 owner - 1 invited = 1 available (Invites consume seats)
        assert data["available_seats"] == 1

    def test_invite_multiple_members(self, client):
        """Test inviting multiple members within seat limit"""
        # First invite
        response1 = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member1@test.com"},
        )
        assert response1.status_code == 200
        # 3 - 1 owner - 1 invited = 1 left
        assert response1.json()["available_seats"] == 1

        # Second invite
        response2 = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member2@test.com"},
        )
        assert response2.status_code == 200
        # 3 - 1 owner - 2 invited = 0 left
        assert response2.json()["available_seats"] == 0

    def test_invite_exceeds_seat_limit(self, client):
        """Test invitation fails when no seats available"""
        # Fill all seats
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m1@test.com"})
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m2@test.com"})

        # Try to invite one more (should fail)
        response = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "m3@test.com"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "No available seats" in data["message"]

    def test_invite_duplicate_member(self, client):
        """Test cannot invite same member twice"""
        # First invite
        client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member@test.com"},
        )

        # Second invite (should fail)
        response = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member@test.com"},
        )
        assert response.status_code == 400
        assert "already has a pending invitation" in response.json()["detail"]

    def test_invite_team_not_found(self, client):
        """Test invitation to non-existent team"""
        response = client.post(
            "/api/team/invalid_id/invite",
            json={"email": "member@test.com"},
        )
        assert response.status_code == 400


class TestMemberRemoval:
    """Test member removal endpoint"""

    @pytest.fixture(autouse=True)
    def setup_team(self, client):
        """Create a test team with members before each test"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Team",
                "owner_email": "owner@test.com",
                "license_tier": "pro",
            },
        )
        self.team_id = response.json()["team"]["team_id"]

        # Add a member
        client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member@test.com"},
        )

    def test_remove_member_success(self, client):
        """Test successful member removal"""
        response = client.delete(f"/api/team/{self.team_id}/member/member@test.com")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "removed from team" in data["message"]
        assert data["available_seats"] == 2

    def test_remove_owner_fails(self, client):
        """Test cannot remove team owner"""
        response = client.delete(f"/api/team/{self.team_id}/member/owner@test.com")
        assert response.status_code == 400
        assert "Cannot remove team owner" in response.json()["detail"]

    def test_remove_nonexistent_member(self, client):
        """Test removing member that doesn't exist"""
        response = client.delete(f"/api/team/{self.team_id}/member/nobody@test.com")
        assert response.status_code == 400
        assert "Member not found" in response.json()["detail"]

    def test_remove_already_removed_member(self, client):
        """Test cannot remove already removed member"""
        # Remove member
        client.delete(f"/api/team/{self.team_id}/member/member@test.com")

        # Try to remove again
        response = client.delete(f"/api/team/{self.team_id}/member/member@test.com")
        assert response.status_code == 400
        assert "already removed" in response.json()["detail"]


class TestMemberListing:
    """Test member listing endpoint"""

    @pytest.fixture(autouse=True)
    def setup_team(self, client):
        """Create a test team with members before each test"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Team",
                "owner_email": "owner@test.com",
                "license_tier": "pro",
            },
        )
        self.team_id = response.json()["team"]["team_id"]

        # Add members
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m1@test.com"})
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m2@test.com"})

    def test_list_members_success(self, client):
        """Test successful member listing"""
        response = client.get(f"/api/team/{self.team_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["team_id"] == self.team_id
        assert data["max_seats"] == 3
        # active_members counts both ACTIVE and INVITED members (seats occupied)
        assert data["active_members"] == 3  # Owner + 2 invited
        assert len(data["members"]) == 3  # Owner + 2 invited

    def test_list_members_exclude_removed(self, client):
        """Test listing excludes removed members by default"""
        # Remove a member
        client.delete(f"/api/team/{self.team_id}/member/m1@test.com")

        response = client.get(f"/api/team/{self.team_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert len(data["members"]) == 2  # Owner + 1 invited (removed excluded)

    def test_list_members_include_removed(self, client):
        """Test listing includes removed members when requested"""
        # Remove a member
        client.delete(f"/api/team/{self.team_id}/member/m1@test.com")

        response = client.get(
            f"/api/team/{self.team_id}/members", params={"include_removed": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["members"]) == 3  # All members including removed

    def test_list_members_team_not_found(self, client):
        """Test listing for non-existent team"""
        response = client.get("/api/team/invalid_id/members")
        assert response.status_code == 404


class TestSeatAvailability:
    """Test seat availability endpoint"""

    @pytest.fixture(autouse=True)
    def setup_team(self, client):
        """Create a test team before each test"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Test Team",
                "owner_email": "owner@test.com",
                "license_tier": "pro",
            },
        )
        self.team_id = response.json()["team"]["team_id"]

    def test_check_seats_success(self, client):
        """Test successful seat availability check"""
        response = client.get(f"/api/team/{self.team_id}/seats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["max_seats"] == 3
        assert data["active_members"] == 1
        assert data["available_seats"] == 2
        assert data["has_available_seats"] is True
        assert data["is_unlimited"] is False

    def test_check_seats_after_invites(self, client):
        """Test seat availability updates after invitations"""
        # Add members
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m1@test.com"})
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m2@test.com"})

        response = client.get(f"/api/team/{self.team_id}/seats")
        assert response.status_code == 200
        data = response.json()
        assert data["available_seats"] == 0  # 3 max - 1 owner - 2 invited = 0


    def test_check_seats_enterprise_unlimited(self, client):
        """Test enterprise tier shows unlimited seats"""
        response = client.post(
            "/api/team/create",
            json={
                "name": "Enterprise Team",
                "owner_email": "ent@test.com",
                "license_tier": "enterprise",
            },
        )
        team_id = response.json()["team"]["team_id"]

        response = client.get(f"/api/team/{team_id}/seats")
        assert response.status_code == 200
        data = response.json()
        assert data["max_seats"] == -1
        assert data["available_seats"] == -1
        assert data["has_available_seats"] is True
        assert data["is_unlimited"] is True

    def test_check_seats_team_not_found(self, client):
        """Test seat check for non-existent team"""
        response = client.get("/api/team/invalid_id/seats")
        assert response.status_code == 404


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self, client):
        """Test team service health check"""
        response = client.get("/api/team/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert data["service"] == "team-management"
        assert "endpoints" in data
