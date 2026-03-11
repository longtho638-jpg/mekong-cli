# Legal Compliance Report — MIT License, GDPR, Privacy
*Mekong CLI v5.0 | March 2026*

## License Compliance

### MIT License Status
- LICENSE file: Present in repo root
- License type: MIT (permissive, OSI-approved)
- Author: Binh Phap Venture Studio

### MIT License Obligations (What We Must Do)
| Obligation | Status |
|-----------|--------|
| Include copyright notice in distributions | License file in repo — PyPI wheel must include it |
| Include license text in distributions | Verify `pyproject.toml` includes LICENSE in package data |
| No warranty liability | Covered by MIT "AS IS" clause |

### MIT License Permissions (What Others Can Do)
- Use commercially: Yes
- Modify: Yes
- Distribute: Yes
- Sublicense: Yes
- Private use: Yes
- Patent use: Not granted (MIT does not include patent grant — note for enterprise customers)

**Action needed:** Verify `pyproject.toml` packages section includes LICENSE file in wheel distribution.

---

## Dependency License Audit

All runtime dependencies must be MIT, BSD, Apache 2.0, or compatible:

| Package | License | Compatible? |
|---------|---------|------------|
| FastAPI | MIT | Yes |
| Typer | MIT | Yes |
| Pydantic | MIT | Yes |
| SQLAlchemy | MIT | Yes |
| Rich | MIT | Yes |
| Authlib | BSD | Yes |
| python-jose | MIT | Yes |
| passlib | BSD | Yes |
| Stripe SDK | Apache 2.0 | Yes |
| structlog | Apache 2.0 / MIT | Yes |
| uvicorn | BSD | Yes |
| cryptography | Apache 2.0 / BSD | Yes |

**No GPL or AGPL dependencies detected** — safe for commercial use and RaaS distribution.

---

## GDPR Compliance

### Data We Collect (RaaS Users)

| Data Type | Purpose | Retention | Legal Basis |
|-----------|---------|-----------|------------|
| Email address | Account creation, billing | Duration of subscription + 2 years | Contract |
| Credit card (via Polar.sh) | Payment processing | Polar.sh/Stripe stores, not us | Contract |
| MCU usage logs | Billing accuracy, audit | 90 days rolling | Legitimate interest |
| Mission metadata (not content) | Credit metering | 90 days | Legitimate interest |
| IP address (API logs) | Security, abuse prevention | 30 days | Legitimate interest |

**Key GDPR principle:** We do NOT store LLM prompt content. BYOK means user's prompts go directly to their LLM provider. This significantly reduces our GDPR surface.

### GDPR Rights Implementation

| Right | Status | Implementation |
|-------|--------|---------------|
| Right to access | Not implemented | Need `mekong raas export-data` command |
| Right to erasure | Not implemented | Need `mekong raas delete-account` command |
| Right to portability | Not implemented | Need JSON export of usage data |
| Right to rectification | Partial | User can update email via billing portal |

**Gap:** No formal GDPR rights flow exists. Must implement before serving EU customers commercially.

### Privacy Policy
- Status: **Missing** — no privacy policy page on mekong.sh
- **Required before launch** for GDPR and general trust
- Minimum content: what data we collect, how we use it, how to request deletion
- Recommend: use a generator (Termly, iubenda) for v1 — $0 cost

---

## Terms of Service

- Status: **Missing**
- Required to enforce MCU credit limits, abuse policies, and acceptable use
- Key clauses needed:
  - Acceptable use (no illegal content generation)
  - MCU credit non-refundability (or refund policy)
  - BYOK disclaimer (we are not responsible for LLM provider outages)
  - MIT license acknowledgment for self-hosters
  - Governing law (Vietnam or Delaware — decide based on entity formation)

---

## CCPA (California) Compliance

Triggered when: serving California residents + >$25M revenue OR >100K user records.

**Current status:** Not triggered (pre-revenue, <100K users).
**Action:** Monitor — add CCPA clause to privacy policy when writing it (no extra cost to include).

---

## Export Control (ITAR/EAR)

Cryptography export: `cryptography` package uses OpenSSL. US export regulations apply to encryption software.

**Status:** Standard commercial encryption (AES, RSA) is generally exempt under EAR License Exception ENC. No ITAR concerns for a business automation CLI.

**Action:** Add standard EAR notice to README: "This software uses encryption and may be subject to US export regulations."

---

## Priority Legal Actions (Pre-Launch)

| Priority | Action | Cost | Timeline |
|----------|--------|------|----------|
| 1 | Write Privacy Policy | $0 (generator) | This week |
| 2 | Write Terms of Service | $0–200 (template) | This week |
| 3 | Verify MIT license in PyPI wheel | $0 | Before PyPI publish |
| 4 | Add EAR export notice to README | $0 | This week |
| 5 | Implement data export/deletion for GDPR | Dev effort | Before EU launch |
| 6 | LLC formation (at $5K MRR) | $500–1,000 | Q3 trigger |
