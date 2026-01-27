# 🚀 Full-Text Search Kit: Production-Ready Search in Minutes

**Stop building search from scratch.**

The **Full-Text Search Kit** is a professional, provider-agnostic search infrastructure for React applications. Whether you use **Algolia** for its premium speed or self-hosted **Meilisearch** to save costs, this kit handles it all.

---

## 💎 Why This Kit?

Building a great search experience takes weeks. You need to handle:
- ❌ Debouncing and race conditions
- ❌ State management (URL sync, filters)
- ❌ UI components (facets, highlighting, pagination)
- ❌ Analytics tracking
- ❌ Provider SDK quirks

With **Full-Text Search Kit**, you get all of this **pre-built, tested, and optimized**.

## 🔥 Killer Features

### 1. Dual Provider Support (Zero Lock-in)
Switch between Algolia and Meilisearch with **one line of config**.
- Start with **Meilisearch (Free/Self-Hosted)** to validate.
- Scale to **Algolia** when you need enterprise features.
- No code changes required.

### 2. Drop-in React Components
Beautiful, unstyled (headless) or Tailwind-ready components:
- `SearchBar`: Instant search with debounce.
- `Autocomplete`: As-you-type suggestions & recent history.
- `FacetList`: Dynamic filtering (categories, brands, prices).
- `SearchResults`: With hit highlighting & infinite scroll support.

### 3. Built-in Analytics
Don't fly blind. The kit includes a plug-and-play **Analytics Dashboard** tracking:
- 📈 Total Searches & CTR
- 👁 Zero-result queries (find content gaps!)
- 🖱 Top clicked results

### 4. Developer Experience First
- **100% TypeScript**: Fully typed for confidence.
- **Provider Abstraction**: A unified API for indexing, searching, and configuring.
- **Indexing Scripts**: Node.js scripts to push your data instantly.

---

## 📦 What's Inside?

- ✅ **Source Code**: Full React + TypeScript library.
- ✅ **Indexing Engine**: Scripts for Algolia & Meilisearch.
- ✅ **Backend Helpers**: Webhook handlers for real-time updates.
- ✅ **Documentation**: Step-by-step setup guides for both providers.
- ✅ **Test Suite**: Unit & Integration tests ensuring stability.

---

## ⚡ Quick Start

```typescript
// 1. Initialize
useSearchStore.getState().init({
  type: 'meilisearch', // or 'algolia'
  config: { host: '...', apiKey: '...' }
});

// 2. Render
<div className="search-ui">
  <SearchBar indexName="products" />
  <div className="flex">
    <FacetList attribute="category" />
    <SearchResults />
  </div>
</div>
```

---

## 💰 Pricing

**$77** - One-time payment. Lifetime access. Unlimited projects.
*Save 30+ hours of development time per project.*

---

**100% Money-Back Guarantee**: If this kit doesn't save you time, email me within 14 days for a full refund.
