"""
🛡️ Role-Based Access Control (RBAC)
==================================
Defines system roles and provides dependencies for FastAPI permission enforcement.
"""

from enum import Enum
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# Import verification logic from existing auth module
from backend.api.auth.utils import TokenData, verify_token


class Role(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    DEVELOPER = "developer"
    VIEWER = "viewer"
    AGENT = "agent"

# Hierarchical permissions (Owner > Admin > Developer > Viewer)
ROLE_HIERARCHY = {
    Role.OWNER: [Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.VIEWER, Role.AGENT],
    Role.ADMIN: [Role.ADMIN, Role.DEVELOPER, Role.VIEWER, Role.AGENT],
    Role.DEVELOPER: [Role.DEVELOPER, Role.VIEWER, Role.AGENT],
    Role.VIEWER: [Role.VIEWER],
    Role.AGENT: [Role.AGENT],
}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """Validate token and return user data."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return await verify_token(token, credentials_exception)

class RoleChecker:
    """Dependency factory for role-based access checks."""

    def __init__(self, allowed_roles: List[Role]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: TokenData = Depends(get_current_user)):
        if not user.role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no assigned role"
            )

        user_role = Role(user.role)

        # Check if user role or any inherited role is in allowed_roles
        # This implementation uses simple inclusion for now
        if user_role not in self.allowed_roles:
            # Check hierarchy
            has_permission = False
            for allowed in self.allowed_roles:
                if allowed in ROLE_HIERARCHY.get(user_role, []):
                    has_permission = True
                    break

            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Operation not permitted for role: {user.role}"
                )

        return user

# Convenience dependencies
require_owner = RoleChecker([Role.OWNER])
require_admin = RoleChecker([Role.OWNER, Role.ADMIN])
require_developer = RoleChecker([Role.OWNER, Role.ADMIN, Role.DEVELOPER])
require_editor = require_developer
require_viewer = RoleChecker([Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.VIEWER])
require_agent = RoleChecker([Role.OWNER, Role.AGENT])

def require_role(role_name: str):
    """Factory to require a specific single role."""
    return RoleChecker([Role(role_name)])
