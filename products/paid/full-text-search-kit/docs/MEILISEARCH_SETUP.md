# Meilisearch Setup Guide

## 1. Run Meilisearch

You can run Meilisearch locally using Docker or use [Meilisearch Cloud](https://www.meilisearch.com/cloud).

### Local (Docker)

```bash
docker run -it --rm \
    -p 7700:7700 \
    -v $(pwd)/meili_data:/meili_data \
    getmeili/meilisearch:v1.6
```

## 2. Get API Keys

If running locally without a master key, it's unprotected.
For production, set a master key:

```bash
export MEILI_MASTER_KEY='my-secret-master-key'
./meilisearch
```

Then generate a search key:
```bash
curl \
  -H "Authorization: Bearer my-secret-master-key" \
  -X GET 'http://localhost:7700/keys'
```

## 3. Configuration

In your frontend application:

```typescript
import { useSearchStore } from 'full-text-search-kit';

useSearchStore.getState().init({
  type: 'meilisearch',
  config: {
    host: 'http://localhost:7700', // or your cloud URL
    apiKey: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY,
  },
});
```

## 4. Index Configuration

Meilisearch is schema-less but requires settings for filtering and sorting.

```typescript
const client = new SearchClient({ type: 'meilisearch', config: ... });

await client.configureIndex('products', {
  searchableAttributes: ['name', 'description', 'brand'],
  filterableAttributes: ['category', 'brand', 'price'],
  sortableAttributes: ['price', 'created_at'],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ]
});
```
