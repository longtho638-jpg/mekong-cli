# Phase 3: Settings & RBAC

## Overview
Implement the "Settings" module and the granular "Role-Based Access Control" system.

## Objectives
- [ ] Build General Settings form (Profile, App Config).
- [ ] Build Security Settings (Password, 2FA toggle).
- [ ] Implement Role Management (CRUD Roles).
- [ ] Implement Permission Matrix.
- [ ] Enforce RBAC in UI (Hide elements).

## Architecture
- **Forms**: React Hook Form + Zod.
- **RBAC**: `usePermission` hook checking `user.role.permissions`.
- **Security**: Mock API endpoints for updates.

## Implementation Steps

### 1. Settings Module
- Create `Tabs` layout for Settings.
- `GeneralTab`: Profile, Branding.
- `SecurityTab`: Password change, Session timeout.

### 2. Roles Module
- Create `RoleTable.tsx`.
- Create `PermissionMatrix.tsx` (Grid of checkboxes: Resource x Action).
- Implement "Create Role" flow.

### 3. RBAC Enforcement
- Create `Guard` component (e.g., `<Can perform="users:delete">...</Can>`).
- Wrap critical buttons (Delete, Ban) with `Guard`.

## Verification
- "Manager" role cannot access "Settings".
- "ReadOnly" role cannot see "Delete" buttons.
- Settings forms validate inputs correctly.
