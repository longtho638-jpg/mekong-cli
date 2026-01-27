# Algolia Setup Guide

## 1. Create an Account

Sign up at [algolia.com](https://www.algolia.com/).

## 2. Get API Keys

Go to **Settings > API Keys**.
You need:
- **Application ID**
- **Search-Only API Key** (for the frontend)
- **Admin API Key** (for indexing scripts - keep this secret!)

## 3. Configuration

In your frontend application:

```typescript
import { useSearchStore } from 'full-text-search-kit';

useSearchStore.getState().init({
  type: 'algolia',
  config: {
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
    apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
  },
});
```

## 4. Index Configuration

You can configure settings via the dashboard or using the Kit's API:

```typescript
const client = new SearchClient({ type: 'algolia', config: ... });

await client.configureIndex('products', {
  searchableAttributes: ['name', 'description', 'brand'],
  filterableAttributes: ['category', 'brand', 'price'],
  rankingRules: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ]
});
```
