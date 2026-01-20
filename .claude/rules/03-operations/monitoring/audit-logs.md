# Audit Log Standards

Guidelines for recording system and user activity for security and compliance.

## Rules
- Record all administrative actions (user management, config changes, deployments).
- Include the "Who, What, When, Where, and Why" in every audit event.
- Audit logs must be immutable and stored in a secure, tamper-evident location.
- Implement log integrity checks to detect unauthorized modifications.
- Ensure audit logs are retained according to regulatory and business requirements.
- Periodically review audit logs for suspicious activity.
- Automate alerts for critical security-related audit events (e.g., multiple failed logins, permission changes).
