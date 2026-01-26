# Examples

## 1. Sending a Basic In-App Notification

**Request (Python/Requests):**
```python
import requests

payload = {
    "user_id": "user_123",
    "type": "info",
    "title": "New Comment",
    "body": "Alice commented on your post."
}
requests.post("http://localhost:8000/api/v1/notifications/send", json=payload)
```

## 2. Sending an Email Notification
To trigger an email, ensure the notification `type` includes "email" (logic defined in `endpoints/notifications.py`).

**Request (cURL):**
```bash
curl -X POST http://localhost:8000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "type": "email_alert",
    "title": "Security Alert",
    "body": "New login detected from new IP.",
    "data": {
        "url": "https://myapp.com/security"
    }
  }'
```

## 3. Triggering a Webhook
Include `webhook_url` in the `data` field.

**Request:**
```json
{
  "user_id": "system",
  "type": "event",
  "title": "Deployment Success",
  "body": "Build #45 deployed successfully.",
  "data": {
    "webhook_url": "https://hooks.slack.com/services/..."
  }
}
```

## 4. Frontend Component Usage

```tsx
import { NotificationFeed } from './components/NotificationFeed';

export default function Dashboard() {
  const currentUser = { id: "user_123" };

  return (
    <div className="flex justify-between p-4 bg-white shadow">
      <h1>Dashboard</h1>

      {/*
        vapidPublicKey is optional.
        Only provide if using Web Push notifications.
      */}
      <NotificationFeed
        userId={currentUser.id}
        vapidPublicKey="BM...your_public_key..."
      />
    </div>
  );
}
```
