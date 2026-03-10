# Authentication Guide

## Overview

Mekong CLI implements a comprehensive OAuth2 authentication system with Google and GitHub support, RBAC (Role-Based Access Control), and Stripe integration for subscription-based role provisioning.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Authentication Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User visits /login                                       │
│     ↓                                                         │
│  2. OAuth2 Provider Selection (Google / GitHub)             │
│     ↓                                                         │
│  3. Redirect to Provider Authorization URL                   │
│     ↓                                                         │
│  4. User grants permission at provider                       │
│     ↓                                                         │
│  5. Provider redirects to callback (/auth/*/callback)       │
│     ↓                                                         │
│  6. Exchange authorization code for access token             │
│     ↓                                                         │
│  7. Fetch user info from provider                            │
│     ↓                                                         │
│  8. Create/find user in database                             │
│     ↓                                                         │
│  9. Generate JWT access + refresh tokens                     │
│     ↓                                                         │
│  10. Set HTTPOnly session cookie                             │
│     ↓                                                         │
│  11. Redirect to /dashboard                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## OAuth2 Setup

### Google OAuth2

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Configure consent screen if prompted

2. **Configure Authorized Redirect URIs**
   ```
   http://localhost:8080/auth/google/callback
   https://yourdomain.com/auth/google/callback
   ```

3. **Set scopes required:**
   - `openid`
   - `email`
   - `profile`

4. **Enables keep me signed in**
   - `access_type`: `offline`
   - `prompt`: `consent` (for refresh tokens)

### GitHub OAuth2

1. **Create OAuth App**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click **OAuth Apps** → **New OAuth App**
   - Fill in application details

2. **Configure Authorization Callback URL**
   ```
   http://localhost:8080/auth/github/callback
   https://yourdomain.com/auth/github/callback
   ```

3. **Request user email permission**
   - Enable **Request user email address** (optional)

## Environment Variables

### Required for All Environments

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_ENVIRONMENT` | Environment mode: `dev`, `staging`, `production` | `production` |
| `JWT_SECRET` | Secret key for JWT signing (use strong random string in prod) | `change-this-in-prod` |
| `JWT_ACCESS_EXPIRY_MINUTES` | Access token expiry in minutes | `30` |
| `JWT_REFRESH_EXPIRY_DAYS` | Refresh token expiry in days | `7` |

### OAuth2 Provider Credentials

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | If using Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | If using Google login |
| `GOOGLE_REDIRECT_URI` | Google OAuth2 redirect URI | If using Google login |
| `GITHUB_CLIENT_ID` | GitHub OAuth2 client ID | If using GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth2 client secret | If using GitHub login |
| `GITHUB_REDIRECT_URI` | GitHub OAuth2 redirect URI | If using GitHub login |

### Session Cookie Settings

| Variable | Description | Default | Prod Value |
|----------|-------------|---------|------------|
| `SESSION_MAX_AGE_SECONDS` | Session cookie max age | `604800` (7 days) | Same |
| `SESSION_COOKIE_NAME` | Cookie name | `session_token` | Same |

### Stripe Integration (Optional but Recommended)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `STRIPE_PRICE_IDS` | JSON mapping of Price ID → Role | See below |

#### Stripe Price ID to Role Mapping

Default mapping (can be overridden via `STRIPE_PRICE_IDS` env var):

```json
{
  "price_enterprise": "owner",
  "price_pro": "admin",
  "price_trial": "member",
  "price_free": "viewer"
}
```

## RBAC Roles

### Role Hierarchy

```
owner (highest)
  ├── admin
  │     ├── member
  │     │     └── viewer (lowest)
  │     └── viewer
  └── member
      └── viewer
```

### Roles and Permissions

| Role | View Dashboard | Export Data | Create/Update | Delete | Manage Users | Manage Billing | System Config |
|------|----------------|-------------|---------------|--------|--------------|----------------|---------------|
| **owner** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **admin** | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **member** | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **viewer** | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

### Programmatically Checking Access

```python
from src.auth.rbac import Role, has_permission, require_role, get_current_user

# In route handler
@router.get("/admin")
@require_role(Role.ADMIN, Role.OWNER)
async def admin_route(request: Request):
    user = get_current_user(request)
    # user = {"id": "...", "email": "...", "role": "admin"}

# Check permission
if has_permission(user_role, Permission.MANAGE_USERS):
    # User can manage users
```

### Permission Decorators

```python
from src.auth.rbac import require_permission, Permission

@router.post("/users")
@require_permission(Permission.MANAGE_USERS)
async def create_user(request: Request):
    # Only users with MANAGE_USERS permission can access
    ...

@router.delete("/resources/{id}")
@require_permission(Permission.DELETE_RESOURCES)
async def delete_resource(request: Request):
    # Only users with DELETE_RESOURCES permission can access
    ...
```

## Stripe Integration

### Webhook Endpoints

The system receives Stripe webhooks at `/auth/webhook/stripe` to automatically update user roles when subscriptions change.

### Supported Webhook Events

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Provision role based on price tier |
| `customer.subscription.updated` | Update role if price tier changed |
| `customer.subscription.deleted` | Downgrade to `viewer` role |
| `customer.deleted` | Revoke access (set to `viewer`) |

### Webhook Signature Verification

All webhooks are verified using HMAC SHA-256 signature to ensure they originate from Stripe.

### Syncing User Role from Stripe

```python
from src.auth.stripe_integration import sync_user_from_stripe

# Sync user role from their Stripe subscription
success = await sync_user_from_stripe(user_id="user-uuid")
```

### Role Provisioning Flow

```
User purchases subscription → Stripe webhook received →
Role mapped from price ID → User role updated in database →
Next request uses updated role
```

## Local Development Configuration

### .env-dev Template

```bash
# Environment
AUTH_ENVIRONMENT=dev
JWT_SECRET=dev-secret-for-local-testing
JWT_ACCESS_EXPIRY_MINUTES=30
JWT_REFRESH_EXPIRY_DAYS=7

# OAuth2 (optional - will show "Login with..." buttons)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Stripe (optional - for testing subscription flow)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Development Mode Features

- Auto-authenticate all requests as `owner` role
- Skip OAuth2 provider redirects
- Use `POST /auth/dev-login` for test user creation

## Production Configuration

### .env-prod Template

```bash
# Environment
AUTH_ENVIRONMENT=production
JWT_SECRET=generate-strong-random-32-char-string-here
JWT_ACCESS_EXPIRY_MINUTES=30
JWT_REFRESH_EXPIRY_DAYS=7

# OAuth2 (REQUIRED for production)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback

# Cookie settings (secure for production)
SESSION_MAX_AGE_SECONDS=604800

# Stripe (REQUIRED for subscription billing)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_IDS={"price_enterprise":"owner","price_pro":"admin","price_trial":"member","price_free":"viewer"}
```

### Security Checklist for Production

- [ ] `JWT_SECRET` is a cryptographically secure random string (32+ chars)
- [ ] OAuth2 redirect URIs match production domain exactly
- [ ] HTTPS enforced on all OAuth callbacks
- [ ] Stripe webhook signature verification enabled
- [ ] Cookie `secure` flag set to `true`
- [ ] Cookie `samesite` set to `none` (with `secure=true`)
- [ ] CSRF protection state parameters validated
- [ ] PKCE code challenge/verifier used for public clients

## Testing Authentication

### Test OAuth2 URLs

```bash
# Test Google OAuth URL generation
python3 -c "
from src.auth.oauth2_providers import get_google_oauth_url
# Result: https://accounts.google.com/o/oauth2/v2/auth?...
"

# Test GitHub OAuth URL generation
python3 -c "
from src.auth.oauth2_providers import get_github_oauth_url
# Result: https://github.com/login/oauth/authorize?...
"
```

### Test Dev Login

```bash
# Create test user in dev mode
curl -X POST http://localhost:8080/auth/dev-login

# Response:
{
  "success": true,
  "message": "Dev login successful",
  "user": {
    "id": "...",
    "email": "dev@example.com",
    "role": "owner"
  }
}
```

### Verify Webhook Signature

```python
from src.auth.stripe_integration import verify_stripe_webhook

# Verify incoming webhook
payload = request.body()
sig_header = request.headers["Stripe-Signature"]
is_valid = verify_stripe_webhook(payload, sig_header)
```

## Troubleshooting

### Common Issues

1. **"Invalid state parameter"**
   - Cause: CSRF state mismatch
   - Fix: Ensure state is stored in session before redirect

2. **"Token has expired"**
   - Cause: Access token expired
   - Fix: Use refresh token to get new access token

3. **OAuth callback URL not found**
   - Cause: Redirect URI doesn't match registered provider config
   - Fix: Update provider settings with exact callback URL

4. **Stripe webhook signature invalid**
   - Cause: Webhook secret mismatch or relay proxy issue
   - Fix: Verify `STRIPE_WEBHOOK_SECRET` matches dashboard setting

### Debug Mode

Set `LOG_LEVEL=debug` to see detailed authentication logs including:
- Token decode operations
- User lookup results
- Session creation events
