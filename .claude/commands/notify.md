---
description: 🔔 NOTIFY - Omni-channel notification dispatcher
---

# /notify - Notification Command

> **"Tin tức lan truyền"** - News spreads fast

## Usage

```bash
/notify [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `send` | Send notification | `/notify send --channel email --to user@ex.com` |
| `broadcast` | Broadcast to all users | `/notify broadcast --msg "Maintenance in 1h"` |
| `test` | Test notification channels | `/notify test --channel slack` |
| `status` | Check delivery status | `/notify status --id msg_123` |

## Execution Protocol

1.  **Agent**: Delegates to `serviceops` or `community-hub`.
2.  **Tool**: Uses `NotificationRouter` and `QueueService`.
3.  **Channels**: Email, Slack, Push, Webhook.

## Examples

```bash
# Send system alert to all admins
/notify broadcast --role admin --level critical --msg "High load detected"

# Test email configuration
/notify test --channel email
```

## Win-Win-Win
- **Owner**: Critical updates delivered.
- **Agency**: Efficient communication.
- **Client**: Timely information.
