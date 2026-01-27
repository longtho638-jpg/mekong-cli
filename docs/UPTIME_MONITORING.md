# 🔍 Uptime Monitoring Configuration

> **"Giám sát 24/7"** - Monitor around the clock

**Last Updated:** 2026-01-27

---

## 1. Overview

This document describes the uptime monitoring setup for AgencyOS production services.

**Monitoring Service:** UptimeRobot (recommended) or Pingdom
**Status Page:** https://status.agencyos.network (optional)

---

## 2. Monitored Endpoints

### 2.1 API Backend (Priority: CRITICAL)

**Endpoint:** `https://api.agencyos.network/health`
- **Protocol:** HTTP(S)
- **Method:** GET
- **Interval:** 1 minute
- **Timeout:** 30 seconds
- **Expected Status:** 200 OK
- **Expected Response:** JSON with `"status": "healthy"`

**Alert Triggers:**
- 3 consecutive failures
- Response time > 5 seconds (warning)
- Response time > 10 seconds (critical)

**Notification Channels:**
- Email: ops@agencyos.network
- Slack: #alerts channel
- SMS: On-call engineer (for P0 incidents)

### 2.2 Main Landing Page (Priority: HIGH)

**Endpoint:** `https://agencyos.network/`
- **Protocol:** HTTP(S)
- **Method:** GET
- **Interval:** 5 minutes
- **Timeout:** 30 seconds
- **Expected Status:** 200 OK
- **Keyword Check:** "AgencyOS" (to detect blank pages)

**Alert Triggers:**
- 3 consecutive failures
- Keyword not found in response

### 2.3 Dashboard (Priority: HIGH)

**Endpoint:** `https://dashboard.agencyos.network/`
- **Protocol:** HTTP(S)
- **Method:** GET
- **Interval:** 5 minutes
- **Timeout:** 30 seconds
- **Expected Status:** 200 OK
- **Keyword Check:** "Dashboard" or specific UI element

**Alert Triggers:**
- 3 consecutive failures
- Keyword not found in response

### 2.4 Documentation Site (Priority: MEDIUM)

**Endpoint:** `https://docs.agencyos.network/`
- **Protocol:** HTTP(S)
- **Method:** GET
- **Interval:** 10 minutes
- **Timeout:** 30 seconds
- **Expected Status:** 200 OK

**Alert Triggers:**
- 5 consecutive failures (less critical than API)

---

## 3. UptimeRobot Setup Guide

### 3.1 Create Account
1. Sign up at https://uptimerobot.com
2. Choose plan:
   - **Free Plan:** Up to 50 monitors, 5-minute intervals
   - **Pro Plan:** Unlimited monitors, 1-minute intervals, SMS alerts

### 3.2 Add Monitors

**API Health Check:**
```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS API Health
URL: https://api.agencyos.network/health
Monitoring Interval: 1 minute (Pro) or 5 minutes (Free)
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)
HTTP Status Codes: 200

Advanced:
- Keyword Monitoring: ON
- Keyword Type: Exists
- Keyword Value: "healthy"
```

**Landing Page:**
```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS Landing Page
URL: https://agencyos.network/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)
HTTP Status Codes: 200

Advanced:
- Keyword Monitoring: ON
- Keyword Type: Exists
- Keyword Value: "AgencyOS"
```

**Dashboard:**
```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS Dashboard
URL: https://dashboard.agencyos.network/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)
HTTP Status Codes: 200
```

### 3.3 Configure Alert Contacts

**Email:**
```
Contact Type: Email
Friendly Name: Operations Team
Email Address: ops@agencyos.network
Alert After: 3 retries (3 minutes for 1-min interval)
```

**Slack:**
```
Contact Type: Slack
Friendly Name: #alerts channel
Webhook URL: https://hooks.slack.com/services/YOUR_WEBHOOK_URL

Message Template:
🚨 {monitorFriendlyName} is {uptimeStatus}
URL: {monitorURL}
Time: {alertDateTime}
Reason: {alertDetails}
```

**SMS (Pro Plan Only):**
```
Contact Type: SMS
Friendly Name: On-Call Engineer
Phone Number: +1-XXX-XXX-XXXX
Alert For: API monitors only (critical services)
```

### 3.4 Maintenance Windows

To avoid false alerts during planned maintenance:
```
Settings → Maintenance Windows → Add New

Name: Weekly Deployment Window
Start: Every Sunday 02:00 UTC
Duration: 1 hour
Affected Monitors: All
```

---

## 4. Alternative: Pingdom Setup

If using Pingdom instead of UptimeRobot:

### 4.1 Create Check

**API Health Check:**
```
Check Type: HTTP
Name: AgencyOS API Health
URL: https://api.agencyos.network/health
Check Interval: 1 minute
Timeout: 30 seconds

Response Validation:
- Status: 200
- Contains string: "healthy"
```

### 4.2 Configure Alerting

**Integrations:**
- Email: ops@agencyos.network
- PagerDuty: (optional for 24/7 on-call)
- Slack: #alerts channel

**Alert Rules:**
- Alert after: 3 failures
- Re-notify every: 30 minutes
- Auto-resolve: When check passes 2 consecutive times

---

## 5. Status Page (Optional)

Create a public status page to communicate uptime to users.

### 5.1 StatusPage.io (Recommended)

**Free Plan:** Up to 1 component, unlimited subscribers
**Paid Plan:** Multiple components, custom domain

**Setup:**
1. Sign up at https://www.statuspage.io
2. Create page: `agencyos.statuspage.io`
3. Add components:
   - API Backend
   - Dashboard
   - Documentation
4. Connect UptimeRobot/Pingdom monitors
5. Customize branding (logo, colors)

**Public URL:** https://status.agencyos.network (CNAME to statuspage.io)

### 5.2 Custom Status Page (Self-Hosted)

**Tech Stack:** Next.js + Uptime Robot API
**Deployment:** Vercel (free)

**Features:**
- Real-time status from UptimeRobot API
- Historical uptime charts
- Incident timeline
- Subscribe to email/SMS updates

**Code:** `/apps/status-page/` (create if needed)

---

## 6. Monitoring Locations

Configure monitors to check from multiple geographic locations to detect regional issues.

**Recommended Locations:**
- US East (New York)
- US West (San Francisco)
- Europe (London or Amsterdam)
- Asia-Pacific (Singapore or Tokyo)

**UptimeRobot:** Pro plan allows selecting monitoring locations
**Pingdom:** All plans include multiple probe locations

---

## 7. Synthetic Monitoring (Advanced)

For critical user journeys, set up synthetic monitoring:

**Tools:**
- Checkly (https://www.checklyhq.com)
- Datadog Synthetic Monitoring
- New Relic Synthetics

**Example Test Cases:**
1. **User Login Flow:**
   - Navigate to dashboard
   - Fill login form
   - Verify successful login
   - Expected: < 3 seconds total

2. **Payment Creation:**
   - Navigate to payments page
   - Create test invoice
   - Verify invoice appears
   - Expected: < 5 seconds total

3. **API Integration Test:**
   - Call `/api/auth/login` (POST)
   - Verify JWT token returned
   - Call `/api/invoices` (GET) with token
   - Verify invoice list returned

---

## 8. Integration with Sentry

Link uptime monitoring with Sentry for correlation:

**Sentry Releases:**
- Tag Sentry releases with deployment time
- Correlate error spikes with deployments

**Sentry Alerts:**
- Create Sentry alert rule: Error rate > 1%
- Send to same Slack channel as uptime alerts

---

## 9. Runbook: Responding to Downtime Alerts

### Step 1: Acknowledge (< 2 min)
1. Check alert notification (Email/Slack/SMS)
2. Acknowledge in UptimeRobot/Pingdom
3. Post in #incidents Slack channel:
   ```
   🚨 DOWNTIME ALERT
   Service: [API/Dashboard/etc]
   Time: [HH:MM UTC]
   Status: INVESTIGATING
   ```

### Step 2: Verify (2-5 min)
1. Check endpoint manually:
   ```bash
   curl -v https://api.agencyos.network/health
   ```
2. Check if it's a global issue or regional
3. Verify other services are operational

### Step 3: Diagnose (5-15 min)
1. Check Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=50
   ```
2. Check Sentry for errors during downtime window
3. Check Google Cloud Status: https://status.cloud.google.com

### Step 4: Mitigate (15-30 min)
- **If Cloud Run issue:** Restart service or rollback deployment
- **If database issue:** Check Supabase Dashboard
- **If DNS issue:** Verify DNS records at domain registrar
- **If DDoS:** Enable Cloud Armor or Cloudflare protection

### Step 5: Resolve & Communicate (30-60 min)
1. Verify service is fully operational
2. Update status page
3. Post resolution in #incidents
4. If downtime > 5 minutes: Send user notification email

---

## 10. SLA Targets

**Monthly Uptime Target:** 99.9% (43 minutes downtime allowed)

**Breakdown by Service:**
| Service | SLA Target | Downtime/Month | Monitoring Priority |
|---------|------------|----------------|---------------------|
| **API Backend** | 99.95% | 21.6 minutes | P0 |
| **Dashboard** | 99.9% | 43.2 minutes | P1 |
| **Landing Page** | 99.9% | 43.2 minutes | P1 |
| **Docs Site** | 99.5% | 3.6 hours | P2 |

**Measurement Period:** Rolling 30 days
**Exclusions:** Scheduled maintenance (announced 24h in advance)

---

## 11. Reporting

### 11.1 Weekly Report (Automated)

Send every Monday to ops@agencyos.network:

**Template:**
```
📊 Weekly Uptime Report (Jan 20-26, 2026)

API Backend: 99.98% (8 min downtime)
  - 1 incident on Jan 23 (08:15-08:23 UTC)
  - Root cause: Database connection pool exhaustion
  - Fix: Increased pool size from 20 to 50

Dashboard: 100% (0 min downtime)

Landing Page: 99.95% (21 min downtime)
  - 1 incident on Jan 24 (14:30-14:51 UTC)
  - Root cause: Vercel deployment issue
  - Fix: Rollback + redeploy

Docs Site: 100% (0 min downtime)

✅ Monthly SLA Target: ON TRACK (99.9%)
```

### 11.2 Monthly Incident Review

Review all incidents and update runbooks:
1. List all downtime events
2. Categorize by root cause
3. Identify patterns
4. Update prevention measures
5. Improve monitoring coverage

**Template:** See `docs/INCIDENT_RESPONSE.md` Section 7 (Post-Mortem)

---

## 12. Testing Monitoring Setup

### 12.1 Test Alerts

**Manual Test:**
```bash
# Temporarily break health endpoint to trigger alert
# (Do this in staging first!)

# Method 1: Update Cloud Run to point to non-existent version
gcloud run services update mekong-api --image=gcr.io/invalid/image

# Method 2: Take down service temporarily
gcloud run services delete mekong-api --region=us-central1

# Verify alert is sent within monitoring interval
# Then restore service
```

**Expected Behavior:**
- Alert triggered after 3 consecutive failures (3 minutes for 1-min interval)
- Notification sent to all configured channels
- Status page updated to "Down"

### 12.2 Test Auto-Recovery Detection

**Scenario:** Service recovers on its own (e.g., Cloud Run auto-scales up)

**Expected Behavior:**
- UptimeRobot detects recovery within next check
- "Up" notification sent
- Status page updated to "Operational"
- Incident auto-resolved in tracking system

---

## 13. Cost Estimate

**UptimeRobot:**
- Free Plan: $0/month (50 monitors, 5-min interval)
- Pro Plan: $7/month (unlimited monitors, 1-min interval, SMS)

**Pingdom:**
- Starter: $15/month (10 checks, 1-min interval)
- Advanced: $85/month (100 checks, multi-location)

**StatusPage.io:**
- Free: $0/month (1 component)
- Starter: $29/month (3 components, custom domain)

**Recommended Setup:** UptimeRobot Pro ($7/mo) + StatusPage.io Free ($0/mo) = **$7/month total**

---

## 14. Checklist: Initial Setup

- [ ] Sign up for UptimeRobot account
- [ ] Add API health check monitor (1-min interval)
- [ ] Add Landing Page monitor (5-min interval)
- [ ] Add Dashboard monitor (5-min interval)
- [ ] Configure email alert to ops@agencyos.network
- [ ] Configure Slack webhook to #alerts channel
- [ ] (Optional) Configure SMS alert for on-call engineer
- [ ] Set up maintenance window for Sunday deployments
- [ ] Test alerts by breaking staging environment
- [ ] (Optional) Create public status page
- [ ] Document monitoring setup in team wiki
- [ ] Add SENTRY_DSN to .env and deploy

---

**Last Review:** 2026-01-27
**Next Review:** 2026-04-27 (Quarterly)

🏯 **"Giám sát để ngăn ngừa, không chỉ để phản ứng"**
*Monitor to prevent, not just to react.*
