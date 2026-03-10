# Tier-Based Rate Limiting — ROIaaS Phase 6

## Overview

Tier-Based Rate Limiting is a comprehensive rate limiting system that apportion rate limits based on user license tiers (FREE, TRIAL, PRO, ENTERPRISE). Each tier has configurable presets for different endpoint categories with token bucket algorithm implementation.

**Module:** `src/lib/tier_rate_limit_middleware.py`
**CLI Command:** `mekong tier-admin`
**Database Tables:** `tier_configs`, `tenant_rate_limits`

---

## Tier Configuration

### Tier Tiers and Default Presets

| Tier | auth_login | auth_callback | auth_refresh | api_default | burst_size |
|------|------------|---------------|--------------|-------------|------------|
| FREE | 5/min | 10/min | 10/min | 20/min | 30 |
| TRIAL | 10/min | 20/min | 20/min | 40/min | 60 |
| PRO | 30/min | 60/min | 60/min | 100/min | 150 |
| ENTERPRISE | 100/min | 200/min | 200/min | 500/min | 750 |

### Preset Types

| Preset | Endpoints | Purpose |
|--------|-----------|---------|
| `auth_login` | `/auth/login`, `/auth/google/login`, `/auth/github/login` | Authentication attempts |
| `auth_callback` | `/auth/google/callback`, `/auth/github/callback` | OAuth callbacks |
| `auth_refresh` | `/auth/refresh` | Token refresh endpoints |
| `api_default` | All other API endpoints | Default API rate limit |

### Rate Limit Configuration Structure

```python
@dataclass
class RateLimitConfig:
    requests_per_minute: int
    burst_size: Optional[int] = None  # Defaults to requests_per_minute

@dataclass
class TierRateLimitConfig:
    tier: Tier
    auth_login: RateLimitConfig
    auth_callback: RateLimitConfig
    auth_refresh: RateLimitConfig
    api_default: RateLimitConfig
```

---

## Tier Configuration Guide

### Viewing Current Configurations

#### List All Tier Configurations

```bash
mekong tier-admin list
```

Output shows all tiers with their preset configurations in table format.

#### Get Configuration for Specific Tier

```bash
mekong tier-admin get pro
```

### Setting Tier Configurations

#### Update Tier Preset

```bash
mekong tier-admin set <tier> <preset> <rate_limit> [window_seconds]
```

**Example:**
```bash
# Set PRO tier auth_login to 50 requests/minute
mekong tier-admin set pro auth_login 50 60

# Set FREE tier api_default to 30 requests/30 seconds
mekong tier-admin set free api_default 30 30
```

**Arguments:**
- `tier`: `free`, `trial`, `pro`, or `enterprise`
- `preset`: `auth_login`, `auth_callback`, `auth_refresh`, or `api_default`
- `rate_limit`: Positive integer (requests per window)
- `window_seconds`: Optional, default 60

**Verified:**
- Tier name must exist in Tier enum
- Preset name must be valid
- Rate limit must be >= 1

### Database Schema

#### tier_configs Table

```sql
CREATE TABLE tier_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(50) NOT NULL,
    preset VARCHAR(50) NOT NULL,
    rate_limit INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_tier_preset UNIQUE(tier, preset),
    CONSTRAINT check_rate_limit_positive CHECK (rate_limit > 0),
    CONSTRAINT check_window_positive CHECK (window_seconds > 0)
);
```

**Indexes:**
- `idx_tier_configs_tier` — Tier lookups
- `idx_tier_configs_preset` — Preset lookups

---

## CLI Commands Reference

### tier-admin Command Group

```bash
mekong tier-admin --help
```

#### Available Commands

| Command | Description |
|---------|-------------|
| `list` | List all tier configurations |
| `get <tier>` | Get config for specific tier |
| `set <tier> <preset> <rate_limit> [window]` | Set tier preset configuration |
| `override <tenant_id> <preset> <limit> [window]` | Set tenant-specific override |
| `overrides` | List all tenant overrides |
| `remove-override <tenant_id> <preset>` | Remove tenant override |

### Command Details

#### 1. Listing Configurations

```bash
mekong tier-admin list
```

**Output:** Tables organized by tier showing presets.

#### 2. Getting Tier Configuration

```bash
mekong tier-admin get <tier>
```

**Example:**
```bash
$ mekong tier-admin get enterprise

Configuration for Tier: ENTERPRISE

Preset           Rate Limit    Window (seconds)
---------------  ------------  ----------------
auth_login       100           60
auth_callback    200           60
auth_refresh     200           60
api_default      500           60
```

#### 3. Setting Configuration

```bash
mekong tier-admin set <tier> <preset> <rate_limit> [window_seconds]
```

**Example:**
```bash
# Set TRIAL tier auth_callback to 30/min
mekong tier-admin set trial auth_callback 30 60
```

**Success Response:**
```
✓ Configuration updated!

  Tier: trial
  Preset: auth_callback
  Rate Limit: 30 requests / 60s
  Window: 60 seconds
```

#### 4. Setting Tenant Overrides

```bash
mekong tier-admin override <tenant_id> <preset> <custom_limit> [custom_window] [--tier <tier>]
```

**Examples:**
```bash
# Give tenant-123 100 auth_login requests/minute
mekong tier-admin override tenant-123 auth_login 100 60

# Override for specific tier
mekong tier-admin override tenant-123 auth_login 100 60 --tier pro

# Temporarily disable rate limit (very high limit)
mekong tier-admin override tenant-123 api_default 10000 60
```

**Output:**
```
✓ Tenant override created!

  Tenant ID: tenant-123
  Preset: auth_login
  Custom Limit: 100 requests / 60s
  Tier Override: pro
```

#### 5. Listing Tenant Overrides

```bash
mekong tier-admin overrides
mekong tier-admin overrides --tenant tenant-123
```

**Output Format:**
```
Tenant ID        Preset          Custom Limit    Window (s)    Tier Override    Expires
---------------  --------------  --------------  ------------  ---------------  ---------
tenant-123       auth_login      100             60            pro              -
tenant-456       api_default     200             120           -                2026-04-01
```

#### 6. Removing Tenant Overrides

```bash
mekong tier-admin remove-override <tenant_id> <preset>
```

**Example:**
```bash
mekong tier-admin remove-override tenant-123 auth_login
```

---

## API Endpoints Reference

### Tier Rate Limit Middleware

The middleware is applied to the FastAPI application via `src/lib/tier_rate_limit_middleware.py`.

#### HTTP Headers Adds to Response

| Header | Description |
|--------|-------------|
| `X-RateLimit-Tier` | License tier (free, trial, pro, enterprise, dev) |
| `X-RateLimit-Limit` | requests per minute limit |
| `X-RateLimit-Remaining` | requests remaining in window |
| `X-RateLimit-Reset` | Unix timestamp of window reset |
| `Retry-After` | Seconds to wait before retry (on 429) |

#### Rate Limited Response (429)

```json
{
  "error": "rate_limit_exceeded",
  "message": "Rate limit exceeded for free tier",
  "retry_after": 45,
  "tier": "free",
  "limit": 20
}
```

Headers included:
```
X-RateLimit-Tier: free
X-RateLimit-Limit: 20
Retry-After: 45
Content-Type: application/json
```

### Path-to-Preset Mapping

| Path Pattern | Preset Used |
|--------------|-------------|
| `/auth/login`, `/auth/dev-login` | `auth_login` |
| `/auth/callback` | `auth_callback` |
| `/auth/refresh` | `auth_refresh` |
| `/auth/*` (other) | `auth_login` |
| All other paths | `api_default` |

---

## Custom Overrides Guide

### Tenant Override System

The tenant override system allows per-tenant customization beyond tier defaults.

#### Key Features

| Feature | Description |
|---------|-------------|
| Per-Tenant Customization | Override rate limits per tenant |
| Tier Override | Assign different tier for specific tenant |
| Expiration | Set override expiry timestamp |
| Multiple Presets | Different limits per endpoint type |
| Database Persistence | Overrides persisted across restarts |

#### Override Priority

1. **Tenant Override** (highest priority)
2. **Tier Default** (from database)
3. **In-Memory Default** (from `src/lib/tier_config.py`)

#### Priority数学:

```
effective_limit = override.custom_limit
                OR tier_config.rate_limit
                OR default_config.rate_limit
```

### Use Cases

#### 1. Premium Support Customer

```bash
# Give premium support tenant higher limits
mekong tier-admin override support-tenant-001 api_default 1000 60
mekong tier-admin override support-tenant-001 auth_login 200 60
```

#### 2. Trial Extension with Temporary Boost

```bash
# Give trial user temporary 2x quota for testing
mekong tier-admin override trial-user-x auth_login 20 60
```

#### 3. Internal Testing

```bash
# Disable rate limiting for internal testing (use carefully!)
mekong tier-admin override test-env internal_api 10000 60
```

### Expiring Overrides

```bash
# Override with expiration (ISO format)
mekong tier-admin override <tenant> <preset> <limit> --expires 2026-04-01T23:59:59Z
```

In code:
```python
from datetime import datetime, timedelta

# Set override expire in 30 days
expires = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
```

### Removing All Overrides for Tenant

```sql
-- SQL for cleanup
DELETE FROM tenant_rate_limits WHERE tenant_id = 'tenant-123';
```

Or via Python:

```python
from src.db.tier_config_repository import get_repository
import asyncio

async def remove_tenant_overrides(tenant_id: str):
    repo = get_repository()

    # Get all overrides for tenant
    overrides = await repo.get_all_tenant_overrides(tenant_id)

    # Delete each
    for override in overrides:
        await repo.delete_tenant_override(tenant_id, override.preset)

asyncio.run(remove_tenant_overrides("tenant-123"))
```

---

## Token Bucket Algorithm

### Implementation

The rate limiter uses a token bucket algorithm with the following parameters:

| Parameter | Description |
|-----------|-------------|
| `burst_size` | Maximum tokens in bucket (peak capacity) |
| `requests_per_minute` | Token refill rate (tokens/second = rpm/60) |
| `_tokens` | Current token count (float, starts at burst_size) |

### Algorithm Flow

```
Request arrives
    ↓
Refill tokens: tokens += elapsed * (rpm/60)
    ↓
Limit to: tokens = min(tokens, burst_size)
    ↓
If tokens >= 1:
    tokens -= 1
    allow_request = True
else:
    allow_request = False
    wait_time = (1 - tokens) / (rpm/60)
```

### Example Calculation

For PRO tier `api_default` (100 rpm, 150 burst):

| Time | Tokens | Action | Result |
|------|--------|--------|--------|
| Start | 150 | — | Full capacity |
| Request 1 | 150 → 149 | Consume 1 | Allowed |
| Request 2 | 149 → 148 | Consume 1 | Allowed |
| 1 second later | 148 + 1.67 = 149.67 | Refill (100/60) | ~150 |
| Burst of 50 | 150 → 100 | Consume 50 | Allowed |
| No refill for 30s | 100 + 50 = 150 | Full refill | Max capacity |

---

## Development Mode

### Bypass Rate Limiting

Rate limiting is automatically bypassed in development mode:

1. `MEKONG_DEV_MODE=true` environment variable
2. `DISABLE_RATE_LIMITING=true` environment variable

### Dev Mode Response

When bypassed, responses include:
```
X-RateLimit-Tier: dev
X-RateLimit-Limit: unlimited
```

---

## Configuration Files

### Default Configuration Source

Default tier configurations are stored in `src/lib/tier_config.py`:

```python
DEFAULT_TIER_CONFIGS = {
    Tier.FREE: TierRateLimitConfig(
        tier=Tier.FREE,
        auth_login=RateLimitConfig(requests_per_minute=5, burst_size=5),
        auth_callback=RateLimitConfig(requests_per_minute=10, burst_size=10),
        auth_refresh=RateLimitConfig(requests_per_minute=10, burst_size=10),
        api_default=RateLimitConfig(requests_per_minute=20, burst_size=30),
    ),
    # ... other tiers
}
```

### Database Seeding

The default configurations are also seeded in `005_create_tier_configs.sql`:

```sql
INSERT INTO tier_configs (tier, preset, rate_limit, window_seconds) VALUES
    ('free', 'auth_login', 5, 60),
    ('free', 'auth_callback', 10, 60),
    -- ... other presets and tiers
ON CONFLICT (tier, preset) DO NOTHING;
```

---

## Rate Limiter Factory

### Caching Strategy

The `RateLimiterFactory` provides cached access to rate limiters:

| Feature | Configuration |
|---------|---------------|
| Cache TTL | 300 seconds (5 minutes) |
| Cache Key | `{tier}:{preset}` |
| Thread Safety | Lock-protected operations |

### Usage

```python
from src.lib.rate_limiter_factory import get_factory, get_rate_limiter

# Get factory instance
factory = get_factory()
factory.invalidate_cache()  # Clear all cached entries

# Get rate limiter for tier/preset
limiter = get_rate_limiter("pro", "api_default")
limiter.acquire()  # Try to consume a token
limiter.get_wait_time()  # Get wait time if rate limited
```

---

## Database Cleanup

### Expired Override Cleanup

```sql
-- Clean up expired overrides
DELETE FROM tenant_rate_limits
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```

Programmatic cleanup:
```python
from src.db.tier_config_repository import get_repository
import asyncio

async def cleanup_expired():
    repo = get_repository()
    deleted = await repo.cleanup_expired_overrides()
    print(f"Deleted {deleted} expired overrides")

asyncio.run(cleanup_expired())
```

### Full Reset

```sql
-- Reset all configurations to defaults
DELETE FROM tier_configs;
DELETE FROM tenant_rate_limits;

-- Re-seed defaults
\i src/db/migrations/005_create_tier_configs.sql
```

---

## Monitoring and Troubleshooting

### Checking Current Limits

```bash
# Via CLI
mekong tier-admin list
mekong tier-admin overrides

# Direct database query
psql "$(npx supabase db url)" -c "SELECT tier, preset, rate_limit FROM tier_configs ORDER BY tier, preset"
```

### Debugging Rate Limiting Issues

1. **Verify license key has tier:**
   ```bash
   # Check JWT payload contains tier claim
   mekong license validate YOUR_KEY
   ```

2. **Check database has config:**
   ```sql
   SELECT * FROM tier_configs WHERE tier = 'pro' AND preset = 'api_default';
   ```

3. **Check tenant override exists:**
   ```sql
   SELECT * FROM tenant_rate_limits WHERE tenant_id = 'your-tenant';
   ```

### Rate Limit Headers in Production

All responses include rate limit headers for debugging:

```http
HTTP/1.1 200 OK
X-RateLimit-Tier: pro
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1741401600
```

---

## Migration Guide

### From Old Rate Limiter System

1. **Backup existing data:**
   ```sql
   CREATE TABLE tier_configs_backup AS SELECT * FROM tier_configs;
   ```

2. **Run migration:**
   ```bash
   supabase db push
   # or manually run src/db/migrations/005_create_tier_configs.sql
   ```

3. **Verify defaults seeded:**
   ```sql
   SELECT tier, preset, rate_limit FROM tier_configs;
   ```

4. **Update middleware reference to new module:**
   ```python
   # Old
   from src.auth.rate_limiter import RateLimitPreset, get_rate_limiter

   # New
   from src.lib.tier_config import get_preset_config
   from src.lib.rate_limiter_factory import get_rate_limiter
   ```

---

## API Examples

### cURL Examples

#### Check Rate Limit Headers

```bash
curl -i \
  -H "X-License-Key: YOUR_LICENSE_KEY" \
  "https://api.example.com/endpoint"
```

Response includes:
```http
HTTP/2 200
x-ratelimit-tier: pro
x-ratelimit-limit: 100
x-ratelimit-remaining: 99
x-ratelimit-reset: 1741401660
```

#### Rate Limited Response

```bash
curl -i \
  -H "X-License-Key: FREE_KEY_WITHOUT_CREDITS" \
  "https://api.example.com/endpoint"
```

Response:
```http
HTTP/2 429 Too Many Requests
x-ratelimit-tier: free
x-ratelimit-limit: 20
retry-after: 45

{"error":"rate_limit_exceeded","message":"Rate limit exceeded for free tier","retry_after":45,"tier":"free","limit":20}
```

#### Setting Override via CLI

```bash
mekong tier-admin override my-tenant api_default 500 60
```

---

## Configuration Reference Summary

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `MEKONG_DEV_MODE` | `false` | Bypass rate limiting in dev |
| `DISABLE_RATE_LIMITING` | `false` | Global rate limiter toggle |
| `RATE_LIMIT_CACHE_TTL` | `300` | Cache TTL in seconds |

### Database Tables

| Table | Purpose |
|-------|---------|
| `tier_configs` | Default rate limits per tier/preset |
| `tenant_rate_limits` | Per-tenant custom overrides |

### Default Presets

| Preset | Free | Trial | Pro | Enterprise |
|--------|------|-------|-----|------------|
| `auth_login` | 5/min | 10/min | 30/min | 100/min |
| `auth_callback` | 10/min | 20/min | 60/min | 200/min |
| `auth_refresh` | 10/min | 20/min | 60/min | 200/min |
| `api_default` | 20/min | 40/min | 100/min | 500/min |

---

## Appendix: Implementation Details

### File Structure

```
src/
├── lib/
│   ├── tier_config.py              # Tier enum and default configurations
│   ├── tier_rate_limit_middleware.py  # FastAPI middleware
│   └── rate_limiter_factory.py   # Factory with caching
├── db/
│   ├── tier_config_repository.py  # Database operations
│   └── migrations/
│       └── 005_create_tier_configs.sql  # Schema + seed
└── commands/
    └── tier_admin.py              # CLI commands
```

### Class Structure

```
TierRateLimitMiddleware (FastAPI middleware)
  └─ _get_rate_limiter(tier, preset)
      └─ RateLimiterFactory.get_rate_limiter()
          └─ TierRateLimiter (token bucket)
              ├─ acquire()  # Try to consume token
              ├─ get_wait_time()  # Calculate wait if limited
              └─ reset()  # Reset to full capacity

RateLimiterFactory
  ├─ get_config_for_tier(tier, preset)  # With cache
  ├─ get_rate_limiter(tier, preset)  # Get limiter instance
  ├─ invalidate_cache(tier=None)  # Clear cache
  └─ get_all_tier_configs()  # Get all configs

TierConfigRepository
  ├─ get_config(tier, preset)  # DB lookup
  ├─ update_config(tier, preset, rate_limit, window)  # Insert/Update
  ├─ get_all_configs()  # Get all tier configs
  ├─ set_tenant_override(...)  # Create override
  ├─ get_all_tenant_overrides(...)  # List overrides
  └─ cleanup_expired_overrides()  # Cleanup
```

---

## Related Documentation

- `docs/project-changelog.md` — Phase 6 release notes
- `docs/authentication.md` — OAuth2 and session management
- `src/lib/jwt_license_generator.py` — License key validation
- `tests/test_tier_rate_limiting.py` — Test suite documentation

---

*Last Updated: 2026-03-07*
*ROIaaS Phase 6: Tier-Based Rate Limiting*
