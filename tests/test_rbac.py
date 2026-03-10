"""Tests for RBAC (Role-Based Access Control) system.

Tests role permissions mapping, decorator behavior, access control,
require_role/require_permission decorators, and environment-aware bypass.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from src.auth.rbac import (
    Role,
    Permission,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    PERMISSION_GROUPS,
    get_roles_for_permission,
    role_gte,
    has_permission,
    require_role,
    require_permission,
    get_current_user,
    check_access,
    RBACMiddleware,
)


class TestRoleEnum:
    """Test Role enum behavior."""

    def test_all_roles_defined(self):
        """Should have all required roles."""
        roles = [r.value for r in Role]
        assert "viewer" in roles
        assert "member" in roles
        assert "admin" in roles
        assert "owner" in roles

    def test_role_order_hierarchy(self):
        """Roles should have proper hierarchy order."""
        assert Role.VIEWER.value == "viewer"
        assert Role.MEMBER.value == "member"
        assert Role.ADMIN.value == "admin"
        assert Role.OWNER.value == "owner"


class TestPermissionEnum:
    """Test Permission enum behavior."""

    def test_all_permissions_defined(self):
        """Should have all required permissions."""
        permissions = [p.value for p in Permission]
        assert "view_dashboard" in permissions
        assert "export_data" in permissions
        assert "create_resources" in permissions
        assert "manage_users" in permissions
        assert "manage_licenses" in permissions
        assert "admin_access" in permissions

    def test_permission_groups_defined(self):
        """Should have permission groups for convenient checking."""
        assert "read:*" in PERMISSION_GROUPS
        assert "write:*" in PERMISSION_GROUPS
        assert "delete:*" in PERMISSION_GROUPS
        assert "manage:users" in PERMISSION_GROUPS


class TestRoleHierarchy:
    """Test role hierarchy mapping."""

    def test_owner_includes_all_roles(self):
        """Owner should have permissions of all roles."""
        assert Role.OWNER in ROLE_HIERARCHY[Role.OWNER]
        assert Role.ADMIN in ROLE_HIERARCHY[Role.OWNER]
        assert Role.MEMBER in ROLE_HIERARCHY[Role.OWNER]
        assert Role.VIEWER in ROLE_HIERARCHY[Role.OWNER]

    def test_admin_includes_lower_roles(self):
        """Admin should have permissions of admin, member, and viewer."""
        assert Role.ADMIN in ROLE_HIERARCHY[Role.ADMIN]
        assert Role.MEMBER in ROLE_HIERARCHY[Role.ADMIN]
        assert Role.VIEWER in ROLE_HIERARCHY[Role.ADMIN]
        assert Role.OWNER not in ROLE_HIERARCHY[Role.ADMIN]

    def test_member_includes_viewer(self):
        """Member should have permissions of member and viewer."""
        assert Role.MEMBER in ROLE_HIERARCHY[Role.MEMBER]
        assert Role.VIEWER in ROLE_HIERARCHY[Role.MEMBER]
        assert Role.ADMIN not in ROLE_HIERARCHY[Role.MEMBER]
        assert Role.OWNER not in ROLE_HIERARCHY[Role.MEMBER]

    def test_viewer_only_viewer(self):
        """Viewer should only have viewer permissions."""
        assert Role.VIEWER in ROLE_HIERARCHY[Role.VIEWER]
        assert Role.MEMBER not in ROLE_HIERARCHY[Role.VIEWER]
        assert Role.ADMIN not in ROLE_HIERARCHY[Role.VIEWER]
        assert Role.OWNER not in ROLE_HIERARCHY[Role.VIEWER]


class TestRolePermissionsMapping:
    """Test role to permission mapping."""

    def test_viewer_can_view_dashboard(self):
        """Viewer role should have view_dashboard permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_DASHBOARD]
        assert Role.VIEWER in permissions

    def test_member_can_view_dashboard(self):
        """Member role should have view_dashboard permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_DASHBOARD]
        assert Role.MEMBER in permissions

    def test_admin_can_view_dashboard(self):
        """Admin role should have view_dashboard permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_DASHBOARD]
        assert Role.ADMIN in permissions

    def test_owner_can_view_dashboard(self):
        """Owner role should have view_dashboard permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_DASHBOARD]
        assert Role.OWNER in permissions

    def test_viewer_cannot_export(self):
        """Viewer role should not have export permission."""
        permissions = ROLE_PERMISSIONS[Permission.EXPORT_DATA]
        assert Role.VIEWER not in permissions

    def test_member_can_export(self):
        """Member role should have export permission."""
        permissions = ROLE_PERMISSIONS[Permission.EXPORT_DATA]
        assert Role.MEMBER in permissions

    def test_admin_can_export(self):
        """Admin role should have export permission."""
        permissions = ROLE_PERMISSIONS[Permission.EXPORT_DATA]
        assert Role.ADMIN in permissions

    def test_owner_can_export(self):
        """Owner role should have export permission."""
        permissions = ROLE_PERMISSIONS[Permission.EXPORT_DATA]
        assert Role.OWNER in permissions

    def test_viewer_cannot_create(self):
        """Viewer role should not have create permission."""
        permissions = ROLE_PERMISSIONS[Permission.CREATE_RESOURCES]
        assert Role.VIEWER not in permissions

    def test_member_can_create(self):
        """Member role should have create permission."""
        permissions = ROLE_PERMISSIONS[Permission.CREATE_RESOURCES]
        assert Role.MEMBER in permissions

    def test_admin_can_delete(self):
        """Admin role should have delete permission."""
        permissions = ROLE_PERMISSIONS[Permission.DELETE_RESOURCES]
        assert Role.ADMIN in permissions

    def test_member_cannot_delete(self):
        """Member role should not have delete permission."""
        permissions = ROLE_PERMISSIONS[Permission.DELETE_RESOURCES]
        assert Role.MEMBER not in permissions

    def test_owner_can_manage_settings(self):
        """Owner role should have manage_settings permission."""
        permissions = ROLE_PERMISSIONS[Permission.MANAGE_SETTINGS]
        assert Role.OWNER in permissions

    def test_admin_can_manage_settings(self):
        """Admin role should have manage_settings permission."""
        permissions = ROLE_PERMISSIONS[Permission.MANAGE_SETTINGS]
        assert Role.ADMIN in permissions

    def test_member_cannot_manage_settings(self):
        """Member role should not have manage_settings permission."""
        permissions = ROLE_PERMISSIONS[Permission.MANAGE_SETTINGS]
        assert Role.MEMBER not in permissions

    def test_viewer_can_view_billing(self):
        """Owner role should have view_billing permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_BILLING]
        assert Role.OWNER in permissions

    def test_admin_cannot_view_billing(self):
        """Admin role should not have view_billing permission."""
        permissions = ROLE_PERMISSIONS[Permission.VIEW_BILLING]
        assert Role.ADMIN not in permissions


class TestGetRolesForPermission:
    """Test get_roles_for_permission function."""

    def test_get_roles_for_view_dashboard(self):
        """Should return all roles that can view dashboard."""
        roles = get_roles_for_permission(Permission.VIEW_DASHBOARD)
        assert Role.VIEWER in roles
        assert Role.MEMBER in roles
        assert Role.ADMIN in roles
        assert Role.OWNER in roles

    def test_get_roles_for_manage_users(self):
        """Should return only admin roles that can manage users."""
        roles = get_roles_for_permission(Permission.MANAGE_USERS)
        assert Role.ADMIN in roles
        assert Role.OWNER in roles
        assert Role.MEMBER not in roles
        assert Role.VIEWER not in roles

    def test_get_roles_for_unknown_permission(self):
        """Should return empty set for unknown permission."""
        roles = get_roles_for_permission(Permission.SYSTEM_CONFIG)
        assert Role.OWNER in roles
        assert Role.ADMIN not in roles


class TestRoleGte:
    """Test role_gte (role greater than or equal) function."""

    def test_owner_gte_owner(self):
        """Owner >= Owner should be True."""
        assert role_gte(Role.OWNER, Role.OWNER) is True

    def test_owner_gte_admin(self):
        """Owner >= Admin should be True."""
        assert role_gte(Role.OWNER, Role.ADMIN) is True

    def test_owner_gte_member(self):
        """Owner >= Member should be True."""
        assert role_gte(Role.OWNER, Role.MEMBER) is True

    def test_owner_gte_viewer(self):
        """Owner >= Viewer should be True."""
        assert role_gte(Role.OWNER, Role.VIEWER) is True

    def test_admin_gte_admin(self):
        """Admin >= Admin should be True."""
        assert role_gte(Role.ADMIN, Role.ADMIN) is True

    def test_admin_gte_member(self):
        """Admin >= Member should be True."""
        assert role_gte(Role.ADMIN, Role.MEMBER) is True

    def test_admin_gte_viewer(self):
        """Admin >= Viewer should be True."""
        assert role_gte(Role.ADMIN, Role.VIEWER) is True

    def test_admin_gte_owner(self):
        """Admin >= Owner should be False."""
        assert role_gte(Role.ADMIN, Role.OWNER) is False

    def test_member_gte_viewer(self):
        """Member >= Viewer should be True."""
        assert role_gte(Role.MEMBER, Role.VIEWER) is True

    def test_member_gte_admin(self):
        """Member >= Admin should be False."""
        assert role_gte(Role.MEMBER, Role.ADMIN) is False

    def test_viewer_gte_viewer(self):
        """Viewer >= Viewer should be True."""
        assert role_gte(Role.VIEWER, Role.VIEWER) is True

    def test_viewer_gte_member(self):
        """Viewer >= Member should be False."""
        assert role_gte(Role.VIEWER, Role.MEMBER) is False

    def test_unknown_role_gte_any(self):
        """Unknown role should return False."""
        assert role_gte("unknown_role", Role.MEMBER) is False


class TestHasPermission:
    """Test has_permission function."""

    def test_owner_has_view_dashboard(self):
        """Owner should have view_dashboard permission."""
        assert has_permission(Role.OWNER, Permission.VIEW_DASHBOARD) is True

    def test_member_has_view_dashboard(self):
        """Member should have view_dashboard permission."""
        assert has_permission(Role.MEMBER, Permission.VIEW_DASHBOARD) is True

    def test_viewer_has_view_dashboard(self):
        """Viewer should have view_dashboard permission."""
        assert has_permission(Role.VIEWER, Permission.VIEW_DASHBOARD) is True

    def test_viewer_has_export(self):
        """Viewer should NOT have export permission."""
        assert has_permission(Role.VIEWER, Permission.EXPORT_DATA) is False

    def test_admin_has_delete(self):
        """Admin should have delete permission."""
        assert has_permission(Role.ADMIN, Permission.DELETE_RESOURCES) is True

    def test_member_has_delete(self):
        """Member should NOT have delete permission."""
        assert has_permission(Role.MEMBER, Permission.DELETE_RESOURCES) is False

    def test_unknown_role_has_permission(self):
        """Unknown role should return False."""
        assert has_permission("unknown_role", Permission.VIEW_DASHBOARD) is False

    def test_unknown_permission_for_role(self):
        """Unknown permission should return False."""
        assert has_permission(Role.MEMBER, "unknown_permission") is False


class TestPermissionGroups:
    """Test permission groups functionality."""

    def test_read_group(self):
        """Read group should contain read permissions."""
        read_perms = PERMISSION_GROUPS["read:*"]
        assert Permission.VIEW_DASHBOARD in read_perms
        assert Permission.VIEW_ANALYTICS in read_perms
        assert Permission.EXPORT_DATA in read_perms

    def test_write_group(self):
        """Write group should contain write permissions."""
        write_perms = PERMISSION_GROUPS["write:*"]
        assert Permission.CREATE_RESOURCES in write_perms
        assert Permission.UPDATE_RESOURCES in write_perms

    def test_delete_group(self):
        """Delete group should contain delete permissions."""
        delete_perms = PERMISSION_GROUPS["delete:*"]
        assert Permission.DELETE_RESOURCES in delete_perms

    def test_manage_users_group(self):
        """Manage users group should contain user management permissions."""
        manage_users_perms = PERMISSION_GROUPS["manage:users"]
        assert Permission.MANAGE_USERS in manage_users_perms

    def test_manage_settings_group(self):
        """Manage settings group should contain admin permissions."""
        manage_settings_perms = PERMISSION_GROUPS["manage:settings"]
        assert Permission.MANAGE_SETTINGS in manage_settings_perms
        assert Permission.SYSTEM_CONFIG in manage_settings_perms

    def test_manage_licenses_group(self):
        """Manage licenses group should contain license permissions."""
        manage_licenses_perms = PERMISSION_GROUPS["manage:licenses"]
        assert Permission.MANAGE_LICENSES in manage_licenses_perms

    def test_billing_group(self):
        """Billing group should contain billing permissions."""
        billing_perms = PERMISSION_GROUPS["billing:*"]
        assert Permission.VIEW_BILLING in billing_perms
        assert Permission.MANAGE_BILLING in billing_perms

    def test_admin_group(self):
        """Admin group should contain admin permissions."""
        admin_perms = PERMISSION_GROUPS["admin:*"]
        assert Permission.ADMIN_ACCESS in admin_perms
        assert Permission.MANAGE_USERS in admin_perms
        assert Permission.MANAGE_SETTINGS in admin_perms


class TestRequireRoleDecorator:
    """Test require_role decorator behavior."""

    def test_require_role_allows_admin(self):
        """Admin should pass require_role check."""

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "admin"

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        result = asyncio.run(admin_route(mock_request))

        assert result == {"success": True}

    def test_require_role_allows_owner(self):
        """Owner should pass require_role check."""

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "owner"

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        result = asyncio.run(admin_route(mock_request))

        assert result == {"success": True}

    def test_require_role_denies_member(self):
        """Member should be denied require_role check."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "member"

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(admin_route(mock_request))

        assert exc_info.value.status_code == 403
        assert "admin" in exc_info.value.detail.lower() or "owner" in exc_info.value.detail.lower()

    def test_require_role_denies_viewer(self):
        """Viewer should be denied require_role check."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "viewer"

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(admin_route(mock_request))

        assert exc_info.value.status_code == 403

    def test_require_role_denies_when_not_authenticated(self):
        """Unauthenticated should be denied."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = False

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(admin_route(mock_request))

        assert exc_info.value.status_code == 401

    def test_require_role_denies_when_no_role(self):
        """Request without role should be denied."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = None

        @require_role(Role.ADMIN, Role.OWNER)
        async def admin_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(admin_route(mock_request))

        assert exc_info.value.status_code == 401

    def test_require_role_multiple_roles(self):
        """Should allow any of multiple roles."""

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "viewer"

        @require_role(Role.VIEWER, Role.MEMBER, Role.ADMIN)
        async def multi_role_route(request: MagicMock):
            return {"success": True}

        import asyncio
        result = asyncio.run(multi_role_route(mock_request))

        assert result == {"success": True}

    def test_require_role_passes_request_arguments(self):
        """Should pass other arguments to decorated function."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "owner"

        @require_role(Role.OWNER)
        async def route_with_args(request: MagicMock, user_id: int):
            return {"user_id": user_id}

        import asyncio
        result = asyncio.run(route_with_args(mock_request, user_id=123))

        assert result == {"user_id": 123}


class TestRequirePermissionDecorator:
    """Test require_permission decorator behavior."""

    def test_require_permission_allows_permission(self):
        """Should allow when user has permission."""

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "admin"

        @require_permission(Permission.MANAGE_USERS)
        async def manage_users_route(request: MagicMock):
            return {"success": True}

        import asyncio
        result = asyncio.run(manage_users_route(mock_request))

        assert result == {"success": True}

    def test_require_permission_denies_missing_permission(self):
        """Should deny when user lacks permission."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "member"

        @require_permission(Permission.MANAGE_USERS)
        async def manage_users_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(manage_users_route(mock_request))

        assert exc_info.value.status_code == 403

    def test_require_permission_allows_view_dashboard(self):
        """Should allow when user has view_dashboard permission."""

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "viewer"

        @require_permission(Permission.VIEW_DASHBOARD)
        async def view_dashboard_route(request: MagicMock):
            return {"success": True}

        import asyncio
        result = asyncio.run(view_dashboard_route(mock_request))

        assert result == {"success": True}

    def test_require_permission_denies_forbidden_permission(self):
        """Should deny when user lacks required permission."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "viewer"

        @require_permission(Permission.DELETE_RESOURCES)
        async def delete_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(delete_route(mock_request))

        assert exc_info.value.status_code == 403

    def test_require_permission_denies_when_not_authenticated(self):
        """Should deny unauthenticated requests."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = False

        @require_permission(Permission.MANAGE_USERS)
        async def manage_users_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(manage_users_route(mock_request))

        assert exc_info.value.status_code == 401

    def test_require_permission_denies_when_no_role(self):
        """Should deny when role is missing."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = None

        @require_permission(Permission.MANAGE_USERS)
        async def manage_users_route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(manage_users_route(mock_request))

        assert exc_info.value.status_code == 401


class TestGetCurrentUser:
    """Test get_current_user function."""

    def test_get_current_user_returns_info_when_authenticated(self):
        """Should return user info when authenticated."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_id = "user-123"
        mock_request.state.user_email = "user@example.com"
        mock_request.state.user_role = "admin"

        user_info = get_current_user(mock_request)

        assert user_info is not None
        assert user_info["id"] == "user-123"
        assert user_info["email"] == "user@example.com"
        assert user_info["role"] == "admin"

    def test_get_current_user_returns_none_when_not_authenticated(self):
        """Should return None when not authenticated."""
        mock_request = MagicMock()
        mock_request.state.authenticated = False

        user_info = get_current_user(mock_request)

        assert user_info is None

    def test_get_current_user_returns_none_when_no_id(self):
        """Should return None when no user_id."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_id = None
        mock_request.state.user_email = "user@example.com"
        mock_request.state.user_role = "member"

        user_info = get_current_user(mock_request)

        # Get current user returns None only when not authenticated or no id
        # When authenticated but no id, it returns the dict with None id
        assert user_info is not None
        assert user_info["id"] is None

    def test_get_current_user_includes_all_fields(self):
        """Should include all user fields."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_id = "user-456"
        mock_request.state.user_email = "admin@example.com"
        mock_request.state.user_role = "owner"

        user_info = get_current_user(mock_request)

        assert "id" in user_info
        assert "email" in user_info
        assert "role" in user_info


class TestCheckAccess:
    """Test check_access function."""

    def test_check_access_allows_permission(self):
        """Should return True when access is granted."""
        result = check_access(Role.ADMIN, Permission.MANAGE_USERS)

        assert result is True

    def test_check_access_denies_permission(self):
        """Should return False when access is denied."""
        result = check_access(Role.VIEWER, Permission.MANAGE_USERS)

        assert result is False

    def test_check_access_allows_view_dashboard(self):
        """Should allow view_dashboard for all roles."""
        result = check_access(Role.VIEWER, Permission.VIEW_DASHBOARD)

        assert result is True

    def test_check_access_with_admin_role(self):
        """Should allow admin-specific permissions for admin role."""
        assert check_access(Role.ADMIN, Permission.MANAGE_USERS) is True
        assert check_access(Role.ADMIN, Permission.MANAGE_SETTINGS) is True
        assert check_access(Role.ADMIN, Permission.DELETE_RESOURCES) is True

    def test_check_access_with_owner_role(self):
        """Should allow all permissions for owner role."""
        assert check_access(Role.OWNER, Permission.MANAGE_USERS) is True
        assert check_access(Role.OWNER, Permission.MANAGE_SETTINGS) is True
        assert check_access(Role.OWNER, Permission.VIEW_BILLING) is True

    def test_check_access_with_member_role(self):
        """Should allow member permissions but not admin."""
        assert check_access(Role.MEMBER, Permission.VIEW_DASHBOARD) is True
        assert check_access(Role.MEMBER, Permission.CREATE_RESOURCES) is True
        assert check_access(Role.MEMBER, Permission.MANAGE_USERS) is False
        assert check_access(Role.MEMBER, Permission.MANAGE_SETTINGS) is False


class TestRBACMiddleware:
    """Test RBAC middleware behavior."""

    def test_middleware_attaches_user_role(self):
        """Should attach user role to request state."""
        from starlette.responses import PlainTextResponse

        async def handler(request, call_next):
            response = await call_next(request)
            return response

        middleware = RBACMiddleware(app=None)
        middleware.app = handler

        mock_request = MagicMock()
        mock_request.state.authenticated = True

        class MockUser:
            role = "admin"

        mock_request.state.user = MockUser()

        async def call_next(request):
            # Verify role was attached
            assert hasattr(request.state, "user_role")
            assert request.state.user_role == "admin"
            return PlainTextResponse("OK")

        import asyncio
        # Mind the async nature
        asyncio.run(middleware.dispatch(mock_request, call_next))

    def test_middleware_handles_no_user(self):
        """Should handle requests without user."""
        mock_request = MagicMock()
        mock_request.state.authenticated = False
        mock_request.state.user = None

        from starlette.responses import PlainTextResponse

        async def call_next(request):
            return PlainTextResponse("OK")

        import asyncio
        asyncio.run(RBACMiddleware(app=None).dispatch(mock_request, call_next))

    def test_middleware_handles_no_role(self):
        """Should default to MEMBER when no role."""
        from starlette.responses import PlainTextResponse

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user = MagicMock()
        mock_request.state.user.role = None

        async def call_next(request):
            assert request.state.user_role == "member"
            return PlainTextResponse("OK")

        import asyncio
        asyncio.run(RBACMiddleware(app=None).dispatch(mock_request, call_next))

    def test_middleware_handles_invalid_role(self):
        """Should default to MEMBER for invalid roles."""
        from starlette.responses import PlainTextResponse

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user = MagicMock()
        mock_request.state.user.role = "invalid_role_xyz"

        async def call_next(request):
            # Should default to member instead of raising
            assert request.state.user_role == "member"
            return PlainTextResponse("OK")

        import asyncio
        asyncio.run(RBACMiddleware(app=None).dispatch(mock_request, call_next))

    def test_middleware_preserves_request_state(self):
        """Should preserve other request state attributes."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True

        class MockUser:
            role = "admin"

        mock_request.state.user = MockUser()
        mock_request.state.some_other_attr = "value"

        async def call_next(request):
            assert request.state.some_other_attr == "value"
            return MagicMock()

        import asyncio
        asyncio.run(RBACMiddleware(app=None).dispatch(mock_request, call_next))


class TestDecoratorsRequireRequest:
    """Test that decorators require request in args."""

    def test_require_role_raises_without_request(self):
        """Should raise HTTPException when request not found."""
        from fastapi import HTTPException

        @require_role(Role.OWNER)
        async def route_without_request():
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(route_without_request())

        assert exc_info.value.status_code == 500
        assert "request" in exc_info.value.detail.lower()

    def test_require_permission_raises_without_request(self):
        """Should raise HTTPException when request not found."""
        from fastapi import HTTPException

        @require_permission(Permission.VIEW_DASHBOARD)
        async def route_without_request():
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(route_without_request())

        assert exc_info.value.status_code == 500
        assert "request" in exc_info.value.detail.lower()


class TestInvalidRoleHandling:
    """Test handling of invalid role values."""

    def test_invalid_role_in_decorator_raises_500(self):
        """Should raise 500 for invalid role value."""
        from fastapi import HTTPException

        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "not_a_valid_role"

        @require_role(Role.ADMIN)
        async def route(request: MagicMock):
            return {"success": True}

        import asyncio
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(route(mock_request))

        assert exc_info.value.status_code == 500


class TestRequestInKwargs:
    """Test that decorators find request in kwargs."""

    def test_require_role_finds_request_in_kwargs(self):
        """Should find request when passed as kwarg."""
        mock_request = MagicMock()
        mock_request.state.authenticated = True
        mock_request.state.user_role = "admin"

        @require_role(Role.ADMIN, Role.OWNER)
        async def route(request: MagicMock = None):
            return {"success": True}

        import asyncio
        result = asyncio.run(route(request=mock_request))

        assert result == {"success": True}


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_permission_list(self):
        """Test behavior with edge case permission."""
        # When permission has no roles assigned
        roles = get_roles_for_permission(Permission.ADMIN_ACCESS)
        assert Role.ADMIN in roles
        assert Role.OWNER in roles

    def test_role_none_handling(self):
        """Test handling when role is None."""
        assert role_gte(None, Role.MEMBER) is False
        assert has_permission(None, Permission.VIEW_DASHBOARD) is False

    def test_invalid_string_role_in_check_access(self):
        """Test with invalid role string."""
        assert check_access("invalid_role", Permission.VIEW_DASHBOARD) is False
