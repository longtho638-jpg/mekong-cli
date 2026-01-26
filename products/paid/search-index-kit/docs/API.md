# Search Index Kit API Documentation

## Overview

The Search Index Kit API provides a robust interface for indexing content and performing full-text searches. It is built on top of PostgreSQL's full-text search capabilities.

## Base URL

`http://localhost:8000/api`

## Authentication

Currently, the API is open. In a production environment, you should secure the management endpoints (POST /documents, POST /index/rebuild) using the `antigravity-auth-kit`.

## Endpoints

### 1. Search

**POST** `/search`

Performs a full-text search with ranking and filtering.

**Parameters:**
- `query` (query param, required): The search text.
- `page` (query param, default: 1): Page number.
- `page_size` (query param, default: 10): Results per page.
- `category` (query param, optional): Filter by category.

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "title": "Doc Title",
      "url": "/docs/1",
      "snippet": "<b>Doc</b> content...",
      "category": "general",
      "score": 0.8
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10
}
```

### 2. Autocomplete

**GET** `/search/autocomplete`

Returns suggestions based on the document titles.

**Parameters:**
- `query` (query param, required): The partial text.
- `limit` (query param, default: 5): Max suggestions.

**Response:**
```json
{
  "suggestions": [
    "Documentation",
    "Docker Setup"
  ]
}
```

### 3. Facets

**GET** `/search/facets`

Returns available categories and tags for filtering.

**Response:**
```json
{
  "categories": [
    { "value": "docs", "count": 10 },
    { "value": "blog", "count": 5 }
  ],
  "tags": []
}
```

### 4. Index Document

**POST** `/documents`

Adds a new document to the search index.

**Body:**
```json
{
  "title": "How to Install",
  "content": "Detailed installation guide...",
  "url": "/install",
  "category": "guide",
  "tags": "install,setup"
}
```

**Response:**
```json
{
  "id": 123,
  "title": "How to Install",
  ...
}
```

## Analytics

The system automatically tracks search queries via the `/search` endpoint (logic implemented in the endpoint). You can also manually track events via `/search/analytics` if using a decoupled frontend.

**POST** `/search/analytics`

**Body:**
```json
{
  "query": "installation",
  "user_id": "user_123",
  "result_count": 5,
  "clicked_url": "/install"
}
```
