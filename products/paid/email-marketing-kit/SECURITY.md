# Security Considerations

Security is a critical aspect of email marketing infrastructure.

## 🔒 Email Injection Prevention

- **Input Validation**: All user inputs (names, emails, subjects) are validated using Pydantic schemas.
- **Header Sanitization**: To prevent header injection attacks, newline characters are stripped from header fields (Subject, From, etc.).

## 🛡️ SMTP Relay Protection

- **Authenticated Access**: The API is protected. Ensure `SECRET_KEY` is strong.
- **Provider Security**: We recommend using API-based providers (SES, SendGrid) over raw SMTP for better security and deliverability.
- **Rate Limiting**: Implement rate limiting at the web server level (Nginx) to prevent abuse of the send endpoints.

## 🛑 Unsubscribe Compliance (CAN-SPAM / GDPR)

- **One-Click Unsubscribe**: Every email sent must include a clear unsubscribe link.
- **Headers**: The system should automatically inject `List-Unsubscribe` headers (Planned feature).
- **Status Management**: The system enforces `status=unsubscribed`. The dispatcher filters out unsubscribed users automatically.

## 🕵️ Data Privacy (PII)

- **Subscriber Data**: Emails and names are PII.
- **Access Control**: Restrict database access to authorized personnel only.
- **Encryption**: Use TLS (HTTPS) for all API traffic. Use TLS for SMTP connections.

## 🔑 API Security

- **CORS**: Configure `BACKEND_CORS_ORIGINS` in `.env` to allow only trusted domains.
- **SQL Injection**: We use SQLAlchemy ORM which handles parameter escaping, preventing SQL injection.

## ⚠️ Recommendations

1.  **DMARC/SPF/DKIM**: These are DNS settings required for your sending domain. They are crucial to prevent others from spoofing your domain.
2.  **Regular Updates**: Keep the kit and its dependencies updated to patch vulnerabilities.
3.  **Audit Logs**: Monitor your provider's logs for unusual sending activity.
