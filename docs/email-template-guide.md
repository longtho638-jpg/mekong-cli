# Email Template Guide

> **Objective:** How to create and manage dynamic email templates in Agency OS.

## 1. Template Structure

We use **Jinja2** for template rendering. This allows for powerful logic, loops, and variable substitution within your email content.

### Basic Syntax

*   **Variables:** `{{ user_name }}` outputs the value of the variable.
*   **Logic:** `{% if amount > 100 %} High Value {% endif %}`
*   **Loops:** `{% for item in items %} <li>{{ item }}</li> {% endfor %}`

## 2. Managing Templates

Templates can be managed via the **Admin Dashboard** (`/admin/notifications/templates`).

### Creating a Template

1.  **Name:** Unique identifier (e.g., `invoice_created`, `welcome_email`). This is what you pass to the orchestrator.
2.  **Type:** Select `Email`.
3.  **Subject:** The email subject line. Supports variables (e.g., `Invoice #{{ invoice_id }}`).
4.  **Content:** The HTML body of the email.

### Example: Welcome Email

**Name:** `welcome_email`
**Subject:** Welcome to Agency OS, {{ user_name }}!

**Content:**
```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; color: #333; }
  .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
</style>
</head>
<body>
  <h1>Welcome, {{ user_name }}!</h1>
  <p>We are thrilled to have you on board.</p>
  <p>Your account has been successfully created.</p>

  <p>
    <a href="{{ dashboard_url }}" class="button">Go to Dashboard</a>
  </p>

  <p>Best regards,<br>The Agency OS Team</p>
</body>
</html>
```

## 3. Context Variables

When triggering a notification from code, the `data` dictionary you pass is available in the template.

**Code:**
```python
await orchestrator.send_notification(
    ...,
    type="welcome_email",
    data={
        "user_name": "Alice",
        "dashboard_url": "https://app.agencyos.network"
    }
)
```

**Template:**
```html
Hello {{ user_name }}
```

## 4. Best Practices

1.  **Inline CSS:** Email clients (Gmail, Outlook) have varying support for CSS. It's best to inline critical styles or use simple HTML structures.
2.  **Responsive Design:** Use media queries for mobile optimization, but keep layouts simple (single column works best).
3.  **Testing:** Always send a test notification to yourself to verify rendering across different clients.
4.  **Images:** Use absolute URLs for images (e.g., `https://cdn.agencyos.network/logo.png`).
