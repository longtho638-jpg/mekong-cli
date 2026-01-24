"""
Team Service - Manages team creation, member invites, and seat allocation

Handles team operations including:
- Team creation with owner and seat limits based on license tier
- Member invitations and removal
- Seat availability checking
- Team member listing
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class LicenseTier(str, Enum):
    """License tier definitions with seat limits"""
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    FRANCHISE = "franchise"
    ENTERPRISE = "enterprise"


# Tier to seat limit mapping
TIER_SEAT_LIMITS = {
    LicenseTier.FREE: 1,
    LicenseTier.STARTER: 1,
    LicenseTier.PRO: 3,
    LicenseTier.FRANCHISE: 10,
    LicenseTier.ENTERPRISE: -1,  # unlimited
}


class TeamMemberRole(str, Enum):
    """Team member roles"""
    OWNER = "owner"
    MEMBER = "member"


class TeamMemberStatus(str, Enum):
    """Team member invitation status"""
    ACTIVE = "active"
    INVITED = "invited"
    REMOVED = "removed"


class TeamMember:
    """Represents a team member"""

    def __init__(
        self,
        email: str,
        role: TeamMemberRole,
        status: TeamMemberStatus = TeamMemberStatus.ACTIVE,
        invited_at: Optional[datetime] = None,
        joined_at: Optional[datetime] = None,
    ):
        self.email = email
        self.role = role
        self.status = status
        self.invited_at = invited_at or datetime.now()
        self.joined_at = joined_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "email": self.email,
            "role": self.role.value,
            "status": self.status.value,
            "invited_at": self.invited_at.isoformat() if self.invited_at else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class Team:
    """Represents a team with members and seat limits"""

    def __init__(
        self,
        team_id: str,
        name: str,
        owner_email: str,
        license_tier: LicenseTier,
        created_at: Optional[datetime] = None,
    ):
        self.team_id = team_id
        self.name = name
        self.owner_email = owner_email
        self.license_tier = license_tier
        self.created_at = created_at or datetime.now()
        self.members: List[TeamMember] = []
        self.max_seats = TIER_SEAT_LIMITS[license_tier]

        # Add owner as first member
        self._add_owner()

    def _add_owner(self):
        """Add owner as the first team member"""
        owner = TeamMember(
            email=self.owner_email,
            role=TeamMemberRole.OWNER,
            status=TeamMemberStatus.ACTIVE,
            joined_at=self.created_at,
        )
        self.members.append(owner)

    def get_active_member_count(self) -> int:
        """Get count of active members (excluding invited/removed)"""
        return len([m for m in self.members if m.status == TeamMemberStatus.ACTIVE])

    def get_available_seats(self) -> int:
        """
        Get number of available seats
        Returns -1 for unlimited (enterprise)
        """
        if self.max_seats == -1:
            return -1
        return self.max_seats - self.get_active_member_count()

    def has_available_seats(self) -> bool:
        """Check if team has available seats"""
        if self.max_seats == -1:  # unlimited
            return True
        return self.get_available_seats() > 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "team_id": self.team_id,
            "name": self.name,
            "owner_email": self.owner_email,
            "license_tier": self.license_tier.value,
            "max_seats": self.max_seats,
            "active_members": self.get_active_member_count(),
            "available_seats": self.get_available_seats(),
            "created_at": self.created_at.isoformat(),
            "members": [m.to_dict() for m in self.members],
        }


class TeamService:
    """Service for managing teams and members"""

    def __init__(self):
        # In-memory storage (replace with database in production)
        self._teams: Dict[str, Team] = {}
        self._team_counter = 0

    def create_team(
        self,
        name: str,
        owner_email: str,
        license_tier: str,
    ) -> Dict[str, Any]:
        """
        Create a new team

        Args:
            name: Team name
            owner_email: Email of team owner
            license_tier: License tier (free, starter, pro, franchise, enterprise)

        Returns:
            Dict with team details and success status

        Raises:
            ValueError: If license tier is invalid
        """
        # Validate license tier
        try:
            tier = LicenseTier(license_tier.lower())
        except ValueError:
            raise ValueError(
                f"Invalid license tier: {license_tier}. "
                f"Must be one of: {', '.join([t.value for t in LicenseTier])}"
            )

        # Generate team ID
        self._team_counter += 1
        team_id = f"team_{self._team_counter:06d}"

        # Create team
        team = Team(
            team_id=team_id,
            name=name,
            owner_email=owner_email,
            license_tier=tier,
        )

        self._teams[team_id] = team

        return {
            "success": True,
            "team": team.to_dict(),
            "message": f"Team '{name}' created successfully",
        }

    def invite_member(
        self,
        team_id: str,
        email: str,
    ) -> Dict[str, Any]:
        """
        Invite a member to the team

        Args:
            team_id: Team ID
            email: Email of member to invite

        Returns:
            Dict with invitation details and success status

        Raises:
            ValueError: If team not found, no seats available, or member already exists
        """
        # Get team
        team = self._teams.get(team_id)
        if not team:
            raise ValueError(f"Team not found: {team_id}")

        # Check if member already exists
        existing = next((m for m in team.members if m.email == email), None)
        if existing:
            if existing.status == TeamMemberStatus.ACTIVE:
                raise ValueError(f"Member {email} is already active in the team")
            elif existing.status == TeamMemberStatus.INVITED:
                raise ValueError(f"Member {email} already has a pending invitation")
            # If removed, we can re-invite (handled below)

        # Check seat availability
        if not team.has_available_seats():
            return {
                "success": False,
                "message": f"No available seats. Team has {team.max_seats} seat(s) and {team.get_active_member_count()} active member(s)",
                "available_seats": 0,
            }

        # Create invitation
        if existing and existing.status == TeamMemberStatus.REMOVED:
            # Re-invite previously removed member
            existing.status = TeamMemberStatus.INVITED
            existing.invited_at = datetime.now()
            member = existing
        else:
            # New invitation
            member = TeamMember(
                email=email,
                role=TeamMemberRole.MEMBER,
                status=TeamMemberStatus.INVITED,
            )
            team.members.append(member)

        return {
            "success": True,
            "member": member.to_dict(),
            "message": f"Invitation sent to {email}",
            "available_seats": team.get_available_seats(),
        }

    def remove_member(
        self,
        team_id: str,
        email: str,
    ) -> Dict[str, Any]:
        """
        Remove a member from the team

        Args:
            team_id: Team ID
            email: Email of member to remove

        Returns:
            Dict with removal details and success status

        Raises:
            ValueError: If team not found, member not found, or trying to remove owner
        """
        # Get team
        team = self._teams.get(team_id)
        if not team:
            raise ValueError(f"Team not found: {team_id}")

        # Find member
        member = next((m for m in team.members if m.email == email), None)
        if not member:
            raise ValueError(f"Member not found: {email}")

        # Cannot remove owner
        if member.role == TeamMemberRole.OWNER:
            raise ValueError("Cannot remove team owner")

        # Cannot remove already removed member
        if member.status == TeamMemberStatus.REMOVED:
            raise ValueError(f"Member {email} is already removed")

        # Mark as removed
        member.status = TeamMemberStatus.REMOVED

        return {
            "success": True,
            "message": f"Member {email} removed from team",
            "available_seats": team.get_available_seats(),
        }

    def list_members(
        self,
        team_id: str,
        include_removed: bool = False,
    ) -> Dict[str, Any]:
        """
        List team members

        Args:
            team_id: Team ID
            include_removed: Whether to include removed members

        Returns:
            Dict with member list and team info

        Raises:
            ValueError: If team not found
        """
        # Get team
        team = self._teams.get(team_id)
        if not team:
            raise ValueError(f"Team not found: {team_id}")

        # Filter members
        members = team.members
        if not include_removed:
            members = [m for m in members if m.status != TeamMemberStatus.REMOVED]

        return {
            "success": True,
            "team_id": team_id,
            "team_name": team.name,
            "license_tier": team.license_tier.value,
            "max_seats": team.max_seats,
            "active_members": team.get_active_member_count(),
            "available_seats": team.get_available_seats(),
            "members": [m.to_dict() for m in members],
        }

    def check_seat_availability(
        self,
        team_id: str,
    ) -> Dict[str, Any]:
        """
        Check seat availability for a team

        Args:
            team_id: Team ID

        Returns:
            Dict with seat availability info

        Raises:
            ValueError: If team not found
        """
        # Get team
        team = self._teams.get(team_id)
        if not team:
            raise ValueError(f"Team not found: {team_id}")

        available = team.get_available_seats()

        return {
            "success": True,
            "team_id": team_id,
            "license_tier": team.license_tier.value,
            "max_seats": team.max_seats,
            "active_members": team.get_active_member_count(),
            "available_seats": available,
            "has_available_seats": team.has_available_seats(),
            "is_unlimited": team.max_seats == -1,
        }

    def get_team(self, team_id: str) -> Optional[Dict[str, Any]]:
        """
        Get team details

        Args:
            team_id: Team ID

        Returns:
            Team dict or None if not found
        """
        team = self._teams.get(team_id)
        if not team:
            return None
        return team.to_dict()


# Global service instance
team_service = TeamService()
