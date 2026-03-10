"""
RBAC System - Role-Based Access Control

Implements role hierarchy, permission checks, and route decorators for FastAPI.
"""

from enum import Enum
from functools import wraps
from typing import Set, Dict, Callable, Optional, Any

from fastapi import HTTPException, status, Request
from starlette.middleware.base import BaseHTTPMiddleware


class Role(str, Enum):
    """User roles in RBAC hierarchy."""

    VIEWER = "viewer"
    MEMBER = "member"
    ADMIN = "admin"
    OWNER = "owner"


class Permission(str, Enum):
    """Available permissions in the system."""

    # Read permissions
    VIEW_DASHBOARD = "view_dashboard"
    EXPORT_DATA = "export_data"
    VIEW_ANALYTICS = "view_analytics"

    # Write permissions
    CREATE_RESOURCES = "create_resources"
    UPDATE_RESOURCES = "update_resources"
    DELETE_RESOURCES = "delete_resources"

    # Management permissions
    MANAGE_USERS = "manage_users"
    MANAGE_SETTINGS = "manage_settings"
    MANAGE_LICENSES = "manage_licenses"

    # Billing permissions
    MANAGE_BILLING = "manage_billing"
    VIEW_BILLING = "view_billing"

    # Admin permissions
    ADMIN_ACCESS = "admin_access"
    SYSTEM_CONFIG = "system_config"


# Role hierarchy: higher roles inherit lower role permissions
ROLE_HIERARCHY: Dict[Role, Set[Role]] = {
    Role.OWNER: {Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER},
    Role.ADMIN: {Role.ADMIN, Role.MEMBER, Role.VIEWER},
    Role.MEMBER: {Role.MEMBER, Role.VIEWER},
    Role.VIEWER: {Role.VIEWER},
}

# Permission matrix: which roles have which permissions
ROLE_PERMISSIONS: Dict[Permission, Set[Role]] = {
    # Viewer permissions (read-only)
    Permission.VIEW_DASHBOARD: {Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER},
    Permission.VIEW_ANALYTICS: {Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER},
    Permission.EXPORT_DATA: {Role.OWNER, Role.ADMIN, Role.MEMBER},

    # Member permissions (create/update)
    Permission.CREATE_RESOURCES: {Role.OWNER, Role.ADMIN, Role.MEMBER},
    Permission.UPDATE_RESOURCES: {Role.OWNER, Role.ADMIN, Role.MEMBER},

    # Admin permissions
    Permission.DELETE_RESOURCES: {Role.OWNER, Role.ADMIN},
    Permission.MANAGE_USERS: {Role.OWNER, Role.ADMIN},
    Permission.MANAGE_SETTINGS: {Role.OWNER, Role.ADMIN},
    Permission.MANAGE_LICENSES: {Role.OWNER, Role.ADMIN},
    Permission.ADMIN_ACCESS: {Role.OWNER, Role.ADMIN},

    # Billing permissions (owner only)
    Permission.VIEW_BILLING: {Role.OWNER},
    Permission.MANAGE_BILLING: {Role.OWNER},

    # System permissions (owner only)
    Permission.SYSTEM_CONFIG: {Role.OWNER},
}

# Permission groups for convenient checking
PERMISSION_GROUPS: Dict[str, Set[Permission]] = {
    "read:*": {
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_ANALYTICS,
        Permission.EXPORT_DATA,
    },
    "write:*": {
        Permission.CREATE_RESOURCES,
        Permission.UPDATE_RESOURCES,
    },
    "delete:*": {
        Permission.DELETE_RESOURCES,
    },
    "manage:users": {
        Permission.MANAGE_USERS,
    },
    "manage:settings": {
        Permission.MANAGE_SETTINGS,
        Permission.SYSTEM_CONFIG,
    },
    "manage:licenses": {
        Permission.MANAGE_LICENSES,
    },
    "billing:*": {
        Permission.VIEW_BILLING,
        Permission.MANAGE_BILLING,
    },
    "admin:*": {
        Permission.ADMIN_ACCESS,
        Permission.MANAGE_USERS,
        Permission.MANAGE_SETTINGS,
    },
}


def get_roles_for_permission(permission: Permission) -> Set[Role]:
    """Get all roles that have a specific permission.

    Args:
        permission: Permission to check

    Returns:
        Set of roles that have this permission
    """
    return ROLE_PERMISSIONS.get(permission, set())


def role_gte(user_role: Role, required_role: Role) -> bool:
    """Check if user role is greater than or equal to required role.

    Args:
        user_role: User's current role
        required_role: Minimum required role

    Returns:
        True if user role meets or exceeds required role
    """
    return required_role in ROLE_HIERARCHY.get(user_role, set())


def has_permission(user_role: Role, permission: Permission) -> bool:
    """Check if user role has a specific permission.

    Args:
        user_role: User's current role
        permission: Permission to check

    Returns:
        True if user has permission
    """
    allowed_roles = ROLE_PERMISSIONS.get(permission, set())
    return user_role in allowed_roles


def require_role(*allowed_roles: Role):
    """Decorator to require minimum role level for route access.

    Usage:
        @app.get("/admin")
        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: Request):
            ...

    Args:
        *allowed_roles: One or more roles that are allowed access

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Find request in args or kwargs (supports both real Request and MagicMock)
            request = None
            for arg in args:
                if isinstance(arg, Request) or hasattr(arg, 'state'):
                    request = arg
                    break
            if request is None:
                request = kwargs.get("request")

            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request not found in route handler",
                )

            # Check if user is authenticated
            if not getattr(request.state, "authenticated", False):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get user role from request state
            user_role_str = getattr(request.state, "user_role", None)
            if not user_role_str:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User role not found",
                )

            try:
                user_role = Role(user_role_str)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Invalid user role: {user_role_str}",
                )

            # Check if user has allowed role
            if user_role not in allowed_roles:
                allowed_roles_str = ", ".join(r.value for r in allowed_roles)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Requires role: {allowed_roles_str}",
                )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(*permissions: Permission):
    """Decorator to require specific permissions for route access.

    Usage:
        @app.post("/users")
        @require_permission(Permission.MANAGE_USERS)
        async def create_user(request: Request):
            ...

    Args:
        *permissions: One or more permissions required

    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Find request in args or kwargs (supports both real Request and MagicMock)
            request = None
            for arg in args:
                if isinstance(arg, Request) or hasattr(arg, 'state'):
                    request = arg
                    break
            if request is None:
                request = kwargs.get("request")

            if request is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request not found in route handler",
                )

            # Check if user is authenticated
            if not getattr(request.state, "authenticated", False):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Get user role from request state
            user_role_str = getattr(request.state, "user_role", None)
            if not user_role_str:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User role not found",
                )

            try:
                user_role = Role(user_role_str)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Invalid user role: {user_role_str}",
                )

            # Check if user has ALL required permissions
            for permission in permissions:
                if not has_permission(user_role, permission):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Permission denied: {permission.value}",
                    )

            return await func(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """Extract current user info from request state.

    Usage:
        @app.get("/profile")
        async def get_profile(request: Request):
            user = get_current_user(request)
            return user

    Args:
        request: FastAPI Request object

    Returns:
        User info dict with id, email, role, or None if not authenticated
    """
    if not getattr(request.state, "authenticated", False):
        return None

    return {
        "id": getattr(request.state, "user_id", None),
        "email": getattr(request.state, "user_email", None),
        "role": getattr(request.state, "user_role", None),
    }


def check_access(user_role: Role, resource: Permission) -> bool:
    """Check if user role has access to a resource/permission.

    Usage:
        if check_access(user_role, Permission.MANAGE_USERS):
            # Grant access
        else:
            # Deny access

    Args:
        user_role: User's role
        resource: Permission/resource to check

    Returns:
        True if user has access
    """
    return has_permission(user_role, resource)


class RBACMiddleware(BaseHTTPMiddleware):
    """Middleware to attach user role to request state."""

    async def dispatch(self, request: Request, call_next):
        """Attach user role to request state for downstream handlers."""
        user = getattr(request.state, "user", None)

        if user and getattr(request.state, "authenticated", False):
            # Get user's role from user object or request context
            user_role = getattr(user, "role", None)

            if user_role:
                try:
                    # Ensure role is valid
                    Role(user_role)
                    request.state.user_role = user_role
                except ValueError:
                    # Invalid role, default to member
                    request.state.user_role = Role.MEMBER.value
            else:
                # No role specified, default to member
                request.state.user_role = Role.MEMBER.value

        response = await call_next(request)
        return response
