import { SearchClient } from '../src/core/search-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple check for env vars
const APP_ID = process.env.ALGOLIA_APP_ID;
const API_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX_NAME = process.env.INDEX_NAME || 'products';

if (!APP_ID || !API_KEY) {
  console.error('Error: ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY environment variables are required.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

async function run() {
  console.log(`Initializing Algolia client for app ${APP_ID}...`);

  const client = new SearchClient({
    type: 'algolia',
    config: {
      appId: APP_ID,
      apiKey: API_KEY,
    },
  });

  await client.init();

  console.log(`Configuring index ${INDEX_NAME}...`);
  await client.configureIndex(INDEX_NAME, {
    name: INDEX_NAME,
    searchableAttributes: ['name', 'description', 'brand', 'category'],
    filterableAttributes: ['brand', 'category', 'price'],
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

  console.log(`Indexing ${data.length} documents...`);
  await client.addDocuments(INDEX_NAME, data);

  console.log('Done!');
}

run().catch(console.error);
