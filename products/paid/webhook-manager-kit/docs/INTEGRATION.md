# Integration Examples

How to integrate Webhook Manager Kit into your existing application.

## 1. Triggering Webhooks

In your main application (e.g., your SaaS backend), you need to make a POST request to the Webhook Manager Kit whenever an event occurs.

### Python (Requests)

```python
import requests

WEBHOOK_MANAGER_URL = "http://localhost:8000/api/v1/events/trigger"

def trigger_webhook(event_type, payload):
    try:
        response = requests.post(
            WEBHOOK_MANAGER_URL,
            json={
                "event_type": event_type,
                "payload": payload
            },
            timeout=5
        )
        response.raise_for_status()
    except Exception as e:
        print(f"Failed to trigger webhook: {e}")

# Usage
trigger_webhook("user.created", {"id": 123, "email": "user@example.com"})
```

### Node.js (Axios)

```javascript
const axios = require('axios');

const WEBHOOK_MANAGER_URL = 'http://localhost:8000/api/v1/events/trigger';

async function triggerWebhook(eventType, payload) {
  try {
    await axios.post(WEBHOOK_MANAGER_URL, {
      event_type: eventType,
      payload: payload
    });
  } catch (error) {
    console.error('Failed to trigger webhook:', error.message);
  }
}

// Usage
triggerWebhook('order.paid', { id: 'ord_123', amount: 9900 });
```

## 2. Consuming Webhooks

Your customers/users will set up endpoints to receive these events. They should use the signature verification (see SECURITY.md) to secure their endpoints.

See `docs/SECURITY.md` for verification code snippets.
