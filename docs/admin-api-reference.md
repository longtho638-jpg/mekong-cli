# Admin API Reference

The Admin API provides programmatic access to system management features. All endpoints are prefixed with `/api/admin`.

**Authentication:** Requires a Bearer Token with appropriate RBAC roles.

## User Management

### List Users
`GET /users`
- **Query Params:** `page` (int), `per_page` (int)
- **Role:** Viewer+
- **Response:** List of users with pagination metadata.

### Get User Details
`GET /users/{user_id}`
- **Role:** Viewer+
- **Response:** Detailed user object including metadata.

### Ban User
`POST /users/{user_id}/ban`
- **Query Params:** `duration` (string: "forever", "none", or ISO timestamp)
- **Role:** Admin+
- **Response:** Success message.

### Update User Role
`PATCH /users/{user_id}/role`
- **Query Params:** `role` (string)
- **Role:** Owner
- **Response:** Success message.

## System Settings

### List Settings
`GET /settings`
- **Role:** Admin+
- **Response:** List of key-value system settings.

### Update Setting
`PATCH /settings/{key}`
- **Body:** `{ "value": object, "description": string }`
- **Role:** Owner
- **Response:** Updated setting object.

### List Feature Flags
`GET /settings/feature-flags`
- **Role:** Viewer+
- **Response:** List of all feature flags.

### Update Feature Flag
`PATCH /settings/feature-flags/{key}`
- **Body:** `{ "enabled": boolean, "rules": object }`
- **Role:** Developer+
- **Response:** Updated feature flag.

## Webhooks

### List Configs
`GET /webhooks/configs`
- **Role:** Developer+
- **Response:** List of webhook configurations.

### Create Config
`POST /webhooks/configs`
- **Body:** `{ "url": string, "event_types": string[], "secret": string }`
- **Role:** Admin+
- **Response:** Created config object.

### Get Config Details
`GET /webhooks/configs/{id}`
- **Role:** Developer+
- **Response:** Webhook config details.

## Analytics & Audit

### Get Audit Logs
`GET /audit`
- **Query Params:** `limit` (int), `offset` (int)
- **Role:** Admin+
- **Response:** List of audit log entries.

### Get System Stats
`GET /system/stats`
- **Role:** Viewer+
- **Response:** Aggregated system statistics (users, tenants, health).

### Get Revenue Analytics
`GET /analytics/revenue`
- **Query Params:** `period` (string)
- **Role:** Viewer+
- **Response:** Revenue charts and plan breakdown.
