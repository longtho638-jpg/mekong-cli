# Deployment Guide: AgencyOS / AntigravityKit

> Production deployment guide for AntigravityKit
> Backend → Cloud Run | Frontend → Cloudflare Pages

---

## Prerequisites

- Google Cloud account (backend)
- Cloudflare account (frontend + edge API)
- GitHub repository
- Domain name (optional)

---

## Backend Deployment (Cloud Run)

### Step 1: Prepare Docker Image

Create `Dockerfile` in project root:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY antigravity/ antigravity/
COPY backend/ backend/

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080
ENV PYTHONPATH=/app

# Run application
CMD ["uvicorn", "backend.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 2: Build and Push Image

```bash
# Set project ID
export PROJECT_ID=your-gcp-project
export REGION=asia-southeast1

# Build image
docker build -t gcr.io/$PROJECT_ID/agencyos-api:v1 .

# Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/agencyos-api:v1
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy agencyos-api \
  --image gcr.io/$PROJECT_ID/agencyos-api:v1 \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --port 8080
```

### Step 4: Get Service URL

```bash
gcloud run services describe agencyos-api \
  --region $REGION \
  --format 'value(status.url)'
```

Output example: `https://agencyos-api-xxx.run.app`

---

## Frontend Deployment (Cloudflare Pages)

### Step 1: Connect Repository

1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect your GitHub repository
3. Select root directory: `frontend/` (or project root)
4. Framework preset: `Next.js` or `Astro`

### Step 2: Configure Build Settings

```
Build command:  npm run build
Output dir:     dist  (or .next for Next.js)
Node version:   20
```

### Step 3: Set Environment Variables

In Cloudflare Pages project settings → Environment variables:

```bash
NEXT_PUBLIC_API_URL=https://agencyos-api-xxx.run.app
```

### Step 4: Deploy

```bash
# Cloudflare Pages auto-deploys on every push to main
git push origin main
```

### Step 5: Configure Custom Domain (Optional)

In Cloudflare Pages → project → Custom domains:

```bash
# Add custom domain (agencyos.network)
# Cloudflare handles DNS + SSL automatically when domain is on Cloudflare
```

DNS records (managed via Cloudflare DNS automatically):
```
Type: CNAME
Name: @
Value: <project>.pages.dev  (Cloudflare manages this)
```

---

## Edge API Deployment (Cloudflare Workers)

For lightweight API, webhooks, and middleware:

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy worker
cd apps/raas-gateway
wrangler deploy

# Set secrets
wrangler secret put OPENCLAW_URL
wrangler secret put SERVICE_TOKEN
```

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `PYTHONPATH` | Python path | `/app` |
| `CORS_ORIGINS` | Allowed origins | `https://agencyos.network` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.agencyos.network` |

---

## DNS Configuration

### For api.agencyos.network (Backend)

```
Type: CNAME
Name: api
Value: ghs.googlehosted.com
```

### For agencyos.network (Frontend via Cloudflare Pages)

When domain is managed by Cloudflare, Pages sets DNS automatically.
Manual setup if needed:
```
Type: CNAME
Name: @
Value: <project>.pages.dev
```

---

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Docker image builds successfully
- [ ] Frontend builds successfully (`npm run build`)

### Backend Deployment
- [ ] Docker image pushed to GCR
- [ ] Cloud Run service deployed
- [ ] Health check endpoint working
- [ ] CORS configured correctly

### Frontend Deployment
- [ ] Cloudflare Pages project connected to repo
- [ ] Environment variables set in CF Pages settings
- [ ] Production build successful
- [ ] API connection verified

### Post-deployment
- [ ] SSL certificates active (Cloudflare handles automatically)
- [ ] DNS configured correctly
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## Health Checks

### Backend Health Check

```bash
curl https://api.agencyos.network/health
```

Expected response:
```json
{
  "status": "healthy",
  "modules": {
    "i18n": "loaded",
    "vietnam": "loaded",
    "crm": "loaded",
    "hybrid_router": "loaded",
    "agents": "loaded",
    "antigravity": "loaded"
  }
}
```

### Frontend Health Check

```bash
curl -I https://agencyos.network
```

Expected: `200 OK`

---

## Monitoring

### Cloud Run Metrics

```bash
# View logs
gcloud run logs read agencyos-api --region $REGION

# View metrics
gcloud run services describe agencyos-api \
  --region $REGION \
  --format 'get(status.traffic)'
```

### Cloudflare Analytics

Visit: https://dash.cloudflare.com → Pages → your project → Analytics

---

## CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Build and Push Docker Image
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/agencyos-api:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/agencyos-api:${{ github.sha }}

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy agencyos-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/agencyos-api:${{ github.sha }} \
            --region asia-southeast1

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: agencyos-landing
          directory: ./frontend/dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## Troubleshooting

### Backend Issues

**Problem**: 502 Bad Gateway
```bash
# Check logs
gcloud run logs read agencyos-api --limit 50

# Check service status
gcloud run services describe agencyos-api
```

**Problem**: CORS errors
- Ensure CORS_ORIGINS includes frontend domain
- Check backend logs for details

### Frontend Issues

**Problem**: API connection failed
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check network tab in browser DevTools
- Ensure backend is running

**Problem**: Build failed
```bash
# Check Cloudflare Pages build logs in dashboard
# Dashboard → Pages → project → Deployments → failed deploy → View logs
```

---

## Cost Estimates

### Cloud Run (Backend)
- **Free tier**: 2M requests/month
- **Typical cost**: $5-20/month (1M requests)

### Cloudflare Pages (Frontend)
- **Free plan**: Unlimited sites, 500 builds/month
- **Pro plan**: $20/month (advanced features)

### Total Estimated Cost
- **Small agency**: $0-10/month
- **Growing agency**: $20-50/month
- **VC-backed**: $50-200/month

---

## Security Best Practices

1. **Always use HTTPS** (Cloudflare enforces automatically)
2. **Enable authentication for admin endpoints**
3. **Set up rate limiting** (Cloudflare WAF or Workers)
4. **Use environment variables for secrets**
5. **Enable Cloudflare DDoS protection** (automatic on free plan)
6. **Regular security audits**

---

## Scaling

### Horizontal Scaling (Cloud Run)

```bash
gcloud run services update agencyos-api \
  --min-instances 3 \
  --max-instances 100 \
  --region $REGION
```

### Database Migration (When Needed)

Replace in-memory demo data with:
- Supabase (PostgreSQL)
- Firebase Firestore
- MongoDB Atlas

---

## Success!

Your AgencyOS stack is now live!

- **Backend**: https://api.agencyos.network
- **Frontend**: https://agencyos.network
- **Dashboard**: https://agencyos.network/antigravity

---

*Deployment guide v2.0 | Updated: 2026-03-12 | CF-only*
