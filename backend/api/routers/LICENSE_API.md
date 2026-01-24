# License Verification API

API endpoints for license key validation, feature checks, and activation.

## Endpoints

### 1. POST `/api/license/verify`

Verify a license key and return tier and features.

**Request Body:**
```json
{
  "license_key": "BP-PRO-ABC123"  // Optional, null for free tier
}
```

**Response:**
```json
{
  "valid": true,
  "tier": "pro",
  "message": "✓ Valid PRO license activated",
  "features": [
    "template_generation",
    "ai_generation",
    "basic_support",
    "email_support",
    "priority_support"
  ]
}
```

---

### 2. GET `/api/license/features/{tier}`

Get available features for a specific license tier.

**Path Parameters:**
- `tier`: License tier (free, starter, pro, franchise, enterprise)

**Response:**
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
    }
  ]
}
```

---

### 3. POST `/api/license/activate`

Activate a license key (record first use).

**Request Body:**
```json
{
  "license_key": "BP-PRO-ABC123",
  "email": "user@example.com",      // Optional
  "product_id": "bizplan-pro"       // Optional
}
```

**Response:**
```json
{
  "success": true,
  "tier": "pro",
  "activated_at": "2026-01-24T22:45:00.000Z",
  "message": "License activated successfully for PRO tier"
}
```

---

### 4. GET `/api/license/health`

Health check endpoint for the license service.

**Response:**
```json
{
  "status": "operational",
  "service": "license-verification",
  "tiers_available": ["free", "starter", "pro", "franchise", "enterprise"],
  "features_count": 10
}
```

---

## License Tiers

### Free
- ✓ template_generation
- ✓ basic_support

### Starter
- ✓ template_generation
- ✓ basic_support
- ✓ email_support

### Pro
- ✓ template_generation
- ✓ ai_generation (AI-powered generation)
- ✓ basic_support
- ✓ email_support
- ✓ priority_support

### Franchise
- ✓ template_generation
- ✓ ai_generation
- ✓ export_pdf (PDF export)
- ✓ basic_support
- ✓ email_support
- ✓ priority_support
- ✓ multi_user

### Enterprise
- ✓ template_generation
- ✓ ai_generation
- ✓ export_pdf
- ✓ custom_branding (White-label)
- ✓ basic_support
- ✓ email_support
- ✓ priority_support
- ✓ multi_user
- ✓ dedicated_support
- ✓ sla_guarantee

---

## License Key Formats

### BizPlan Format (BP-*)
```
BP-{TIER}-{CHECKSUM}

Examples:
- BP-FREE-ABC123
- BP-STARTER-XYZ789
- BP-PRO-ABC123
- BP-FRANCHISE-DEF456
- BP-ENTERPRISE-GHI789
```

### AgencyOS Format (AGOS-*)
```
AGOS-{TIER_PREFIX}-{UID}-{CHECKSUM}

Examples:
- AGOS-ST-4C7C683E-DB44     (Starter)
- AGOS-PRO-4C7C683E-DB44    (Pro)
- AGOS-FR-4C7C683E-DB44     (Franchise)
- AGOS-EN-4C7C683E-DB44     (Enterprise)
```

### Mekong Format (mk_live_*)
```
mk_live_{tier}_{hash}_{timestamp}

Examples:
- mk_live_pro_a1b2c3d4e5f6g7h8_1737752400
- mk_live_enterprise_x9y8z7w6v5u4t3s2_1737752400
```

---

## Testing

Run the test suite:

```bash
# Test license validation logic
PYTHONPATH=/Users/macbookprom1/mekong-cli python3 backend/api/tests/test_license_simple.py

# Test router structure
PYTHONPATH=/Users/macbookprom1/mekong-cli python3 backend/api/tests/test_license_router_import.py
```

All tests should pass with ✅ status.

---

## Integration

The license router is automatically registered in `/backend/api/main.py`:

```python
from backend.api.routers import license as license_router
# ...
app.include_router(license_router.router)
```

Access the API documentation at: `http://localhost:8000/docs`

---

## Error Handling

### Invalid License Key
```json
{
  "valid": false,
  "tier": "free",
  "message": "Invalid license key format. Expected format: BP-TIER-XXXXXXXX",
  "features": ["template_generation", "basic_support"]
}
```

### Invalid Tier
```json
{
  "detail": "Invalid tier: invalid_tier. Valid tiers are: free, starter, pro, franchise, enterprise"
}
```

### Activation Failure
```json
{
  "detail": "Invalid license key: Invalid license key format. Expected format: BP-TIER-XXXXXXXX"
}
```
