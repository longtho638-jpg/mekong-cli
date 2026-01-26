# API Reference

The Email Marketing Kit provides a comprehensive REST API. All API endpoints are prefixed with `/api/v1`.

## Authentication
(Note: Authentication implementation details would go here. For this MVP, assume API keys or Bearer tokens if configured.)

## Endpoints

### 📧 Campaigns

Manage email campaigns.

#### Create Campaign
`POST /api/v1/campaigns/`

Creates a new campaign draft.

**Request Body:**
```json
{
  "name": "Summer Sale",
  "subject": "50% Off Everything!",
  "template_id": 1,
  "scheduled_at": "2023-12-01T10:00:00Z"
}
```

#### Send Campaign
`POST /api/v1/campaigns/{id}/send`

Triggers the sending process for a campaign.

#### Get Campaigns
`GET /api/v1/campaigns/?skip=0&limit=100`

List all campaigns.

---

### 👥 Subscribers

Manage subscribers and mailing lists.

#### Create Subscriber
`POST /api/v1/subscribers/`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "attributes": {"city": "New York"},
  "list_ids": [1, 2]
}
```

#### Get Subscribers
`GET /api/v1/subscribers/?skip=0&limit=100&status=active`

List subscribers, optionally filtered by status or list.

#### Delete Subscriber
`DELETE /api/v1/subscribers/{id}`

Permanently remove a subscriber.

---

### 📝 Templates

Manage email templates.

#### Create Template
`POST /api/v1/templates/`

**Request Body:**
```json
{
  "name": "Newsletter v1",
  "subject": "Weekly Update",
  "body_mjml": "<mjml>...</mjml>",
  "body_html": "<html>...</html>",
  "variables_schema": ["first_name"]
}
```
*Note: If `body_mjml` is provided, `body_html` is automatically generated.*

#### Preview Template
`POST /api/v1/templates/{id}/preview`

Render a template with sample data.

**Request Body:**
```json
{
  "context": {
    "first_name": "John"
  }
}
```

---

### 📋 Mailing Lists

Organize subscribers into lists.

#### Create List
`POST /api/v1/lists/`

**Request Body:**
```json
{
  "name": "Beta Users",
  "description": "Early access users"
}
```

#### Get Lists
`GET /api/v1/lists/`

---

### 📊 Tracking

Public endpoints for tracking opens and clicks.

#### Track Open
`GET /api/v1/t/o/{campaign_id}/{subscriber_id}/pixel.gif`

Returns a transparent 1x1 GIF and records an open event.

#### Track Click
`GET /api/v1/t/c/{campaign_id}/{subscriber_id}?url={destination_url}`

Redirects to the destination URL and records a click event.

---

## Error Codes

| Status Code | Description |
| :--- | :--- |
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (Validation Error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Resource Not Found |
| 500 | Internal Server Error |
