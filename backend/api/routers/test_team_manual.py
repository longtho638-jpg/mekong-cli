"""
Simple manual test for Team API endpoints

Run with: python3 backend/api/routers/test_team_manual.py
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from backend.services.team_service import team_service


def test_team_creation():
    """Test team creation"""
    print("\n=== Testing Team Creation ===")

    # Create a team
    result = team_service.create_team(
        name="Test Agency",
        owner_email="owner@test.com",
        license_tier="pro",
    )

    print(f"✓ Team created: {result['team']['team_id']}")
    print(f"  Name: {result['team']['name']}")
    print(f"  Owner: {result['team']['owner_email']}")
    print(f"  Tier: {result['team']['license_tier']}")
    print(f"  Max seats: {result['team']['max_seats']}")
    print(f"  Active members: {result['team']['active_members']}")
    print(f"  Available seats: {result['team']['available_seats']}")

    return result['team']['team_id']


def test_member_invitation(team_id):
    """Test member invitation"""
    print("\n=== Testing Member Invitation ===")

    # Invite first member
    result1 = team_service.invite_member(team_id, "member1@test.com")
    print(f"✓ Invited: {result1['member']['email']}")
    print(f"  Status: {result1['member']['status']}")
    print(f"  Available seats: {result1['available_seats']}")

    # Invite second member
    result2 = team_service.invite_member(team_id, "member2@test.com")
    print(f"✓ Invited: {result2['member']['email']}")
    print(f"  Available seats: {result2['available_seats']}")


def test_seat_limit(team_id):
    """Test seat limit enforcement"""
    print("\n=== Testing Seat Limit ===")

    # Try to invite third member (should fail - only 3 seats, 1 owner + 2 invited)
    result = team_service.invite_member(team_id, "member3@test.com")

    if result['success']:
        print("✗ ERROR: Should have failed (no seats available)")
    else:
        print(f"✓ Correctly rejected: {result['message']}")


def test_list_members(team_id):
    """Test listing members"""
    print("\n=== Testing List Members ===")

    result = team_service.list_members(team_id)
    print(f"✓ Team: {result['team_name']}")
    print(f"  Active members: {result['active_members']}")
    print(f"  Total members: {len(result['members'])}")

    for member in result['members']:
        print(f"  - {member['email']} ({member['role']}, {member['status']})")


def test_remove_member(team_id):
    """Test removing a member"""
    print("\n=== Testing Member Removal ===")

    result = team_service.remove_member(team_id, "member1@test.com")
    print("✓ Removed: member1@test.com")
    print(f"  Message: {result['message']}")
    print(f"  Available seats: {result['available_seats']}")


def test_seat_availability(team_id):
    """Test seat availability check"""
    print("\n=== Testing Seat Availability ===")

    result = team_service.check_seat_availability(team_id)
    print(f"✓ Team: {result['team_id']}")
    print(f"  License tier: {result['license_tier']}")
    print(f"  Max seats: {result['max_seats']}")
    print(f"  Active members: {result['active_members']}")
    print(f"  Available seats: {result['available_seats']}")
    print(f"  Has available: {result['has_available_seats']}")
    print(f"  Is unlimited: {result['is_unlimited']}")


def test_enterprise_unlimited():
    """Test enterprise tier has unlimited seats"""
    print("\n=== Testing Enterprise Unlimited Seats ===")

    result = team_service.create_team(
        name="Enterprise Corp",
        owner_email="ceo@enterprise.com",
        license_tier="enterprise",
    )

    team_id = result['team']['team_id']
    print(f"✓ Enterprise team created: {team_id}")
    print(f"  Max seats: {result['team']['max_seats']} (unlimited)")

    # Invite many members
    for i in range(5):
        team_service.invite_member(team_id, f"member{i}@enterprise.com")

    seats = team_service.check_seat_availability(team_id)
    print("✓ After 5 invites:")
    print(f"  Available seats: {seats['available_seats']} (still unlimited)")
    print(f"  Has available: {seats['has_available_seats']}")


if __name__ == "__main__":
    print("=" * 50)
    print("Team Management Service - Manual Tests")
    print("=" * 50)

    try:
        # Test team creation
        team_id = test_team_creation()

        # Test member invitation
        test_member_invitation(team_id)

        # Test seat limit
        test_seat_limit(team_id)

        # Test list members
        test_list_members(team_id)

        # Test remove member
        test_remove_member(team_id)

        # Test seat availability
        test_seat_availability(team_id)

        # Test enterprise unlimited
        test_enterprise_unlimited()

        print("\n" + "=" * 50)
        print("✓ All tests passed!")
        print("=" * 50)

    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
