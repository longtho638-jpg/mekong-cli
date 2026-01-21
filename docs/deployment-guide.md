# Deployment Guide

## 1. Local Production (Docker Compose)
To run the full stack locally in production mode:

```bash
docker-compose up --build -d
```

Services:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Postgres**: localhost:5432
- **Redis**: localhost:6379

## 2. Kubernetes Deployment
Manifests are located in `k8s/`.

### Prerequisites
- Kubernetes cluster (GKE, EKS, or DigitalOcean)
- `kubectl` configured
- `cert-manager` installed for SSL

### Deploy
```bash
# Create namespace
kubectl create namespace agencyos

# Apply secrets (Manual step)
kubectl create secret generic mekong-secrets \
  --from-literal=database-url='postgresql://user:pass@db-host:5432/db' \
  -n agencyos

# Apply manifests
kubectl apply -f k8s/
```

## 3. CI/CD
GitHub Actions workflow `.github/workflows/deploy.yml` automatically:
1. Builds Docker images on push to `main`
2. Pushes to GitHub Container Registry (GHCR)
3. Deploys to K8s (requires KUBECONFIG secret)
