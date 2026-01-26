# Security Guide

Security is critical for any production deployment. Here are best practices for securing your Feedback Widget Kit integration.

## 1. CORS Configuration

By default, the kit is configured with `allow_origins=["*"]` for ease of development. **In production, you MUST restrict this.**

**Update `backend/app/main.py` or `backend/.env`:**

```python
# backend/app/main.py

origins = [
    "https://your-production-app.com",
    "https://admin-dashboard.your-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # ...
)
```

This prevents unauthorized websites from embedding your feedback widget and spamming your backend.

## 2. Rate Limiting

To prevent spam/abuse of the feedback endpoint, consider adding rate limiting.
You can use a library like `slowapi` for FastAPI or configure rate limiting at the reverse proxy level (Nginx/Cloudflare).

**Example using Nginx:**
```nginx
limit_req_zone $binary_remote_addr zone=feedback_limit:10m rate=1r/m;

location /api/v1/feedback {
    limit_req zone=feedback_limit burst=5;
    # ...
}
```

## 3. Input Sanitization

The backend uses Pydantic for schema validation, which provides a good baseline.
- **Content:** The text content is stored as-is. When displaying this content in the Dashboard, ensure it is properly escaped to prevent XSS (React does this by default).
- **Screenshots:** The backend accepts image uploads.
  - Ensure `UPLOAD_DIR` is outside the web root if possible, or strictly serve only image mime types.
  - The current implementation serves files via `StaticFiles`. Ensure no executable files can be uploaded (FastAPI `UploadFile` content-type checking is recommended).

## 4. Admin Dashboard Access

The Admin Dashboard currently connects directly to the API.
**Protect the Dashboard:**
- **Network Level:** Only allow access to the dashboard from internal VPN or specific IP addresses.
- **Authentication:** Add a login layer to the Dashboard and protect the Admin API endpoints (`GET /feedback`, `PATCH /feedback`, `DELETE /feedback`).
  - You can implement Basic Auth or OAuth2 in FastAPI.

## 5. File Upload Security

- **Size Limit:** Configure a maximum file size for screenshots to prevent DoS (e.g., 5MB).
- **Validation:** Verify that uploaded files are actually images.

## 6. HTTPS

Always use HTTPS in production. Feedback data can contain sensitive user information.
- Use Let's Encrypt with Nginx or Caddy.
- If using Cloudflare, enable "Always Use HTTPS".
