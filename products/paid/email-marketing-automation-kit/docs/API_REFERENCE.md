# API Reference

The kit exposes REST API endpoints for sending emails, previewing templates, and running tests.

## 1. Send Email

Send a transactional email using the configured providers.

**Endpoint:** `POST /api/send`

**Body Parameters:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject line |
| `template` | string | Yes | Template ID (e.g., `welcome`, `order-confirmation`) |
| `data` | object | No | Props to pass to the React component |

**Example Request:**

```json
{
  "to": "user@example.com",
  "subject": "Welcome aboard!",
  "template": "welcome",
  "data": {
    "customerName": "John Doe",
    "loginLink": "https://myapp.com/login"
  }
}
```

**Response:**

```json
{
  "success": true,
  "provider": "resend", // or "sendgrid"
  "id": "re_123..."
}
```

## 2. Preview Template

Render a template to HTML for previewing.

**Endpoint:** `GET /api/preview`

**Query Parameters:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `template` | string | Yes | Template name to render |
| `list` | boolean | No | If true, returns list of all available templates |

**Example Request:**
`GET /api/preview?template=invoice`

**Response:**
Returns raw HTML string.

## 3. Run Tests

Run various checks on your email content.

**Endpoint:** `POST /api/test`

**Body Parameters:**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | Yes | One of: `spam-score`, `validate`, `links` |
| `template` | string | Yes | Template name to test |
| `subject` | string | No | Subject line (required for spam-score) |

**Example Request (Spam Score):**

```json
{
  "type": "spam-score",
  "template": "promotional",
  "subject": "FREE MONEY CLICK HERE"
}
```

**Response:**

```json
{
  "score": 6.5,
  "details": ["Subject line is all caps", "Contains spam keyword: 'free'"],
  "isSpam": true
}
```
