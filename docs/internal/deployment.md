# 🚀 AntigravityKit Deployment Guide

> Production deployment guide for AntigravityKit
> Backend → Cloud Run | Frontend → Vercel

---

## 📋 Prerequisites

- Google Cloud account
- Vercel account
- GitHub repository
- Domain name (optional)

---

## 🐳 Backend Deployment (Cloud Run)

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

## ▲ Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Configure Environment

Create `frontend/.env.production`:

```bash
NEXT_PUBLIC_API_URL=https://agencyos-api-xxx.run.app
```

### Step 3: Deploy

```bash
cd frontend
vercel --prod
```

### Step 4: Configure Domain (Optional)

```bash
# Add custom domain
vercel domains add agencyos.network

# Point frontend to domain
vercel alias https://your-deployment.vercel.app agencyos.network
```

---

## 🔧 Environment Variables

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

## 🌐 DNS Configuration

### For api.agencyos.network (Backend)

```
Type: CNAME
Name: api
Value: ghs.googlehosted.com
```

### For agencyos.network (Frontend)

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## ✅ Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Docker image builds successfully
- [ ] Frontend builds successfully

### Backend Deployment
- [ ] Docker image pushed to GCR
- [ ] Cloud Run service deployed
- [ ] Health check endpoint working
- [ ] CORS configured correctly

### Frontend Deployment
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Production build successful
- [ ] API connection verified

### Post-deployment
- [ ] SSL certificates active
- [ ] DNS configured correctly
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

## 🔍 Health Checks

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

## 📊 Monitoring

### Cloud Run Metrics

```bash
# View logs
gcloud run logs read agencyos-api --region $REGION

# View metrics
gcloud run services describe agencyos-api \
  --region $REGION \
  --format 'get(status.traffic)'
```

### Vercel Analytics

Visit: https://vercel.com/dashboard/analytics

---

## 🔄 CI/CD Setup

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
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./frontend
```

---

## 🐛 Troubleshooting

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
# Check build logs
vercel logs deployment-url
```

---

## 💰 Cost Estimates

### Cloud Run
- **Free tier**: 2M requests/month
- **Typical cost**: $5-20/month (1M requests)

### Vercel
- **Hobby plan**: Free
- **Pro plan**: $20/month (team features)

### Total Estimated Cost
- **Small agency**: $0-10/month
- **Growing agency**: $20-50/month
- **VC-backed**: $50-200/month

---

## 🔒 Security Best Practices

1. **Always use HTTPS**
2. **Enable authentication for admin endpoints**
3. **Set up rate limiting**
4. **Use environment variables for secrets**
5. **Enable Cloud Armor for DDoS protection**
6. **Regular security audits**

---

## 📈 Scaling

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

## ✨ Success!

Your AntigravityKit is now live! 🎊

- **Backend**: https://api.agencyos.network
- **Frontend**: https://agencyos.network
- **Dashboard**: https://agencyos.network/antigravity

---

*Deployment guide v1.0 | Updated: 2026-01-07*
