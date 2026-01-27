# 📊 Production Monitoring Documentation

> **Complete monitoring setup for AgencyOS production environment**

This directory contains all documentation for production monitoring, error tracking, and incident response.

---

## 📚 Documentation Index

### Quick Start
- **[MONITORING_QUICK_REFERENCE.md](MONITORING_QUICK_REFERENCE.md)** - Emergency reference card (print this!)
- **[MONITORING_SETUP.md](MONITORING_SETUP.md)** - Step-by-step setup guide

### Implementation
- **[IPO-005-MONITORING-SUMMARY.md](IPO-005-MONITORING-SUMMARY.md)** - Implementation summary and technical details
- **Backend Integration:** `/backend/core/sentry_config.py`
- **Setup Script:** `/scripts/setup-monitoring.sh`

### Operations
- **[INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)** - Complete incident response protocol
- **[UPTIME_MONITORING.md](UPTIME_MONITORING.md)** - Uptime monitoring configuration

---

## 🚀 Getting Started

### 1. Install Monitoring Tools

```bash
# Run automated setup
./scripts/setup-monitoring.sh

# Or manually install Sentry
pip install "sentry-sdk[fastapi]>=1.40.0"
```

### 2. Configure Sentry

1. Sign up at https://sentry.io
2. Create a new project (Python/FastAPI)
3. Get your DSN from project settings
4. Add to `backend/.env`:
   ```bash
   SENTRY_DSN=https://your_dsn@sentry.io/project_id
   SENTRY_ENABLED=true
   ENV=production
   ```

### 3. Set Up Uptime Monitoring

1. Sign up at https://uptimerobot.com
2. Add monitors for:
   - API: `https://api.agencyos.network/health`
   - Landing: `https://agencyos.network/`
   - Dashboard: `https://dashboard.agencyos.network/`
3. Configure alerts to ops@agencyos.network and Slack

### 4. Review Incident Response

Read [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) to understand:
- Severity levels (P0-P3)
- Response workflows
- Escalation procedures
- Communication templates

---

## 🔍 What We Monitor

### Error Tracking (Sentry)
- ✅ Backend API errors and exceptions
- ✅ Performance metrics (response times)
- ✅ Database query performance
- ✅ Payment webhook failures
- ✅ User context for debugging

### Uptime Monitoring (UptimeRobot)
- ✅ API availability (1-minute checks)
- ✅ Landing page availability (5-minute checks)
- ✅ Dashboard availability (5-minute checks)
- ✅ SSL certificate expiry
- ✅ Response time tracking

---

## 📞 Emergency Contacts

| Role | Slack Handle | When to Contact |
|------|--------------|-----------------|
| **On-Call Engineer** | @oncall | P0-P2 incidents |
| **Dev Lead** | @devlead | P0-P1 escalation |
| **CTO** | @cto | P0 critical only |

**Slack Channels:**
- `#alerts` - Automated monitoring alerts
- `#incidents` - Active incident coordination
- `#post-mortems` - Incident analysis and learnings

---

## 🎯 SLA Targets

| Service | Target Uptime | Max Downtime/Month |
|---------|---------------|-------------------|
| **API Backend** | 99.95% | 21.6 minutes |
| **Dashboard** | 99.9% | 43.2 minutes |
| **Landing Page** | 99.9% | 43.2 minutes |

**Overall Target:** 99.9% uptime (43 minutes downtime per month)

---

## 📊 Monitoring Dashboards

### Sentry
- **URL:** https://sentry.io/organizations/agencyos/
- **Purpose:** Error tracking, performance monitoring
- **Access:** Requires Sentry account

### UptimeRobot
- **URL:** https://uptimerobot.com/dashboard
- **Purpose:** Uptime monitoring, availability tracking
- **Access:** Requires UptimeRobot account

### Cloud Run
- **URL:** https://console.cloud.google.com/run
- **Purpose:** Deployment logs, resource metrics
- **Access:** Requires Google Cloud permissions

### Metrics Endpoint
- **URL:** `https://api.agencyos.network/metrics`
- **Purpose:** Real-time performance metrics
- **Format:** Prometheus format

---

## 🔧 Configuration Files

### Environment Variables
```bash
# Required
SENTRY_DSN=https://your_dsn@sentry.io/project_id
ENV=production  # or development, staging

# Optional
SENTRY_ENABLED=true  # Set to 'false' to disable
VERSION=5.1.1        # Auto-tagged in Sentry
```

### Python Integration
```python
# backend/main.py
from backend.core.sentry_config import init_sentry

init_sentry(
    traces_sample_rate=0.1,  # 10% transaction sampling
    profiles_sample_rate=0.1,  # 10% profiling
)
```

---

## 🚨 Incident Response Flow

```
Alert Triggered
      ↓
Acknowledge (< 2 min)
      ↓
Assess Severity (P0/P1/P2/P3)
      ↓
Notify #incidents channel
      ↓
Investigate (Check Sentry, logs)
      ↓
Mitigate (Fix/Rollback/Config)
      ↓
Verify Resolution
      ↓
Communicate to users (if P0/P1)
      ↓
Write Post-Mortem (if P0/P1)
```

**Full details:** [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)

---

## 💰 Costs

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| **Sentry** | Team | $26 |
| **UptimeRobot** | Pro | $7 |
| **StatusPage.io** | Free | $0 |
| **Total** | - | **$33** |

**Free Alternative:** Sentry Developer + UptimeRobot Free = $0/month

---

## 📖 Common Tasks

### Check Error Rate
```bash
# Via Sentry dashboard
https://sentry.io/organizations/agencyos/issues/

# Via API metrics endpoint
curl https://api.agencyos.network/metrics | grep error_rate
```

### View Recent Errors
```bash
# Cloud Run logs (last 50 errors)
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=50 --format=json
```

### Check Uptime Status
```bash
# Via UptimeRobot dashboard
https://uptimerobot.com/dashboard

# Via public status page (if configured)
https://status.agencyos.network
```

### Rollback Deployment
```bash
# Automatic rollback script
./deploy-production.sh --rollback

# Manual Cloud Run rollback
gcloud run services update-traffic mekong-api \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1
```

---

## 🧪 Testing

### Test Sentry Integration
```bash
# Use test endpoint (development only)
curl http://localhost:8000/test/sentry-error

# Check Sentry dashboard for new error
```

### Test Uptime Alerts
```bash
# In UptimeRobot dashboard:
# 1. Select monitor
# 2. Click "Send Test Notification"
# 3. Verify alert in email/Slack
```

### Test Rollback Procedure
```bash
# Test in staging environment
# 1. Deploy broken code
# 2. Verify alert triggers
# 3. Execute rollback
# 4. Verify service restored
```

---

## 📚 Additional Resources

### External Documentation
- **Sentry Docs:** https://docs.sentry.io/platforms/python/guides/fastapi/
- **UptimeRobot Docs:** https://uptimerobot.com/help/
- **Cloud Run Docs:** https://cloud.google.com/run/docs

### Internal Documentation
- **Architecture:** `/docs/ARCHITECTURE.md`
- **Deployment:** `/docs/DEPLOYMENT_GUIDE.md`
- **Operations:** `/docs/MISSION_CONTROL.md`

---

## ✅ Checklist: Production Readiness

- [ ] Sentry SDK installed
- [ ] Sentry DSN configured in production
- [ ] UptimeRobot monitors created
- [ ] Alert notifications configured (Email + Slack)
- [ ] Incident response team assigned
- [ ] Emergency contacts documented
- [ ] Runbooks reviewed by team
- [ ] Post-mortem template ready
- [ ] Status page created (optional)
- [ ] Team trained on incident response

---

## 📞 Support

**Questions about monitoring setup?**
- Read: [MONITORING_SETUP.md](MONITORING_SETUP.md)
- Check: [IPO-005-MONITORING-SUMMARY.md](IPO-005-MONITORING-SUMMARY.md)

**Need help during an incident?**
- Follow: [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)
- Reference: [MONITORING_QUICK_REFERENCE.md](MONITORING_QUICK_REFERENCE.md)

**External vendor support:**
- Sentry: support@sentry.io
- UptimeRobot: https://uptimerobot.com/support
- Google Cloud: https://console.cloud.google.com/support

---

**Last Updated:** 2026-01-27
**Status:** ✅ Production Ready
**Owner:** Operations Team

🏯 **"Monitoring is not optional - it's essential"**
