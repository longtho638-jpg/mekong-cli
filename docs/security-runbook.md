# Security Runbook & Incident Response Plan

## 1. Severity Classification

| Level | Description | Examples | SLA (Response/Resolution) |
|-------|-------------|----------|---------------------------|
| **CRITICAL** | Service outage, Data breach, Active attack | Root compromise, SQL Injection exploited, User DB leak | 15 min / 4 hours |
| **HIGH** | Significant feature broken, Security bypass possible | Broken ACLs, XSS potential, Failed backups | 1 hour / 24 hours |
| **MEDIUM** | Non-critical bug, Potential vulnerability | Deprecated config, Weak cipher suite | 24 hours / 1 week |
| **LOW** | Minor issue, Hardening suggestion | Missing headers, Information disclosure (version) | 1 week / Next Sprint |

## 2. Incident Response Phases

### Phase 1: Identification
- **Alerts**: PagerDuty/Slack notification from `SecurityMonitor`.
- **Logs**: Check `audit_logs` in DB and Splunk/Datadog.
- **Verification**: Reproduce or verify the anomaly is not a false positive.

### Phase 2: Containment
- **Block IP**: Add attacking IP to firewall/WAF blocklist.
- **Revoke Tokens**:
  ```bash
  # Scripts available in ops toolkit
  python scripts/security/revoke_user.py --user_id <TARGET_ID>
  ```
- **Lock Account**: Set user status to `locked`.
- **Rollback**: If caused by bad deployment, use `cc deploy rollback`.

### Phase 3: Eradication
- **Patch**: Deploy fix for vulnerability.
- **Rotate Secrets**: If keys compromised, rotate immediately using AWS Secrets Manager / Vault.
- **Clean**: Remove any backdoors or malicious data.

### Phase 4: Recovery
- **Restore**: Restore data from backups if integrity compromised.
- **Monitor**: Enhanced monitoring for 24h.
- **Unblock**: Remove temporary blocks once threat passes.

### Phase 5: Lessons Learned
- **Post-Mortem**: Document root cause, timeline, and fix.
- **Action Items**: Create tickets to prevent recurrence.

## 3. Common Scenarios

### Scenario A: Compromised API Key
**Trigger**: Alert "Abnormal API usage pattern".
**Action**:
1. Identify key owner.
2. Revoke key immediately.
3. Check audit logs for unauthorized actions during compromise window.
4. Notify user to generate new key.

### Scenario B: Brute Force Attack
**Trigger**: Alert "High failed login rate".
**Action**:
1. Auto-ban IP (handled by RateLimiter).
2. If distributed (botnet), enable "Under Attack Mode" (Cloudflare).
3. Notify users of failed attempts.

### Scenario C: Data Exfiltration
**Trigger**: Alert "Large data export".
**Action**:
1. Kill active session.
2. Verify if export was authorized.
3. If unauthorized, disconnect network/database access.
4. Legal/Compliance notification (GDPR/CCPA).

## 4. Contacts
- **CISO**: ciso@mekong.hq
- **DevOps On-Call**: +1-555-0199
- **Legal**: legal@mekong.hq
