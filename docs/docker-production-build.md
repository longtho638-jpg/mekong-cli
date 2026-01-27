# AgencyOS Backend - Production Docker Build

## 📋 Overview

Production-ready multi-stage Dockerfile for AgencyOS FastAPI backend with optimizations for:
- **Security**: Non-root user, minimal attack surface
- **Performance**: Layer caching, multi-stage build, uvloop/httptools
- **Size**: Optimized dependencies, excluded unnecessary files
- **Reliability**: Health checks, graceful shutdown, auto-restart

## 🏗️ Architecture

### Multi-Stage Build

```
┌─────────────────────────────────────────────────────────┐
│ Stage 1: Builder (python:3.11-slim-bookworm)           │
│ - Install build dependencies                            │
│ - Compile Python packages                               │
│ - Create isolated /install prefix                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 2: Runtime (python:3.11-slim-bookworm)           │
│ - Copy compiled packages from builder                   │
│ - Install minimal runtime dependencies                  │
│ - Create non-root user (agencyos:1000)                  │
│ - Copy application code                                 │
│ - Configure health checks                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Stage 3: Development (extends runtime)                 │
│ - Add debugging tools (git, vim, iputils)               │
│ - Install pytest, black, mypy, etc.                     │
│ - Enable hot reload with --reload flag                  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Build Production Image

```bash
docker build --target runtime -t agencyos-backend:latest .
```

### 2. Build Development Image

```bash
docker build --target development -t agencyos-backend:dev .
```

### 3. Run Production Container

```bash
docker run -d \
  -p 8000:8000 \
  -e SECRET_KEY=your-secret-key \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  --name agencyos-backend \
  agencyos-backend:latest
```

### 4. Run with Docker Compose

```bash
# Production
docker-compose up -d app

# Development (with hot reload)
docker-compose up -d backend-dev
```

## 🔧 Build Options

### Target Stages

| Target | Use Case | Size | Features |
|--------|----------|------|----------|
| `runtime` | Production | ~450MB | Minimal, secure, fast |
| `development` | Local dev | ~550MB | Debugging tools, hot reload |

### Build Arguments

```bash
docker build \
  --target runtime \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  --tag agencyos-backend:v3.0.0 \
  .
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `WORKERS` | `4` | Uvicorn worker processes |
| `ENVIRONMENT` | `production` | Environment mode |
| `PYTHONPATH` | `/app` | Python module search path |
| `SECRET_KEY` | - | **Required** JWT secret key |
| `DATABASE_URL` | - | Database connection string |
| `REDIS_URL` | - | Redis connection string |

## 📊 Performance Optimizations

### Layer Caching Strategy

1. **Dependencies first**: `COPY requirements.txt` before application code
2. **Separate builder stage**: Compile wheels once, reuse across builds
3. **Isolated prefix**: `/install` directory for clean copy to runtime
4. **Minimal base**: `python:3.11-slim-bookworm` (not `python:3.11-alpine`)

### Runtime Optimizations

- **uvloop**: Faster event loop (2-4x performance gain)
- **httptools**: Faster HTTP parsing
- **Multiple workers**: `--workers 4` for CPU utilization
- **Proxy headers**: `--proxy-headers` for reverse proxy support

## 🔒 Security Features

### Non-Root User

```dockerfile
RUN groupadd -r -g 1000 agencyos && \
    useradd -r -u 1000 -g agencyos -m -s /bin/bash agencyos
USER agencyos
```

### Minimal Attack Surface

- Only essential runtime dependencies installed
- No build tools in final image
- Read-only filesystem support
- Security labels via OCI annotations

### Secret Management

```bash
# Use Docker secrets (Swarm/Kubernetes)
docker secret create db_password ./db_password.txt
docker service create \
  --secret db_password \
  --env DATABASE_PASSWORD_FILE=/run/secrets/db_password \
  agencyos-backend:latest

# Or use environment variables (less secure)
docker run -e SECRET_KEY=$(cat secret.txt) agencyos-backend:latest
```

## 🏥 Health Checks

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
```

### Endpoints

- **`GET /health`**: Detailed health status
- **`GET /`**: Basic health check

### Monitoring

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' agencyos-backend

# View health logs
docker inspect --format='{{json .State.Health}}' agencyos-backend | jq
```

## 📦 Image Size Optimization

### Before vs After

| Image | Size |
|-------|------|
| Before (single-stage) | ~1.2GB |
| After (multi-stage) | ~450MB |
| **Savings** | **~63%** |

### .dockerignore Optimizations

Excludes:
- Virtual environments (`.venv/`, `venv/`)
- Tests (`tests/`, `.pytest_cache/`)
- Documentation (`docs/`, `*.md`)
- IDE files (`.vscode/`, `.idea/`)
- Git history (`.git/`)
- Frontend code (`frontend/`, `node_modules/`)

## 🧪 Testing

### Automated Test Script

```bash
./scripts/test-docker-build.sh
```

This script:
1. Builds production and development images
2. Checks image sizes
3. Starts a test container
4. Verifies health endpoints
5. Cleans up resources

### Manual Testing

```bash
# Build
docker build -t agencyos-test .

# Run
docker run -d -p 8000:8000 --name test agencyos-test

# Test health
curl http://localhost:8000/health

# Check logs
docker logs test

# Cleanup
docker stop test && docker rm test
```

## 🚢 Deployment

### Google Cloud Run

```bash
# Tag for GCR
docker tag agencyos-backend:latest gcr.io/PROJECT_ID/agencyos-backend:latest

# Push to GCR
docker push gcr.io/PROJECT_ID/agencyos-backend:latest

# Deploy
gcloud run deploy agencyos-backend \
  --image gcr.io/PROJECT_ID/agencyos-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="ENVIRONMENT=production"
```

### AWS ECS

```bash
# Tag for ECR
docker tag agencyos-backend:latest AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/agencyos:latest

# Push to ECR
docker push AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/agencyos:latest

# Update ECS service
aws ecs update-service \
  --cluster agencyos-cluster \
  --service agencyos-backend \
  --force-new-deployment
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agencyos-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agencyos-backend
  template:
    metadata:
      labels:
        app: agencyos-backend
    spec:
      containers:
      - name: backend
        image: agencyos-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: agencyos-secrets
              key: secret-key
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 40
          periodSeconds: 30
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
```

## 🐛 Troubleshooting

### Build Failures

**Problem**: Dependency compilation fails
```bash
# Solution: Check build logs
docker build --no-cache --progress=plain -t agencyos-backend:debug .
```

**Problem**: Image size too large
```bash
# Solution: Verify .dockerignore
docker build --target runtime -t test . && docker images test
```

### Runtime Issues

**Problem**: Container exits immediately
```bash
# Check logs
docker logs agencyos-backend

# Run interactively
docker run -it --rm agencyos-backend:latest /bin/bash
```

**Problem**: Health check fails
```bash
# Test inside container
docker exec agencyos-backend curl -f http://localhost:8000/health

# Check environment
docker exec agencyos-backend env
```

## 📚 References

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Python Docker Best Practices](https://docs.docker.com/language/python/build-images/)
- [Security Scanning](https://docs.docker.com/engine/scan/)

## 🎯 Next Steps

1. **CI/CD Integration**: Add to GitHub Actions
2. **Security Scanning**: Integrate Trivy/Snyk
3. **Performance Testing**: Load test with Locust
4. **Monitoring**: Add Prometheus metrics
5. **Logging**: Integrate with ELK/Loki stack

---

**Built with ❤️ by AgencyOS Team**
**Version**: 3.0.0 | **Last Updated**: 2026-01-27
