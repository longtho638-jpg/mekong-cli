# API Reference

> **Agency OS Unified API** - The One-Person Unicorn Operating System
>
> **Version:** 0.1.0
> **Base URL:** `http://localhost:8000`
> **Philosophy:** "Không đánh mà thắng" (Win Without Fighting)

---

## Table of Contents

1. [License Management](#1-license-management)
2. [Team Management](#2-team-management)
3. [Revenue Analytics](#3-revenue-analytics)
4. [Webhooks](#4-webhooks)
5. [Health Checks](#5-health-checks)
6. [Error Codes](#error-codes)

---

## 1. License Management

### Verify License

Verify a license key and return tier and features.

**Endpoint:** `POST /api/license/verify`

**Request Body:**
```json
{
  "license_key": "PRO-ABC123-XYZ789"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "tier": "pro",
  "message": "License valid for PRO tier",
  "features": [
    "template_generation",
    "ai_generation",
    "basic_support",
    "email_support",
    "priority_support"
  ]
}
```

**Response (Free Tier):**
```json
{
  "valid": true,
  "tier": "free",
  "message": "Using FREE tier (no license key)",
  "features": [
    "template_generation",
    "basic_support"
  ]
}
```

---

### Get Tier Features

Get available features for a specific license tier.

**Endpoint:** `GET /api/license/features/{tier}`

**Parameters:**
- `tier` (path): License tier - `free`, `starter`, `pro`, `franchise`, `enterprise`

**Example:** `GET /api/license/features/pro`

**Response (200 OK):**
```json
{
  "tier": "pro",
  "features": [
    {
      "name": "template_generation",
      "description": "Generate business plans from templates"
    },
    {
      "name": "ai_generation",
      "description": "AI-powered business plan generation"
    },
    {
      "name": "basic_support",
      "description": "Community support via forums"
    },
    {
      "name": "email_support",
      "description": "Email support"
    },
    {
      "name": "priority_support",
      "description": "Priority email and chat support"
    }
  ]
}
```

**Response (400 Bad Request - Invalid Tier):**
```json
{
  "detail": "Invalid tier: premium. Valid tiers are: free, starter, pro, franchise, enterprise"
}
```

---

### Activate License

Activate a license key (record first use).

**Endpoint:** `POST /api/license/activate`

**Request Body:**
```json
{
  "license_key": "ENTERPRISE-DEF456-ABC123",
  "email": "customer@company.com",
  "product_id": "agency_os_enterprise"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "tier": "enterprise",
  "activated_at": "2026-01-24T15:30:00.000000Z",
  "message": "License activated successfully for ENTERPRISE tier"
}
```

**Response (400 Bad Request - Invalid Key):**
```json
{
  "detail": "Invalid license key: License key format invalid"
}
```

---

### License Health Check

Check license service status.

**Endpoint:** `GET /api/license/health`

**Response (200 OK):**
```json
{
  "status": "operational",
  "service": "license-verification",
  "tiers_available": [
    "free",
    "starter",
    "pro",
    "franchise",
    "enterprise"
  ],
  "features_count": 10
}
```

---

## 2. Team Management

### Create Team

Create a new team with owner and seat limits based on license tier.

**Endpoint:** `POST /api/team/create`

**Request Body:**
```json
{
  "name": "Engineering Team Alpha",
  "owner_email": "owner@company.com",
  "license_tier": "franchise"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "team": {
    "id": "team_abc123xyz",
    "name": "Engineering Team Alpha",
    "owner_email": "owner@company.com",
    "license_tier": "franchise",
    "max_seats": 7,
    "active_members": 1,
    "available_seats": 6,
    "created_at": "2026-01-24T15:30:00.000000Z",
    "members": [
      {
        "email": "owner@company.com",
        "role": "owner",
        "status": "active",
        "joined_at": "2026-01-24T15:30:00.000000Z"
      }
    ]
  },
  "message": "Team created successfully with FRANCHISE tier (7 seats)"
}
```

**Response (400 Bad Request - Invalid Tier):**
```json
{
  "detail": "Invalid license_tier. Valid tiers: free, starter, pro, franchise, enterprise"
}
```

---

### Invite Member

Invite a member to the team.

**Endpoint:** `POST /api/team/{team_id}/invite`

**Path Parameters:**
- `team_id`: Team ID (e.g., `team_abc123xyz`)

**Request Body:**
```json
{
  "email": "newmember@company.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "member": {
    "email": "newmember@company.com",
    "role": "member",
    "status": "active",
    "joined_at": "2026-01-24T16:00:00.000000Z"
  },
  "message": "Member invited successfully",
  "available_seats": 5
}
```

**Response (400 Bad Request - No Seats):**
```json
{
  "detail": "No available seats. Upgrade license tier or remove members."
}
```

**Response (400 Bad Request - Already Exists):**
```json
{
  "detail": "Member with email newmember@company.com already exists"
}
```

---

### Remove Member

Remove a member from the team.

**Endpoint:** `DELETE /api/team/{team_id}/member/{email}`

**Path Parameters:**
- `team_id`: Team ID
- `email`: Member email to remove (URL-encoded)

**Example:** `DELETE /api/team/team_abc123xyz/member/member@company.com`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Member member@company.com removed successfully",
  "available_seats": 6
}
```

**Response (400 Bad Request - Owner Removal):**
```json
{
  "detail": "Cannot remove team owner"
}
```

**Response (400 Bad Request - Not Found):**
```json
{
  "detail": "Member not found"
}
```

---

### List Members

List all team members.

**Endpoint:** `GET /api/team/{team_id}/members`

**Path Parameters:**
- `team_id`: Team ID

**Query Parameters:**
- `include_removed` (optional, default: `false`): Include removed members

**Example:** `GET /api/team/team_abc123xyz/members?include_removed=false`

**Response (200 OK):**
```json
{
  "success": true,
  "team_id": "team_abc123xyz",
  "team_name": "Engineering Team Alpha",
  "license_tier": "franchise",
  "max_seats": 7,
  "active_members": 3,
  "available_seats": 4,
  "members": [
    {
      "email": "owner@company.com",
      "role": "owner",
      "status": "active",
      "joined_at": "2026-01-24T15:30:00.000000Z"
    },
    {
      "email": "member1@company.com",
      "role": "member",
      "status": "active",
      "joined_at": "2026-01-24T16:00:00.000000Z"
    },
    {
      "email": "member2@company.com",
      "role": "member",
      "status": "active",
      "joined_at": "2026-01-24T16:15:00.000000Z"
    }
  ]
}
```

---

### Check Seat Availability

Check seat availability for a team.

**Endpoint:** `GET /api/team/{team_id}/seats`

**Path Parameters:**
- `team_id`: Team ID

**Response (200 OK - Limited Seats):**
```json
{
  "success": true,
  "team_id": "team_abc123xyz",
  "license_tier": "franchise",
  "max_seats": 7,
  "active_members": 3,
  "available_seats": 4,
  "has_available_seats": true,
  "is_unlimited": false
}
```

**Response (200 OK - Unlimited Seats):**
```json
{
  "success": true,
  "team_id": "team_enterprise_001",
  "license_tier": "enterprise",
  "max_seats": -1,
  "active_members": 25,
  "available_seats": -1,
  "has_available_seats": true,
  "is_unlimited": true
}
```

---

### Team Health Check

Check team service status.

**Endpoint:** `GET /api/team/health`

**Response (200 OK):**
```json
{
  "status": "operational",
  "service": "team-management",
  "endpoints": {
    "create": "POST /api/team/create",
    "invite": "POST /api/team/{team_id}/invite",
    "remove": "DELETE /api/team/{team_id}/member/{email}",
    "list_members": "GET /api/team/{team_id}/members",
    "check_seats": "GET /api/team/{team_id}/seats"
  }
}
```

---

## 3. Revenue Analytics

### Revenue Dashboard

Get high-level revenue metrics (requires authentication).

**Endpoint:** `GET /revenue/dashboard`

**Headers:**
- `Authorization`: Bearer token (requires viewer role)

**Response (200 OK):**
```json
{
  "volume": {
    "total_customers": 142,
    "active_subscriptions": 98,
    "total_transactions": 1247
  },
  "financials": {
    "total_revenue_usd": 285000.00,
    "mrr": 18500.00,
    "arr": 222000.00,
    "outstanding": 4200.00
  },
  "goals": {
    "monthly_target": 25000.00,
    "progress_percent": 74.0,
    "gap_usd": 6500.00
  }
}
```

---

### Revenue Summary

Get overall revenue metrics.

**Endpoint:** `GET /revenue/summary`

**Response (200 OK):**
```json
{
  "total_revenue": 125000.00,
  "mrr": 8500.00,
  "customer_count": 42
}
```

---

### Revenue by Product

Get revenue breakdown by product.

**Endpoint:** `GET /revenue/by-product`

**Response (200 OK):**
```json
[
  {
    "product_name": "SaaS Starter",
    "revenue": 45000.00,
    "customers": 18
  },
  {
    "product_name": "Agency Pro",
    "revenue": 60000.00,
    "customers": 15
  },
  {
    "product_name": "Enterprise",
    "revenue": 20000.00,
    "customers": 9
  }
]
```

---

### Revenue by Period

Get time-series revenue data.

**Endpoint:** `GET /revenue/by-period`

**Query Parameters:**
- `period` (optional, default: `monthly`): Time period - `daily`, `weekly`, `monthly`

**Example:** `GET /revenue/by-period?period=daily`

**Response (200 OK - Daily):**
```json
[
  {
    "date": "2026-01-20",
    "revenue": 1200.00
  },
  {
    "date": "2026-01-21",
    "revenue": 980.00
  },
  {
    "date": "2026-01-22",
    "revenue": 1500.00
  },
  {
    "date": "2026-01-23",
    "revenue": 1100.00
  },
  {
    "date": "2026-01-24",
    "revenue": 1350.00
  }
]
```

**Response (200 OK - Weekly):**
```json
[
  {
    "week": "2026-W01",
    "revenue": 7800.00
  },
  {
    "week": "2026-W02",
    "revenue": 8200.00
  },
  {
    "week": "2026-W03",
    "revenue": 7500.00
  },
  {
    "week": "2026-W04",
    "revenue": 9100.00
  }
]
```

**Response (200 OK - Monthly):**
```json
[
  {
    "month": "2025-09",
    "revenue": 28000.00
  },
  {
    "month": "2025-10",
    "revenue": 31500.00
  },
  {
    "month": "2025-11",
    "revenue": 29800.00
  },
  {
    "month": "2025-12",
    "revenue": 35700.00
  }
]
```

---

### Affiliate Revenue

Get affiliate commission summary.

**Endpoint:** `GET /revenue/affiliates`

**Response (200 OK):**
```json
[
  {
    "affiliate_name": "TechPartner A",
    "total_sales": 12000.00,
    "commission": 1800.00,
    "status": "paid"
  },
  {
    "affiliate_name": "MarketingPro B",
    "total_sales": 8500.00,
    "commission": 1275.00,
    "status": "pending"
  },
  {
    "affiliate_name": "SalesExpert C",
    "total_sales": 15200.00,
    "commission": 2280.00,
    "status": "paid"
  }
]
```

---

### Sync Revenue

Trigger synchronization with payment providers (requires admin).

**Endpoint:** `POST /revenue/sync`

**Headers:**
- `Authorization`: Bearer token (requires admin role)

**Response (200 OK):**
```json
{
  "status": "synced",
  "message": "Revenue data synchronization complete"
}
```

---

## 4. Webhooks

### Gumroad Webhook

Handle Gumroad purchase webhooks.

**Endpoint:** `POST /api/webhooks/gumroad`

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body (Form Data):**
```
email=customer@example.com
product_id=gumroad_product_123
product_name=Agency OS Pro License
price=395.00
currency=USD
sale_id=sale_abc123xyz
license_key=PRO-XYZ789-ABC123
purchaser_id=purchaser_def456
custom_fields={"affiliate_code":"PARTNER2024"}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Purchase received"
}
```

**Response (400 Bad Request):**
```json
{
  "detail": "Invalid webhook data: missing required field 'email'"
}
```

---

### List Customers

Get all customers from webhook data.

**Endpoint:** `GET /api/webhooks/customers`

**Response (200 OK):**
```json
{
  "count": 24,
  "customers": [
    {
      "email": "customer1@example.com",
      "product_name": "Agency OS Pro License",
      "license_key": "PRO-ABC123-XYZ789",
      "price": 395.00,
      "currency": "USD",
      "purchase_date": "2026-01-24T10:30:00Z"
    },
    {
      "email": "customer2@example.com",
      "product_name": "Agency OS Starter",
      "license_key": "STARTER-DEF456-QRS012",
      "price": 149.00,
      "currency": "USD",
      "purchase_date": "2026-01-24T11:15:00Z"
    }
  ]
}
```

---

### List Affiliates

Get all affiliates and their stats.

**Endpoint:** `GET /api/webhooks/affiliates`

**Response (200 OK):**
```json
{
  "count": 3,
  "affiliates": [
    {
      "code": "PARTNER2024",
      "total_referrals": 12,
      "total_sales": 4740.00,
      "total_commission_pending": 711.00,
      "total_commission_paid": 0.00
    },
    {
      "code": "TECH2024",
      "total_referrals": 8,
      "total_sales": 3160.00,
      "total_commission_pending": 474.00,
      "total_commission_paid": 0.00
    },
    {
      "code": "MARKET2024",
      "total_referrals": 15,
      "total_sales": 5925.00,
      "total_commission_pending": 888.75,
      "total_commission_paid": 0.00
    }
  ]
}
```

---

### Get Affiliate Details

Get detailed affiliate information including all referrals.

**Endpoint:** `GET /api/webhooks/affiliates/{affiliate_code}`

**Path Parameters:**
- `affiliate_code`: Affiliate tracking code (e.g., `PARTNER2024`)

**Example:** `GET /api/webhooks/affiliates/PARTNER2024`

**Response (200 OK):**
```json
{
  "code": "PARTNER2024",
  "total_referrals": 12,
  "total_sales": 4740.00,
  "total_commission_pending": 711.00,
  "total_commission_paid": 0.00,
  "referrals": [
    {
      "email": "customer1@example.com",
      "product_name": "Agency OS Pro License",
      "price": 395.00,
      "commission": 59.25,
      "commission_status": "pending",
      "purchase_date": "2026-01-24T10:30:00Z"
    },
    {
      "email": "customer2@example.com",
      "product_name": "Agency OS Pro License",
      "price": 395.00,
      "commission": 59.25,
      "commission_status": "pending",
      "purchase_date": "2026-01-24T12:45:00Z"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "detail": "Affiliate not found"
}
```

---

### Validate License (Webhook)

Validate a license key against webhook purchase data.

**Endpoint:** `POST /api/webhooks/license/validate`

**Query Parameters:**
- `license_key`: License key to validate
- `email`: Customer email

**Example:** `POST /api/webhooks/license/validate?license_key=PRO-ABC123-XYZ789&email=customer@example.com`

**Response (200 OK):**
```json
{
  "valid": true,
  "product": "Agency OS Pro License"
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Invalid license"
}
```

---

## 5. Health Checks

### Root API

Get API information.

**Endpoint:** `GET /`

**Response (200 OK):**
```json
{
  "name": "Agency OS Unified API",
  "tagline": "The One-Person Unicorn Operating System",
  "version": "0.1.0",
  "binh_phap": "Không đánh mà thắng",
  "docs": "/docs",
  "status": "operational",
  "environment": "development"
}
```

---

### Global Health Check

Check overall API health.

**Endpoint:** `GET /health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "modules": {
    "swarm": "active",
    "revenue": "active",
    "ops": "active",
    "crm": "loaded"
  },
  "architecture": "modular_v2"
}
```

---

## Error Codes

Standard HTTP status codes used across all endpoints:

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request data or parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Response Formats

All endpoints return JSON responses with consistent structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "detail": "Error description",
  "code": "ERROR_CODE",
  "field": "field_name"  // Optional, for validation errors
}
```

---

## Authentication

Protected endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/revenue/dashboard
```

**Roles:**
- `viewer`: Read-only access to analytics
- `admin`: Full access including sync operations

---

## Rate Limiting

All endpoints are subject to rate limiting:

- **Default:** 100 requests per minute per IP
- **Webhooks:** 1000 requests per minute
- **Protected endpoints:** 60 requests per minute

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706112000
```

---

## Additional Resources

- **Interactive API Docs:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Spec:** `http://localhost:8000/openapi.json`

---

**Last Updated:** 2026-01-24
**Maintained by:** Binh Pháp Agency OS Team
