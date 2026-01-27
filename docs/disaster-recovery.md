# Disaster Recovery Runbook

## 1. Emergency Response
**Trigger**: Complete region failure, data corruption, or malicious deletion.
**Role**: DevOps Lead / CTO.

### 1.1 Immediate Actions
1. **Stop Traffic**: Put application in maintenance mode.
   ```bash
   cc deploy maintenance --on
   ```
2. **Assess Damage**: Check Grafana dashboards and S3 bucket status.
3. **Notify Stakeholders**: Send status update via PagerDuty/Slack.

## 2. Restore Procedure (Point-in-Time)

### 2.1 Locate Backup
1. List available backups:
   ```bash
   aws s3 ls s3://agencyos-backups-primary-us-east-1/daily/
   ```
2. If Primary region is down, check DR bucket:
   ```bash
   aws s3 ls s3://agencyos-backups-dr-eu-west-1/daily/
   ```

### 2.2 Restore Database
1. Run the restore script:
   ```bash
   ./scripts/backup/restore.sh
   ```
   Or use the API:
   ```bash
   curl -X POST https://api.agencyos.dev/api/backups/restore/s3://... \
     -H "Authorization: Bearer $TOKEN"
   ```

### 2.3 Verify Data
1. Check critical tables (Users, Orders).
2. Run integrity checks:
   ```bash
   ./scripts/backup/verify-backup.sh
   ```

## 3. Failover (Region Failure)

1. Update DNS to point to DR Region (if active-passive).
2. Deploy Backend to DR Region (if not running).
3. Connect Backend to Restored Database.

## 4. Post-Mortem
1. Analyze root cause.
2. Update this runbook with lessons learned.
3. Verify zero data loss.

## 5. Contact List
- **DevOps**: devops@agencyos.dev / +1-555-0100
- **AWS Support**: Case ID #12345
- **Supabase Support**: Priority Enterprise Support
