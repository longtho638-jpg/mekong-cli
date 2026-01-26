# API Documentation

Base URL: `http://localhost:8000/api/v1`

## Webhooks

### List Endpoints
`GET /webhooks/`

Returns a list of registered webhook endpoints.

**Query Params:**
- `skip`: int (default 0)
- `limit`: int (default 100)

### Create Endpoint
`POST /webhooks/`

Register a new webhook endpoint.

**Body:**
```json
{
  "url": "https://api.yoursite.com/webhook",
  "description": "Production Payment Events",
  "event_types": ["payment.success", "payment.failed"],
  "is_active": true
}
```

**Response:**
Returns the created endpoint object, including the `secret` used for signature verification.

### Update Endpoint
`PUT /webhooks/{id}`

Update an existing endpoint.

### Delete Endpoint
`DELETE /webhooks/{id}`

Remove an endpoint.

### Get Delivery Logs
`GET /webhooks/{id}/deliveries`

Get delivery history for a specific endpoint.

## Events

### Trigger Event
`POST /events/trigger`

Trigger a new event that will be dispatched to matching webhooks.

**Body:**
```json
{
  "event_type": "payment.success",
  "payload": {
    "order_id": "12345",
    "amount": 100
  }
}
```

### Retry Failed
`POST /events/retry-failed`

Manually trigger a retry for all failed deliveries that are due for retry.
