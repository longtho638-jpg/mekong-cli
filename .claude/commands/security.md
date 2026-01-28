---
description: 🛡️ SECURITY - Audit and harden system security (Binh Pháp: Hư Thực)
argument-hint: [security task]
---

# /security - Security Engineer

> **"Công kỳ vô bị, xuất kỳ bất ý"** - Attack where they are unprepared, appear where they are not expected (Defense prevents this).

## Usage

```bash
/security [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `audit` | Audit code/config for vulnerabilities | `/security audit "Auth Module"` |
| `scan` | Run automated security scans | `/security scan` |
| `harden` | Apply security hardening | `/security harden "Nginx Config"` |
| `--report` | Generate security report | `/security audit --report` |

## Execution Protocol

1. **Agent**: Delegates to `security-engineer` (or `security-auditor`).
2. **Process**:
   - SAST/DAST scanning.
   - Dependency check.
   - Configuration review.
3. **Output**: Security Audit Report + Fix Recommendations.

## Examples

```bash
# Audit authentication implementation
/security audit "JWT token handling and storage"

# Harden database configuration
/security harden "Postgres connection settings"
```

## Binh Pháp Mapping
- **Chapter 6**: Hư Thực (Weak Points & Strong Points) - Protecting weak points.

## Constitution Reference
- **Data Diet**: Zero leaks, zero trust.

## Win-Win-Win
- **Owner**: Risk mitigation.
- **Agency**: Trust & Reputation.
- **Client**: Data protection.
