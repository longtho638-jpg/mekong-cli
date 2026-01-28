# Search Engine Guide (Meilisearch)

## Overview

We use **Meilisearch** for full-text search capabilities. Meilisearch is an open-source, lightning-fast, and hyper-relevant search engine that fits perfectly with our "Nuclear Weaponization" strategy (Self-hosted, Zero Cost, High Performance).

## Architecture

The search implementation follows the **Service Layer Pattern**:

- **Client (`meilisearch_client.py`)**: Singleton wrapper for the official Meilisearch Python SDK.
- **Indexer (`indexer.py`)**: Handles index creation, configuration, and document updates (Write operations).
- **Service (`service.py`)**: Facade for search queries, autocomplete, and high-level logic (Read operations).
- **Analytics (`analytics.py`)**: Tracks search usage metrics in Redis.
- **Worker (`workers/search_indexer.py`)**: Asynchronous worker for handling indexing jobs off the main request thread.

## Configuration

### Environment Variables

```bash
# .env
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=masterKey
```

### Index Definition

Indexes are defined in `backend/services/search/config.py`. To add a new index, define an `IndexConfig` object:

```python
INDEXES = {
    "products": IndexConfig(
        name="products",
        primary_key="id",
        searchable_attributes=["title", "description", "sku"],
        filterable_attributes=["price", "status", "tags"],
        sortable_attributes=["price", "created_at"]
    ),
    # ...
}
```

## Usage

### Searching

Use the REST API endpoint:

```http
GET /api/search?q=query&indexes=products,users&filters=status=active
```

**Parameters:**
- `q`: Search query (required).
- `indexes`: Comma-separated list of indexes (optional, defaults to all).
- `filters`: Filter expression (e.g., `status = active AND price > 100`).
- `limit`: Max results per index.
- `offset`: Pagination offset.

### Indexing Data

To index data, prefer using the background worker to avoid blocking the API:

```python
from backend.core.queues import queue_service

# Enqueue indexing job
queue_service.enqueue("search_indexing", {
    "action": "index",
    "index": "products",
    "document": {
        "id": "123",
        "title": "Awesome Product",
        "description": "...",
        "price": 99.99
    }
})
```

For real-time updates (e.g., small datasets), you can use the `SearchIndexer` directly:

```python
from backend.services.search.indexer import get_search_indexer

indexer = get_search_indexer()
indexer.add_documents("products", [doc])
```

## Analytics

Search analytics are tracked in Redis and can be viewed via:

- `GET /api/search/analytics/top-queries`
- `GET /api/search/analytics/no-results`

## Troubleshooting

### "Index not found"
Ensure the index is initialized. Run the reindex endpoint:
```http
POST /api/search/reindex/products
```

### Connection Errors
Check if the Meilisearch container is running:
```bash
docker ps | grep meilisearch
```
Check logs:
```bash
docker logs mekong-meilisearch
```
