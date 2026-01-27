# Audit Logging Guide

## Overview

The Audit Logging system provides a comprehensive, immutable, and searchable record of all actions performed within the AgencyOS platform. It is designed to meet compliance requirements for SOC 2, GDPR, HIPAA, and PCI-DSS.

## Features

1.  **Immutable Audit Trail**: Uses SHA-256 hash chaining to prevent tampering.
2.  **Full Coverage**: Logs user actions, API requests, admin operations, and security events.
3.  **Search & Filtering**: Granular search by user, action, resource, and time range.
4.  **Export**: Compliance-ready CSV and JSON exports.
5.  **Retention**: Automatic archival of old logs to cold storage (S3).
6.  **SIEM Integration**: Forward logs to Splunk, ELK, or Datadog.

## Data Structure

Each audit log entry contains:

| Field | Description |
|-------|-------------|
| `timestamp` | UTC timestamp of the event |
| `user_id` | ID of the user performing the action |
| `action` | Action type (e.g., `user.login`, `resource.create`) |
| `resource_type` | Type of resource affected (e.g., `user`, `invoice`) |
| `resource_id` | ID of the resource |
| `metadata` | JSON object with additional context (diffs, params) |
| `ip_address` | Source IP address |
| `hash` | Cryptographic hash for integrity verification |

## Usage

### Viewing Logs (Admin API)

**Endpoint**: `GET /api/audit/logs`

**Parameters**:
- `user_id`: Filter by user.
- `action`: Filter by action type.
- `start_date`, `end_date`: Time range (ISO 8601).
- `limit`, `offset`: Pagination.

### Exporting Logs

**Endpoint**: `GET /api/audit/export`

**Parameters**:
- `format`: `csv` or `json` (default: `json`).
- Filters same as search.

### Integrity Verification

**Endpoint**: `GET /api/audit/verify`

Checks the hash chain integrity of recent logs to ensure no records have been modified or deleted.

## Configuration

Settings in `.env`:
- `AUDIT_RETENTION_DAYS`: Days to keep in hot storage (default: 365).
- `SPLUNK_HEC_URL`: Splunk HEC Endpoint for forwarding.
- `SPLUNK_TOKEN`: Splunk HEC Token.

## Compliance

### GDPR
- **Right to Access**: Use Search/Export to provide user activity reports.
- **Right to Erasure**: Audit logs are typically exempt from erasure requests if required for legal/security reasons (check local laws), but allow marking as "erased" if needed without breaking chain (not implemented default).

### SOC 2
- **Security Monitoring**: Use SIEM integration to alert on suspicious activities.
- **Change Management**: Audit logs track all config changes (`config.change`).

### HIPAA
- **Access Tracking**: Logs all access to PHI (Protected Health Information).
