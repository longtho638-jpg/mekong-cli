# RBAC Implementation Guide

## 1. Concepts

**Role-Based Access Control (RBAC)** restricts system access to authorized users.

### Roles
- `owner`: Superuser, manages billing and dangerous actions.
- `admin`: Operational admin, manages users and settings.
- `developer`: Tech access, API keys, webhooks.
- `viewer`: Read-only dashboard access.
- `agent`: AI Agent identity.

## 2. Usage in Code

### Require a Role
Use the dependency factories in `backend/core/security/rbac.py`.

```python
from fastapi import APIRouter, Depends
from backend.core.security.rbac import require_admin, require_viewer

router = APIRouter()

@router.post("/system/config")
def update_config(
    config: ConfigModel,
    user = Depends(require_admin) # Only Owner/Admin
):
    ...

@router.get("/dashboard/stats")
def get_stats(
    user = Depends(require_viewer) # Owner/Admin/Dev/Viewer
):
    ...
```

### Check Permissions Dynamically
```python
from backend.core.security.rbac import Role, ROLE_HIERARCHY

def check_custom_perm(user):
    if Role(user.role) not in ROLE_HIERARCHY[Role.ADMIN]:
        raise HTTPException(403)
```

## 3. Adding New Roles
1. Update `Role` Enum in `backend/core/security/rbac.py`.
2. Update `ROLE_HIERARCHY` dictionary.
3. Create a convenience dependency `require_newrole`.

## 4. Testing
Use `backend/tests/core/permissions/test_rbac.py` to verify hierarchy logic.
