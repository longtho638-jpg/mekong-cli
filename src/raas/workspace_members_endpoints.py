"""Workspace Members API endpoints — CRUD operations for team management.

Provides REST API for managing workspace members:
- GET /api/workspaces/{id}/members - List all members
- POST /api/workspaces/{id}/members - Add member
- DELETE /api/workspaces/{id}/members/{email} - Remove member

Uses existing WorkspaceRepository for data operations.
"""
from __future__ import annotations

import logging
from typing import Literal, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from src.raas.workspace_repository import Workspace, WorkspaceRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/workspaces", tags=["workspace-members"])


# =============================================================================
# Request/Response Models
# =============================================================================

class MemberResponse(BaseModel):
    """Member information response."""
    user_email: str
    role: Literal["owner", "admin", "member"]
    joined_at: str


class AddMemberRequest(BaseModel):
    """Request to add a new member."""
    user_email: EmailStr
    role: Literal["owner", "admin", "member"] = "member"


class RemoveMemberResponse(BaseModel):
    """Response after removing a member."""
    success: bool
    message: str


class WorkspaceMembersResponse(BaseModel):
    """Wrapper for list response."""
    members: List[MemberResponse]
    total: int


# =============================================================================
# Dependency Injection
# =============================================================================

def get_workspace_repo() -> WorkspaceRepository:
    """Get workspace repository instance."""
    return WorkspaceRepository()


# =============================================================================
# Helper Functions
# =============================================================================

def _validate_workspace_exists(repo: WorkspaceRepository, workspace_id: str) -> Workspace:
    """Validate workspace exists, raise 404 if not."""
    workspace = repo.get_by_id(workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=404,
            detail=f"Workspace '{workspace_id}' not found"
        )
    return workspace


def _count_owners(repo: WorkspaceRepository, workspace_id: str) -> int:
    """Count number of owners in workspace."""
    members = repo.list_members(workspace_id)
    return sum(1 for m in members if m.role == "owner")


# =============================================================================
# API Endpoints
# =============================================================================

@router.get("/{workspace_id}/members", response_model=WorkspaceMembersResponse)
async def list_members(
    workspace_id: str,
    repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> WorkspaceMembersResponse:
    """List all members of a workspace.

    Args:
        workspace_id: The workspace identifier
        repo: Injected workspace repository

    Returns:
        List of members with email, role, and join date

    Raises:
        HTTPException 404: If workspace not found
    """
    # Validate workspace exists
    _validate_workspace_exists(repo, workspace_id)

    # Get members
    members = repo.list_members(workspace_id)

    # Convert to response format
    member_responses = [
        MemberResponse(
            user_email=m.user_email,
            role=m.role,  # type: ignore
            joined_at=m.joined_at,
        )
        for m in members
    ]

    return WorkspaceMembersResponse(
        members=member_responses,
        total=len(member_responses),
    )


@router.post("/{workspace_id}/members", response_model=MemberResponse)
async def add_member(
    workspace_id: str,
    request: AddMemberRequest,
    repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> MemberResponse:
    """Add a new member to a workspace.

    Args:
        workspace_id: The workspace identifier
        request: Add member request with email and role
        repo: Injected workspace repository

    Returns:
        Created member information

    Raises:
        HTTPException 404: If workspace not found
        HTTPException 409: If member already exists
    """
    # Validate workspace exists
    _validate_workspace_exists(repo, workspace_id)

    # Check if member already exists
    existing_members = repo.list_members(workspace_id)
    if any(m.user_email == request.user_email for m in existing_members):
        raise HTTPException(
            status_code=409,
            detail=f"User '{request.user_email}' is already a member"
        )

    # Add member
    success = repo.add_member(
        workspace_id=workspace_id,
        user_email=request.user_email,
        role=request.role,
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to add member"
        )

    # Get updated member list to find the new member
    members = repo.list_members(workspace_id)
    new_member = next(
        (m for m in members if m.user_email == request.user_email),
        None
    )

    if not new_member:
        raise HTTPException(
            status_code=500,
            detail="Member added but could not retrieve"
        )

    return MemberResponse(
        user_email=new_member.user_email,
        role=new_member.role,  # type: ignore
        joined_at=new_member.joined_at,
    )


@router.delete("/{workspace_id}/members/{user_email}", response_model=RemoveMemberResponse)
async def remove_member(
    workspace_id: str,
    user_email: str,
    repo: WorkspaceRepository = Depends(get_workspace_repo),
) -> RemoveMemberResponse:
    """Remove a member from a workspace.

    Args:
        workspace_id: The workspace identifier
        user_email: Email of the member to remove
        repo: Injected workspace repository

    Returns:
        Success status and message

    Raises:
        HTTPException 404: If workspace not found or member not found
        HTTPException 403: If attempting to remove the last owner
    """
    # Validate workspace exists
    workspace = _validate_workspace_exists(repo, workspace_id)

    # Check if member exists
    members = repo.list_members(workspace_id)
    member = next((m for m in members if m.user_email == user_email), None)
    if not member:
        raise HTTPException(
            status_code=404,
            detail=f"Member '{user_email}' not found in workspace"
        )

    # Check if this is the last owner
    if member.role == "owner":
        owner_count = _count_owners(repo, workspace_id)
        if owner_count <= 1:
            raise HTTPException(
                status_code=403,
                detail="Cannot remove the last owner. Transfer ownership first."
            )

    # Remove member
    success = repo.remove_member(
        workspace_id=workspace_id,
        user_email=user_email,
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to remove member"
        )

    return RemoveMemberResponse(
        success=True,
        message=f"Member '{user_email}' removed from workspace '{workspace.slug}'",
    )
