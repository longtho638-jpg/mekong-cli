# 📊 Monitoring Setup Guide

> **Complete guide for setting up production monitoring with Sentry and Uptime tracking**

**Last Updated:** 2026-01-27

---

## Table of Contents

1. [Sentry Setup](#1-sentry-setup)
2. [Uptime Monitoring Setup](#2-uptime-monitoring-setup)
3. [Testing Your Setup](#3-testing-your-setup)
4. [Troubleshooting](#4-troubleshooting)

---

## 1. Sentry Setup

### 1.1 Create Sentry Account

1. Go to https://sentry.io/signup/
2. Sign up with your work email
3. Choose a plan:
   - **Developer (Free):** 5,000 errors/month, 7-day retention
   - **Team ($26/mo):** 50,000 errors/month, 30-day retention
   - **Business ($80/mo):** Unlimited errors, 90-day retention, performance monitoring

**Recommended:** Start with Free plan for testing, upgrade to Team for production.

### 1.2 Create a New Project

1. After signing in, click **"Create Project"**
2. Select **Python** as the platform
3. Set **Alert frequency:** "On every new issue"
4. Project name: `agencyos-backend`
5. Team: Select your default team
6. Click **"Create Project"**

### 1.3 Get Your DSN

After creating the project, Sentry will show you the **DSN (Data Source Name)**:

```
https://abc123def456@o123456.ingest.sentry.io/789012
```

**Copy this DSN** - you'll need it in the next step.

### 1.4 Configure Backend

1. Open `/backend/.env` file
2. Add your Sentry DSN:
   ```bash
   SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
   SENTRY_ENABLED=true
   ENV=production
   VERSION=5.1.1
   ```

3. **For production deployment**, add these as environment variables in Google Cloud Run:
   ```bash
   gcloud run services update mekong-api \
     --update-env-vars SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012 \
     --update-env-vars SENTRY_ENABLED=true \
     --update-env-vars ENV=production \
     --update-env-vars VERSION=5.1.1 \
     --region=us-central1
   ```

### 1.5 Install Sentry SDK

The Sentry SDK is already included in `requirements.txt`:
```bash
# Install dependencies
pip install -r requirements.txt

# Or install Sentry specifically
pip install "sentry-sdk[fastapi]>=1.40.0"
```

### 1.6 Verify Integration

The Sentry integration is already configured in `/backend/main.py`. When you start the server, you should see:

```
✅ Sentry initialized successfully
   Environment: production
   Release: 5.1.1
   Traces Sample Rate: 10.0%
   Profiles Sample Rate: 10.0%
```

If Sentry is disabled or DSN is missing:
```
⚠️  Sentry DSN not provided. Error tracking disabled.
   Set SENTRY_DSN environment variable to enable Sentry.
```

### 1.7 Configure Alerts

1. Go to **Settings** → **Alerts**
2. Create alert rules:

**Rule 1: High Error Rate**
```
Name: High Error Rate Alert
Condition: Number of events in an issue is more than 50 in 1 hour
Action: Send notification to #alerts Slack channel
```

**Rule 2: New Issue**
```
Name: New Issue Alert
Condition: A new issue is created
Action: Send email to ops@agencyos.network
```

**Rule 3: Performance Degradation**
```
Name: Slow API Response
Condition: Transaction duration 95th percentile is more than 1000ms
Action: Send notification to #performance Slack channel
```

### 1.8 Integrate with Slack

1. Go to **Settings** → **Integrations**
2. Search for **Slack**
3. Click **"Add to Slack"**
4. Select your workspace
5. Choose channel: `#alerts`
6. Authorize Sentry

Now all alerts will be sent to Slack automatically!

---

## 2. Uptime Monitoring Setup

### 2.1 Create UptimeRobot Account

1. Go to https://uptimerobot.com/signUp
2. Sign up with your work email
3. Verify your email
4. Choose a plan:
   - **Free:** 50 monitors, 5-minute intervals
   - **Pro ($7/mo):** Unlimited monitors, 1-minute intervals, SMS alerts

**Recommended:** Pro plan for production (only $7/month).

### 2.2 Add API Health Monitor

1. Click **"Add New Monitor"**
2. Fill in the details:

```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS API Health
URL (or IP): https://api.agencyos.network/health
Monitoring Interval: 1 minute
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)
```

3. Expand **"Advanced Settings"**:
```
☑ Keyword Monitoring
Keyword Type: Exists
Keyword Value: healthy
```

4. Click **"Create Monitor"**

### 2.3 Add Landing Page Monitor

Repeat the same steps for the landing page:
```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS Landing Page
URL (or IP): https://agencyos.network/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)

Advanced Settings:
☑ Keyword Monitoring
Keyword Type: Exists
Keyword Value: AgencyOS
```

### 2.4 Add Dashboard Monitor

```
Monitor Type: HTTP(s)
Friendly Name: AgencyOS Dashboard
URL (or IP): https://dashboard.agencyos.network/
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
HTTP Method: GET (HEAD)
```

### 2.5 Configure Alert Contacts

1. Go to **"My Settings"** → **"Alert Contacts"**
2. Click **"Add Alert Contact"**

**Email Contact:**
```
Contact Type: Email
Friendly Name: Operations Team
Email Address: ops@agencyos.network

Alert When: Down or Up
Alert After: 3 retries (3 minutes)
```

**Slack Contact:**
1. In Slack, go to your workspace
2. Navigate to **Apps** → **Add apps**
3. Search for **"Incoming WebHooks"**
4. Click **"Add to Slack"**
5. Choose channel: `#alerts`
6. Copy the **Webhook URL**

Back in UptimeRobot:
```
Contact Type: Slack
Friendly Name: #alerts channel
Webhook URL: https://hooks.slack.com/services/YOUR_WEBHOOK_URL

Alert When: Down or Up
Alert After: 3 retries
```

### 2.6 Set Up Maintenance Windows

To avoid false alerts during deployments:

1. Go to **"Maintenance Windows"**
2. Click **"Add New Maintenance Window"**
3. Configure:
```
Name: Weekly Deployment Window
Start: Every Sunday at 02:00 UTC
Duration: 1 hour
Affected Monitors: Select all monitors
```

---

## 3. Testing Your Setup

### 3.1 Test Sentry Error Tracking

Add a test endpoint to manually trigger an error:

1. Create `/backend/test_sentry.py`:
```python
from fastapi import APIRouter, HTTPException
import sentry_sdk

router = APIRouter(prefix="/test", tags=["testing"])

@router.get("/sentry-error")
async def test_sentry_error():
    """Trigger a test error to verify Sentry integration"""
    sentry_sdk.capture_message("This is a test message from AgencyOS", level="info")
    raise ValueError("This is a test error to verify Sentry integration!")

@router.get("/sentry-message")
async def test_sentry_message():
    """Send a test message to Sentry"""
    sentry_sdk.capture_message("Test message from AgencyOS API", level="warning")
    return {"message": "Test message sent to Sentry"}
```

2. Add to `/backend/main.py`:
```python
from backend.test_sentry import router as test_router
app.include_router(test_router)
```

3. Start the server and visit:
   - `http://localhost:8000/test/sentry-message` (should succeed and send message)
   - `http://localhost:8000/test/sentry-error` (should fail and log error)

4. Check Sentry dashboard - you should see both the message and the error within 30 seconds!

5. **IMPORTANT:** Remove or disable test endpoint before production deployment!

### 3.2 Test Uptime Monitoring

**Method 1: Temporary Service Stop (Staging Only!)**
```bash
# Stop the backend service temporarily
# (Do this in staging, NOT production!)
pkill -f "uvicorn.*main:app"

# Wait 3-4 minutes for UptimeRobot to detect downtime
# You should receive:
# - Email alert
# - Slack notification

# Restart service
uvicorn backend.main:app --reload
```

**Method 2: Force Monitor Check**
1. Go to UptimeRobot dashboard
2. Find your monitor
3. Click **"Force Check"** button
4. Verify status updates immediately

### 3.3 Test Slack Notifications

Send a test notification from UptimeRobot:
1. Click on a monitor
2. Click **"Send Test Notification"**
3. Verify message appears in Slack #alerts channel

Expected message:
```
🚨 AgencyOS API Health is DOWN
URL: https://api.agencyos.network/health
Time: 2026-01-27 10:45:00 UTC
Reason: Connection timeout
```

---

## 4. Troubleshooting

### Issue: Sentry not capturing errors

**Symptoms:** No errors appear in Sentry dashboard

**Solutions:**
1. Verify SENTRY_DSN is set correctly:
   ```bash
   echo $SENTRY_DSN
   ```
2. Check Sentry is initialized:
   ```bash
   # Look for this in server startup logs:
   ✅ Sentry initialized successfully
   ```
3. Verify network connectivity:
   ```bash
   curl -I https://sentry.io
   ```
4. Check Sentry project status: https://status.sentry.io
5. Test with manual error trigger (see section 3.1)

### Issue: Too many Sentry errors (quota exceeded)

**Symptoms:** Sentry stops capturing errors, shows "quota exceeded"

**Solutions:**
1. Filter out noisy errors in `/backend/core/sentry_config.py`:
   ```python
   def before_send_hook(event, hint):
       # Add more error types to ignore
       ignored_errors = [
           "ConnectionError",
           "TimeoutError",
           "404",  # Don't log 404s
       ]
       # ...
   ```
2. Reduce sample rate:
   ```python
   init_sentry(
       traces_sample_rate=0.01,  # Sample only 1% instead of 10%
       profiles_sample_rate=0.01,
   )
   ```
3. Upgrade Sentry plan for higher quota

### Issue: UptimeRobot showing false positives

**Symptoms:** Alerts triggered but service is actually up

**Solutions:**
1. Increase retry count before alerting (5 retries instead of 3)
2. Increase timeout (60s instead of 30s)
3. Verify keyword monitoring is working:
   ```bash
   curl https://api.agencyos.network/health | grep "healthy"
   ```
4. Check if firewall is blocking UptimeRobot IPs
5. Whitelist UptimeRobot IPs in Cloud Run (if using IP restrictions)

### Issue: No Slack notifications

**Symptoms:** UptimeRobot detects downtime but no Slack message

**Solutions:**
1. Verify webhook URL is correct in UptimeRobot
2. Test webhook manually:
   ```bash
   curl -X POST https://hooks.slack.com/services/YOUR_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test from UptimeRobot"}'
   ```
3. Check Slack webhook is not disabled
4. Verify UptimeRobot alert contact is enabled for the monitor

### Issue: Sentry performance overhead

**Symptoms:** API response times increased after enabling Sentry

**Solutions:**
1. Reduce trace sample rate:
   ```python
   init_sentry(traces_sample_rate=0.01)  # 1% instead of 10%
   ```
2. Disable profiling:
   ```python
   init_sentry(profiles_sample_rate=0.0)  # Disable profiling
   ```
3. Use async mode (already enabled by default in sentry-sdk)
4. Consider upgrading server resources if needed

---

## 5. Maintenance

### Weekly Tasks
- [ ] Review Sentry error trends
- [ ] Check UptimeRobot uptime percentage
- [ ] Verify alert notifications are working

### Monthly Tasks
- [ ] Review and update alert rules
- [ ] Clean up resolved issues in Sentry
- [ ] Audit monitoring coverage (are all critical endpoints monitored?)

### Quarterly Tasks
- [ ] Review incident response times (MTTR, MTTD, MTTA)
- [ ] Update runbooks based on recent incidents
- [ ] Test disaster recovery procedures

---

## 6. Next Steps

After setting up monitoring:

1. ✅ Install Sentry SDK and configure DSN
2. ✅ Create UptimeRobot monitors for all critical endpoints
3. ✅ Set up alert notifications (Email + Slack)
4. ✅ Test monitoring setup
5. ⏭️ Create public status page (optional): See `/docs/UPTIME_MONITORING.md`
6. ⏭️ Set up PagerDuty for 24/7 on-call rotation (optional)
7. ⏭️ Configure Sentry releases for deployment tracking
8. ⏭️ Review incident response procedures: See `/docs/INCIDENT_RESPONSE.md`

---

## 7. Resources

**Sentry Documentation:**
- Getting Started: https://docs.sentry.io/platforms/python/guides/fastapi/
- Configuration Options: https://docs.sentry.io/platforms/python/configuration/
- Error Filtering: https://docs.sentry.io/platforms/python/configuration/filtering/

**UptimeRobot Documentation:**
- Getting Started: https://uptimerobot.com/help/
- API Documentation: https://uptimerobot.com/api/
- Integration Guides: https://uptimerobot.com/integrations/

**Related Documents:**
- `/docs/INCIDENT_RESPONSE.md` - Full incident response protocol
- `/docs/UPTIME_MONITORING.md` - Detailed uptime monitoring configuration
- `/backend/core/sentry_config.py` - Sentry configuration code

---

**Last Updated:** 2026-01-27

🏯 **"Giám sát tốt = ngủ ngon"**
*Good monitoring = good sleep.*
