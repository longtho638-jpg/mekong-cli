"""
RBAC Proxy
==========
This module is deprecated. Please use backend.core.permissions.rbac instead.
"""
import warnings

from backend.core.permissions.rbac import (
    ROLE_HIERARCHY,
    Role,
    RoleChecker,
    get_current_user,
    oauth2_scheme,
    require_admin,
    require_agent,
    require_developer,
    require_editor,
    require_owner,
    require_role,
    require_viewer,
)

warnings.warn(
    "backend.core.security.rbac is deprecated. Use backend.core.permissions.rbac instead.",
    DeprecationWarning,
    stacklevel=2
)
