from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import HTTPException, status

from backend.core.permissions.rbac import ROLE_HIERARCHY, Role, RoleChecker


@pytest.fixture
def mock_user_owner():
    user = Mock()
    user.role = "owner"
    user.username = "owner_user"
    return user

@pytest.fixture
def mock_user_viewer():
    user = Mock()
    user.role = "viewer"
    user.username = "viewer_user"
    return user

@pytest.fixture
def mock_user_no_role():
    user = Mock()
    user.role = None
    return user

def test_role_hierarchy_structure():
    assert Role.OWNER in ROLE_HIERARCHY[Role.OWNER]
    assert Role.VIEWER in ROLE_HIERARCHY[Role.OWNER]
    assert Role.OWNER not in ROLE_HIERARCHY[Role.VIEWER]

def test_role_checker_owner_access(mock_user_owner):
    # Owner should access admin routes
    checker = RoleChecker([Role.ADMIN])
    result = checker(mock_user_owner)
    assert result == mock_user_owner

def test_role_checker_viewer_denied_admin(mock_user_viewer):
    # Viewer should NOT access admin routes
    checker = RoleChecker([Role.ADMIN])
    with pytest.raises(HTTPException) as excinfo:
        checker(mock_user_viewer)

    assert excinfo.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Operation not permitted" in excinfo.value.detail

def test_role_checker_viewer_access_viewer(mock_user_viewer):
    # Viewer should access viewer routes
    checker = RoleChecker([Role.VIEWER])
    result = checker(mock_user_viewer)
    assert result == mock_user_viewer

def test_role_checker_no_role(mock_user_no_role):
    checker = RoleChecker([Role.VIEWER])
    with pytest.raises(HTTPException) as excinfo:
        checker(mock_user_no_role)

    assert excinfo.value.status_code == status.HTTP_403_FORBIDDEN
    assert "User has no assigned role" in excinfo.value.detail

def test_require_role_factory():
    from backend.core.permissions.rbac import require_role
    checker = require_role("admin")
    assert checker.allowed_roles == [Role.ADMIN]

@pytest.mark.asyncio
async def test_get_current_user_delegates_to_verify_token():
    """Test get_current_user calls verify_token with correct exception."""
    from unittest.mock import ANY, patch

    from backend.core.permissions.rbac import get_current_user

    token = "valid_token"
    expected_user = Mock(username="test_user", role="user")

    # We patch where it is used (rbac module)
    with patch("backend.core.permissions.rbac.verify_token", new_callable=AsyncMock) as mock_verify:
        mock_verify.return_value = expected_user

        user = await get_current_user(token)

        assert user == expected_user
        mock_verify.assert_called_once()

        # Check arguments: token, exception
        args, _ = mock_verify.call_args
        assert args[0] == token
        exc = args[1]
        assert isinstance(exc, HTTPException)
        assert exc.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc.detail == "Could not validate credentials"

