# ROIaaS Deployment Guide

**Version:** 3.0.0
**Date:** 2026-03-05
**Status:** Production Ready

---

## Quick Start

```bash
# 1. Install dependencies
poetry install

# 2. Set environment variables
export RAAS_LICENSE_KEY="raas-pro-abc123-signature"
export DATABASE_URL="postgresql://user:pass@localhost:5432/mekong_db"
export LICENSE_SECRET="your-hmac-secret-key"

# 3. Run database migrations
python3 -m src.db.migrate

# 4. Verify installation
mekong version
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `RAAS_LICENSE_KEY` | License key for premium features | `raas-pro-abc123-signature` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `LICENSE_SECRET` | HMAC signing key for license generation | `your-secret-key` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RAAS_API_URL` | Remote validation API URL | `http://localhost:8787` |
| `RAAS_API_ENABLED` | Enable remote validation | `true` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mekong CLI Engine                        │
├─────────────────────────────────────────────────────────────┤
│  CLI Commands (Typer)                                       │
│  ├── Free: init, version, list, search, status, doctor     │
│  └── Premium: cook, gateway, binh-phap, swarm, agi         │
├─────────────────────────────────────────────────────────────┤
│  RaaS License Gate (Phase 1)                                │
│  ├── Environment variable check                             │
│  ├── License format validation                              │
│  └── Feature gating                                         │
├─────────────────────────────────────────────────────────────┤
│  Remote Validation (Phase 2)                                │
│  ├── HMAC signature verification                            │
│  ├── Usage metering per tier                                │
│  └── Rate limiting                                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Backend (Phase 3)                               │
│  ├── Connection pooling (asyncpg)                           │
│  ├── Repository layer (CRUD)                                │
│  └── Migration system                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## License Tiers

| Tier | Commands/Day | Max Days | Price |
|------|-------------|----------|-------|
| **free** | 10 | unlimited | $0 |
| **trial** | 50 | 7 | $0 |
| **pro** | 1000 | unlimited | $49/mo |
| **enterprise** | unlimited | unlimited | Custom |

---

## Database Schema

### Tables

```sql
licenses
├── id (SERIAL PRIMARY KEY)
├── license_key (VARCHAR 255, UNIQUE)
├── key_id (VARCHAR 50)
├── tier (VARCHAR 50)
├── email (VARCHAR 255)
├── status (VARCHAR 50)
├── daily_limit (INTEGER)
├── expires_at (TIMESTAMP)
└── created_at (TIMESTAMP)

usage_records
├── id (SERIAL PRIMARY KEY)
├── license_id (INTEGER, FK)
├── key_id (VARCHAR 50)
├── date (DATE)
├── commands_count (INTEGER)
└── total_commands (INTEGER)

revocations
├── id (SERIAL PRIMARY KEY)
├── key_id (VARCHAR 50)
├── license_key (VARCHAR 255)
├── reason (TEXT)
└── revoked_at (TIMESTAMP)

webhook_events
├── id (SERIAL PRIMARY KEY)
├── event_type (VARCHAR 50)
├── event_id (VARCHAR 100)
├── payload (JSONB)
└── processed (BOOLEAN)
```

---

## Migration Commands

```bash
# Run all pending migrations
python3 -m src.db.migrate

# Check migration status
python3 -m src.db.migrate status

# Rollback to specific version
python3 -m src.db.migrate rollback 001
```

---

## API Endpoints (Phase 2)

### License Validation API

```bash
# POST /api/v1/license/validate
curl -X POST http://localhost:8787/api/v1/license/validate \
  -H "Content-Type: application/json" \
  -d '{"license_key": "raas-pro-abc123-signature"}'

# Response
{
  "valid": true,
  "tier": "pro",
  "key_id": "abc123",
  "usage": {
    "commands_today": 50,
    "daily_limit": 1000,
    "remaining": 950
  }
}
```

### Polar.sh Webhook

```bash
# POST /api/v1/webhooks/polar
# Events: subscription.created, subscription.updated, subscription.cancelled
```

---

## Production Checklist

### Pre-Deployment

- [ ] Set `RAAS_LICENSE_KEY` environment variable
- [ ] Set `DATABASE_URL` for PostgreSQL
- [ ] Set `LICENSE_SECRET` for HMAC signing
- [ ] Run database migrations
- [ ] Verify asyncpg installed (`poetry show asyncpg`)

### Post-Deployment

- [ ] Test free commands work without license
- [ ] Test premium commands require license
- [ ] Verify database connection
- [ ] Check usage metering works
- [ ] Monitor error logs

### Security

- [ ] No secrets in codebase
- [ ] HMAC secret is strong (32+ chars)
- [ ] Database credentials secured
- [ ] HTTPS enabled for API

---

## Troubleshooting

### License Validation Fails

```bash
# Check license key format
echo $RAAS_LICENSE_KEY
# Should start with "raas-"

# Validate license locally
python3 -c "from src.lib.license_generator import validate_license; print(validate_license('raas-pro-abc123-sig'))"
```

### Database Connection Error

```bash
# Check DATABASE_URL format
echo $DATABASE_URL
# postgresql://user:pass@host:5432/dbname

# Test connection
python3 -c "from src.db.database import init_database; import asyncio; asyncio.run(init_database())"
```

### Migration Errors

```bash
# Check migration status
python3 -m src.db.migrate status

# Force re-run migration
python3 -m src.db.migrate rollback 000
python3 -m src.db.migrate
```

---

## Monitoring

### Key Metrics

- License validation success rate
- API response times
- Database connection pool usage
- Daily command usage per tier

### Logs

```bash
# License validation logs
grep "RAAS" ~/.mekong/logs/*.log

# Database errors
grep "PostgreSQL" ~/.mekong/logs/*.log
```

---

## Support

- **Documentation:** `plans/reports/raas-implementation-status-*.md`
- **Issues:** GitHub Issues
- **Email:** support@mekong-cli.io

---

**Last Updated:** 2026-03-05
**Version:** 3.0.0
