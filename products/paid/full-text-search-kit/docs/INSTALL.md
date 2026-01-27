# Installation Guide

## Prerequisites

- Node.js 18+
- React 18+
- TypeScript 4.5+

## Step 1: Add the Package

Copy the `full-text-search-kit` folder into your project or install it if packaged as an npm module.

If copying source directly:

```bash
cp -r /path/to/full-text-search-kit /your/project/src/search-kit
```

## Step 2: Install Peer Dependencies

```bash
npm install algoliasearch meilisearch zustand
```

## Step 3: Configure Tailwind CSS

Ensure your `tailwind.config.js` includes the path to the search kit components if you are using the provided UI.

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/search-kit/**/*.{js,jsx,ts,tsx}", // Add this line
  ],
  // ...
};
```

## Step 4: Index Your Data

Before searching, you need to push data to your search provider. See `indexing/` scripts for examples.

```bash
# Example
node scripts/index-data.js
```
