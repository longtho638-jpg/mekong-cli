---
description: 行軍 - Steady Operations, Jobs, and Queues
---

# 🏯 Chapter 9: Hành Quân (行軍)

> **"Hành quân tất thận"** - March carefully

## Philosophy

The skillful leader calculates position, resource availability, and operational readiness. Steady operations, reliable logistics, never stranded.

## When to Use

- Job scheduling
- Queue management
- Operational runbooks
- Process automation

## Steps

### Step 1: Operations Audit

// turbo

```bash
# Check operational health
cat << 'EOF'
## Operations Dashboard

| System | Status | Jobs/hr | Failed |
|--------|--------|---------|--------|
| Queues | ✅/❌ | ___ | ___ |
| Cron | ✅/❌ | ___ | ___ |
| Workers | ✅/❌ | ___ | ___ |
| Webhooks | ✅/❌ | ___ | ___ |
EOF
```

### Step 2: Job Configuration

// turbo

```bash
# Job scheduler setup
cat << 'EOF'
## Job Schedule

| Job | Frequency | Priority | Timeout |
|-----|-----------|----------|---------|
| backup | Daily 2am | High | 30m |
| reports | Weekly | Med | 1h |
| cleanup | Hourly | Low | 5m |
| sync | Every 5m | Med | 2m |
EOF
```

### Step 3: Queue Monitoring

// turbo

```bash
# Queue health check
cat << 'EOF'
## Queue Status

| Queue | Pending | Processing | DLQ |
|-------|---------|------------|-----|
| default | ___ | ___ | ___ |
| priority | ___ | ___ | ___ |
| batch | ___ | ___ | ___ |
EOF
```

## Related Commands

- `/okr` - OKR management
- `/ops` - Operations dashboard
- `/jobs` - Job management

## Related IPO Tasks

- IPO-019-Queue (Queue system)
- IPO-039-Jobs (Scheduler)
- IPO-017-Webhook (Event processing)

## Binh Pháp Wisdom

> **"行軍之法，無恃其不來，恃吾有以待之"**
> Don't rely on the enemy not coming, rely on your preparedness.

---

_AgencyOS | Binh Pháp Chapter 9 | Hành Quân_
