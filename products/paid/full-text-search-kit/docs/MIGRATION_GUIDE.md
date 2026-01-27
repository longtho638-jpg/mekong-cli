# Migration Guide

## Switching Providers

The Full-Text Search Kit abstraction layer makes switching providers extremely simple.

### From Algolia to Meilisearch

1. **Update Initialization**:
   Change the `init` call in your app entry point.

   ```diff
   - useSearchStore.getState().init({
   -   type: 'algolia',
   -   config: { appId: '...', apiKey: '...' }
   - });
   + useSearchStore.getState().init({
   +   type: 'meilisearch',
   +   config: { host: '...', apiKey: '...' }
   + });
   ```

2. **Re-Index Data**:
   Run your indexing script pointing to the new provider. The abstraction layer `addDocuments` method works for both.

   ```typescript
   // This code works for both providers!
   await client.addDocuments('products', myData);
   ```

3. **Check Filter Syntax (Advanced)**:
   The Kit handles basic filter generation. If you used raw filter strings in `search({ filters: '...' })`, you might need to adjust syntax manually as Algolia and Meilisearch have slight differences in complex boolean logic.
   - Algolia: `category:Book`
   - Meilisearch: `category = Book`

   *Note: The built-in `toggleFilter` and `FacetList` components handle this translation automatically.*

## Feature Parity

| Feature | Algolia | Meilisearch | Notes |
|---------|---------|-------------|-------|
| Search | ✅ | ✅ | |
| Faceting | ✅ | ✅ | |
| Highlighting | ✅ | ✅ | |
| Typo Tolerance | ✅ | ✅ | Config structure varies slightly |
| Synonyms | ✅ | ✅ | Meilisearch has simpler synonym support |
| Geosearch | ✅ | ✅ | |
| Personalization| ✅ | ❌ | Algolia specific |
| Rules | ✅ | ❌ | Algolia specific (Visual Editor) |
