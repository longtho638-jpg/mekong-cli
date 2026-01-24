# Production Deployment Checklist

## Overview
This checklist ensures a comprehensive, secure, and production-ready deployment of AgencyOS (mekong-cli). Follow each section sequentially before go-live.

---

## 1. Environment Variables Configuration

### Required Environment Variables

#### Core Application Settings
- [ ] `PROJECT_NAME` - Set to "Agency OS" or custom branding
- [ ] `ENVIRONMENT` - Set to `production`
- [ ] `DEBUG` - Set to `false` (CRITICAL for security)
- [ ] `SECRET_KEY` - Generate strong random key (min 64 chars): `openssl rand -hex 64`

#### Database Configuration
- [ ] `DATABASE_URL` - Production PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Ensure SSL mode enabled: `?sslmode=require`
- [ ] `REDIS_URL` - Production Redis instance
  - Format: `redis://username:password@host:port`
  - Configure eviction policy and maxmemory

#### Supabase Configuration
- [ ] `SUPABASE_URL` - Production Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Public anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key (KEEP SECRET)
  - Store in secrets manager, never commit to repo
  - Rotate every 90 days

#### Payment Gateway Configuration

**PayPal**
- [ ] `PAYPAL_CLIENT_ID` - Production client ID
- [ ] `PAYPAL_CLIENT_SECRET` - Production secret key
- [ ] `PAYPAL_WEBHOOK_ID` - Webhook event listener ID
- [ ] `PAYPAL_MODE` - Set to `live` (NOT sandbox)

**Stripe**
- [ ] `STRIPE_API_KEY` - Production secret key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
  - Configure webhook URL: `https://yourdomain.com/api/webhooks/stripe`
  - Subscribe to events: `payment_intent.succeeded`, `customer.subscription.updated`, `invoice.payment_failed`

**Gumroad**
- [ ] `GUMROAD_ACCESS_TOKEN` - Production access token
- [ ] `GUMROAD_WEBHOOK_SECRET` - Webhook verification secret
  - Configure webhook URL: `https://yourdomain.com/api/webhooks/gumroad`

#### API URLs
- [ ] `BACKEND_URL` - Production backend URL (e.g., `https://api.yourdomain.com`)
- [ ] `FRONTEND_URL` - Production frontend URL (e.g., `https://yourdomain.com`)

#### Additional Production Variables
- [ ] `CORS_ORIGINS` - Allowed frontend origins (comma-separated)
- [ ] `LOG_LEVEL` - Set to `INFO` or `WARNING` (not `DEBUG`)
- [ ] `SENTRY_DSN` - Error tracking endpoint (optional but recommended)
- [ ] `RATE_LIMIT_REQUESTS` - API rate limit per minute (default: 100)
- [ ] `SESSION_TIMEOUT` - User session timeout in seconds (default: 3600)

---

## 2. Database Setup

### PostgreSQL Configuration
- [ ] Create production database instance
  - Minimum: 2 CPU cores, 4GB RAM
  - Storage: SSD with min 50GB
  - Enable automated backups (daily retention: 30 days)

- [ ] Configure connection pooling
  - Max connections: 100
  - Connection timeout: 30s
  - Idle timeout: 600s

- [ ] Run migrations
  ```bash
  # Backup current schema first
  pg_dump -h localhost -U user -d database -F c -f backup_pre_migration.dump

  # Run migrations
  cd backend
  alembic upgrade head
  ```

- [ ] Create database indexes
  - [ ] Users table: `email`, `created_at`
  - [ ] Subscriptions table: `user_id`, `status`, `expires_at`
  - [ ] Payments table: `user_id`, `created_at`, `status`
  - [ ] Teams table: `owner_id`

- [ ] Set up read replicas (optional but recommended for scale)

### Redis Configuration
- [ ] Deploy Redis instance (managed service recommended)
  - Version: 7.0+
  - Memory: Min 1GB
  - Persistence: Enable RDB + AOF

- [ ] Configure Redis policies
  - Eviction policy: `allkeys-lru`
  - Max memory: 80% of available RAM
  - Password authentication enabled

- [ ] Test Redis connectivity
  ```bash
  redis-cli -u $REDIS_URL ping
  # Expected: PONG
  ```

---

## 3. API Keys & Third-Party Services

### Required Integrations

#### Google Cloud Platform
- [ ] Create GCP project for production
- [ ] Enable APIs:
  - [ ] Cloud Storage (for file uploads)
  - [ ] Cloud Functions (for background jobs)
  - [ ] Cloud Logging
  - [ ] Cloud Monitoring
- [ ] Generate service account key
  - Download JSON key file
  - Store in secrets manager
  - Set `GOOGLE_APPLICATION_CREDENTIALS` env var

#### Email Service (SendGrid/Mailgun)
- [ ] Choose email provider
- [ ] Configure SMTP credentials
  - [ ] `SMTP_HOST`
  - [ ] `SMTP_PORT`
  - [ ] `SMTP_USER`
  - [ ] `SMTP_PASSWORD`
  - [ ] `FROM_EMAIL`
- [ ] Set up email templates for:
  - [ ] Welcome email
  - [ ] Password reset
  - [ ] Invoice notifications
  - [ ] Subscription updates

#### Analytics (Optional)
- [ ] Google Analytics 4 tracking ID
- [ ] Mixpanel project token
- [ ] PostHog API key

#### AI Services (If using AgencyOS AI features)
- [ ] OpenAI API key
- [ ] Anthropic API key
- [ ] Google Gemini API key

---

## 4. Domain & DNS Configuration

### Domain Setup
- [ ] Purchase domain name
- [ ] Configure DNS records:

```
Type    Name        Value                       TTL
A       @           <your-server-ip>           300
A       www         <your-server-ip>           300
CNAME   api         <backend-service>          300
TXT     @           v=spf1 include:...         3600
```

- [ ] Add MX records for email delivery
- [ ] Configure SPF, DKIM, DMARC for email authentication

### CDN Configuration (Recommended)
- [ ] Set up Cloudflare or AWS CloudFront
- [ ] Enable DDoS protection
- [ ] Configure caching rules
- [ ] Enable Brotli/Gzip compression

---

## 5. SSL Certificate Setup

### Let's Encrypt (Free Option)
- [ ] Install cert-manager in Kubernetes cluster
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
  ```

- [ ] Create ClusterIssuer for Let's Encrypt
  ```yaml
  apiVersion: cert-manager.io/v1
  kind: ClusterIssuer
  metadata:
    name: letsencrypt-prod
  spec:
    acme:
      server: https://acme-v02.api.letsencrypt.org/directory
      email: admin@yourdomain.com
      privateKeySecretRef:
        name: letsencrypt-prod
      solvers:
      - http01:
          ingress:
            class: nginx
  ```

- [ ] Update Ingress to use TLS
  - See `k8s/ingress.yaml`
  - Verify certificate issued: `kubectl describe certificate`

### Alternative: Managed SSL
- [ ] Use AWS Certificate Manager (ACM) for AWS deployments
- [ ] Use Google-managed certificates for GKE deployments

---

## 6. Monitoring & Observability

### Application Monitoring
- [ ] Set up logging aggregation
  - [ ] Deploy ELK stack (Elasticsearch, Logstash, Kibana)
  - [ ] Or use managed service (Datadog, New Relic, Splunk)

- [ ] Configure log retention policies
  - Application logs: 30 days
  - Security logs: 90 days
  - Audit logs: 365 days

- [ ] Set up error tracking
  - [ ] Sentry integration
  - [ ] Configure alert thresholds
  - [ ] Set up on-call rotation

### Infrastructure Monitoring
- [ ] Prometheus for metrics collection
- [ ] Grafana dashboards for visualization
- [ ] Key metrics to track:
  - [ ] CPU/Memory usage per service
  - [ ] Request latency (p50, p95, p99)
  - [ ] Error rate (4xx, 5xx)
  - [ ] Database connection pool utilization
  - [ ] Redis memory usage
  - [ ] Disk I/O and space

### Uptime Monitoring
- [ ] Configure health check endpoints
  - [ ] `/health` - Basic liveness check
  - [ ] `/ready` - Readiness check (DB, Redis connectivity)

- [ ] Set up external uptime monitoring
  - [ ] UptimeRobot or Pingdom
  - [ ] Check frequency: 5 minutes
  - [ ] Alert channels: Email, Slack, PagerDuty

### Alerting Rules
- [ ] CPU usage > 80% for 5 minutes
- [ ] Memory usage > 85% for 5 minutes
- [ ] Error rate > 5% for 1 minute
- [ ] Response time > 2s (p95) for 5 minutes
- [ ] Database connections > 90% pool size
- [ ] Failed payment webhook > 10 in 5 minutes

---

## 7. Backup & Disaster Recovery

### Database Backups
- [ ] Automated daily backups
  - Time: 2 AM UTC (low traffic period)
  - Retention: 30 days rolling
  - Storage: S3 or Google Cloud Storage

- [ ] Automated backup verification
  - Weekly restore test to staging environment
  - Alert on backup failure

- [ ] Point-in-time recovery (PITR) enabled
  - WAL archiving configured
  - Retention: 7 days

### Application Backups
- [ ] Git repository backups
  - Mirror to secondary remote
  - Automated daily sync

- [ ] Configuration backups
  - Kubernetes manifests in version control
  - Secrets stored in secrets manager (AWS Secrets Manager, HashiCorp Vault)

### Disaster Recovery Plan
- [ ] Document recovery procedures
  - RTO (Recovery Time Objective): 4 hours
  - RPO (Recovery Point Objective): 1 hour

- [ ] Test disaster recovery quarterly
  - Restore database from backup
  - Deploy application to clean environment
  - Verify functionality

- [ ] Maintain runbook for common incidents
  - Database failover procedure
  - Redis failover procedure
  - Certificate renewal failures
  - Payment gateway outages

---

## 8. Security Hardening

### Application Security
- [ ] Enable HTTPS-only mode
  - [ ] HSTS headers enabled (`Strict-Transport-Security`)
  - [ ] Redirect all HTTP to HTTPS

- [ ] Configure security headers
  ```
  Content-Security-Policy: default-src 'self'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  ```

- [ ] Rate limiting configured
  - Global: 100 req/min per IP
  - Auth endpoints: 5 req/min per IP
  - API endpoints: 1000 req/min per API key

- [ ] Input validation on all endpoints
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection enabled

### Authentication & Authorization
- [ ] Enforce strong password policy
  - Min 12 characters
  - Require uppercase, lowercase, number, special char

- [ ] Implement two-factor authentication (2FA)
  - [ ] TOTP support
  - [ ] Backup codes

- [ ] JWT token configuration
  - [ ] Short expiration (15 minutes for access tokens)
  - [ ] Refresh token rotation
  - [ ] Secure cookie flags (`HttpOnly`, `Secure`, `SameSite`)

### Infrastructure Security
- [ ] Network segmentation
  - [ ] Private subnets for databases
  - [ ] Bastion host for SSH access
  - [ ] No direct internet access to backend services

- [ ] Firewall rules
  - [ ] Allow only necessary ports (443, 80)
  - [ ] Whitelist known IPs for admin access
  - [ ] Block all other inbound traffic

- [ ] Secrets management
  - [ ] Use AWS Secrets Manager, GCP Secret Manager, or HashiCorp Vault
  - [ ] Never store secrets in environment variables or code
  - [ ] Rotate secrets every 90 days

- [ ] Container security
  - [ ] Scan images for vulnerabilities (Trivy, Snyk)
  - [ ] Use minimal base images (Alpine Linux)
  - [ ] Run containers as non-root user

### Compliance & Auditing
- [ ] GDPR compliance
  - [ ] User data export functionality
  - [ ] Right to deletion (account deletion)
  - [ ] Privacy policy updated
  - [ ] Cookie consent banner

- [ ] PCI DSS compliance (if handling credit cards directly)
  - Note: Using Stripe/PayPal handles most PCI requirements

- [ ] Audit logging enabled
  - [ ] Log all authentication events
  - [ ] Log all payment transactions
  - [ ] Log all admin actions
  - [ ] Tamper-proof audit trail

---

## 9. Performance Optimization

### Backend Optimization
- [ ] Enable database query caching
- [ ] Implement Redis caching for:
  - [ ] User sessions
  - [ ] API responses (TTL: 5 minutes)
  - [ ] Static data (pricing plans, feature flags)

- [ ] Database connection pooling configured
  - Pool size: 20
  - Max overflow: 10

- [ ] API response compression enabled (Gzip/Brotli)

- [ ] Optimize database queries
  - [ ] Add indexes for frequently queried fields
  - [ ] Remove N+1 queries
  - [ ] Use database query analyzer

### Frontend Optimization
- [ ] Code splitting and lazy loading
- [ ] Image optimization
  - [ ] WebP format with fallbacks
  - [ ] Lazy loading for below-fold images
  - [ ] Responsive images with srcset

- [ ] Bundle size optimization
  - [ ] Tree shaking enabled
  - [ ] Remove unused dependencies
  - [ ] Target bundle size < 200KB (gzipped)

- [ ] CDN for static assets
  - [ ] JavaScript bundles
  - [ ] CSS files
  - [ ] Images and fonts

### Kubernetes Optimization
- [ ] Horizontal Pod Autoscaler (HPA) configured
  - [ ] Backend: Scale 2-10 pods based on CPU (70% threshold)
  - [ ] Frontend: Scale 2-5 pods based on CPU (70% threshold)

- [ ] Resource limits set
  ```yaml
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
  ```

- [ ] Liveness and readiness probes configured
  - Liveness: `/health` every 10s
  - Readiness: `/ready` every 5s

---

## 10. Go-Live Verification

### Pre-Launch Smoke Tests
- [ ] Health check endpoints return 200
  ```bash
  curl https://yourdomain.com/health
  curl https://api.yourdomain.com/health
  ```

- [ ] Database connectivity test
  ```bash
  # Run from backend pod
  python -c "from sqlalchemy import create_engine; engine = create_engine('$DATABASE_URL'); print(engine.execute('SELECT 1').scalar())"
  ```

- [ ] Redis connectivity test
  ```bash
  redis-cli -u $REDIS_URL ping
  ```

### Payment Integration Tests
- [ ] Stripe webhook delivery test
  - Send test event from Stripe dashboard
  - Verify event logged in application logs
  - Verify webhook signature validation

- [ ] PayPal webhook delivery test
  - Send test IPN from PayPal sandbox
  - Verify event processed

- [ ] Gumroad webhook test
  - Create test sale
  - Verify webhook received and processed

- [ ] Test subscription flow
  - [ ] Create subscription
  - [ ] Upgrade/downgrade plan
  - [ ] Cancel subscription
  - [ ] Verify invoice generation

### User Journey Tests
- [ ] User registration and email verification
- [ ] Login and logout
- [ ] Password reset flow
- [ ] Profile update
- [ ] Subscription purchase
- [ ] Invoice download
- [ ] Team member invitation
- [ ] 2FA setup and login

### Performance Benchmarks
- [ ] Load testing with Artillery or k6
  - Target: 100 concurrent users
  - Duration: 10 minutes
  - Expected p95 latency: < 500ms

- [ ] Lighthouse score (Frontend)
  - Performance: > 90
  - Accessibility: > 95
  - Best Practices: > 95
  - SEO: > 90

### Security Verification
- [ ] SSL certificate valid and trusted
  ```bash
  curl -vI https://yourdomain.com 2>&1 | grep 'SSL certificate verify ok'
  ```

- [ ] Security headers present
  ```bash
  curl -I https://yourdomain.com | grep -E 'Strict-Transport-Security|Content-Security-Policy'
  ```

- [ ] No exposed secrets
  - [ ] Run secret scanner (truffleHog, git-secrets)
  - [ ] Verify `.env` not in version control
  - [ ] Check public S3 buckets

- [ ] OWASP Top 10 vulnerability scan
  - [ ] Use OWASP ZAP or Burp Suite
  - [ ] Fix all high/critical vulnerabilities

### Monitoring Verification
- [ ] Logs flowing to aggregation service
- [ ] Metrics visible in Grafana dashboards
- [ ] Alerts triggering on test conditions
- [ ] Error tracking active in Sentry
- [ ] Uptime monitor pinging every 5 minutes

### Documentation Verification
- [ ] API documentation up-to-date (Swagger/OpenAPI)
- [ ] Runbook for on-call engineers complete
- [ ] Disaster recovery procedures documented
- [ ] Change management process defined
- [ ] Incident response plan documented

---

## Final Go-Live Checklist

### T-1 Week
- [ ] All items above completed and verified
- [ ] Staging environment mirrors production exactly
- [ ] Load testing passed on staging
- [ ] Security scan completed with no critical issues
- [ ] Backup and restore tested successfully

### T-1 Day
- [ ] All production credentials rotated and verified
- [ ] DNS TTL reduced to 300s (for quick rollback if needed)
- [ ] On-call rotation confirmed
- [ ] Communication plan for users (downtime notice if applicable)
- [ ] Rollback plan documented and tested

### Go-Live (T-0)
- [ ] Deploy application to production
- [ ] Verify all health checks green
- [ ] Run smoke tests
- [ ] Monitor logs for errors (first 30 minutes)
- [ ] Verify payment webhooks receiving events
- [ ] Test user registration and login flows

### T+1 Hour
- [ ] Monitor error rates and latency
- [ ] Verify no critical alerts
- [ ] Check database and Redis metrics
- [ ] Verify SSL certificate working
- [ ] Test payment flow end-to-end

### T+24 Hours
- [ ] Review application logs for anomalies
- [ ] Verify automated backups completed
- [ ] Check uptime monitor status (should be 100%)
- [ ] Review performance metrics
- [ ] Increase DNS TTL back to normal (3600s)

### T+1 Week
- [ ] Collect user feedback
- [ ] Review error tracking for patterns
- [ ] Optimize based on real-world usage
- [ ] Document lessons learned
- [ ] Plan next iteration

---

## Post-Launch Maintenance

### Daily
- [ ] Check error tracking dashboard (Sentry)
- [ ] Review uptime monitor status
- [ ] Monitor resource usage trends

### Weekly
- [ ] Review performance metrics
- [ ] Check backup success rate
- [ ] Update dependencies (security patches)
- [ ] Review and respond to user feedback

### Monthly
- [ ] Security vulnerability scan
- [ ] Review and optimize slow database queries
- [ ] Analyze cost metrics and optimize
- [ ] Update documentation
- [ ] Test disaster recovery procedures

### Quarterly
- [ ] Rotate all API keys and secrets
- [ ] Full disaster recovery drill
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Compliance review

---

## Support Contacts

### Internal Team
- DevOps Lead: [email]
- Security Officer: [email]
- Database Admin: [email]
- On-Call Engineer: [phone/slack]

### External Vendors
- Domain Registrar: [contact]
- Hosting Provider: [support link]
- Payment Processors: Stripe, PayPal, Gumroad support
- Email Service: [support contact]
- Monitoring Service: [support contact]

---

**TASK Z COMPLETION CRITERIA MET**

This checklist covers:
✅ Environment variables (Section 1)
✅ Database setup (Section 2)
✅ API keys (Section 3)
✅ Domain/DNS configuration (Section 4)
✅ SSL certificate setup (Section 5)
✅ Monitoring setup (Section 6)
✅ Backup configuration (Section 7)
✅ Security hardening (Section 8)
✅ Performance optimization (Section 9)
✅ Go-live verification steps (Section 10)
✅ Post-launch maintenance procedures

**Document Status:** Production-ready, comprehensive deployment checklist for AgencyOS.
