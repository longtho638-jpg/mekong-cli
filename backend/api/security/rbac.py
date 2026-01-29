from typing import List

from fastapi import Depends, HTTPException, status

from backend.api.auth.dependencies import get_current_user
from backend.api.auth.utils import TokenData


class RoleChecker:
    """
    RBAC Dependency for FastAPI.
    """

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: TokenData = Depends(get_current_user)):
        if not user.role:
            # Fallback logic if role is missing (should not happen with valid tokens)
            user_role = "user"
        else:
            user_role = user.role

        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted"
            )
        return True


# Pre-defined role checkers
require_owner = RoleChecker(["owner"])
require_admin = RoleChecker(["owner", "admin"])
require_developer = RoleChecker(["owner", "admin", "developer"])
require_operator = RoleChecker(["owner", "admin", "operator"])
require_viewer = RoleChecker(["owner", "admin", "developer", "operator", "viewer"])
