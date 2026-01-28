# Notification System Guide (IPO-051)

> **Objective:** A unified, multi-channel notification orchestrator for Agency OS.

## 1. Architecture Overview

The Notification System is designed to be **channel-agnostic** and **preference-aware**. It decouples the *trigger* of a notification from the *delivery* mechanism.

### Key Components

1.  **Notification Orchestrator**: The central brain. It receives a notification request (User ID, Type, Data), checks user preferences, checks rate limits, and dispatches to enabled channels.
2.  **Channels**:
    *   **Email**: Uses `TemplateService` (Jinja2) and sends via SMTP/AWS SES/SendGrid (abstracted).
    *   **Push**: Uses Web Push (VAPID) or FCM.
    *   **In-App**: Stored in the database (`notifications` table) for display in the dashboard.
    *   **SMS**: (Planned) Twilio/AWS SNS integration.
3.  **Rate Limiter**: Prevents spamming users. Configured per notification type and channel.
4.  **Template Engine**: Renders dynamic content using Jinja2 templates.

### Data Flow

```mermaid
graph TD
    A[Trigger (e.g., Payment Success)] -->|Call orchestrator.send_notification| B(Notification Orchestrator)
    B --> C{Check User Prefs}
    C -->|Email Enabled?| D[Email Service]
    C -->|Push Enabled?| E[Push Service]
    C -->|Always| F[In-App Database]
    D --> G{Rate Limit Check}
    E --> H{Rate Limit Check}
    G -->|Pass| I[Send Email]
    H -->|Pass| J[Send Push]
```

## 2. API Reference

### Base URL: `/api/v1/notifications`

#### 2.1. User Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Get current user's notifications. Query: `?unread_only=true` |
| `POST` | `/{id}/read` | Mark a specific notification as read. |
| `POST` | `/read-all` | Mark all notifications as read. |

#### 2.2. Preferences (`/preferences`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Get current user's notification settings. |
| `PUT` | `/` | Update settings (enable/disable channels, quiet hours). |

#### 2.3. Push Subscriptions (`/push`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/subscribe` | Register a browser PushSubscription. |
| `POST` | `/unsubscribe` | Remove a subscription. |

#### 2.4. Admin/System (`/templates`, `/send`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/send` | Trigger a notification manually (Admin only). |
| `GET` | `/analytics` | View delivery stats (Admin only). |
| `GET` | `/templates/` | List all templates. |
| `POST` | `/templates/` | Create a new template. |

## 3. Usage Example (Python Service)

To send a notification from another backend service:

```python
from backend.services.notification_orchestrator import get_notification_orchestrator

async def handle_payment_success(user_id: str, amount: float):
    orchestrator = get_notification_orchestrator()

    await orchestrator.send_notification(
        db=db_session,
        user_id=user_id,
        type="payment_success",
        title="Payment Received",
        message=f"We received your payment of ${amount}",
        data={
            "amount": amount,
            "transaction_id": "tx_123"
        },
        priority=NotificationPriority.HIGH
    )
```

## 4. Frontend Integration

### Dashboard (React)

Use the `usePushNotifications` hook to manage subscriptions:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

const { subscribeToPush, isSubscribed } = usePushNotifications();

// Button click
<button onClick={subscribeToPush}>Enable Notifications</button>
```

### Service Worker (`sw.js`)

The service worker handles the `push` event. The backend sends a payload structure:

```json
{
  "title": "Payment Received",
  "body": "We received your payment of $50",
  "icon": "/icons/icon-192x192.png",
  "data": {
    "url": "/billing/invoices/123"
  }
}
```

The service worker ensures that clicking the notification focuses the existing tab or opens a new one.
