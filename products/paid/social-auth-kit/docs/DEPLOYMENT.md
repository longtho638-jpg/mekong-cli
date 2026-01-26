# Deployment Guide

## 1. Environment Variables

Ensure these variables are set in your production environment (e.g., Railway, Heroku, AWS).

| Variable | Description |
|----------|-------------|
| `POSTGRES_SERVER` | Database Host |
| `POSTGRES_USER` | Database User |
| `POSTGRES_PASSWORD` | Database Password |
| `POSTGRES_DB` | Database Name |
| `SECRET_KEY` | Long random string for JWT signing |
| `BACKEND_CORS_ORIGINS` | JSON list of allowed frontend origins (e.g. `["https://myapp.com"]`) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GITHUB_CLIENT_ID` | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | From GitHub Developer Settings |

## 2. Docker Deployment

The kit includes a production-ready `Dockerfile`.

1. **Build Image**:
```bash
docker build -t social-auth-kit-backend ./backend
```

2. **Run Container**:
```bash
docker run -d -p 8000:8000 --env-file .env social-auth-kit-backend
```

## 3. Database Migrations

When deploying updates, always run migrations:

```bash
docker exec -it <container_id> alembic upgrade head
```

## 4. HTTPS Requirement

The Refresh Token cookie is set with `Secure=True` by default in the code. This means **it will only be sent over HTTPS**.
- Ensure your production domain has SSL enabled.
- If testing on `localhost` without HTTPS, you may need to set `secure=False` in `auth.py` temporarily, OR use a local proxy like `mkcert`.

## 5. Security Checklist

- [ ] **Secret Key**: Ensure `SECRET_KEY` is high entropy (use `openssl rand -hex 32`).
- [ ] **CORS**: Only allow your specific frontend domain.
- **Allowed Hosts**: If using `TrustedHostMiddleware`, configure allowed hosts.
- [ ] **Rate Limiting**: Configure rate limits on the `/auth/login` endpoint if needed (e.g., via Nginx or API Gateway).
