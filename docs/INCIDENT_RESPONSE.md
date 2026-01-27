# 🚨 Incident Response Protocol

> **"Chuẩn bị từ thời bình"** - Prepare in peacetime for wartime.

**Last Updated:** 2026-01-27
**Status:** Active
**Owner:** Operations Team

---

## 1. Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P0 - Critical** | Complete service outage, data breach, payment failure | **15 minutes** | Immediate - All hands |
| **P1 - High** | Major feature broken, significant user impact | **1 hour** | Dev Lead + Ops |
| **P2 - Medium** | Minor feature degradation, limited user impact | **4 hours** | On-call engineer |
| **P3 - Low** | Cosmetic issues, no user impact | **24 hours** | Normal sprint cycle |

---

## 2. Detection Systems

### 2.1 Error Monitoring (Sentry)
- **Backend Errors:** Captured automatically via Sentry Python SDK
- **Frontend Errors:** Captured via Sentry JavaScript SDK
- **Threshold:** > 50 errors/minute triggers P1 alert
- **Dashboard:** https://sentry.io/organizations/agencyos/

### 2.2 Uptime Monitoring
- **Service:** UptimeRobot / Pingdom
- **Endpoints Monitored:**
  - `https://api.agencyos.network/health` (1-min interval)
  - `https://agencyos.network/` (5-min interval)
  - `https://dashboard.agencyos.network/` (5-min interval)
- **Threshold:** 3 consecutive failures = downtime alert

### 2.3 Performance Monitoring
- **Metrics Endpoint:** `/metrics`
- **Key Metrics:**
  - Response time P95 < 500ms
  - Error rate < 1%
  - CPU usage < 80%
  - Memory usage < 85%

### 2.4 Payment Gateway Health
- **PayPal Webhooks:** Monitor delivery rate (should be 100%)
- **Stripe Webhooks:** Monitor delivery rate (should be 100%)
- **Gumroad Webhooks:** Monitor delivery rate (should be 100%)

---

## 3. Incident Response Workflow

### Phase 1: Detection (T+0 to T+5 min)
```
┌─────────────────────────────────────────────────────┐
│  Alert Triggered → Acknowledge → Assess Severity    │
└─────────────────────────────────────────────────────┘
```

**Actions:**
1. **Acknowledge** the alert immediately (Slack, PagerDuty, Email)
2. **Assess** severity level (P0-P3)
3. **Notify** stakeholders via #incidents Slack channel
4. **Create** incident ticket in Linear/Jira

**Template:**
```
🚨 INCIDENT DETECTED
Severity: [P0/P1/P2/P3]
Service: [API/Dashboard/Payment/etc]
Time: [YYYY-MM-DD HH:MM UTC]
Impact: [Brief description]
Status: INVESTIGATING
```

### Phase 2: Triage (T+5 to T+15 min)
```
┌─────────────────────────────────────────────────────┐
│  Gather Info → Root Cause → Mitigation Plan         │
└─────────────────────────────────────────────────────┘
```

**Actions:**
1. **Check** Sentry for error stack traces
2. **Review** logs via Cloud Run logs or local logs/
3. **Verify** database health (Supabase Dashboard)
4. **Test** affected endpoints manually
5. **Identify** affected users/transactions

**Checklist:**
- [ ] Error logs collected?
- [ ] Stack trace available?
- [ ] Database accessible?
- [ ] Third-party services operational? (Sentry Status, Stripe Status)
- [ ] Recent deployments? (check git log)

### Phase 3: Mitigation (T+15 to T+30 min)
```
┌─────────────────────────────────────────────────────┐
│  Immediate Fix → Rollback → Manual Override          │
└─────────────────────────────────────────────────────┘
```

**Priority Actions (Pick fastest option):**
1. **Rollback:** If caused by recent deployment
   ```bash
   # Rollback to previous stable version
   ./deploy-production.sh --rollback
   # Or via Cloud Run Console
   gcloud run services update-traffic mekong-api --to-revisions=PREVIOUS_REVISION=100
   ```

2. **Hotfix:** If simple code fix
   ```bash
   # Fix bug → Test locally → Deploy
   git checkout -b hotfix/incident-{id}
   # Make fix
   pytest tests/
   git commit -m "fix: {description} (Incident #{id})"
   ./deploy-production.sh
   ```

3. **Configuration Change:** If config-related
   ```bash
   # Update .env in Cloud Run
   gcloud run services update mekong-api --update-env-vars KEY=VALUE
   ```

4. **Manual Intervention:** If data corruption
   - Connect to Supabase
   - Run SQL fix script (document in incident ticket)
   - Verify data integrity

### Phase 4: Recovery (T+30 to T+60 min)
```
┌─────────────────────────────────────────────────────┐
│  Verify Fix → Monitor → Notify Users                 │
└─────────────────────────────────────────────────────┘
```

**Actions:**
1. **Verify** service is fully operational
2. **Monitor** error rates for 15 minutes
3. **Run** smoke tests on critical paths
4. **Notify** affected users (if P0/P1)
5. **Update** status page / #incidents channel

**Template:**
```
✅ INCIDENT RESOLVED
Severity: [P0/P1/P2/P3]
Duration: [X minutes]
Root Cause: [Brief explanation]
Fix Applied: [What we did]
Impact: [Users affected, revenue impact]
Status: RESOLVED
```

### Phase 5: Post-Mortem (T+24 hours)
```
┌─────────────────────────────────────────────────────┐
│  RCA → Action Items → Prevention → Documentation     │
└─────────────────────────────────────────────────────┘
```

**Required for P0/P1 incidents:**
1. **Write** Root Cause Analysis (RCA) document
2. **Identify** preventive measures
3. **Create** action items (Linear tasks)
4. **Update** runbooks / documentation
5. **Share** learnings with team

**RCA Template:** (See Section 7)

---

## 4. Emergency Contacts

| Role | Name | Phone | Slack | Escalation |
|------|------|-------|-------|------------|
| **On-Call Engineer** | [TBD] | +1-XXX-XXX-XXXX | @oncall | Primary |
| **Dev Lead** | [TBD] | +1-XXX-XXX-XXXX | @devlead | Secondary |
| **CTO** | [TBD] | +1-XXX-XXX-XXXX | @cto | Tertiary |
| **CEO** | [Anh] | [TBD] | @anh | P0 Only |

**External Vendors:**
- **Sentry Support:** support@sentry.io (Enterprise plan)
- **Google Cloud Support:** [Support Console](https://console.cloud.google.com/support)
- **Supabase Support:** support@supabase.com
- **Stripe Support:** https://support.stripe.com

---

## 5. Rollback Procedures

### 5.1 Backend Rollback (FastAPI)
```bash
# Method 1: Cloud Run Revision Rollback
gcloud run services update-traffic mekong-api \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1

# Method 2: Git-based rollback
git revert HEAD
git push origin main
# Trigger automatic deployment via Cloud Build

# Method 3: Manual script
./deploy-production.sh --rollback --revision=abc123
```

### 5.2 Frontend Rollback (Next.js)
```bash
# Vercel automatic rollback
vercel rollback https://agencyos.network --yes

# Or via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "Promote to Production"
```

### 5.3 Database Rollback (Supabase)
```sql
-- CRITICAL: Always backup before manual DB changes
-- Supabase has Point-in-Time Recovery (PITR)

-- Example: Rollback failed migration
BEGIN;
  -- Your rollback SQL here
  -- e.g., DROP TABLE IF EXISTS new_feature_table;
ROLLBACK; -- Use COMMIT; only after verification
```

**Best Practice:** Never manually edit production DB without a backup!

---

## 6. Communication Templates

### 6.1 Status Page Update (P0/P1)
```
Title: [Service Name] Experiencing Issues

We are currently investigating reports of [brief issue description].
Our team has been alerted and is working to resolve this as quickly as possible.

Time Started: [HH:MM UTC]
Last Update: [HH:MM UTC]
Status: INVESTIGATING / IDENTIFIED / MONITORING / RESOLVED

We will provide updates every 30 minutes until resolved.
```

### 6.2 User Notification Email (P0/P1)
```
Subject: [AgencyOS] Service Disruption - [Date]

Hi [User],

We experienced a service disruption today affecting [feature/service].

Timeline:
- Issue Started: [HH:MM UTC]
- Issue Resolved: [HH:MM UTC]
- Duration: [X minutes]

Impact:
- [What was affected]
- [What actions you might need to take, if any]

We sincerely apologize for any inconvenience this may have caused.
As a token of our apology, we've [credit/extension/compensation].

What we're doing to prevent this:
- [Prevention measure 1]
- [Prevention measure 2]

If you have any questions, please reply to this email or contact support@agencyos.network.

Best regards,
The AgencyOS Team
```

### 6.3 Internal Slack Update
```
#incidents channel:

🚨 UPDATE - Incident #XXX

Status: [INVESTIGATING/IDENTIFIED/MONITORING/RESOLVED]
Time: [+15 min]
Progress:
- [What we've done]
- [What we found]
- [Next steps]

ETA to resolution: [X minutes]
```

---

## 7. Post-Mortem Template

**File:** `docs/post-mortems/YYYY-MM-DD-incident-{id}.md`

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Severity:** [P0/P1/P2/P3]
**Duration:** [X minutes/hours]
**Impact:** [Users affected, revenue impact, reputation]
**Author:** [Name]
**Reviewers:** [Names]

---

## 1. Summary
[One-paragraph summary of what happened]

## 2. Timeline (UTC)
- **HH:MM** - Incident detected (via Sentry alert)
- **HH:MM** - Engineer acknowledged
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Incident resolved
- **HH:MM** - Monitoring confirmed stability

## 3. Root Cause
[Detailed explanation of WHY the incident occurred]

### What Went Wrong?
- [Technical explanation]
- [Code snippet or config that caused issue]

### Why Wasn't This Caught Earlier?
- [Missing test case?]
- [Insufficient monitoring?]
- [Lack of staging validation?]

## 4. Impact Analysis
- **Users Affected:** [Number/Percentage]
- **Revenue Impact:** $[Amount]
- **Reputation Impact:** [Social media mentions, support tickets]
- **SLA Violation:** [Yes/No - if yes, credit issued]

## 5. Resolution
[What we did to fix it]

### Immediate Fix
[Temporary solution applied]

### Permanent Fix
[Long-term solution]

## 6. Action Items
- [ ] **[Owner]** - [Action item 1] - Due: [Date]
- [ ] **[Owner]** - [Action item 2] - Due: [Date]
- [ ] **[Owner]** - [Action item 3] - Due: [Date]

## 7. Prevention Measures
- **Monitoring:** [New alert added]
- **Testing:** [New test case]
- **Process:** [New review step]
- **Documentation:** [Update runbook]

## 8. Lessons Learned
### What Went Well?
- [Fast detection via Sentry]
- [Quick rollback capability]

### What Could Be Improved?
- [Better error messages]
- [More comprehensive tests]

## 9. References
- Sentry Issue: https://sentry.io/issues/[id]
- GitHub PR: https://github.com/[org]/[repo]/pull/[id]
- Linear Ticket: https://linear.app/[workspace]/issue/[id]
```

---

## 8. Runbooks

### 8.1 Database Connection Lost
**Symptoms:** 500 errors, "could not connect to database"
**Likely Cause:** Supabase outage or network issue

**Steps:**
1. Check Supabase Status: https://status.supabase.com
2. Verify connection string in Cloud Run env vars
3. Test connection manually:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```
4. If Supabase is down: Wait for recovery or failover to backup
5. If connection string wrong: Update env var and redeploy

### 8.2 Payment Webhook Failure
**Symptoms:** Payments processed but not reflected in database
**Likely Cause:** Webhook signature verification failed or endpoint timeout

**Steps:**
1. Check Sentry for webhook errors
2. Verify webhook secret matches:
   - PayPal: `PAYPAL_WEBHOOK_ID`
   - Stripe: `STRIPE_WEBHOOK_SECRET`
3. Test webhook endpoint manually:
   ```bash
   curl -X POST https://api.agencyos.network/webhooks/paypal \
     -H "Content-Type: application/json" \
     -d @test-webhook-payload.json
   ```
4. Check Cloud Run logs for timeout issues
5. If timeout: Increase Cloud Run timeout to 300s

### 8.3 High Memory Usage
**Symptoms:** Cloud Run instances restarting, 502 errors
**Likely Cause:** Memory leak or inefficient query

**Steps:**
1. Check Cloud Run metrics (Memory % over time)
2. Identify memory-intensive endpoints via `/metrics`
3. Profile Python memory usage:
   ```bash
   python -m memory_profiler backend/main.py
   ```
4. Common culprits:
   - Large database query results (add pagination)
   - In-memory caching without limits (use Redis)
   - File uploads not streamed (use chunked upload)
5. Temporary fix: Scale up Cloud Run memory
6. Permanent fix: Optimize code and add memory limits

### 8.4 Third-Party API Outage
**Symptoms:** Errors calling external API (PayPal, Stripe, Gemini)
**Likely Cause:** Provider outage or rate limiting

**Steps:**
1. Check provider status page:
   - PayPal: https://www.paypal-status.com
   - Stripe: https://status.stripe.com
   - Google Cloud: https://status.cloud.google.com
2. If provider is down: Activate fallback mode (if available)
3. If rate limited: Implement exponential backoff retry
4. If critical: Switch to alternative provider temporarily
5. Notify users of degraded service via status page

---

## 9. Testing \u0026 Drills

### 9.1 Chaos Engineering
Run quarterly to test resilience:
```bash
# Simulate database outage
docker-compose down db

# Simulate high load
ab -n 10000 -c 100 https://api.agencyos.network/health

# Simulate payment gateway failure
# Mock Stripe API to return 500 errors
```

### 9.2 Incident Response Drill
Run monthly to practice:
1. Simulate incident (e.g., deploy broken code to staging)
2. On-call engineer responds
3. Team follows this document
4. Measure response time
5. Review and improve process

---

## 10. Metrics \u0026 SLOs

### Service Level Objectives (SLOs)
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.9% (43 min downtime/month) | UptimeRobot |
| **API Response Time (P95)** | < 500ms | Prometheus |
| **Error Rate** | < 1% | Sentry |
| **Payment Success Rate** | > 99% | Database query |

### Incident Response KPIs
| Metric | Target | Actual (Last 30 Days) |
|--------|--------|----------------------|
| **Mean Time to Detect (MTTD)** | < 5 min | [TBD] |
| **Mean Time to Acknowledge (MTTA)** | < 15 min | [TBD] |
| **Mean Time to Resolve (MTTR)** | < 1 hour (P1) | [TBD] |
| **Incidents per Month** | < 5 | [TBD] |

**Dashboard:** `/metrics` endpoint or Grafana (if set up)

---

## 11. Tools \u0026 Access

### Monitoring Tools
- **Sentry:** https://sentry.io/organizations/agencyos/
- **UptimeRobot:** https://uptimerobot.com (or Pingdom)
- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://app.supabase.com

### Communication
- **Slack:** #incidents, #engineering, #ops
- **Status Page:** https://status.agencyos.network (StatusPage.io or custom)
- **PagerDuty:** (Optional - for 24/7 on-call rotation)

### Documentation
- **Runbooks:** This document + `/docs/runbooks/`
- **Architecture:** `/docs/ARCHITECTURE.md`
- **Deployment:** `/docs/DEPLOYMENT_GUIDE.md`

---

## 12. Appendix

### A. Common Error Codes
| Code | Meaning | Action |
|------|---------|--------|
| **500** | Internal Server Error | Check Sentry for stack trace |
| **502** | Bad Gateway | Cloud Run instance crashed, check logs |
| **503** | Service Unavailable | Cloud Run scaled to zero or overloaded |
| **504** | Gateway Timeout | Request took > 300s, optimize or increase timeout |

### B. Environment Variables Checklist
Critical env vars that must be set:
- [ ] `DATABASE_URL`
- [ ] `SENTRY_DSN`
- [ ] `PAYPAL_CLIENT_ID`
- [ ] `PAYPAL_CLIENT_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### C. Emergency Commands
```bash
# Quick health check
curl https://api.agencyos.network/health | jq

# Check Cloud Run logs (last 10 errors)
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=10 --format=json

# Restart Cloud Run service
gcloud run services update mekong-api --region=us-central1

# Force new deployment
gcloud run deploy mekong-api --source=. --region=us-central1
```

---

## 13. Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-27 | 1.0.0 | Initial creation | Claude |

---

**Next Review Date:** 2026-04-27 (Quarterly)

🏯 **"Chuẩn bị trước khi chiến tranh, thắng trước khi đánh"**
*Prepare before the battle, win before the fight.*
