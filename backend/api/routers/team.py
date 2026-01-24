"""
Team Management API Router

Provides endpoints for team creation, member management, and seat allocation.
Supports multi-seat licensing with tier-based limits.
"""

import os
import sys
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Ensure backend is reachable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import team service
from backend.services.team_service import team_service

router = APIRouter(prefix="/api/team", tags=["Team Management"])


# Request/Response Models

class TeamCreateRequest(BaseModel):
    """Request model for creating a team."""
    name: str = Field(..., description="Team name", min_length=1, max_length=100)
    owner_email: str = Field(..., description="Email of team owner")
    license_tier: str = Field(..., description="License tier (free, starter, pro, franchise, enterprise)")


class TeamCreateResponse(BaseModel):
    """Response model for team creation."""
    success: bool = Field(..., description="Whether team creation was successful")
    team: dict = Field(..., description="Team details")
    message: str = Field(..., description="Creation message")


class MemberInviteRequest(BaseModel):
    """Request model for inviting a team member."""
    email: str = Field(..., description="Email of member to invite")


class MemberInviteResponse(BaseModel):
    """Response model for member invitation."""
    success: bool = Field(..., description="Whether invitation was successful")
    member: Optional[dict] = Field(None, description="Member details if successful")
    message: str = Field(..., description="Invitation message")
    available_seats: int = Field(..., description="Remaining available seats")


class MemberRemoveResponse(BaseModel):
    """Response model for member removal."""
    success: bool = Field(..., description="Whether removal was successful")
    message: str = Field(..., description="Removal message")
    available_seats: int = Field(..., description="Remaining available seats")


class MemberListResponse(BaseModel):
    """Response model for listing team members."""
    success: bool = Field(..., description="Whether operation was successful")
    team_id: str = Field(..., description="Team ID")
    team_name: str = Field(..., description="Team name")
    license_tier: str = Field(..., description="License tier")
    max_seats: int = Field(..., description="Maximum seats (-1 for unlimited)")
    active_members: int = Field(..., description="Number of active members")
    available_seats: int = Field(..., description="Available seats")
    members: list = Field(..., description="List of team members")


class SeatAvailabilityResponse(BaseModel):
    """Response model for seat availability check."""
    success: bool = Field(..., description="Whether operation was successful")
    team_id: str = Field(..., description="Team ID")
    license_tier: str = Field(..., description="License tier")
    max_seats: int = Field(..., description="Maximum seats (-1 for unlimited)")
    active_members: int = Field(..., description="Number of active members")
    available_seats: int = Field(..., description="Available seats")
    has_available_seats: bool = Field(..., description="Whether seats are available")
    is_unlimited: bool = Field(..., description="Whether seats are unlimited (enterprise)")


# Endpoints

@router.post("/create", response_model=TeamCreateResponse)
async def create_team(request: TeamCreateRequest):
    """
    Create a new team with owner and seat limits based on license tier.

    Args:
        request: Team creation request with name, owner email, and tier

    Returns:
        Team creation response with team details

    Raises:
        HTTPException: If license tier is invalid
    """
    try:
        result = team_service.create_team(
            name=request.name,
            owner_email=request.owner_email,
            license_tier=request.license_tier,
        )
        return TeamCreateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{team_id}/invite", response_model=MemberInviteResponse)
async def invite_member(team_id: str, request: MemberInviteRequest):
    """
    Invite a member to the team.

    Args:
        team_id: Team ID
        request: Invitation request with member email

    Returns:
        Invitation response with member details and seat availability

    Raises:
        HTTPException: If team not found, no seats available, or member already exists
    """
    try:
        result = team_service.invite_member(
            team_id=team_id,
            email=request.email,
        )
        return MemberInviteResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{team_id}/member/{email}", response_model=MemberRemoveResponse)
async def remove_member(team_id: str, email: str):
    """
    Remove a member from the team.

    Args:
        team_id: Team ID
        email: Email of member to remove

    Returns:
        Removal response with updated seat availability

    Raises:
        HTTPException: If team not found, member not found, or trying to remove owner
    """
    try:
        result = team_service.remove_member(
            team_id=team_id,
            email=email,
        )
        return MemberRemoveResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{team_id}/members", response_model=MemberListResponse)
async def list_members(team_id: str, include_removed: bool = False):
    """
    List all team members.

    Args:
        team_id: Team ID
        include_removed: Whether to include removed members (default: False)

    Returns:
        Member list response with team info and members

    Raises:
        HTTPException: If team not found
    """
    try:
        result = team_service.list_members(
            team_id=team_id,
            include_removed=include_removed,
        )
        return MemberListResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{team_id}/seats", response_model=SeatAvailabilityResponse)
async def check_seat_availability(team_id: str):
    """
    Check seat availability for a team.

    Args:
        team_id: Team ID

    Returns:
        Seat availability response with capacity details

    Raises:
        HTTPException: If team not found
    """
    try:
        result = team_service.check_seat_availability(team_id=team_id)
        return SeatAvailabilityResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the team service.

    Returns:
        Service status information
    """
    return {
        "status": "operational",
        "service": "team-management",
        "endpoints": {
            "create": "POST /api/team/create",
            "invite": "POST /api/team/{team_id}/invite",
            "remove": "DELETE /api/team/{team_id}/member/{email}",
            "list_members": "GET /api/team/{team_id}/members",
            "check_seats": "GET /api/team/{team_id}/seats",
        },
    }
