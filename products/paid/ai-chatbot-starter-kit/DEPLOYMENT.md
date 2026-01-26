# Deployment Guide

This starter kit is containerized using Docker, making it easy to deploy to any cloud provider that supports Docker/Containers.

## Deploying to Railway (Recommended)

1.  **Fork/Push this repo to GitHub.**
2.  **Create a New Project on Railway.**
3.  **Add Services**:
    - Import from GitHub repo.
    - Railway usually auto-detects the `Dockerfile` in root. Since we have multiple, you need to configure "Root Directory".
    - **Backend Service**: Set Root Directory to `backend/`.
    - **Frontend Service**: Set Root Directory to `frontend/`.
4.  **Add Databases**:
    - Add a Redis service.
    - Add a PostgreSQL service.
5.  **Configure Environment Variables**:
    - In Backend service:
        - `REDIS_URL`: `redis://<railway-redis-host>:<port>`
        - `DATABASE_URL`: `postgresql://...`
        - `OPENAI_API_KEY`: ...
    - In Frontend service:
        - `NEXT_PUBLIC_API_URL`: `https://<your-backend-url>/api/v1`

## Deploying to Render

1.  **Create Web Service (Backend)**:
    - Build Context: `backend`
    - Environment: Docker
    - Vars: `OPENAI_API_KEY`, `REDIS_URL` (Internal Redis), `DATABASE_URL` (Internal Postgres).
2.  **Create Web Service (Frontend)**:
    - Build Context: `frontend`
    - Environment: Docker
    - Vars: `NEXT_PUBLIC_API_URL` pointing to backend URL.

## Production Checklist

- [ ] **Security**: Change default passwords in `docker-compose.yml` if using self-hosted.
- [ ] **SSL**: Ensure your backend is served over HTTPS to avoid Mixed Content errors.
- [ ] **Rate Limiting**: Enable rate limiting in `backend/app/utils/rate_limiter.py` (if implemented) or use Cloudflare.
- [ ] **Persistence**: Ensure `backend/chroma_db` is mounted to a persistent volume if strictly using local storage, or switch to a cloud vector DB (Pinecone/Weaviate) for scalable production.
