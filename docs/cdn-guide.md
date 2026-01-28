# CDN Integration Guide (IPO-057)

## Overview
This guide details the Content Delivery Network (CDN) integration for Mekong CLI, ensuring high availability, low latency, and enhanced security for static assets and API endpoints.

## Providers
- **Primary**: Cloudflare (Global edge delivery, DDoS protection, WAF).
- **Secondary (Failover)**: Fastly (High-performance edge computing).

## Architecture
- **Edge Layer**: Cloudflare acts as the reverse proxy for `api.agencyos.dev` and `app.agencyos.dev`.
- **Origin Shield**: Fastly (optional configuration) or direct origin fetch with strict authenticated origin pulls.
- **Asset Storage**: S3-compatible storage (AWS S3 or Cloudflare R2) serving static assets via the CDN.

## Configuration
### Cloudflare
- **DNS**: Managed via Terraform in `infra/cdn/cloudflare.tf`.
- **Caching Rules**:
  - `/*` (Static assets): Cache Everything, TTL 1 year.
  - `/api/*` (API): No Cache (Dynamic).
- **WAF**: Enabled with rules for rate limiting (IPO-054) and SQL injection protection.

### Backend Integration
- **Service**: `backend/services/cdn_service.py`
- **Cache Invalidation**:
  - Automated invalidation on deployment.
  - API endpoint: `POST /api/v1/admin/cdn/purge` for manual clearing.

## Deployment
CDN configurations are deployed via Infrastructure as Code (IaC) using Terraform.
```bash
cd infra
terraform apply -target=module.cdn
```

## Monitoring
- **Metrics**: Cache Hit Ratio, Bandwidth Saved, Request Latency available in the Admin Dashboard (Infrastructure tab).
- **Alerting**: High 5xx error rates or low cache hit ratios trigger PagerDuty alerts.
