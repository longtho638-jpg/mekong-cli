# AgencyOS - Deployment Guide

**Version:** 5.1.1
**Last Updated:** 2026-01-25

## Prerequisites

- Google Cloud account (for Cloud Run)
- Vercel account (for frontend)
- Supabase account (for database)
- PayPal/Stripe accounts (for payments)

## Environment Setup

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
PAYPAL_MODE=live  # or 'sandbox'
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SECRET_KEY=your_secure_random_string_for_jwt_signing  # REQUIRED

### Quota Server Configuration
The Quota Server manages Google Cloud accounts for Gemini models. It loads credentials from a local JSON file to prevent hardcoding secrets.

1. **Setup Configuration File:**
   ```bash
   # Copy example to the required location
   cp ~/.mekong/quota_accounts.json.example ~/.mekong/quota_accounts.json
   ```

2. **Configure Accounts:**
   Edit `~/.mekong/quota_accounts.json` to add your Google Cloud credentials (cookies).
   *Note: This file contains sensitive credentials and is excluded from git.*
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.agencyos.network
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment Steps

### 1. Backend Deployment (Cloud Run)
```bash
cd /Users/macbookprom1/mekong-cli
./deploy-production.sh
```

### 2. Frontend Deployment (Vercel)
```bash
# Auto-deploys on push to main branch
git push origin main

# Manual deployment:
cd apps/dashboard
vercel --prod
```

### 3. Configure Webhooks

**PayPal Webhook URL:**
```
https://api.agencyos.network/api/payments/paypal/webhook
```

**Stripe Webhook URL:**
```
https://api.agencyos.network/api/payments/stripe/webhook
```

## Health Checks

```bash
# Backend
curl https://api.agencyos.network/health

# Frontend
curl https://agencyos.network
```

## Rollback Procedure

```bash
# Backend
./deploy-production.sh --rollback

# Frontend
vercel rollback
```

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
