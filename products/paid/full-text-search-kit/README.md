# Full-Text Search Kit ($77)

A production-ready, provider-agnostic search solution for React applications. seamless integration with **Algolia** and **Meilisearch**.

## Features

- 🚀 **Dual Provider Support**: Switch between Algolia and Meilisearch with a single config change.
- ⚛️ **React UI Components**: SearchBar, Autocomplete, Facets, Highlights, and more.
- 📊 **Analytics Dashboard**: Track searches, clicks, and CTR out of the box.
- ⚡ **Instant Search**: As-you-type results with debouncing and caching.
- 🎨 **Headless & Styled**: Built with Tailwind CSS but easily customizable.
- 🛠 **Type-Safe**: Written in TypeScript with full type definitions.

## Quick Start

### 1. Install Dependencies

```bash
npm install full-text-search-kit algoliasearch meilisearch zustand
```

### 2. Initialize the Client

```typescript
import { useSearchStore } from 'full-text-search-kit';

// For Algolia
useSearchStore.getState().init({
  type: 'algolia',
  config: {
    appId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_KEY',
  },
});

// OR for Meilisearch
useSearchStore.getState().init({
  type: 'meilisearch',
  config: {
    host: 'http://localhost:7700',
    apiKey: 'YOUR_MASTER_KEY',
  },
});
```

### 3. Use UI Components

```tsx
import { SearchBar, SearchResults, FacetList, Highlight } from 'full-text-search-kit';

export default function SearchPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4">
        <aside className="w-1/4">
          <FacetList attribute="category" indexName="products" title="Categories" />
          <FacetList attribute="brand" indexName="products" title="Brands" />
        </aside>
        <main className="w-3/4">
          <SearchBar indexName="products" />
          <SearchResults
            renderItem={(hit) => (
              <div className="p-4 border rounded hover:shadow-sm">
                <h3 className="font-bold">
                  <Highlight hit={hit} attribute="name" />
                </h3>
                <p className="text-gray-600">{hit.description}</p>
              </div>
            )}
          />
        </main>
      </div>
    </div>
  );
}
```

## Documentation

- [Installation Guide](docs/INSTALL.md)
- [Algolia Setup](docs/ALGOLIA_SETUP.md)
- [Meilisearch Setup](docs/MEILISEARCH_SETUP.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)

## License

Commercial License.
