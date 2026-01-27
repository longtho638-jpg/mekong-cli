# Phase 1: Infrastructure & Configuration

## Overview
Set up the physical (cloud) terrain for our backups. We need immutable, multi-region storage buckets with strict access controls.

## Tasks
- [ ] Create `terraform/backup/providers.tf`
- [ ] Create `terraform/backup/s3-buckets.tf` (Primary + Replica)
- [ ] Create `terraform/backup/iam-roles.tf`
- [ ] Create `terraform/backup/lifecycle-policies.tf`
- [ ] Create `config/backup-policy.yaml`

## Key Decisions
- **Regions**: Primary: `us-east-1`, DR: `eu-west-1`.
- **Versioning**: Enabled for PITR support.
- **Locking**: Object Lock enabled for compliance (WORM).
- **Encryption**: SSE-KMS with Customer Managed Keys (CMK).
