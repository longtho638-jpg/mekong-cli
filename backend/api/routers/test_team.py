"""
Tests for Team Management API endpoints

Tests team creation, member invitations, removals, and seat management.
"""

import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)


class TestTeamCreation:
    """Test team creation endpoint"""

    def test_create_team_success(self):
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
        return data["team"]["team_id"]

    def test_create_team_invalid_tier(self):
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

    def test_create_team_enterprise_unlimited_seats(self):
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

    def setup_method(self):
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

    def test_invite_member_success(self):
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
        assert data["available_seats"] == 2  # 3 max - 1 owner = 2

    def test_invite_multiple_members(self):
        """Test inviting multiple members within seat limit"""
        # First invite
        response1 = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member1@test.com"},
        )
        assert response1.status_code == 200
        assert response1.json()["available_seats"] == 2

        # Second invite
        response2 = client.post(
            f"/api/team/{self.team_id}/invite",
            json={"email": "member2@test.com"},
        )
        assert response2.status_code == 200
        assert response2.json()["available_seats"] == 1

    def test_invite_exceeds_seat_limit(self):
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

    def test_invite_duplicate_member(self):
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

    def test_invite_team_not_found(self):
        """Test invitation to non-existent team"""
        response = client.post(
            "/api/team/invalid_id/invite",
            json={"email": "member@test.com"},
        )
        assert response.status_code == 400


class TestMemberRemoval:
    """Test member removal endpoint"""

    def setup_method(self):
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

    def test_remove_member_success(self):
        """Test successful member removal"""
        response = client.delete(f"/api/team/{self.team_id}/member/member@test.com")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "removed from team" in data["message"]
        assert data["available_seats"] == 2

    def test_remove_owner_fails(self):
        """Test cannot remove team owner"""
        response = client.delete(f"/api/team/{self.team_id}/member/owner@test.com")
        assert response.status_code == 400
        assert "Cannot remove team owner" in response.json()["detail"]

    def test_remove_nonexistent_member(self):
        """Test removing member that doesn't exist"""
        response = client.delete(f"/api/team/{self.team_id}/member/nobody@test.com")
        assert response.status_code == 400
        assert "Member not found" in response.json()["detail"]

    def test_remove_already_removed_member(self):
        """Test cannot remove already removed member"""
        # Remove member
        client.delete(f"/api/team/{self.team_id}/member/member@test.com")

        # Try to remove again
        response = client.delete(f"/api/team/{self.team_id}/member/member@test.com")
        assert response.status_code == 400
        assert "already removed" in response.json()["detail"]


class TestMemberListing:
    """Test member listing endpoint"""

    def setup_method(self):
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

    def test_list_members_success(self):
        """Test successful member listing"""
        response = client.get(f"/api/team/{self.team_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["team_id"] == self.team_id
        assert data["max_seats"] == 3
        assert data["active_members"] == 1  # Only owner is active
        assert len(data["members"]) == 3  # Owner + 2 invited

    def test_list_members_exclude_removed(self):
        """Test listing excludes removed members by default"""
        # Remove a member
        client.delete(f"/api/team/{self.team_id}/member/m1@test.com")

        response = client.get(f"/api/team/{self.team_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert len(data["members"]) == 2  # Owner + 1 invited (removed excluded)

    def test_list_members_include_removed(self):
        """Test listing includes removed members when requested"""
        # Remove a member
        client.delete(f"/api/team/{self.team_id}/member/m1@test.com")

        response = client.get(
            f"/api/team/{self.team_id}/members", params={"include_removed": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["members"]) == 3  # All members including removed

    def test_list_members_team_not_found(self):
        """Test listing for non-existent team"""
        response = client.get("/api/team/invalid_id/members")
        assert response.status_code == 404


class TestSeatAvailability:
    """Test seat availability endpoint"""

    def setup_method(self):
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

    def test_check_seats_success(self):
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

    def test_check_seats_after_invites(self):
        """Test seat availability updates after invitations"""
        # Add members
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m1@test.com"})
        client.post(f"/api/team/{self.team_id}/invite", json={"email": "m2@test.com"})

        response = client.get(f"/api/team/{self.team_id}/seats")
        assert response.status_code == 200
        data = response.json()
        assert data["available_seats"] == 1  # 3 max - 1 owner - 2 invited = 0 (invited don't count as active)

    def test_check_seats_enterprise_unlimited(self):
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

    def test_check_seats_team_not_found(self):
        """Test seat check for non-existent team"""
        response = client.get("/api/team/invalid_id/seats")
        assert response.status_code == 404


class TestHealthCheck:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test team service health check"""
        response = client.get("/api/team/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert data["service"] == "team-management"
        assert "endpoints" in data
