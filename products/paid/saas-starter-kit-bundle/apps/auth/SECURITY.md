# Security Best Practices

Antigravity Auth PRO is designed with security in mind. Here are the built-in features and recommendations.

## Built-in Features

1.  **MFA Enforcement**:
    - Users can enable TOTP (Authenticator App).
    - Backup codes are provided for recovery.
    - Admins can enforce MFA for specific roles.

2.  **Session Management**:
    - All active sessions are tracked in the database.
    - Users can view device details (OS, Browser, IP).
    - "Log out all other devices" functionality included.

3.  **Secure Headers**:
    - The application is configured with secure HTTP headers via `next.config.js`.

4.  **Row Level Security (RLS)**:
    - All database access is protected by Postgres RLS policies.
    - No direct table access without proper authentication.

## Recommendations

1.  **Environment Variables**:
    - Never commit `.env` files to version control.
    - Use secret management services in production.

2.  **Supabase Security**:
    - Enable "Confirm Email" in Supabase Auth settings.
    - Set strict password policies (min length, complexity).

3.  **Production Deployment**:
    - Use HTTPS for all connections.
    - Set `NEXT_PUBLIC_APP_URL` to your production domain.

## Reporting Vulnerabilities

If you discover a security vulnerability, please send an email to security@antigravity.com.
