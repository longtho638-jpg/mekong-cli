# API Documentation

The Notification Center Kit provides a RESTful API for managing notifications and a WebSocket endpoint for real-time updates.

## Base URL
`http://localhost:8000/api/v1/notifications`

## Endpoints

### 1. Send Notification
Trigger a new notification. This will save it to the database, broadcast it via WebSocket, and trigger side effects (Email/Webhook).

- **URL**: `/send`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "user_id": "string",
    "type": "string",       // e.g., "info", "alert", "email_alert"
    "title": "string",
    "body": "string",
    "data": {               // Optional JSON data
      "url": "https://example.com",
      "webhook_url": "https://webhook.site/..."
    }
  }
  ```
- **Response**: `200 OK` (Notification Object)

### 2. Get Notifications
Retrieve a user's notification feed.

- **URL**: `/`
- **Method**: `GET`
- **Query Params**:
  - `user_id`: string (Required)
  - `skip`: int (Default: 0)
  - `limit`: int (Default: 50)
  - `unread_only`: bool (Default: false)
- **Response**: `200 OK` (Array of Notification Objects)

### 3. Mark as Read
Mark a specific notification as read.

- **URL**: `/{id}/read`
- **Method**: `PATCH`
- **Response**: `200 OK` (Updated Notification Object)

### 4. Mark All as Read
Mark all notifications for a user as read.

- **URL**: `/read-all`
- **Method**: `POST`
- **Query Params**:
  - `user_id`: string (Required)
- **Response**: `200 OK`

### 5. WebSocket Connection
Establish a real-time connection for receiving notifications.

- **URL**: `/ws/{user_id}`
- **Protocol**: `ws://` or `wss://`
- **Events**: Receives JSON objects matching the Notification schema when a new notification is sent.

## Data Models

### Notification Object
```json
{
  "id": 1,
  "user_id": "user_123",
  "type": "info",
  "title": "Welcome!",
  "body": "Thanks for signing up.",
  "data": {},
  "is_read": false,
  "created_at": "2023-10-27T10:00:00Z"
}
```
