---
sidebar_position: 1
---

# Authentication

AgencyOS supports **OAuth 2.0** and **JWT (JSON Web Token)** authentication.

## OAuth 2.0 Flow

For third-party integrations, use the standard OAuth 2.0 Authorization Code flow.

### 1. Authorization Request

Redirect the user to:

```http
GET https://api.agencyos.com/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &response_type=code
  &scope=read:users write:projects
```

### 2. Token Exchange

Exchange the authorization code for an access token:

```bash
curl -X POST https://api.agencyos.com/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### 3. Use Access Token

Include the token in the `Authorization` header:

```bash
curl https://api.agencyos.com/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Keys (Server-to-Server)

For backend scripts, you can use API Keys.

```bash
curl https://api.agencyos.com/v1/projects \
  -H "X-API-Key: YOUR_API_KEY"
```

Generate API keys in your **Developer Settings**.
