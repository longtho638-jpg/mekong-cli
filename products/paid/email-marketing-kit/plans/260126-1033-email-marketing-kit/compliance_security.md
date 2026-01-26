# Security & Compliance Guide

> **Product**: Email Marketing Kit
> **Date**: 2026-01-26

## Email Compliance

### CAN-SPAM Act (USA)
Compliance with CAN-SPAM is built into the kit's core logic.
1. **Unsubscribe Mechanism**:
   - **Requirement**: A visible, functional unsubscribe link valid for at least 30 days.
   - **Implementation**: `Phase 03` includes automatic injection of `{{ unsubscribe_link }}`. Sending fails if the template is missing this variable.
2. **Physical Address**:
   - **Requirement**: Sender's valid physical postal address.
   - **Implementation**: Stored in global config and appended to footer automatically.
3. **No False Headers**:
   - **Requirement**: "From", "To", "Reply-To" must be accurate.
   - **Implementation**: Enforced by the `EmailProvider` validation.

### GDPR (EU)
1. **Consent (Article 6)**:
   - **Implementation**: Double Opt-in workflow is the default. We store the IP address and Timestamp of the confirmation click as proof of consent.
2. **Right to Access (Article 15)**:
   - **Implementation**: `GET /api/v1/subscribers/{id}/export` endpoint generates a JSON dump of all data held on a subscriber.
3. **Right to Erasure (Article 17)**:
   - **Implementation**: `DELETE /api/v1/subscribers/{id}` permanently anonymizes or deletes the record (configurable to keep "Suppressed" status to prevent re-import).

## Technical Security

### Email Authentication (Deliverability Security)
To prevent spoofing and ensure delivery to Inbox (not Spam), the kit assists with:

1. **SPF (Sender Policy Framework)**
   - *What*: DNS record listing IPs allowed to send for your domain.
   - *Kit Feature*: A utility to check if the current SMTP host is authorized in the domain's SPF record.

2. **DKIM (DomainKeys Identified Mail)**
   - *What*: Cryptographic signature on every email.
   - *Kit Feature*: The `EmailProvider` handles the signing (e.g., SES/SendGrid does this automatically). If using local SMTP, we recommend using a relay like Postfix that handles signing, or using `aiosmtplib` with a key.

3. **DMARC (Domain-based Message Authentication, Reporting, and Conformance)**
   - *What*: Policy telling receivers what to do if SPF/DKIM fail.
   - *Kit Feature*: Dashboard warning if DMARC record is missing on the sender domain.

### Application Security

1. **Input Sanitization**:
   - **Risk**: XSS in email templates.
   - **Mitigation**: Jinja2 `autoescape=True`. All user-provided HTML is sanitized using `bleach` (if raw HTML editing is enabled) or restricted to MJML.

2. **Open Redirect Protection**:
   - **Risk**: Attackers using the tracking link `http://yoursite.com/click?url=evil.com` to phish users.
   - **Mitigation**: The tracking endpoint verifies that the `url` parameter matches a link actually found in the email content (signed or stored lookup).

3. **Rate Limiting**:
   - **Risk**: Abusing the "Send Test Email" endpoint to spam others.
   - **Mitigation**: Strict limits on transactional endpoints (e.g., 5 per minute per API key).

4. **Secrets Management**:
   - **Implementation**: Database credentials and SMTP passwords are read from Environment Variables, never hardcoded.

## Privacy Shield (Apple MPP)
- **Context**: Apple Mail pre-loads images via proxy, causing 100% Open Rate for iOS users.
- **Strategy**: The Analytics Engine separates "Machine Opens" from "User Opens" where possible (by User-Agent analysis), or reports "Reliable Opens" vs "Total Opens".
