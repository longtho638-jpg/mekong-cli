# Audit Service Documentation

## Overview

The Audit Service provides comprehensive security and compliance logging for Agency OS. It tracks all user actions, admin operations, API calls, and security events with automatic timestamping, IP tracking, and configurable retention policies.

## Features

✅ **User Action Logging**
- Login/logout events
- Registration
- Password changes
- Profile updates

✅ **Purchase Tracking**
- Transaction logging
- Subscription management
- Payment failures

✅ **API Call Logging**
- Automatic severity classification
- Response time tracking
- User agent capture

✅ **Admin Action Logging**
- User management
- Configuration changes
- Role/permission modifications

✅ **Security Events**
- 2FA events
- Failed login attempts
- Suspicious activity detection
- Data exports

✅ **Compliance Features**
- 90-day retention policy
- JSON export for audits
- Timestamp + IP + User ID tracking
- Query filtering and analytics

## Installation

The service is automatically initialized on first use. Data is stored in `./data/audit_logs.db`.

## Usage Examples

### Basic Usage

```python
from backend.services.audit_service import get_audit_service

# Get singleton instance
audit = get_audit_service()
```

### User Login Logging

```python
# Successful login
audit.log_user_login(
    user_id="user123",
    ip_address="192.168.1.100",
    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    success=True
)

# Failed login
audit.log_user_login(
    user_id="user456",
    ip_address="192.168.1.200",
    success=False,
    error="Invalid credentials"
)
```

### Purchase Logging

```python
audit.log_purchase(
    user_id="user123",
    ip_address="192.168.1.100",
    amount=99.99,
    currency="USD",
    product_id="prod_pro_license",
    success=True,
    transaction_id="txn_abc123"
)

# Failed purchase
audit.log_purchase(
    user_id="user456",
    ip_address="192.168.1.200",
    amount=49.99,
    currency="USD",
    product_id="prod_starter",
    success=False,
    error="Payment declined"
)
```

### API Call Logging

```python
audit.log_api_call(
    user_id="user123",
    ip_address="192.168.1.100",
    endpoint="/api/users",
    method="GET",
    status_code=200,
    response_time_ms=45.2,
    user_agent="API Client/1.0"
)

# Automatically classifies severity:
# - 2xx: INFO
# - 4xx: WARNING
# - 5xx: CRITICAL
```

### Admin Action Logging

```python
from backend.services.audit_service import AuditEventType

# User creation
audit.log_admin_action(
    admin_user_id="admin001",
    ip_address="192.168.1.50",
    action_type=AuditEventType.ADMIN_USER_CREATE,
    action_description="Created new user account",
    target_user_id="user999",
    changes={
        "email": "newuser@example.com",
        "role": "member"
    }
)

# Config change
audit.log_admin_action(
    admin_user_id="admin001",
    ip_address="192.168.1.50",
    action_type=AuditEventType.ADMIN_CONFIG_CHANGE,
    action_description="Updated system configuration",
    changes={
        "setting": "max_users",
        "old_value": 100,
        "new_value": 200
    }
)
```

### Custom Event Logging

```python
from backend.services.audit_service import AuditEventType, AuditSeverity

audit.log_event(
    event_type=AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
    action="Multiple failed login attempts",
    user_id="user123",
    ip_address="192.168.1.100",
    severity=AuditSeverity.CRITICAL,
    metadata={
        "attempts": 5,
        "timespan_seconds": 60
    }
)
```

### Querying Logs

```python
from datetime import datetime, timedelta

# Get all logs for a user
user_logs = audit.get_logs(user_id="user123")

# Get logs by event type
login_logs = audit.get_logs(event_type="user_login")

# Get logs in date range
start_date = datetime.utcnow() - timedelta(days=7)
recent_logs = audit.get_logs(start_date=start_date)

# Get critical events
critical_logs = audit.get_logs(severity="critical")

# Combine filters with pagination
filtered_logs = audit.get_logs(
    user_id="user123",
    event_type="api_call",
    severity="warning",
    limit=50,
    offset=0
)
```

### JSON Export for Compliance

```python
from datetime import datetime, timedelta

# Export last 90 days
start_date = datetime.utcnow() - timedelta(days=90)
export_path = audit.export_to_json(
    output_path="./exports/audit_2024_q1.json",
    start_date=start_date
)

# Export specific date range
export_path = audit.export_to_json(
    output_path="./exports/audit_custom.json",
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 3, 31)
)
```

### Retention Policy

```python
# Apply 90-day retention policy (default)
deleted_count = audit.apply_retention_policy(retention_days=90)
print(f"Deleted {deleted_count} old audit logs")

# Custom retention period
deleted_count = audit.apply_retention_policy(retention_days=180)
```

### Statistics and Analytics

```python
stats = audit.get_statistics()

print(f"Total entries: {stats['total_entries']}")
print(f"Last 24 hours: {stats['last_24_hours']}")
print(f"By event type: {stats['by_event_type']}")
print(f"By severity: {stats['by_severity']}")
```

## FastAPI Integration

### Middleware for Automatic API Logging

```python
from fastapi import Request
import time

@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    # Log API call
    audit = get_audit_service()
    audit.log_api_call(
        user_id=request.state.user_id if hasattr(request.state, 'user_id') else None,
        ip_address=request.client.host,
        endpoint=request.url.path,
        method=request.method,
        status_code=response.status_code,
        response_time_ms=(time.time() - start_time) * 1000,
        user_agent=request.headers.get('user-agent')
    )

    return response
```

### Endpoint for Audit Queries

```python
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/admin/audit-logs")
async def get_audit_logs(
    user_id: Optional[str] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(default=100, le=1000),
    offset: int = 0
):
    """Get audit logs with filters"""
    audit = get_audit_service()
    logs = audit.get_logs(
        user_id=user_id,
        event_type=event_type,
        severity=severity,
        limit=limit,
        offset=offset
    )
    return {"logs": logs, "total": len(logs)}

@router.get("/admin/audit-stats")
async def get_audit_statistics():
    """Get audit statistics"""
    audit = get_audit_service()
    return audit.get_statistics()

@router.post("/admin/audit-export")
async def export_audit_logs(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Export audit logs to JSON"""
    audit = get_audit_service()

    output_path = f"./exports/audit_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    exported_path = audit.export_to_json(
        output_path=output_path,
        start_date=start_date,
        end_date=end_date
    )

    return {
        "success": True,
        "export_path": exported_path
    }
```

## Event Types

### User Events
- `USER_LOGIN` - User login successful
- `USER_LOGOUT` - User logout
- `USER_REGISTER` - New user registration
- `USER_PASSWORD_CHANGE` - Password updated
- `USER_PROFILE_UPDATE` - Profile information updated

### Purchase Events
- `PURCHASE_INITIATED` - Purchase started
- `PURCHASE_COMPLETED` - Purchase successful
- `PURCHASE_FAILED` - Purchase failed
- `SUBSCRIPTION_CREATED` - New subscription
- `SUBSCRIPTION_CANCELLED` - Subscription cancelled

### API Events
- `API_CALL` - API endpoint called
- `API_KEY_CREATED` - New API key generated
- `API_KEY_REVOKED` - API key revoked

### Admin Events
- `ADMIN_CONFIG_CHANGE` - System configuration changed
- `ADMIN_USER_CREATE` - Admin created user
- `ADMIN_USER_UPDATE` - Admin updated user
- `ADMIN_USER_DELETE` - Admin deleted user
- `ADMIN_ROLE_CHANGE` - User role modified
- `ADMIN_PERMISSION_CHANGE` - User permissions modified

### Security Events
- `SECURITY_2FA_ENABLED` - 2FA enabled
- `SECURITY_2FA_DISABLED` - 2FA disabled
- `SECURITY_LOGIN_FAILED` - Login attempt failed
- `SECURITY_SUSPICIOUS_ACTIVITY` - Suspicious activity detected
- `SECURITY_DATA_EXPORT` - User data exported

## Severity Levels

- **INFO**: Normal operations (successful logins, API calls)
- **WARNING**: Potential issues (failed logins, 4xx errors, admin actions)
- **CRITICAL**: Serious issues (5xx errors, security events)

## Database Schema

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,              -- ISO 8601 UTC timestamp
    event_type TEXT NOT NULL,             -- Event type enum value
    severity TEXT NOT NULL DEFAULT 'info', -- info|warning|critical
    user_id TEXT,                         -- User performing action
    ip_address TEXT,                      -- IP address
    user_agent TEXT,                      -- User agent string
    action TEXT NOT NULL,                 -- Human-readable action
    resource TEXT,                        -- Resource type (user, config, etc)
    resource_id TEXT,                     -- Specific resource ID
    metadata TEXT,                        -- JSON metadata
    result TEXT DEFAULT 'success',        -- success|failure
    error_message TEXT                    -- Error details if failed
)
```

## Indexes

- `idx_audit_timestamp` - Fast date range queries
- `idx_audit_user_id` - Fast user-specific queries
- `idx_audit_event_type` - Fast event type filtering
- `idx_audit_severity` - Fast severity filtering

## Compliance Notes

### SOC 2 Compliance
✅ Timestamp + IP + User tracking
✅ 90-day retention policy
✅ Immutable audit trail
✅ JSON export for auditors
✅ Query filtering for investigations

### GDPR Compliance
✅ User data export capability
✅ Retention policy enforcement
✅ Right to audit access

### Best Practices
- Run retention policy monthly: `audit.apply_retention_policy()`
- Export logs quarterly for compliance archives
- Monitor `SECURITY_*` events daily
- Review `ADMIN_*` events weekly
- Track `PURCHASE_*` events for financial reconciliation

## Performance Considerations

- Database is indexed for fast queries
- Pagination recommended for large result sets
- JSON export streams data to file (low memory)
- Retention policy runs as batch delete (fast)

## Security

- Database stored in `./data/` directory (configure permissions)
- No PII in metadata by default (configurable)
- IP addresses logged for security correlation
- Immutable audit trail (no update/delete except retention)

## Monitoring

Set up alerts for:
- High rate of `SECURITY_LOGIN_FAILED` events
- Any `SECURITY_SUSPICIOUS_ACTIVITY` events
- Unusual `ADMIN_*` activity patterns
- Failed purchases exceeding threshold

## Testing

Run comprehensive test suite:

```bash
PYTHONPATH=/Users/macbookprom1/mekong-cli python3 backend/services/test_audit_service.py
```

All tests should pass before deployment.
