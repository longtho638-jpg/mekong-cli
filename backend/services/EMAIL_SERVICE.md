# Email Service

Email notification service for purchase confirmations and license delivery.

## Features

✅ Welcome email with professional HTML/text templates
✅ License key delivery
✅ Download links
✅ Getting started instructions
✅ Mock mode for testing (default)
✅ SMTP support for production

## Quick Start

### Basic Usage (Mock Mode)

```python
from backend.services.email_service import send_purchase_email

# Send purchase confirmation email
success = send_purchase_email(
    email="customer@example.com",
    license_key="BP-2026-ABCD-1234-EFGH-5678",
    product_name="BizPlan Generator"
)

if success:
    print("Email sent successfully!")
```

### Custom Configuration

```python
from backend.services.email_service import EmailService

# Create custom email service
service = EmailService(
    smtp_host="smtp.gmail.com",
    smtp_port=587,
    smtp_user="your-email@gmail.com",
    smtp_password="your-app-password",
    from_email="sales@binhphap.com",
    mock_mode=False  # Set to False for real sending
)

# Send email
service.send_purchase_email(
    email="customer@example.com",
    license_key="BP-2026-ABCD-1234-EFGH-5678",
    product_name="BizPlan Generator"
)
```

## Configuration

### Environment Variables

```bash
# SMTP Configuration (optional)
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"
export FROM_EMAIL="noreply@binhphap.com"

# Mock Mode (default: true)
export EMAIL_MOCK_MODE="true"
```

### Gmail Setup (Production)

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password
3. Use the app password in `SMTP_PASSWORD`

## Email Template

The service sends both HTML and plain text versions:

### HTML Features
- Professional gradient header
- License key in highlighted box
- Clear getting started steps
- Download and documentation buttons
- Helpful resources links
- Responsive design

### Plain Text Fallback
- All information in text format
- Works with any email client
- Accessibility-friendly

## Testing

Run the test suite:

```bash
cd backend/services
python3 test_email_service.py
```

Test output shows:
- Mock email preview
- License key delivery
- Product information
- Pass/fail status

## Integration Example

```python
# In webhook handler after successful purchase
from backend.services.email_service import send_purchase_email

def handle_gumroad_webhook(data):
    # Extract purchase info
    email = data["purchase"]["email"]
    product = data["product"]["name"]

    # Generate license key
    license_key = generate_license_key()

    # Send welcome email
    email_sent = send_purchase_email(
        email=email,
        license_key=license_key,
        product_name=product
    )

    if email_sent:
        logger.info(f"Welcome email sent to {email}")
    else:
        logger.error(f"Failed to send email to {email}")
```

## API Reference

### `send_purchase_email(email, license_key, product_name) -> bool`

Send purchase confirmation email.

**Parameters:**
- `email` (str): Recipient email address
- `license_key` (str): License key for the product
- `product_name` (str): Name of the purchased product

**Returns:**
- `bool`: True if sent successfully, False otherwise

### `EmailService` Class

**Constructor Parameters:**
- `smtp_host` (str, optional): SMTP server host
- `smtp_port` (int, optional): SMTP server port
- `smtp_user` (str, optional): SMTP username
- `smtp_password` (str, optional): SMTP password
- `from_email` (str, optional): Sender email address
- `mock_mode` (bool, optional): Enable mock mode (default: True)

**Methods:**
- `send_purchase_email(email, license_key, product_name)`: Send purchase email

## Security Notes

⚠️ **Never commit SMTP credentials to git**
✅ Use environment variables or secret management
✅ Use app-specific passwords (not your main password)
✅ Enable mock mode in development

## Troubleshooting

### Email not sending (Mock Mode)

By default, the service runs in mock mode. Check the console output for email preview.

### SMTP Authentication Failed

1. Verify SMTP credentials are correct
2. Check if 2FA is enabled (use app password)
3. Ensure "Less secure app access" is NOT enabled (use app password instead)

### Email in Spam

1. Configure SPF, DKIM, and DMARC records
2. Use a professional email service (SendGrid, Mailgun, etc.)
3. Avoid spam trigger words in subject/body

## Future Enhancements

- [ ] Email template customization
- [ ] Attachment support (PDF receipts)
- [ ] Email queue for bulk sending
- [ ] Analytics tracking (open rate, click rate)
- [ ] Multiple language support
- [ ] SendGrid/Mailgun integration

## License

Part of Binh Pháp Venture Studio - Mekong CLI
