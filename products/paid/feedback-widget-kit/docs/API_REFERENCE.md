# API Reference

The Feedback Widget Kit Backend provides a RESTful API built with FastAPI.

**Base URL**: `http://localhost:8000/api/v1`

## Authentication

The API uses API Key authentication.
**Header**: `X-API-Key: <your_api_key>`

You must generate an API key using the `/api-keys` endpoint (admin only) before submitting feedback.

## Endpoints

### API Keys

#### 1. Generate API Key
Create a new API Key for a project.

- **URL**: `/api-keys`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Body:**
```json
{
  "name": "My Production App",
  "domain_whitelist": "example.com, localhost:3000"
}
```

**Response (200 OK):**
```json
{
  "key": "sec_...",
  "name": "My Production App",
  "domain_whitelist": "example.com, localhost:3000"
}
```
*Note: The key is only returned once. Store it securely.*

### Feedback

#### 2. Submit Feedback
Create a new feedback entry.

- **URL**: `/feedback`
- **Method**: `POST`
- **Headers**: `X-API-Key: <your_api_key>`
- **Content-Type**: `multipart/form-data`

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `project_id` | string | Yes | Identifier for your project |
| `page_url` | string | Yes | URL where feedback was submitted |
| `feedback_type` | string | Yes | `bug`, `feature`, or `general` |
| `message` | string | Yes | The text content |
| `user_email` | string | No | User's email |
| `screenshots` | file[] | No | List of image files |
| `browser_info` | string | No | User agent string |
| `screen_resolution`| string | No | e.g., "1920x1080" |

**Response (201 Created):**
```json
{
  "id": 1,
  "project_id": "proj_123",
  "feedback_type": "bug",
  "status": "new",
  "created_at": "2026-01-26T12:00:00"
}
```

#### 2. List Feedback (Admin)
Get a list of feedback entries.

- **URL**: `/feedback`
- **Method**: `GET`

**Query Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `skip` | integer | Number of records to skip (default: 0) |
| `limit` | integer | Max records to return (default: 100) |
| `type` | string | Filter by type |
| `status` | string | Filter by status |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "type": "bug",
    "content": "...",
    "status": "open",
    ...
  }
]
```

#### 3. Update Feedback Status (Admin)
Update the status of a feedback entry.

- **URL**: `/feedback/{id}`
- **Method**: `PATCH`
- **Content-Type**: `application/json`

**Body:**
```json
{
  "status": "resolved"
}
```
*Allowed statuses: `open`, `in_progress`, `resolved`, `closed`*

**Response (200 OK):**
Returns the updated feedback object.

#### 4. Delete Feedback (Admin)
Delete a feedback entry.

- **URL**: `/feedback/{id}`
- **Method**: `DELETE`

**Response (204 No Content)**

### System

#### Health Check
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `{"status": "ok"}`

## Static Files

Screenshots are served from the `/static` endpoint.
Example: `http://localhost:8000/static/filename.png`
