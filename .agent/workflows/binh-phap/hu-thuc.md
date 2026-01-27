---
description: 虛實 - Defense, Security, and Protection Strategies
---

# 🏯 Chapter 6: Hư Thực (虛實)

> **"Tránh thực, đánh hư"** - Avoid strength, attack weakness

## Philosophy

The supreme excellence in war is attacking the enemy's strategy. Know your strengths and weaknesses. Protect the vital, expose the expendable.

## When to Use

- Security hardening
- Rate limiting
- Equity protection
- Vulnerability assessment

## Steps

### Step 1: Weakness Audit

// turbo

```bash
# Identify vulnerabilities
cat << 'EOF'
## Vulnerability Scan

| Area | Weakness | Risk | Priority |
|------|----------|------|----------|
| Auth | ___ | H/M/L | P__ |
| API | ___ | H/M/L | P__ |
| Data | ___ | H/M/L | P__ |
| Infra | ___ | H/M/L | P__ |
EOF
```

### Step 2: Defense Implementation

// turbo

```bash
# Security measures
cat << 'EOF'
## Defense Layers

1. 🛡️ Perimeter - Rate limiting, WAF
2. 🔐 Authentication - MFA, OAuth
3. ⚖️ Authorization - RBAC, RLS
4. 📝 Audit - Logging, monitoring
5. 🔄 Recovery - Backup, DR
EOF
```

### Step 3: Protection Verification

// turbo

```bash
# Verify defenses
cat << 'EOF'
## Security Checklist

- [ ] Rate limiting enabled
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Secrets encrypted
- [ ] Audit logging
EOF
```

## Related Commands

- `/shield` - Protection analysis
- `/equity` - Equity management
- `/security` - Security audit

## Related IPO Tasks

- IPO-003-Security (Core protection)
- IPO-033-Rate-Limiting (Defense)
- IPO-018-OAuth (Auth)

## Binh Pháp Wisdom

> **"知彼知己，百戰不殆"**
> Know the enemy, know yourself, never in peril.

---

_AgencyOS | Binh Pháp Chapter 6 | Hư Thực_
