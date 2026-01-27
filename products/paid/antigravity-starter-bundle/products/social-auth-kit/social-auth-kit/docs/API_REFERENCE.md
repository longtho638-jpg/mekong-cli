# API Reference

Complete documentation for the **Social Auth Kit** REST API.

## Base URL
- **Local**: `http://localhost:8000/api/v1`
- **Production**: `https://api.yourdomain.com/api/v1`

## Authentication
Most endpoints are public, but user-facing endpoints require an `Authorization` header with a Bearer token.

```http
Authorization: Bearer <your_access_token>
```

---

## 🔐 Auth Endpoints

### 1. Login with Provider
Initiates the OAuth2 flow by redirecting the user to the provider's consent page.

- **URL**: `/auth/login/{provider}`
- **Method**: `GET`
- **URL Params**:
  - `provider`: `google` | `github` | `discord`

**Response**:
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/auth?client_id=..."
}
```
**Usage**: Redirect the user's browser to the `authorization_url`.

---

### 2. OAuth Callback
Handles the redirect from the provider, exchanges code for tokens, and creates/updates the user.

- **URL**: `/auth/callback/{provider}`
- **Method**: `GET`
- **Query Params**:
  - `code`: The authorization code returned by the provider.
  - `state`: The CSRF state parameter.

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "user": {
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://lh3.googleusercontent.com/..."
  }
}
```
**Cookies Set**:
- `refresh_token`: HTTPOnly, Secure, SameSite=Lax (Contains the refresh token)

---

### 3. Refresh Access Token
Exchanges a valid refresh token cookie for a new access token. Used when the access token expires (401 Unauthorized).

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Cookies**: `refresh_token` (Required)

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer"
}
```
**Note**: This rotates the refresh token. A new `refresh_token` cookie is set in the response.

---

### 4. Logout
Revokes the refresh token and clears the auth cookies.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Cookies**: `refresh_token` (Optional)

**Response**: `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## 👤 User Endpoints

### 1. Get Current User
Retrieve the profile of the currently authenticated user.

- **URL**: `/users/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <access_token>`

**Response**: `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_superuser": false,
  "avatar_url": "https://..."
}
```

---

## ⚠️ Error Codes

| Status Code | Error Message | Description |
|-------------|---------------|-------------|
| `400 Bad Request` | `Unknown provider` | The provider specified in the URL is not supported. |
| `400 Bad Request` | `OAuth error: ...` | Failed to exchange code for token or get user info. |
| `401 Unauthorized` | `Not authenticated` | Missing or invalid Access Token. |
| `401 Unauthorized` | `Refresh token missing` | The `refresh_token` cookie was not sent. |
| `401 Unauthorized` | `Invalid refresh token` | The token does not exist in the DB (revoked). |
| `401 Unauthorized` | `Refresh token expired` | The token has passed its expiration time. |
| `403 Forbidden` | `Could not validate credentials` | JWT signature verification failed. |
