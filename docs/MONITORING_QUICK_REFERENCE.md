# 🚨 Production Monitoring - Quick Reference Card

> **Keep this handy for incident response**

---

## 🔍 Monitoring Dashboard URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Sentry** | https://sentry.io/organizations/agencyos/ | Error tracking |
| **UptimeRobot** | https://uptimerobot.com/dashboard | Uptime monitoring |
| **Cloud Run** | https://console.cloud.google.com/run | Deployment logs |
| **Supabase** | https://app.supabase.com | Database health |

---

## ⚡ Emergency Actions

### Rollback Deployment
```bash
# Cloud Run rollback
gcloud run services update-traffic mekong-api \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1

# Or use script
./deploy-production.sh --rollback
```

### Check Logs
```bash
# Last 50 errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=50 --format=json

# Real-time logs
gcloud logging tail "resource.type=cloud_run_revision"
```

### Force Restart
```bash
gcloud run services update mekong-api --region=us-central1
```

---

## 📞 Emergency Contacts

| Role | Slack | Phone | When to Call |
|------|-------|-------|--------------|
| **On-Call** | @oncall | [TBD] | P0-P2 incidents |
| **Dev Lead** | @devlead | [TBD] | P0-P1 escalation |
| **CTO** | @cto | [TBD] | P0 escalation |

---

## 🎯 Severity Levels

| Level | Response Time | Example |
|-------|---------------|---------|
| **P0** | 15 minutes | Complete outage, data breach |
| **P1** | 1 hour | Major feature broken |
| **P2** | 4 hours | Minor degradation |
| **P3** | 24 hours | Cosmetic issue |

---

## 📋 Incident Response Checklist

```
□ Acknowledge alert (Slack #incidents)
□ Assess severity (P0/P1/P2/P3)
□ Check Sentry for errors
□ Check Cloud Run logs
□ Verify database health
□ Identify root cause
□ Apply fix (code/config/rollback)
□ Verify resolution
□ Update #incidents with resolution
□ Write post-mortem (if P0/P1)
```

---

## 🛠️ Common Issues & Fixes

### Issue: 500 Errors

**Check:**
1. Sentry dashboard for stack trace
2. Cloud Run logs for exceptions
3. Database connectivity

**Fix:**
```bash
# Check database
psql $DATABASE_URL -c "SELECT 1;"

# Restart service
gcloud run services update mekong-api --region=us-central1
```

### Issue: High Response Times

**Check:**
1. `/metrics` endpoint for slow queries
2. Cloud Run CPU/Memory usage
3. Database query performance

**Fix:**
```bash
# Scale up resources
gcloud run services update mekong-api \
  --cpu=2 --memory=1Gi --region=us-central1

# Or add concurrency limit
gcloud run services update mekong-api \
  --concurrency=80 --region=us-central1
```

### Issue: Payment Webhook Failure

**Check:**
1. Sentry for webhook errors
2. Webhook secret environment variables
3. PayPal/Stripe status pages

**Fix:**
```bash
# Verify webhook secret
gcloud run services describe mekong-api | grep WEBHOOK

# Update if wrong
gcloud run services update mekong-api \
  --update-env-vars PAYPAL_WEBHOOK_ID=new_id
```

---

## 📊 Key Metrics

| Metric | Target | Check At |
|--------|--------|----------|
| **Uptime** | 99.9% | UptimeRobot |
| **Error Rate** | < 1% | Sentry |
| **P95 Response Time** | < 500ms | `/metrics` |
| **Payment Success** | > 99% | Database |

---

## 🔗 Documentation Links

- **Full Incident Response:** `/docs/INCIDENT_RESPONSE.md`
- **Monitoring Setup:** `/docs/MONITORING_SETUP.md`
- **Uptime Config:** `/docs/UPTIME_MONITORING.md`
- **Implementation Summary:** `/docs/IPO-005-MONITORING-SUMMARY.md`

---

## 💡 Pro Tips

- **Before touching production:** Test in staging first
- **During incidents:** Communicate every 15-30 minutes
- **After resolution:** Always write a post-mortem for P0/P1
- **For deploys:** Schedule during low-traffic windows
- **When stuck:** Escalate early, don't wait

---

**Print this card and keep it visible!**

🏯 **"Preparation defeats panic"**
