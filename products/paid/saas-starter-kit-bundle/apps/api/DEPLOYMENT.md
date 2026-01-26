# Deployment Guide

This application is designed to be deployed on any container-orchestration platform (Kubernetes, ECS) or standard VPS (DigitalOcean, EC2).

## Build Process

1.  **Compile TypeScript**
    ```bash
    npm run build
    ```
    This generates JS files in `dist/`.

2.  **Environment Variables**
    Ensure all production environment variables are set. **NEVER** check `.env` into version control.

## Deployment Checklist

- [ ] **Database**: Use a managed database service (RDS, Cloud SQL) for production.
- [ ] **Redis**: Use a managed Redis instance (ElastiCache, Memorystore).
- [ ] **Security**:
    - Set `NODE_ENV=production`.
    - Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to long, random strings.
    - Enable SSL/TLS (HTTPS) at the load balancer level.
- [ ] **Process Management**: Use PM2 or Docker to manage the node process.

## PM2 Setup

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: "api-starter",
    script: "./dist/server.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
```

Run: `pm2 start ecosystem.config.js --env production`

## Cloud Run (Google Cloud)

1.  **Containerize**
    Create a `Dockerfile` for production:

    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY dist ./dist
    COPY prisma ./prisma
    CMD ["node", "dist/server.js"]
    ```

2.  **Deploy**
    ```bash
    gcloud run deploy api-service \
      --image gcr.io/PROJECT_ID/api-image \
      --platform managed \
      --region us-central1 \
      --set-env-vars NODE_ENV=production,DB_URL=...
    ```
